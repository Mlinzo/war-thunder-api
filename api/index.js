const puppeteer = require('puppeteer');
const WarThunderApiError = require('./errors');
const BASE_URL = 'https://thunderskill.com/en'

//! Such nickname not found

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

    //! upgrade later, example - Oxide
    stat = async username => {
        const statUrl = BASE_URL + `/stat/${username}`;
        const userStats = {
            prefers: null,
            nextUpdateIn: null,
            lastUpdate: null,
            arcade: {
                kd: { total: null, ground: null, air: null },
                battles: { air: null, ground: null },
                fragsPerBattle: { total: null, air: null, ground: null },
                resume: null,
                winrate: null,
                lifespan: null,
                totalBattles: null
            },
            realistic: {
                kd: { total: null, ground: null, air: null },
                battles: { air: null, ground: null },
                fragsPerBattle: { total: null, air: null, ground: null },
                resume: null,
                winrate: null,
                lifespan: null,
                totalBattles: null
            },
            simulator: {
                kd: { total: null, ground: null, air: null },
                battles: { air: null, ground: null },
                fragsPerBattle: { total: null, air: null, ground: null },
                resume: null,
                winrate: null,
                lifespan: null,
                totalBattles: null
            },
        };
        const userStatsModes = [ userStats.arcade, userStats.realistic, userStats.simulator ];
       
        const page = this.page;

        await page.goto(statUrl);

        const userFound = await this.#getElementData('div.playerStat > h1.nick', el => el.textContent, 500);
        if (!userFound) throw WarThunderApiError.NoSuchUserError()

        userStats.prefers  = await this.#getElementData('div > p.prefer', el => el.textContent.replace('prefers ', ''));
       
        userStats.nextUpdateIn = await this.#getElementData('div > p.next_update', el => el.textContent.trim().replace('Next update available in ', ''))
       
        userStats.lastUpdate = await this.#getElementData('.stat_dt > strong', el => el.textContent);
       
        const efficiencies = await this.#getElementsData('div.kpd_value', el => el.textContent);
        efficiencies.map( (efficiency, ind) => userStatsModes[ind].efficiency = efficiency );
       
        const resumes = await this.#getElementsData('div.resume', el => el.textContent.toLowerCase());
        resumes.map( (resume, ind) => userStatsModes[ind].resume = resume);
       
        const preferences = await this.#getElementsData('li > a.fakelink', el => el.textContent.trim().toLowerCase().replace('prefers ', ''));
        preferences.map( (prefers, ind) => userStatsModes[ind].prefers = prefers);
       
        const battles = await this.#getElementsData('li > div > span.badge', el => el.textContent === '0%'? null: el.textContent)
        const [airArcade, groundArcade, airRealistic, groundRealistic, airSimulator, groundSimulator] = battles;
        userStats.arcade.battles.air = airArcade;
        userStats.arcade.battles.ground = groundArcade;
        userStats.realistic.battles.air = airRealistic;
        userStats.realistic.battles.ground = groundRealistic;
        userStats.simulator.battles.air = airSimulator;
        userStats.simulator.battles.ground = groundSimulator;
        
        const allStats = await this.#getElementsData('li', el => el.textContent.replace(/[^a-zA-Z]/g, "").toLowerCase());
        const allStatHandles = await this.#getHandles('li');
        this.allStats = allStats;
        this.allStatHandles = allStatHandles;

        const winrates = await this.#getModesStats('winrate', el => el.querySelector('span.badge').textContent )
        winrates.map( (el, ind) => userStatsModes[ind].winrate = el );

        const kds =  await this.#getModesStats('killdeath', el => el.querySelector('span.badge').textContent )
        kds.map( (el, ind) => userStatsModes[ind].kd.total = el );        

        const groundkds = await this.#getModesStats('groundfragsdeath', el => el.querySelector('span.badge').textContent )
        groundkds.map( (el, ind) => userStatsModes[ind].kd.ground = el );        

        const airkds = await this.#getModesStats('airfragsdeath', el => el.querySelector('span.badge').textContent )
        airkds.map( (el, ind) => userStatsModes[ind].kd.air = el );        
        
        const fragsPerBattle = await this.#getModesStats('fragsperbattle', el => el.querySelector('span.badge').textContent )
        fragsPerBattle.map( (el, ind) => userStatsModes[ind].fragsPerBattle.total = el );
        
        const airFragsPerBattle = await this.#getModesStats('airfragsbattle', el => el.querySelector('span.badge').textContent )
        airFragsPerBattle.map( (el, ind) => userStatsModes[ind].fragsPerBattle.air = el );

        const groundFragsPerBattle = await this.#getModesStats('groundfragsbattle', el => el.querySelector('span.badge').textContent )
        groundFragsPerBattle.map( (el, ind) => userStatsModes[ind].fragsPerBattle.ground = el );

        const lifespans = await this.#getModesStats('lifespan', el => el.querySelector('span.badge').textContent == 'N/A min.'? null: el.querySelector('span.badge').textContent )
        lifespans.map( (el, ind) => userStatsModes[ind].lifespan = el );

        const totalBattles = await this.#getModesStats('totalno', el => el.querySelector('span.badge').textContent )
        totalBattles.map( (el, ind) => userStatsModes[ind].totalBattles = el );

        return userStats;
    }

    resume = async username => {
        const resumeUrl = BASE_URL + `/stat/${username}/resume`;
        const resume = {
            nickname: username,
            resume: null,
            preffered: null,
            squadron: null,
            age: null,
            sex: null,
            playsSince: null,
            profile: [],
        };

        await this.page.goto(resumeUrl);

        const userFound = await this.#getElementData('div.playerStat > h1.nick', el => el.textContent);
        if (!userFound) throw WarThunderApiError.NoSuchUserError();

        this.allResumes = await this.#getElementsData('div.profile-user-info > div.profile-info-row', el => el.textContent.replace(/[^a-zA-Z]/g, "").toLowerCase());
        this.allResumeHandles = await this.#getHandles('div.profile-user-info > div.profile-info-row');
        
        resume.resume = await this.#getResumeField('nickname', el => el.querySelectorAll('div.profile-info-value > span')[1].textContent.trim());

        resume.preffered = await this.#getResumeField('preferred', el => el.querySelector('div.profile-info-value').textContent.trim() );

        resume.squadron = await this.#getResumeField('squadron',  el => el.querySelector('div.profile-info-value').textContent.trim() );

        resume.age = await this.#getResumeField('age', el => el.querySelector('div.profile-info-value').textContent.trim());

        resume.sex = await this.#getResumeField('sex', el => el.querySelector('div.profile-info-value > div').textContent.trim());

        resume.playsSince = await this.#getResumeField('playssince',  el => el.querySelector('div.profile-info-value').textContent.trim() );

        resume.profile = await this.#getElementsData('div.profile-info-value > a', el => el.href);

        return resume;
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

    #getHandles = async selector => {
        await this.page.waitForSelector(selector);
        const handles = await this.page.$$(selector);
        return handles;
    }

    #evalHandles = async (handles, cb) => {
        return await Promise.all(
            handles.map( async handle => { 
                try {
                    return await handle.evaluate(cb);
                } catch (err) { return null; }
            })
        );
    }

    #getModesStats = async (statTitle, cb ) => {
        const indexes= this.allStats.findAllIndexes( stat => stat.startsWith(statTitle) );
        const handles  = [ this.allStatHandles[indexes[0]], this.allStatHandles[indexes[1]], this.allStatHandles[indexes[3]]];
        const stats = await this.#evalHandles(handles, cb);
        return stats.map( el => el === 'N/A'? null: el );
    }

    #getResumeField = async (resumeTitle, cb) => {
        const index = this.allResumes.findIndex( field => field.startsWith(resumeTitle) );
        const handle  = this.allResumeHandles[index];
        const resumeField = await handle.evaluate(cb);
        return resumeField === 'unknown'? null: resumeField;
    }

}

module.exports = new WarThunderApi();