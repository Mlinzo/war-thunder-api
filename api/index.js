const puppeteer = require('puppeteer');
const WarThunderApiError = require('./errors');
const { vehicleCountryDTO, vehicleModeDTO, vehicleRoleDTO} = require('./dto');
const BASE_URL = 'https://thunderskill.com/en'

class WarThunderApi {

    constructor() {
        Array.prototype.findAllIndexes = function (cb) { 
            const idxs = [];
            for (let i = this.length - 1; i >= 0; i--) {
                if (cb(this[i])) {
                    idxs.unshift(i);
                }
            }
            return idxs;
        };
    }

    stat = async username => {
        const statUrl = BASE_URL + `/stat/${username}/export/json`;
       
        const page = this.page;

        await page.goto(statUrl);

        let stats;
        try { stats = JSON.parse(await page.evaluate( () => document.querySelector('pre').innerText)); }
        catch (e) { throw WarThunderApiError.NoSuchUserError(); }
        return stats.stats;
    }

    resume = async username => {
        const resumeUrl = BASE_URL + `/stat/${username}/resume`;
        const resume = {
            nickname: username,
        };

        await this.page.goto(resumeUrl);

        const userFound = await this.#getElementData('div.playerStat > h1.nick', el => el.textContent, 500);
        if (!userFound) throw WarThunderApiError.NoSuchUserError();


        this.allResumes = await this.#getElementsData('div.profile-user-info > div.profile-info-row', el => el.textContent.replace(/[^a-zA-Z]/g, "").toLowerCase());
        this.allResumeHandles = await this.#getHandles('div.profile-user-info > div.profile-info-row');

        const fieldsPromises = [
            this.#getResumeField('nickname', el => el.querySelectorAll('div.profile-info-value > span')[1].textContent.trim()),
            this.#getResumeField('preferred', el => el.querySelector('div.profile-info-value').textContent.trim() ),
            this.#getResumeField('squadron',  el => el.querySelector('div.profile-info-value').textContent.trim() ),
            this.#getResumeField('age', el => el.querySelector('div.profile-info-value').textContent.trim()),
            this.#getResumeField('sex', el => el.querySelector('div.profile-info-value > div').textContent.trim()),
            this.#getResumeField('playssince',  el => el.querySelector('div.profile-info-value').textContent.trim() ),
            this.#getElementsData('div.profile-info-value > a', el => el.href)
        ]
        
        await Promise.all(fieldsPromises)
            .then( ([_resume, preffered, squadron, age, sex, playsSince, profile]) => {
                resume.resume = _resume;
                resume.preffered = preffered;
                resume.squadron = squadron;
                resume.age = age;
                resume.sex = sex;
                resume.playsSince = playsSince;
                resume.profile = profile;
        })
            
        return resume;
    }

    userVehicles = async (username, mode, type, role, country) => {
        const stat = {};
        const convertedMode = vehicleModeDTO[mode];
        const convertedRole = vehicleRoleDTO[role];
        const convertedCountry = vehicleCountryDTO[country];
        const userVehiclesUrl = BASE_URL + `/stat/${username}/vehicles/${convertedMode}#type=${type}&role=${convertedRole}&country=${convertedCountry}`;
        await this.page.goto(userVehiclesUrl);
        const vehicles = (await this.#getHandles('div.detail:not(.h) tr:not(.h)')).splice(1, );

        await Promise.all(
            vehicles.map( async vehicle => {

                const params = await this.#getHandles('ul.params > li', vehicle);
                params.pop()
                const paramTitles = await Promise.all( params.map( async param => await param.evaluate( el => el.querySelector('span.param_name').innerText.replace(/[^a-zA-Z]/g, "").toLowerCase() )))
                const getUserVehicleParam = this.#genGetUserVehicleParam(paramTitles, params)
                const airfrags = parseInt(await getUserVehicleParam('overallairfrags', async el => await el.querySelector('span.param_value').innerText ));
                const airfragsperbattle = parseFloat(await getUserVehicleParam('airfragsbattle', async el => await el.querySelector('span.param_value').innerText ));
                const airfragsperdeath = parseFloat(await getUserVehicleParam('airfragsdeath', async el => await el.querySelector('span.param_value').innerText ));
                const groundfrags = parseInt(await getUserVehicleParam('overallgroundfrags', async el => await el.querySelector('span.param_value').innerText ));
                const groundfragsperbattle = parseFloat(await getUserVehicleParam('groundfragsbattle', async el => await el.querySelector('span.param_value').innerText ));
                const groundfragsperdeath = parseFloat(await getUserVehicleParam('groundfragsdeath', async el => await el.querySelector('span.param_value').innerText ));

                
                return {
                    country: await vehicle.evaluate(el => el.dataset.country.match(/country_(.+) all/)[1]),
                    vehicle: await vehicle.evaluate(el => el.querySelector('span[data-action="detail_vehicle"]').textContent),
                    battles: parseInt(await vehicle.evaluate(el => el.querySelectorAll('td')[2].innerText.split(' ')[0])),
                    winrate: this.#round(parseFloat(await vehicle.evaluate(el => el.querySelectorAll('td')[3].innerText.split(' ')[0])) / 100),
                    respawns: parseInt(await vehicle.evaluate(el => el.querySelectorAll('ul > li > span.param_value > strong')[1].innerText)),
                    victories: parseInt(await vehicle.evaluate(el => el.querySelectorAll('ul > li > span.param_value > strong')[2].innerText)),
                    defeats: parseInt(await vehicle.evaluate(el => el.querySelectorAll('ul > li > span.param_value > strong')[3].innerText)),
                    deaths: parseInt(await vehicle.evaluate(el => el.querySelectorAll('ul > li > span.param_value > strong')[4].innerText)),
                    airfrags,
                    airfragsperbattle,
                    airfragsperdeath,
                    groundfrags,
                    groundfragsperbattle,
                    groundfragsperdeath
                }
            })
        )
        .then( vehStats => {
            stat.vehicles = vehStats;
            console.log(vehStats);
        });

        return stat;
    }

    start = async () => {
        console.log('starting war-thunder-api..')
        this.browser = await puppeteer.launch();
        this.page = await this.browser.newPage();
    }

    finish = async () => {
        console.log('finishing war-thunder-api..')
        await this.browser.close()
    }

    #round = number => parseFloat(number.toFixed(2));

    #getElementData = async (selector, cb, timeout = 30000) => {
        try {
            const elSelector = await this.page.waitForSelector(selector, {timeout});
            const data = await elSelector.evaluate(cb);
            return data;
        } catch (err) { return null; }
    }

    #getElementsData = async (selector, cb) => {
            await this.page.waitForSelector(selector);
            const handles = await this.page.$$(selector);
            const data = await Promise.all(
                handles.map( async handle => { 
                    try {
                        return await handle.evaluate(cb);
                    } catch (err) {  return null; }
                })
            );
            return data;
    }

    #getHandles = async (selector, _from = null) => {
        await this.page.waitForSelector(selector);
        const from = _from? _from: this.page
        const handles = await from.$$(selector);
        return handles;
    }


    #getResumeField = async (resumeTitle, cb) => {
        const index = this.allResumes.findIndex( field => field.startsWith(resumeTitle) );
        const handle  = this.allResumeHandles[index];
        const resumeField = await handle.evaluate(cb);
        return resumeField === 'unknown'? null: resumeField;
    }

    #genGetUserVehicleParam =  (paramTitles, params) => {
        return async (paramTitle, cb) => {
            const index = paramTitles.findIndex( param => param.startsWith(paramTitle) );
            if (index === -1) return null
            const handle = params[index];
            const param = await handle.evaluate(cb);
            return param;
        }
    }

}

module.exports = new WarThunderApi();