const express = require('express');
const router = express.Router();
const { getTrips, getTrip, createTrip, completeTrip, cancelTrip } = require('../controllers/tripController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getTrips)
  .post(authorize('manager', 'dispatcher'), createTrip);

router.route('/:id')
  .get(getTrip);

router.put('/:id/complete', authorize('manager', 'dispatcher'), completeTrip);
router.put('/:id/cancel', authorize('manager', 'dispatcher'), cancelTrip);

module.exports = router;
