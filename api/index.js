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

    #getModesStat = async (statTitle, cb ) => {
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
            arcade: {},
            realistic: {},
            simulator: {},
        };
        const userStatsModes = [ userStats.arcade, userStats.realistic, userStats.simulator ]
        //! REASIGN ONCE DONE
        userStatsModes.map( modeStats => Object.assign(modeStats, {
            efficiency: null,
            prefers: null,
            airBattles: null,
            groundBattles: null,
            winrate: null,
            KD: null,
            groundKD: null,
            airKD: null,

        }));
        console.log(userStats)

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
        userStats.arcade.airBattles = airArcade;
        userStats.arcade.groundBattles = groundArcade;
        userStats.realistic.airBattles = airRealistic;
        userStats.realistic.groundBattles = groundRealistic;
        userStats.simulator.airBattles = airSimulator;
        userStats.simulator.groundBattles = groundSimulator;
        
        const allStats = await this.#getElementsData('li', el => el.textContent.replace(/[^a-zA-Z]/g, "").toLowerCase());
        const allStatHandles = await this.#getHandles('li');
        this.allStats = allStats;
        this.allStatHandles = allStatHandles;

        const winrates = await this.#getModesStat('winrate', el => el.querySelector('span.badge').textContent )
        winrates.map( (el, ind) => userStatsModes[ind].winrate = el );

        const kds =  await this.#getModesStat('killdeath', el => el.querySelector('span.badge').textContent )
        kds.map( (el, ind) => userStatsModes[ind].KD = el );        

        const groundKds = await this.#getModesStat('groundfragsdeath', el => el.querySelector('span.badge').textContent )
        groundKds.map( (el, ind) => userStatsModes[ind].groundKD = el );        

        const airKds = await this.#getModesStat('airfragsdeath', el => el.querySelector('span.badge').textContent )
        airKds.map( (el, ind) => userStatsModes[ind].airKD = el );        
        

        await browser.close()
        return userStats;
    }

}

module.exports = new WarThunderApi();



new WarThunderApi().getStat('MrPlane2002').then( stat => console.log(stat));