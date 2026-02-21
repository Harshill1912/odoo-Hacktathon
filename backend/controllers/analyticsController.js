const Trip = require('../models/Trip');
const Expense = require('../models/Expense');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');

// GET /api/analytics/dashboard
const getDashboardStats = async (req, res) => {
  try {
    const totalVehicles = await Vehicle.countDocuments();
    const availableVehicles = await Vehicle.countDocuments({ status: 'Available' });
    const onTripVehicles = await Vehicle.countDocuments({ status: 'OnTrip' });
    const inShopVehicles = await Vehicle.countDocuments({ status: 'InShop' });
    const retiredVehicles = await Vehicle.countDocuments({ status: 'Retired' });

    const totalDrivers = await Driver.countDocuments();
    const onDutyDrivers = await Driver.countDocuments({ status: 'OnDuty' });

    const pendingTrips = await Trip.countDocuments({ status: 'Dispatched' });
    const completedTrips = await Trip.countDocuments({ status: 'Completed' });

    const activeFleet = totalVehicles - retiredVehicles;
    const utilization = activeFleet > 0
      ? Math.round((onTripVehicles / activeFleet) * 100)
      : 0;

    res.json({
      totalVehicles,
      availableVehicles,
      onTripVehicles,
      inShopVehicles,
      retiredVehicles,
      activeFleet,
      utilization,
      totalDrivers,
      onDutyDrivers,
      pendingTrips,
      completedTrips,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/analytics/fuel-efficiency
const getFuelEfficiency = async (req, res) => {
  try {
    // Get total distance per vehicle from completed trips
    const tripData = await Trip.aggregate([
      { $match: { status: 'Completed' } },
      {
        $group: {
          _id: '$vehicleId',
          totalDistance: { $sum: '$distance' },
          tripCount: { $sum: 1 },
          totalRevenue: { $sum: '$revenue' },
        },
      },
    ]);

    // Get total fuel liters per vehicle
    const fuelData = await Expense.aggregate([
      { $match: { type: 'Fuel' } },
      {
        $group: {
          _id: '$vehicleId',
          totalLiters: { $sum: '$liters' },
          totalFuelCost: { $sum: '$cost' },
        },
      },
    ]);

    // Get vehicle details
    const vehicles = await Vehicle.find();
    const vehicleMap = {};
    vehicles.forEach((v) => {
      vehicleMap[v._id.toString()] = v;
    });

    const fuelMap = {};
    fuelData.forEach((f) => {
      fuelMap[f._id.toString()] = f;
    });

    const results = tripData.map((t) => {
      const vid = t._id.toString();
      const vehicle = vehicleMap[vid];
      const fuel = fuelMap[vid] || { totalLiters: 0, totalFuelCost: 0 };
      const efficiency = fuel.totalLiters > 0
        ? Math.round((t.totalDistance / fuel.totalLiters) * 100) / 100
        : 0;

      return {
        vehicleId: vid,
        vehicleName: vehicle?.name || 'Unknown',
        licensePlate: vehicle?.licensePlate || '',
        totalDistance: t.totalDistance,
        totalLiters: fuel.totalLiters,
        totalFuelCost: fuel.totalFuelCost,
        efficiency, // km per liter
        tripCount: t.tripCount,
        totalRevenue: t.totalRevenue,
      };
    });

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/analytics/vehicle-roi
const getVehicleROI = async (req, res) => {
  try {
    const vehicles = await Vehicle.find();

    const results = await Promise.all(
      vehicles.map(async (vehicle) => {
        const vid = vehicle._id;

        // Total revenue from completed trips
        const tripAgg = await Trip.aggregate([
          { $match: { vehicleId: vid, status: 'Completed' } },
          { $group: { _id: null, totalRevenue: { $sum: '$revenue' }, totalDistance: { $sum: '$distance' } } },
        ]);

        const totalRevenue = tripAgg.length > 0 ? tripAgg[0].totalRevenue : 0;
        const totalDistance = tripAgg.length > 0 ? tripAgg[0].totalDistance : 0;

        // Total expenses (fuel + maintenance)
        const expenseAgg = await Expense.aggregate([
          { $match: { vehicleId: vid } },
          {
            $group: {
              _id: null,
              totalFuelCost: { $sum: { $cond: [{ $eq: ['$type', 'Fuel'] }, '$cost', 0] } },
              totalMaintenanceCost: { $sum: { $cond: [{ $eq: ['$type', 'Maintenance'] }, '$cost', 0] } },
            },
          },
        ]);

        const totalFuelCost = expenseAgg.length > 0 ? expenseAgg[0].totalFuelCost : 0;
        const totalMaintenanceCost = expenseAgg.length > 0 ? expenseAgg[0].totalMaintenanceCost : 0;
        const totalExpenses = totalFuelCost + totalMaintenanceCost;

        const roi = vehicle.acquisitionCost > 0
          ? Math.round(((totalRevenue - totalExpenses) / vehicle.acquisitionCost) * 10000) / 100
          : 0;

        return {
          vehicleId: vid,
          vehicleName: vehicle.name,
          licensePlate: vehicle.licensePlate,
          type: vehicle.type,
          acquisitionCost: vehicle.acquisitionCost,
          totalRevenue,
          totalFuelCost,
          totalMaintenanceCost,
          totalExpenses,
          totalDistance,
          roi, // percentage
        };
      })
    );

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/analytics/export/fuel-csv
const exportFuelCSV = async (req, res) => {
  try {
    const tripData = await Trip.aggregate([
      { $match: { status: 'Completed' } },
      {
        $group: {
          _id: '$vehicleId',
          totalDistance: { $sum: '$distance' },
          tripCount: { $sum: 1 },
          totalRevenue: { $sum: '$revenue' },
        },
      },
    ]);

    const fuelData = await Expense.aggregate([
      { $match: { type: 'Fuel' } },
      {
        $group: {
          _id: '$vehicleId',
          totalLiters: { $sum: '$liters' },
          totalFuelCost: { $sum: '$cost' },
        },
      },
    ]);

    const vehicles = await Vehicle.find();
    const vehicleMap = {};
    vehicles.forEach((v) => { vehicleMap[v._id.toString()] = v; });

    const fuelMap = {};
    fuelData.forEach((f) => { fuelMap[f._id.toString()] = f; });

    let csv = 'Vehicle,License Plate,Type,Total Distance (km),Total Liters,Fuel Cost ($),Efficiency (km/L),Trips\n';

    tripData.forEach((t) => {
      const vid = t._id.toString();
      const vehicle = vehicleMap[vid];
      const fuel = fuelMap[vid] || { totalLiters: 0, totalFuelCost: 0 };
      const efficiency = fuel.totalLiters > 0
        ? Math.round((t.totalDistance / fuel.totalLiters) * 100) / 100
        : 0;

      csv += `"${vehicle?.name || 'Unknown'}","${vehicle?.licensePlate || ''}","${vehicle?.type || ''}",${t.totalDistance},${fuel.totalLiters},${fuel.totalFuelCost},${efficiency},${t.tripCount}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=fuel-efficiency-report.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/analytics/export/roi-csv
const exportROICSV = async (req, res) => {
  try {
    const vehicles = await Vehicle.find();

    let csv = 'Vehicle,License Plate,Type,Acquisition Cost ($),Revenue ($),Fuel Cost ($),Maintenance Cost ($),Total Expenses ($),ROI (%)\n';

    for (const vehicle of vehicles) {
      const vid = vehicle._id;

      const tripAgg = await Trip.aggregate([
        { $match: { vehicleId: vid, status: 'Completed' } },
        { $group: { _id: null, totalRevenue: { $sum: '$revenue' } } },
      ]);

      const totalRevenue = tripAgg.length > 0 ? tripAgg[0].totalRevenue : 0;

      const expenseAgg = await Expense.aggregate([
        { $match: { vehicleId: vid } },
        {
          $group: {
            _id: null,
            totalFuelCost: { $sum: { $cond: [{ $eq: ['$type', 'Fuel'] }, '$cost', 0] } },
            totalMaintenanceCost: { $sum: { $cond: [{ $eq: ['$type', 'Maintenance'] }, '$cost', 0] } },
          },
        },
      ]);

      const totalFuelCost = expenseAgg.length > 0 ? expenseAgg[0].totalFuelCost : 0;
      const totalMaintenanceCost = expenseAgg.length > 0 ? expenseAgg[0].totalMaintenanceCost : 0;
      const totalExpenses = totalFuelCost + totalMaintenanceCost;
      const roi = vehicle.acquisitionCost > 0
        ? Math.round(((totalRevenue - totalExpenses) / vehicle.acquisitionCost) * 10000) / 100
        : 0;

      csv += `"${vehicle.name}","${vehicle.licensePlate}","${vehicle.type}",${vehicle.acquisitionCost},${totalRevenue},${totalFuelCost},${totalMaintenanceCost},${totalExpenses},${roi}\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=vehicle-roi-report.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/analytics/driver-performance
const getDriverPerformance = async (req, res) => {
  try {
    const drivers = await Driver.find();

    const results = await Promise.all(
      drivers.map(async (driver) => {
        const totalTrips = await Trip.countDocuments({ driverId: driver._id });
        const completedTrips = await Trip.countDocuments({ driverId: driver._id, status: 'Completed' });
        const cancelledTrips = await Trip.countDocuments({ driverId: driver._id, status: 'Cancelled' });
        const activeTrips = await Trip.countDocuments({ driverId: driver._id, status: 'Dispatched' });

        const tripAgg = await Trip.aggregate([
          { $match: { driverId: driver._id, status: 'Completed' } },
          {
            $group: {
              _id: null,
              totalDistance: { $sum: '$distance' },
              totalRevenue: { $sum: '$revenue' },
              totalCargo: { $sum: '$cargoWeight' },
            },
          },
        ]);

        const completionRate = totalTrips > 0
          ? Math.round((completedTrips / totalTrips) * 100)
          : 0;

        return {
          driverId: driver._id,
          name: driver.name,
          licenseNumber: driver.licenseNumber,
          licenseExpiry: driver.licenseExpiry,
          category: driver.category,
          status: driver.status,
          safetyScore: driver.safetyScore,
          totalTrips,
          completedTrips,
          cancelledTrips,
          activeTrips,
          completionRate,
          totalDistance: tripAgg.length > 0 ? tripAgg[0].totalDistance : 0,
          totalRevenue: tripAgg.length > 0 ? tripAgg[0].totalRevenue : 0,
          totalCargo: tripAgg.length > 0 ? tripAgg[0].totalCargo : 0,
        };
      })
    );

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboardStats, getFuelEfficiency, getVehicleROI, exportFuelCSV, exportROICSV, getDriverPerformance };
