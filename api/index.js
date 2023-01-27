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

    // maybe rename props later
    stat = async username => {
        const statUrl = BASE_URL + `/stat/${username}/export/json`;
       
        const page = this.page;

        await page.goto(statUrl);

        let stats;
        try {
            stats = JSON.parse(await page.evaluate( () => document.querySelector('pre').innerText))
        } catch (e) { throw WarThunderApiError.NoSuchUserError() }
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

    #getResumeField = async (resumeTitle, cb) => {
        const index = this.allResumes.findIndex( field => field.startsWith(resumeTitle) );
        const handle  = this.allResumeHandles[index];
        const resumeField = await handle.evaluate(cb);
        return resumeField === 'unknown'? null: resumeField;
    }

}

module.exports = new WarThunderApi();