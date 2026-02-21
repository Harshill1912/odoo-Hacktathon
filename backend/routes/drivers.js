const express = require('express');
const router = express.Router();
const { getDrivers, getDriver, createDriver, updateDriver, toggleDriverStatus, deleteDriver } = require('../controllers/driverController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getDrivers)
  .post(authorize('manager', 'dispatcher', 'safety'), createDriver);

router.route('/:id')
  .get(getDriver)
  .put(authorize('manager', 'dispatcher', 'safety'), updateDriver)
  .delete(authorize('manager'), deleteDriver);

router.put('/:id/toggle-status', authorize('manager', 'dispatcher', 'safety'), toggleDriverStatus);

module.exports = router;
