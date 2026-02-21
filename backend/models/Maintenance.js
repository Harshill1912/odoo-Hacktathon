const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  type: {
    type: String,
    enum: ['Preventive', 'Reactive', 'Inspection'],
    required: true,
  },
  description: { type: String, required: true },
  cost: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ['Scheduled', 'InProgress', 'Completed'],
    default: 'InProgress',
  },
  scheduledDate: { type: Date, default: Date.now },
  completedDate: { type: Date, default: null },
  odometerAtService: { type: Number, default: 0 },
  notes: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Maintenance', maintenanceSchema);
