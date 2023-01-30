const { Router } = require("express");
const controller = require("../controllers/controller");
const router = Router();


router.get('/', (req, res, next) => res.sendStatus(200));

router.get('/:username/stat', controller.getStat);
router.get('/:username/resume', controller.getResume);
router.get('/:username/vehicles/:mode(arcade|realistic|simulator)', controller.getUserVehicles)

module.exports = router;