const Driver = require('../models/Driver');

// GET /api/drivers
const getDrivers = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const drivers = await Driver.find(filter).sort({ createdAt: -1 });
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/drivers/:id
const getDriver = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    res.json(driver);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/drivers
const createDriver = async (req, res) => {
  try {
    const { name, licenseNumber, licenseExpiry, category, status, safetyScore } = req.body;

    const exists = await Driver.findOne({ licenseNumber });
    if (exists) {
      return res.status(400).json({ message: 'Driver with this license number already exists' });
    }

    const driver = await Driver.create({
      name,
      licenseNumber,
      licenseExpiry,
      category,
      status: status || 'OnDuty',
      safetyScore: safetyScore || 100,
    });

    res.status(201).json(driver);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PUT /api/drivers/:id
const updateDriver = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ message: 'Driver not found' });

    if (req.body.licenseNumber && req.body.licenseNumber !== driver.licenseNumber) {
      const exists = await Driver.findOne({ licenseNumber: req.body.licenseNumber });
      if (exists) {
        return res.status(400).json({ message: 'License number already in use' });
      }
    }

    Object.assign(driver, req.body);
    await driver.save();
    res.json(driver);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PUT /api/drivers/:id/toggle-status
const toggleDriverStatus = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ message: 'Driver not found' });

    if (driver.status === 'OnTrip') {
      return res.status(400).json({ message: 'Cannot change status while driver is on a trip' });
    }

    // Toggle between OnDuty and OffDuty
    if (driver.status === 'OnDuty') {
      driver.status = 'OffDuty';
    } else if (driver.status === 'OffDuty') {
      driver.status = 'OnDuty';
    } else if (driver.status === 'Suspended') {
      driver.status = 'OnDuty';
    }

    await driver.save();
    res.json(driver);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE /api/drivers/:id
const deleteDriver = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    await driver.deleteOne();
    res.json({ message: 'Driver removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDrivers, getDriver, createDriver, updateDriver, toggleDriverStatus, deleteDriver };
