const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getFuelEfficiency,
  getVehicleROI,
  exportFuelCSV,
  exportROICSV,
  getDriverPerformance,
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/dashboard', getDashboardStats);
router.get('/fuel-efficiency', getFuelEfficiency);
router.get('/vehicle-roi', getVehicleROI);
router.get('/driver-performance', getDriverPerformance);
router.get('/export/fuel-csv', exportFuelCSV);
router.get('/export/roi-csv', exportROICSV);

module.exports = router;
