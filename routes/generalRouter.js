const { Router } = require("express");
const generalController = require("../controllers/generalController");
const router = Router();


router.get('/', (req, res, next) => res.sendStatus(200));

router.get('/stat/:username', generalController.getStat)



module.exports = router;