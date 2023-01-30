const api = require('../api/index.js')

class generalService {
    
    getStat = async username =>
        await api.stat(username);
    
    getResume = async username =>
        await api.resume(username);

    getUserVehicles = async (username, mode, type, role, country) => 
        await api.userVehicles(username, mode, type, role, country)

};

module.exports = new generalService();