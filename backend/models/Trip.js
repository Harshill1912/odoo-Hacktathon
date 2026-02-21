const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  cargoWeight: { type: Number, required: true },
  status: {
    type: String,
    enum: ['Draft', 'Dispatched', 'Completed', 'Cancelled'],
    default: 'Draft',
  },
  origin: { type: String, default: '' },
  destination: { type: String, default: '' },
  startOdometer: { type: Number, required: true },
  endOdometer: { type: Number, default: null },
  revenue: { type: Number, default: 0 },
  distance: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Trip', tripSchema);
