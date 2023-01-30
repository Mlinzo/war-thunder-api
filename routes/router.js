const { Router } = require("express");
const controller = require("../controllers/controller");
const router = Router();

router.get('/:username/stat', controller.stat);
router.get('/:username/resume', controller.resume);
router.get('/:username/vehicles/:mode(arcade|realistic|simulator)', controller.userVehicles)
router.get('/:username/squad-history', controller.squadHistory)
router.get('/:username/invitations', controller.invitations)
router.get('/vehicles', controller.vehicles)
router.get('/vehicle/:name', controller.vehicle)


module.exports = router;