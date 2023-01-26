const e = require('express');
const puppeteer = require('puppeteer');

const BASE_URL = 'https://thunderskill.com/en'

class WarThunderApi {

    constructor() {
        Array.prototype.findAll = function (cb) { 
            const idxs = [];
            for (let i = this.length - 1; i >= 0; i--) {
                if (cb(this[i])) {
                    idxs.unshift(i);
                }
            }
            return idxs;
        };
    }

    #getElementData = async (selector, cb) => {
        try {
            const elSelector = await this.page.waitForSelector(selector);
            const data = await elSelector.evaluate(cb);
            return data;
        } catch (err) { console.log(err); return null }
    }

    #getElementsData = async (selector, cb) => {
            await this.page.waitForSelector(selector);
            const handles = await this.page.$$(selector);
            const data = await Promise.all(
                handles.map( async handle => { 
                    try {
                        return await handle.evaluate(cb);
                    } catch (err) { console.log(err); return null; }
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
        const indexes= this.allStats.findAll( stat => stat.startsWith(statTitle) );
        const handles  = [ this.allStatHandles[indexes[0]], this.allStatHandles[indexes[1]], this.allStatHandles[indexes[3]]]
        const stats = await this.#evalHandles(handles, cb)
        return stats.map( el => el === 'N/A'? null: el );
    }

    getStat = async username => {
        const statUrl = BASE_URL + `/stat/${username}`;
        const userStats = {
            prefers: null,
            nextUpdateIn: null,
            lastUpdate: null,
            arcade: {kd: {}, battles: {}, fragsPerBattle: {}},
            realistic: {kd: {}, battles: {}, fragsPerBattle: {}},
            simulator: {kd: {}, battles: {}, fragsPerBattle: {}},
        };
        const userStatsModes = [ userStats.arcade, userStats.realistic, userStats.simulator ]
        //! REASIGN ONCE DONE
        // userStatsModes.map( modeStats => Object.assign(modeStats, {
        //     efficiency: null,
        //     prefers: null,
        //     airBattles: null,
        //     groundBattles: null,
        //     winrate: null,
        //     kd: {},
        //     groundkd: null,
        //     airkd: null,
        //     fragsPerBattle: null,
        // }));
        // console.log(userStats)

        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        this.page = page;
        await page.goto(statUrl);
        
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

        await browser.close()
        return userStats;
    }

}

module.exports = new WarThunderApi();



new WarThunderApi().getStat('MrPlane2002').then( stat => console.log(stat));