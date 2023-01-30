const ApiError = require("../exceptions/ApiError");
const generalService = require("../services/generalService");
const validate = require("../validators");

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

    async getUserVehicles(req, res, next) {
        try {
            console.log('GET user vehicles endpoint call');
            
            try { await validate.getUserVehicles(req.query); }
            catch (error) { console.log(error); return next(ApiError.InvalidQueryError()); }

            const [username, mode] = Object.values(req.params);
            const {type, role, country} = req.query;

            const result = await generalService.getUserVehicles(username, mode, type, role, country);
            return res.json(result);
            
        } catch (e) { next(e); }
    }

};

module.exports = new generalController();