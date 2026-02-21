const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('./models/User');
const Vehicle = require('./models/Vehicle');
const Driver = require('./models/Driver');
const Trip = require('./models/Trip');
const Expense = require('./models/Expense');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await Driver.deleteMany({});
    await Trip.deleteMany({});
    await Expense.deleteMany({});
    console.log('Cleared existing data');

    // Create users (one per role)
    const users = await User.create([
      { name: 'Alice Manager', email: 'manager@fleetflow.com', password: 'password123', role: 'manager' },
      { name: 'Bob Dispatcher', email: 'dispatcher@fleetflow.com', password: 'password123', role: 'dispatcher' },
      { name: 'Carol Safety', email: 'safety@fleetflow.com', password: 'password123', role: 'safety' },
      { name: 'Dave Finance', email: 'finance@fleetflow.com', password: 'password123', role: 'finance' },
    ]);
    console.log(`Created ${users.length} users`);

    // Create vehicles
    const vehicles = await Vehicle.create([
      {
        name: 'City Van',
        licensePlate: 'VAN-001',
        type: 'Van',
        maxCapacity: 500,
        odometer: 12500,
        status: 'Available',
        acquisitionCost: 35000,
      },
      {
        name: 'Heavy Hauler',
        licensePlate: 'TRK-001',
        type: 'Truck',
        maxCapacity: 2000,
        odometer: 45000,
        status: 'Available',
        acquisitionCost: 85000,
      },
    ]);
    console.log(`Created ${vehicles.length} vehicles`);

    // Create drivers with valid licenses (expiry 1 year from now)
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    const drivers = await Driver.create([
      {
        name: 'John Smith',
        licenseNumber: 'DL-VAN-1001',
        licenseExpiry: oneYearFromNow,
        category: 'Van',
        status: 'OnDuty',
        safetyScore: 92,
      },
      {
        name: 'Maria Garcia',
        licenseNumber: 'DL-TRK-2001',
        licenseExpiry: oneYearFromNow,
        category: 'Truck',
        status: 'OnDuty',
        safetyScore: 88,
      },
    ]);
    console.log(`Created ${drivers.length} drivers`);

    // Create a completed trip for the Truck
    const trip = await Trip.create({
      vehicleId: vehicles[1]._id, // Heavy Hauler
      driverId: drivers[1]._id, // Maria Garcia
      cargoWeight: 1500,
      status: 'Completed',
      startOdometer: 44000,
      endOdometer: 45000,
      distance: 1000,
      revenue: 5000,
    });
    console.log('Created 1 completed trip');

    // Create expenses
    const expenses = await Expense.create([
      {
        vehicleId: vehicles[1]._id, // Truck fuel
        type: 'Fuel',
        liters: 120,
        cost: 180,
        date: new Date('2026-02-15'),
      },
      {
        vehicleId: vehicles[0]._id, // Van fuel
        type: 'Fuel',
        liters: 45,
        cost: 67.5,
        date: new Date('2026-02-18'),
      },
      {
        vehicleId: vehicles[0]._id, // Van maintenance
        type: 'Maintenance',
        liters: 0,
        cost: 350,
        date: new Date('2026-02-10'),
      },
    ]);
    console.log(`Created ${expenses.length} expenses`);

    console.log('\n========================================');
    console.log('  SEED COMPLETE - Demo Accounts:');
    console.log('========================================');
    console.log('  manager@fleetflow.com   / password123');
    console.log('  dispatcher@fleetflow.com / password123');
    console.log('  safety@fleetflow.com    / password123');
    console.log('  finance@fleetflow.com   / password123');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
