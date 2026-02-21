const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  name: { type: String, required: true },
  licenseNumber: { type: String, required: true, unique: true },
  licenseExpiry: { type: Date, required: true },
  category: { type: String, enum: ['Truck', 'Van'], required: true },
  status: {
    type: String,
    enum: ['OnDuty', 'OffDuty', 'Suspended', 'OnTrip'],
    default: 'OnDuty',
  },
  safetyScore: { type: Number, default: 100, min: 0, max: 100 },
}, { timestamps: true });

module.exports = mongoose.model('Driver', driverSchema);
