class WarThunderApiError extends Error {

    constructor(status, message){
        super(message);
        this.status = status
    }

    static NoSuchUserError() { return new WarThunderApiError(400, 'Could not find the user') }

}

module.exports = WarThunderApiError;