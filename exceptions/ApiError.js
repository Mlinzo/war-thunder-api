module.exports = class ApiEror extends Error {
    status;

    constructor(status, message){
        super(message);
        this.status = status;
    }

    static BadRequestError(message) { return new ApiEror(400, message) }

    static NotFoundError() { return new ApiEror(404, 'Not Found') }


}