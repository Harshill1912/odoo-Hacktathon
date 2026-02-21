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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, tripsRes] = await Promise.all([
          api.get('/analytics/dashboard'),
          api.get('/trips'),
        ]);
        setStats(statsRes.data);
        setRecentTrips(tripsRes.data.slice(0, 5));
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

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Active Fleet"
          value={stats?.activeFleet || 0}
          subtitle={`${stats?.totalVehicles || 0} total vehicles`}
          color="text-blue-600"
          icon="🚛"
        />
        <StatCard
          title="In Maintenance"
          value={stats?.inShopVehicles || 0}
          subtitle="Vehicles in shop"
          color="text-orange-600"
          icon="🔧"
        />
        <StatCard
          title="Utilization"
          value={`${stats?.utilization || 0}%`}
          subtitle={`${stats?.onTripVehicles || 0} on trip`}
          color="text-green-600"
          icon="📈"
        />
        <StatCard
          title="Active Trips"
          value={stats?.pendingTrips || 0}
          subtitle={`${stats?.completedTrips || 0} completed`}
          color="text-purple-600"
          icon="📦"
        />
      </div>

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

      {/* Driver stats */}
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
