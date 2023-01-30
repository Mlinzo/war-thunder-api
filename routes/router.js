const { Router } = require("express");
const controller = require("../controllers/controller");
const router = Router();


router.get('/', (req, res, next) => res.sendStatus(200));

router.get('/:username/stat', controller.stat);
router.get('/:username/resume', controller.resume);
router.get('/:username/vehicles/:mode(arcade|realistic|simulator)', controller.userVehicles)
router.get('/:username/squad-history', controller.squadHistory)
router.get('/:username/invitations', controller.invitations)

module.exports = router;