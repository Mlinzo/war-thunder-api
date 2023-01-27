const generalService = require("../services/generalService");

class generalController {

    async getStat(req, res, next) {
        try {   
            console.log('GET stat endpoint call');
            const [username] = Object.values(req.params);
            const result = await generalService.getStat(username);
            return res.json(result);
        } catch (e) { next(e); }
    }

    async getResume(req, res, next) {
        try {
            console.log('GET resume endpoint call');
            const [username] = Object.values(req.params);
            const result = await generalService.getResume(username);
            return res.json(result);
        } catch (e) { next(e); }
    }

};

module.exports = new generalController();