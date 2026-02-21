const express = require('express');
const router = express.Router();
const { getDashboardStats, getFuelEfficiency, getVehicleROI } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/dashboard', getDashboardStats);
router.get('/fuel-efficiency', getFuelEfficiency);
router.get('/vehicle-roi', getVehicleROI);

module.exports = router;
