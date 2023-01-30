module.exports = class ApiError extends Error {
    
    constructor(status, message){
        super(message);
        this.status = status;
    }

    static BadRequestError(message) { return new ApiError(400, message) }

    static InvalidQueryError() { return new ApiError(400, 'Invalid query') }

    static NotFoundError() { return new ApiError(404, 'Not Found') }

}