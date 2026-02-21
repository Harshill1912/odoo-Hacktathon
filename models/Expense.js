const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  type: { type: String, enum: ['Fuel', 'Maintenance'], required: true },
  liters: { type: Number, default: 0 },
  cost: { type: Number, required: true },
  date: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
