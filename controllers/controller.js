const ApiError = require("../exceptions/ApiError");
const service = require("../services/service");
const validate = require("../validators");

class Controller {

    async stat(req, res, next) {
        try {   
            console.log('GET stat endpoint call');
            const [username] = Object.values(req.params);
            const result = await service.stat(username);
            return res.json(result);
        } catch (e) { next(e); }
    }

    async resume(req, res, next) {
        try {
            console.log('GET resume endpoint call');
            const [username] = Object.values(req.params);
            const result = await service.resume(username);
            return res.json(result);
        } catch (e) { next(e); }
    }

    async userVehicles(req, res, next) {
        try {
            console.log('GET user vehicles endpoint call');
            
            try { await validate.getUserVehicles(req.query); }
            catch (error) { console.log(error); return next(ApiError.InvalidQueryError()); }

            const [username, mode] = Object.values(req.params);
            const {type, role, country} = req.query;

            const result = await service.userVehicles(username, mode, type, role, country);
            return res.json(result);
            
        } catch (e) { next(e); }
    }

    async squadHistory(req, res, next) {
        try {   
            console.log('GET squad-history endpoint call');
            const [username] = Object.values(req.params);
            const result = await service.squadHistory(username);
            return res.json(result);
        } catch (e) { next(e); }
    }

    async invitations(req, res, next) {
        try {   
            console.log('GET invitations endpoint call');
            const [username] = Object.values(req.params);
            const result = await service.invitations(username);
            return res.json(result);
        } catch (e) { next(e); }
    }

};

module.exports = new Controller();