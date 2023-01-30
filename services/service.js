const api = require('../api/index.js')

class Service {
    
    stat = async username =>
        await api.stat(username);
    
    resume = async username =>
        await api.resume(username);

    userVehicles = async (username, mode, type, role, country) => 
        await api.userVehicles(username, mode, type, role, country);

    squadHistory = async username => 
        await api.squadHistory(username);

    invitations = async username => 
        await api.invitations(username);

    vehicles = async (type, role, country) =>
        await api.vehicles(type, role, country);

};

module.exports = new Service();