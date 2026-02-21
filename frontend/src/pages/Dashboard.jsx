import { useState, useEffect } from 'react';
import api from '../utils/api';

const StatCard = ({ title, value, subtitle, color, icon }) => (
  <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
      <div className="text-3xl">{icon}</div>
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentTrips, setRecentTrips] = useState([]);
  const [allVehicles, setAllVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, tripsRes, vehiclesRes] = await Promise.all([
          api.get('/analytics/dashboard'),
          api.get('/trips'),
          api.get('/vehicles'),
        ]);
        setStats(statsRes.data);
        setRecentTrips(tripsRes.data.slice(0, 5));
        setAllVehicles(vehiclesRes.data);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statusColor = (status) => {
    const colors = {
      Draft: 'bg-gray-100 text-gray-700',
      Dispatched: 'bg-blue-100 text-blue-700',
      Completed: 'bg-green-100 text-green-700',
      Cancelled: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const vehicleStatusColor = (status) => {
    const colors = {
      Available: 'bg-green-100 text-green-700 border-green-200',
      OnTrip: 'bg-blue-100 text-blue-700 border-blue-200',
      InShop: 'bg-orange-100 text-orange-700 border-orange-200',
      Retired: 'bg-gray-100 text-gray-600 border-gray-200',
    };
    return colors[status] || 'bg-gray-100';
  };

  // Filter vehicles
  const filteredVehicles = allVehicles.filter(v => {
    if (filterType && v.type !== filterType) return false;
    if (filterStatus && v.status !== filterStatus) return false;
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Command Center</h1>
          <p className="text-sm text-gray-500 mt-1">Fleet overview at a glance</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Active Fleet"
          value={stats?.activeFleet || 0}
          subtitle={`${stats?.totalVehicles || 0} total vehicles`}
          color="text-blue-600"
          icon="🚛"
        />
        <StatCard
          title="Maintenance Alerts"
          value={stats?.inShopVehicles || 0}
          subtitle="Vehicles in shop"
          color="text-orange-600"
          icon="🔧"
        />
        <StatCard
          title="Utilization Rate"
          value={`${stats?.utilization || 0}%`}
          subtitle={`${stats?.onTripVehicles || 0} on trip`}
          color="text-green-600"
          icon="📈"
        />
        <StatCard
          title="Pending Cargo"
          value={stats?.pendingTrips || 0}
          subtitle={`${stats?.completedTrips || 0} completed`}
          color="text-purple-600"
          icon="📦"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Filter Fleet:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">All Types</option>
            <option value="Truck">🚚 Truck</option>
            <option value="Van">🚐 Van</option>
            <option value="Bike">🏍️ Bike</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">All Statuses</option>
            <option value="Available">Available</option>
            <option value="OnTrip">On Trip</option>
            <option value="InShop">In Shop</option>
            <option value="Retired">Retired</option>
          </select>
          {(filterType || filterStatus) && (
            <button
              onClick={() => { setFilterType(''); setFilterStatus(''); }}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear Filters
            </button>
          )}
          <span className="text-sm text-gray-500 ml-auto">
            Showing {filteredVehicles.length} of {allVehicles.length} vehicles
          </span>
        </div>
      </div>

      {/* Filtered Fleet Table */}
      {(filterType || filterStatus) && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden mb-6">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-800">Filtered Fleet</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">Vehicle</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">Plate</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">Type</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">Capacity</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">Odometer</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredVehicles.map((v) => (
                  <tr key={v._id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-800">{v.name}</td>
                    <td className="px-6 py-3 text-gray-600 font-mono">{v.licensePlate}</td>
                    <td className="px-6 py-3 text-gray-600">{v.type}</td>
                    <td className="px-6 py-3 text-gray-600">{v.maxCapacity} kg</td>
                    <td className="px-6 py-3 text-gray-600">{v.odometer.toLocaleString()} km</td>
                    <td className="px-6 py-3">
                      <span className={`text-xs px-3 py-1 rounded-full font-medium border ${vehicleStatusColor(v.status)}`}>
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredVehicles.length === 0 && (
                  <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">No vehicles match filters</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fleet Status */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Fleet Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Available</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${stats?.totalVehicles ? (stats.availableVehicles / stats.totalVehicles) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-8 text-right">{stats?.availableVehicles}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">On Trip</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${stats?.totalVehicles ? (stats.onTripVehicles / stats.totalVehicles) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-8 text-right">{stats?.onTripVehicles}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">In Shop</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full"
                    style={{ width: `${stats?.totalVehicles ? (stats.inShopVehicles / stats.totalVehicles) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-8 text-right">{stats?.inShopVehicles}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Retired</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gray-500 h-2 rounded-full"
                    style={{ width: `${stats?.totalVehicles ? (stats.retiredVehicles / stats.totalVehicles) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-8 text-right">{stats?.retiredVehicles}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Trips */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Trips</h2>
          {recentTrips.length === 0 ? (
            <p className="text-gray-500 text-sm">No trips yet</p>
          ) : (
            <div className="space-y-3">
              {recentTrips.map((trip) => (
                <div key={trip._id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {trip.vehicleId?.name || 'N/A'} → {trip.driverId?.name || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500">{trip.cargoWeight}kg cargo</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor(trip.status)}`}>
                    {trip.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Stats</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{stats?.totalDrivers || 0}</p>
            <p className="text-sm text-gray-600">Total Drivers</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{stats?.onDutyDrivers || 0}</p>
            <p className="text-sm text-gray-600">On Duty</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{stats?.completedTrips || 0}</p>
            <p className="text-sm text-gray-600">Completed Trips</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-2xl font-bold text-orange-600">{stats?.availableVehicles || 0}</p>
            <p className="text-sm text-gray-600">Available Vehicles</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
