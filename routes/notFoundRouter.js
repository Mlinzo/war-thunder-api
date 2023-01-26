const { Router } = require("express");
const ApiEror = require("../exceptions/ApiError");

const router = Router();

router.get('*', (req, res, next) => {
    next(ApiEror.NotFoundError())
})

module.exports = router;