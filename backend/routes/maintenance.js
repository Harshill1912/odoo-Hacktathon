const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getMaintenanceLogs,
  getMaintenanceLog,
  createMaintenanceLog,
  completeMaintenanceLog,
  deleteMaintenanceLog,
  getMaintenanceSummary,
} = require('../controllers/maintenanceController');

router.use(protect);

router.get('/', getMaintenanceLogs);
router.get('/summary', getMaintenanceSummary);
router.get('/:id', getMaintenanceLog);
router.post('/', createMaintenanceLog);
router.put('/:id/complete', completeMaintenanceLog);
router.delete('/:id', deleteMaintenanceLog);

module.exports = router;
