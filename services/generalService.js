const api = require('../api/index.js')

class generalService {
    
    getStat = async username =>
        await api.stat(username);
    
    getResume = async username =>
        await api.resume(username);

};

module.exports = new generalService();