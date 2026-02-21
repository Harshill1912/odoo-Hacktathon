const Maintenance = require('../models/Maintenance');
const Vehicle = require('../models/Vehicle');
const Expense = require('../models/Expense');

// GET /api/maintenance
const getMaintenanceLogs = async (req, res) => {
  try {
    const filter = {};
    if (req.query.vehicleId) filter.vehicleId = req.query.vehicleId;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.type) filter.type = req.query.type;

    const logs = await Maintenance.find(filter)
      .populate('vehicleId', 'name licensePlate type status odometer')
      .sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/maintenance/:id
const getMaintenanceLog = async (req, res) => {
  try {
    const log = await Maintenance.findById(req.params.id)
      .populate('vehicleId', 'name licensePlate type status odometer');
    if (!log) return res.status(404).json({ message: 'Maintenance log not found' });
    res.json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/maintenance - Create a service log
const createMaintenanceLog = async (req, res) => {
  try {
    const { vehicleId, type, description, cost, scheduledDate, odometerAtService, notes } = req.body;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(400).json({ message: 'Vehicle not found' });
    }

    if (vehicle.status === 'OnTrip') {
      return res.status(400).json({ message: 'Cannot schedule maintenance for a vehicle currently on a trip' });
    }

    // Create maintenance log
    const log = await Maintenance.create({
      vehicleId,
      type,
      description,
      cost,
      status: 'InProgress',
      scheduledDate: scheduledDate || Date.now(),
      odometerAtService: odometerAtService || vehicle.odometer,
      notes: notes || '',
    });

    // Auto-logic: Set vehicle status to InShop
    vehicle.status = 'InShop';
    await vehicle.save();

    // Also create an expense record for financial tracking
    await Expense.create({
      vehicleId,
      type: 'Maintenance',
      liters: 0,
      cost,
      date: scheduledDate || Date.now(),
    });

    const populated = await Maintenance.findById(log._id)
      .populate('vehicleId', 'name licensePlate type status odometer');

    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PUT /api/maintenance/:id/complete - Complete a service
const completeMaintenanceLog = async (req, res) => {
  try {
    const log = await Maintenance.findById(req.params.id);
    if (!log) return res.status(404).json({ message: 'Maintenance log not found' });

    if (log.status === 'Completed') {
      return res.status(400).json({ message: 'Maintenance already completed' });
    }

    log.status = 'Completed';
    log.completedDate = new Date();
    if (req.body.notes) log.notes = req.body.notes;
    if (req.body.cost) log.cost = req.body.cost;
    await log.save();

    // Set vehicle back to Available
    const vehicle = await Vehicle.findById(log.vehicleId);
    if (vehicle && vehicle.status === 'InShop') {
      vehicle.status = 'Available';
      await vehicle.save();
    }

    const populated = await Maintenance.findById(log._id)
      .populate('vehicleId', 'name licensePlate type status odometer');

    res.json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE /api/maintenance/:id
const deleteMaintenanceLog = async (req, res) => {
  try {
    const log = await Maintenance.findById(req.params.id);
    if (!log) return res.status(404).json({ message: 'Maintenance log not found' });

    // If deleting an in-progress log, release the vehicle
    if (log.status === 'InProgress') {
      const vehicle = await Vehicle.findById(log.vehicleId);
      if (vehicle && vehicle.status === 'InShop') {
        vehicle.status = 'Available';
        await vehicle.save();
      }
    }

    await log.deleteOne();
    res.json({ message: 'Maintenance log removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/maintenance/summary - Get maintenance summary per vehicle
const getMaintenanceSummary = async (req, res) => {
  try {
    const summary = await Maintenance.aggregate([
      {
        $group: {
          _id: '$vehicleId',
          totalCost: { $sum: '$cost' },
          totalLogs: { $sum: 1 },
          completedLogs: {
            $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] },
          },
          inProgressLogs: {
            $sum: { $cond: [{ $eq: ['$status', 'InProgress'] }, 1, 0] },
          },
          lastService: { $max: '$completedDate' },
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
          vehicleType: '$vehicle.type',
          vehicleStatus: '$vehicle.status',
          totalCost: 1,
          totalLogs: 1,
          completedLogs: 1,
          inProgressLogs: 1,
          lastService: 1,
        },
      },
    ]);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMaintenanceLogs,
  getMaintenanceLog,
  createMaintenanceLog,
  completeMaintenanceLog,
  deleteMaintenanceLog,
  getMaintenanceSummary,
};
