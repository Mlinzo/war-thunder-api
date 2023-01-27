const generalService = require("../services/generalService");

class generalController {

    async getStat(req, res, next) {
        try {   
            const [username] = Object.values(req.params);
            const result = await generalService.getStat(username);
            return res.json(result);
        } catch (e) { next(e); }
    }

    async getResume(req, res, next) {
        try {   
            const [username] = Object.values(req.params);
            const result = await generalService.getResume(username);
            return res.json(result);
        } catch (e) { next(e); }
    }

};

module.exports = new generalController();