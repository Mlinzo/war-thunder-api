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

        const userFound = await this.#getElementData('div.playerStat > h1.nick', el => el.textContent, 500);
        if (!userFound) throw WarThunderApiError.NoSuchUserError();

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
        .then( vehStats => stat.vehicles = vehStats );

        return stat;
    }

    squadHistory = async username => {
        const result = { history: []};
        const squadHistoryUrl = BASE_URL + `/stat/${username}/squad-history`;

        await this.page.goto(squadHistoryUrl);

        const userFound = await this.#getElementData('div.playerStat > h1.nick', el => el.textContent, 500);
        if (!userFound) throw WarThunderApiError.NoSuchUserError();

        const squadsInfo = await this.#getElementsData('tbody > tr > td', el => el.innerText );
        squadsInfo.reverse();
        if (squadsInfo.length % 2 !== 0 && squadsInfo.length !== 0) 
            squadsInfo.pop()
        for (let i = 0; i < squadsInfo.length; i+=2) {
            const squad = squadsInfo[i];
            const date = squadsInfo[i+1];
            const info = {
                date,
                squad
            }
            result.history.push(info);
        }

        return result
    }
    
    invitations = async username => {
        const invitationsUrl = BASE_URL + `/stat/${username}/recruitment`;
        const result = { squads: [] };
        await this.page.goto(invitationsUrl);

        const userFound = await this.#getElementData('div.playerStat > h1.nick', el => el.textContent, 500);
        if (!userFound) throw WarThunderApiError.NoSuchUserError();

        const squads = await this.#getHandles('div.recruitmentAdvert');
        await Promise.all(
            squads.map( async squad => {
                const stats = await squad.evaluate( el => [...el.querySelectorAll('div.stat > strong')].map(el => el.innerText.trim()) );
                const players = parseInt(stats[0]);
                const effAB = this.#round(parseInt(stats[1]) / 100);
                const effRB = this.#round(parseInt(stats[2]) / 100);
                const effSB = this.#round(parseInt(stats[3]) / 100);

                return {
                    shortname: await squad.evaluate( el => el.querySelector('span.squad_name').innerText.trim()),
                    name: await squad.evaluate( el => el.querySelector('div.squad_orig_name').innerText.trim()),
                    description: await squad.evaluate( el => el.querySelector('div.comment').innerText.trim()),
                    requirements: await squad.evaluate( el => el.querySelector('div.requirements').innerText.trim()),
                    stat: {
                        players,
                        efficiency: {
                            arcade: effAB,
                            realistic: effRB,
                            simulator: effSB
                        }
                    }
                    
                }
            })
        ).then( squadsInfo => result.squads = squadsInfo );

        return result;
    }

    vehicles = async (type, role, country) => {
        const convertedRole = vehicleRoleDTO[role];
        const convertedCountry = vehicleCountryDTO[country];

        const vehiclesUrl = BASE_URL + `/vehicles/#type=${type}&role=${convertedRole}&country=${convertedCountry}`;
        const result = { period: "1 month"};

        await this.page.goto(vehiclesUrl);

        const vehicles = (await this.#getHandles('div.detail:not(.h) tr:not(.h)')).splice(1, );

        await Promise.all(
            vehicles.map( async vehicle => {
                return {
                    name: await vehicle.evaluate( el => el.querySelector('td > a').innerText),
                    role: await vehicle.evaluate( el => el.querySelectorAll('td')[2].innerText),
                    arcade: parseInt(await vehicle.evaluate( el => el.querySelectorAll('td')[3].innerText)),
                    realistic: parseInt(await vehicle.evaluate( el => el.querySelectorAll('td')[4].innerText)),
                    simulator: parseInt(await vehicle.evaluate( el => el.querySelectorAll('td')[5].innerText)),
                    details: `/api/vehicle/${await vehicle.evaluate( el => el.querySelector('td > a').href.split('/')[5])}`
                }
            })
        )
        .then( vehs => result.vehicles = vehs );

        return result;
    }
    
    vehicle = async name => {
        const vehicleUrl = BASE_URL + `/vehicle/${name}`;
        const result = { period: '1 month' };

        const response = await this.page.goto(vehicleUrl);
        if (response.status() !== 200) throw WarThunderApiError.NoSuchVehicleError();

        const modes = await this.#getHandles('div.row.mt-5 > div');
        await Promise.all(
            modes.map( async mode => {
                return {
                    battles: parseInt(await mode.evaluate( el => el.querySelectorAll('ul > li > span.badge')[0].innerText)),
                    winrate: this.#round(parseFloat(await mode.evaluate( el => el.querySelectorAll('ul > li > span.badge')[1].innerText)) / 100),
                    airfragsperbattle: parseFloat(await mode.evaluate( el => el.querySelectorAll('ul > li > span.badge')[2].innerText)),
                    airfragsperdeath: parseFloat(await mode.evaluate( el => el.querySelectorAll('ul > li > span.badge')[3].innerText)),
                    groundfragsperbattle: parseFloat(await mode.evaluate( el => el.querySelectorAll('ul > li > span.badge')[4].innerText)),
                    groundfragsperdeath: parseFloat(await mode.evaluate( el => el.querySelectorAll('ul > li > span.badge')[5].innerText)),
                }
            })
        ).then( stats => {
            result.arcade = stats[0],
            result.realistic = stats[1],
            result.simulator = stats[2]
        } )

        return result;
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