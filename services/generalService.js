const api = require('../api/index.js')

class generalService {
    
    getStat = async username =>
        await api.stat(username);
    

};

module.exports = new generalService();