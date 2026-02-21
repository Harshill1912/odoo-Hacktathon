const Trip = require('../models/Trip');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');

// GET /api/trips
const getTrips = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const trips = await Trip.find(filter)
      .populate('vehicleId', 'name licensePlate type maxCapacity status')
      .populate('driverId', 'name licenseNumber status')
      .sort({ createdAt: -1 });
    res.json(trips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/trips/:id
const getTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('vehicleId')
      .populate('driverId');
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    res.json(trip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/trips - Create & dispatch a trip
const createTrip = async (req, res) => {
  try {
    const { vehicleId, driverId, cargoWeight, revenue } = req.body;

    // Validate vehicle
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(400).json({ message: 'Vehicle not found' });
    }
    if (vehicle.status !== 'Available') {
      return res.status(400).json({ message: `Vehicle is not available (current status: ${vehicle.status})` });
    }

    // Validate driver
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(400).json({ message: 'Driver not found' });
    }
    if (driver.status !== 'OnDuty') {
      return res.status(400).json({ message: `Driver is not on duty (current status: ${driver.status})` });
    }

    // Check license expiry
    if (new Date(driver.licenseExpiry) < new Date()) {
      return res.status(400).json({ message: 'Driver license has expired' });
    }

    // Check cargo weight vs capacity
    if (cargoWeight > vehicle.maxCapacity) {
      return res.status(400).json({
        message: `Cargo weight (${cargoWeight}kg) exceeds vehicle capacity (${vehicle.maxCapacity}kg)`,
      });
    }

    // Create trip
    const trip = await Trip.create({
      vehicleId,
      driverId,
      cargoWeight,
      startOdometer: vehicle.odometer,
      status: 'Dispatched',
      revenue: revenue || 0,
    });

    // Update vehicle & driver status
    vehicle.status = 'OnTrip';
    await vehicle.save();

    driver.status = 'OnTrip';
    await driver.save();

    const populatedTrip = await Trip.findById(trip._id)
      .populate('vehicleId', 'name licensePlate type maxCapacity status')
      .populate('driverId', 'name licenseNumber status');

    res.status(201).json(populatedTrip);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PUT /api/trips/:id/complete
const completeTrip = async (req, res) => {
  try {
    const { endOdometer, revenue } = req.body;
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    if (trip.status !== 'Dispatched') {
      return res.status(400).json({ message: 'Only dispatched trips can be completed' });
    }

    if (!endOdometer || endOdometer <= trip.startOdometer) {
      return res.status(400).json({ message: 'End odometer must be greater than start odometer' });
    }

    const distance = endOdometer - trip.startOdometer;

    trip.endOdometer = endOdometer;
    trip.distance = distance;
    trip.status = 'Completed';
    if (revenue !== undefined) trip.revenue = revenue;
    await trip.save();

    // Update vehicle
    const vehicle = await Vehicle.findById(trip.vehicleId);
    if (vehicle) {
      vehicle.status = 'Available';
      vehicle.odometer = endOdometer;
      await vehicle.save();
    }

    // Update driver
    const driver = await Driver.findById(trip.driverId);
    if (driver) {
      driver.status = 'OnDuty';
      await driver.save();
    }

    const populatedTrip = await Trip.findById(trip._id)
      .populate('vehicleId', 'name licensePlate type maxCapacity status')
      .populate('driverId', 'name licenseNumber status');

    res.json(populatedTrip);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PUT /api/trips/:id/cancel
const cancelTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    if (trip.status === 'Completed') {
      return res.status(400).json({ message: 'Cannot cancel a completed trip' });
    }

    if (trip.status === 'Dispatched') {
      // Release vehicle and driver
      const vehicle = await Vehicle.findById(trip.vehicleId);
      if (vehicle) {
        vehicle.status = 'Available';
        await vehicle.save();
      }
      const driver = await Driver.findById(trip.driverId);
      if (driver) {
        driver.status = 'OnDuty';
        await driver.save();
      }
    }

    trip.status = 'Cancelled';
    await trip.save();

    res.json(trip);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { getTrips, getTrip, createTrip, completeTrip, cancelTrip };
