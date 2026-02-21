const Expense = require('../models/Expense');
const Vehicle = require('../models/Vehicle');

// GET /api/expenses
const getExpenses = async (req, res) => {
  try {
    const filter = {};
    if (req.query.vehicleId) filter.vehicleId = req.query.vehicleId;
    if (req.query.type) filter.type = req.query.type;

    const expenses = await Expense.find(filter)
      .populate('vehicleId', 'name licensePlate type')
      .sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/expenses
const createExpense = async (req, res) => {
  try {
    const { vehicleId, type, liters, cost, date } = req.body;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(400).json({ message: 'Vehicle not found' });
    }

    // If maintenance expense, set vehicle to InShop
    if (type === 'Maintenance') {
      if (vehicle.status === 'OnTrip') {
        return res.status(400).json({ message: 'Cannot log maintenance for a vehicle currently on a trip' });
      }
      vehicle.status = 'InShop';
      await vehicle.save();
    }

    const expense = await Expense.create({
      vehicleId,
      type,
      liters: liters || 0,
      cost,
      date: date || Date.now(),
    });

    const populated = await Expense.findById(expense._id)
      .populate('vehicleId', 'name licensePlate type');

    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// GET /api/expenses/by-vehicle
const getExpensesByVehicle = async (req, res) => {
  try {
    const expenses = await Expense.aggregate([
      {
        $group: {
          _id: '$vehicleId',
          totalFuelCost: {
            $sum: { $cond: [{ $eq: ['$type', 'Fuel'] }, '$cost', 0] },
          },
          totalMaintenanceCost: {
            $sum: { $cond: [{ $eq: ['$type', 'Maintenance'] }, '$cost', 0] },
          },
          totalCost: { $sum: '$cost' },
          totalLiters: { $sum: '$liters' },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'vehicles',
          localField: '_id',
          foreignField: '_id',
          as: 'vehicle',
        },
      },
      { $unwind: '$vehicle' },
      {
        $project: {
          vehicleId: '$_id',
          vehicleName: '$vehicle.name',
          licensePlate: '$vehicle.licensePlate',
          totalFuelCost: 1,
          totalMaintenanceCost: 1,
          totalCost: 1,
          totalLiters: 1,
          count: 1,
        },
      },
    ]);
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getExpenses, createExpense, getExpensesByVehicle };
