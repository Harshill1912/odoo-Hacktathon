import { useState, useEffect } from 'react';
import api from '../utils/api';

const statusColor = (status) => {
  const colors = {
    Draft: 'bg-gray-100 text-gray-700',
    Dispatched: 'bg-blue-100 text-blue-700',
    Completed: 'bg-green-100 text-green-700',
    Cancelled: 'bg-red-100 text-red-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
};

const Dispatch = () => {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dispatch form
  const [form, setForm] = useState({ vehicleId: '', driverId: '', cargoWeight: '', revenue: '' });

  // Complete trip form
  const [completing, setCompleting] = useState(null);
  const [completeForm, setCompleteForm] = useState({ endOdometer: '', revenue: '' });
  const [completeError, setCompleteError] = useState('');

  const fetchData = async () => {
    try {
      const [vehiclesRes, driversRes, tripsRes] = await Promise.all([
        api.get('/vehicles?status=Available'),
        api.get('/drivers?status=OnDuty'),
        api.get('/trips'),
      ]);
      setVehicles(vehiclesRes.data);
      setDrivers(driversRes.data);
      setTrips(tripsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDispatch = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await api.post('/trips', {
        vehicleId: form.vehicleId,
        driverId: form.driverId,
        cargoWeight: Number(form.cargoWeight),
        revenue: Number(form.revenue) || 0,
      });
      setSuccess('Trip dispatched successfully!');
      setForm({ vehicleId: '', driverId: '', cargoWeight: '', revenue: '' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Dispatch failed');
    }
  };

  const handleComplete = async (tripId) => {
    setCompleteError('');
    try {
      await api.put(`/trips/${tripId}/complete`, {
        endOdometer: Number(completeForm.endOdometer),
        revenue: Number(completeForm.revenue) || undefined,
      });
      setCompleting(null);
      setCompleteForm({ endOdometer: '', revenue: '' });
      fetchData();
    } catch (err) {
      setCompleteError(err.response?.data?.message || 'Completion failed');
    }
  };

  const handleCancel = async (tripId) => {
    if (!window.confirm('Are you sure you want to cancel this trip?')) return;
    try {
      await api.put(`/trips/${tripId}/cancel`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Cancel failed');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dispatch Center</h1>

      {/* Dispatch Form */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Create New Dispatch</h2>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
        {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{success}</div>}

        <form onSubmit={handleDispatch} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle (Available Only)</label>
            <select
              value={form.vehicleId}
              onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            >
              <option value="">Select Vehicle</option>
              {vehicles.map((v) => (
                <option key={v._id} value={v._id}>
                  {v.name} ({v.licensePlate}) - {v.maxCapacity}kg
                </option>
              ))}
            </select>
            {vehicles.length === 0 && <p className="text-xs text-orange-600 mt-1">No available vehicles</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Driver (On Duty Only)</label>
            <select
              value={form.driverId}
              onChange={(e) => setForm({ ...form, driverId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            >
              <option value="">Select Driver</option>
              {drivers.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name} ({d.category})
                </option>
              ))}
            </select>
            {drivers.length === 0 && <p className="text-xs text-orange-600 mt-1">No on-duty drivers</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cargo Weight (kg)</label>
            <input
              type="number"
              value={form.cargoWeight}
              onChange={(e) => setForm({ ...form, cargoWeight: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Enter weight"
              required
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Revenue ($)</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={form.revenue}
                onChange={(e) => setForm({ ...form, revenue: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Optional"
                min="0"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors whitespace-nowrap"
              >
                Dispatch
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Trip List */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">All Trips</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Vehicle</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Driver</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Cargo</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Distance</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Revenue</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {trips.map((trip) => (
                <tr key={trip._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-800">
                    {trip.vehicleId?.name || 'N/A'}
                    <span className="block text-xs text-gray-500">{trip.vehicleId?.licensePlate}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{trip.driverId?.name || 'N/A'}</td>
                  <td className="px-6 py-4 text-gray-600">{trip.cargoWeight} kg</td>
                  <td className="px-6 py-4 text-gray-600">
                    {trip.distance ? `${trip.distance} km` : '-'}
                  </td>
                  <td className="px-6 py-4 text-gray-600">${trip.revenue || 0}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusColor(trip.status)}`}>
                      {trip.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {trip.status === 'Dispatched' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setCompleting(trip._id); setCompleteForm({ endOdometer: '', revenue: trip.revenue || '' }); setCompleteError(''); }}
                          className="text-green-600 hover:text-green-800 font-medium text-xs"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => handleCancel(trip._id)}
                          className="text-red-600 hover:text-red-800 font-medium text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {trips.length === 0 && (
                <tr><td colSpan="7" className="px-6 py-8 text-center text-gray-500">No trips found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Complete Trip Modal */}
      {completing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Complete Trip</h2>
            {completeError && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{completeError}</div>}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Odometer (km)</label>
                <input
                  type="number"
                  value={completeForm.endOdometer}
                  onChange={(e) => setCompleteForm({ ...completeForm, endOdometer: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Revenue ($)</label>
                <input
                  type="number"
                  value={completeForm.revenue}
                  onChange={(e) => setCompleteForm({ ...completeForm, revenue: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleComplete(completing)}
                  className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  Complete Trip
                </button>
                <button
                  onClick={() => setCompleting(null)}
                  className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dispatch;
