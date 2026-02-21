const Vehicle = require('../models/Vehicle');

// GET /api/vehicles
const getVehicles = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const vehicles = await Vehicle.find(filter).sort({ createdAt: -1 });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/vehicles/:id
const getVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/vehicles
const createVehicle = async (req, res) => {
  try {
    const { name, licensePlate, type, maxCapacity, odometer, status, acquisitionCost } = req.body;

    const exists = await Vehicle.findOne({ licensePlate });
    if (exists) {
      return res.status(400).json({ message: 'Vehicle with this license plate already exists' });
    }

    const vehicle = await Vehicle.create({
      name,
      licensePlate,
      type,
      maxCapacity,
      odometer: odometer || 0,
      status: status || 'Available',
      acquisitionCost,
    });

    res.status(201).json(vehicle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PUT /api/vehicles/:id
const updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    // Don't allow editing license plate to one that already exists
    if (req.body.licensePlate && req.body.licensePlate !== vehicle.licensePlate) {
      const exists = await Vehicle.findOne({ licensePlate: req.body.licensePlate });
      if (exists) {
        return res.status(400).json({ message: 'License plate already in use' });
      }
    }

    Object.assign(vehicle, req.body);
    await vehicle.save();
    res.json(vehicle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE /api/vehicles/:id
const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    await vehicle.deleteOne();
    res.json({ message: 'Vehicle removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getVehicles, getVehicle, createVehicle, updateVehicle, deleteVehicle };
