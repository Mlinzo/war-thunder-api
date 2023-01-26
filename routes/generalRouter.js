const { Router } = require("express");
const generalController = require("../controllers/generalController");
const router = Router();


router.get('/', (req, res, next) => res.sendStatus(200));



module.exports = router;