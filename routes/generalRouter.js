const { Router } = require("express");
const generalController = require("../controllers/generalController");
const router = Router();


router.get('/', (req, res, next) => res.sendStatus(200));

router.get('/:username/stat', generalController.getStat);
router.get('/:username/resume', generalController.getResume);
router.get('/:username/vehicles/:mode(arcade|realistic|simulator)', generalController.getUserVehicles)

module.exports = router;