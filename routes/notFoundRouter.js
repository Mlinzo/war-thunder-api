const { Router } = require("express");
const ApiError = require("../exceptions/ApiError");

const router = Router();

router.get('*', (req, res, next) => {
    next(ApiError.NotFoundError())
})

module.exports = router;