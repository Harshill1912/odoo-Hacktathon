const express = require('express');
const router = express.Router();
const { getVehicles, getVehicle, createVehicle, updateVehicle, deleteVehicle } = require('../controllers/vehicleController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getVehicles)
  .post(authorize('manager', 'dispatcher'), createVehicle);

router.route('/:id')
  .get(getVehicle)
  .put(authorize('manager', 'dispatcher'), updateVehicle)
  .delete(authorize('manager'), deleteVehicle);

module.exports = router;
