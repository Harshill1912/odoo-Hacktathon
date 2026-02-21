import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const statusPill = (status) => {
  const colors = {
    Scheduled: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    InProgress: 'bg-blue-100 text-blue-700 border-blue-200',
    Completed: 'bg-green-100 text-green-700 border-green-200',
  };
  return (
    <span className={`text-xs px-3 py-1 rounded-full font-medium border ${colors[status] || 'bg-gray-100'}`}>
      {status === 'InProgress' ? 'In Progress' : status}
    </span>
  );
};

const typePill = (type) => {
  const colors = {
    Preventive: 'bg-emerald-100 text-emerald-700',
    Reactive: 'bg-red-100 text-red-700',
    Inspection: 'bg-purple-100 text-purple-700',
  };
  return (
    <span className={`text-xs px-3 py-1 rounded-full font-medium ${colors[type] || 'bg-gray-100'}`}>
      {type}
    </span>
  );
};

const Maintenance = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tab, setTab] = useState('logs'); // logs | summary
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');

  const canEdit = ['manager', 'dispatcher'].includes(user?.role);

  const [form, setForm] = useState({
    vehicleId: '', type: 'Preventive', description: '', cost: '', notes: '',
  });

  const fetchData = async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterType) params.append('type', filterType);

      const [logsRes, vehiclesRes, summaryRes] = await Promise.all([
        api.get(`/maintenance?${params.toString()}`),
        api.get('/vehicles'),
        api.get('/maintenance/summary'),
      ]);
      setLogs(logsRes.data);
      setVehicles(vehiclesRes.data);
      setSummary(summaryRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filterStatus, filterType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/maintenance', {
        vehicleId: form.vehicleId,
        type: form.type,
        description: form.description,
        cost: Number(form.cost),
        notes: form.notes,
      });
      setSuccess('Service log created! Vehicle status set to "In Shop".');
      setShowModal(false);
      setForm({ vehicleId: '', type: 'Preventive', description: '', cost: '', notes: '' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create service log');
    }
  };

  const handleComplete = async (id) => {
    try {
      await api.put(`/maintenance/${id}/complete`);
      setSuccess('Service completed! Vehicle is now Available.');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to complete service');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this service log?')) return;
    try {
      await api.delete(`/maintenance/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  // Vehicles not currently on trip (available for maintenance)
  const availableForService = vehicles.filter(v => v.status !== 'OnTrip' && v.status !== 'Retired');

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Maintenance & Service Logs</h1>
          <p className="text-sm text-gray-500 mt-1">Preventive and reactive fleet health tracking</p>
        </div>
        {canEdit && (
          <button
            onClick={() => { setShowModal(true); setError(''); setSuccess(''); }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <span>🔧</span> New Service Log
          </button>
        )}
      </div>

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center justify-between">
          {success}
          <button onClick={() => setSuccess('')} className="text-green-500 hover:text-green-700 font-bold">×</button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Services</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{logs.length}</p>
            </div>
            <span className="text-2xl">🔧</span>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">In Progress</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {logs.filter(l => l.status === 'InProgress').length}
              </p>
            </div>
            <span className="text-2xl">⏳</span>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Completed</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {logs.filter(l => l.status === 'Completed').length}
              </p>
            </div>
            <span className="text-2xl">✅</span>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Vehicles In Shop</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {vehicles.filter(v => v.status === 'InShop').length}
              </p>
            </div>
            <span className="text-2xl">🏭</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab('logs')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${tab === 'logs' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Service Logs
        </button>
        <button
          onClick={() => setTab('summary')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${tab === 'summary' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Vehicle Summary
        </button>
      </div>

      {tab === 'logs' && (
        <>
          {/* Filters */}
          <div className="flex gap-3 mb-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">All Statuses</option>
              <option value="InProgress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Scheduled">Scheduled</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">All Types</option>
              <option value="Preventive">Preventive</option>
              <option value="Reactive">Reactive</option>
              <option value="Inspection">Inspection</option>
            </select>
          </div>

          {/* Service Logs Table */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Date</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Vehicle</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Type</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Description</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Cost</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Odometer</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Status</th>
                    {canEdit && <th className="text-left px-6 py-3 font-medium text-gray-600">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(log.scheduledDate).toLocaleDateString()}
                        {log.completedDate && (
                          <span className="block text-xs text-green-600">
                            Done: {new Date(log.completedDate).toLocaleDateString()}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-800">{log.vehicleId?.name || 'N/A'}</span>
                        <span className="block text-xs text-gray-500">{log.vehicleId?.licensePlate}</span>
                      </td>
                      <td className="px-6 py-4">{typePill(log.type)}</td>
                      <td className="px-6 py-4 text-gray-700 max-w-xs truncate">{log.description}</td>
                      <td className="px-6 py-4 font-medium text-gray-800">${log.cost.toLocaleString()}</td>
                      <td className="px-6 py-4 text-gray-600">{log.odometerAtService.toLocaleString()} km</td>
                      <td className="px-6 py-4">{statusPill(log.status)}</td>
                      {canEdit && (
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {log.status === 'InProgress' && (
                              <button
                                onClick={() => handleComplete(log._id)}
                                className="text-green-600 hover:text-green-800 font-medium text-xs"
                              >
                                Complete
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(log._id)}
                              className="text-red-600 hover:text-red-800 font-medium text-xs"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={canEdit ? 8 : 7} className="px-6 py-8 text-center text-gray-500">
                        No service logs found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'summary' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {summary.map((item) => (
            <div key={item.vehicleId} className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-800">{item.vehicleName}</h3>
                  <p className="text-sm text-gray-500">{item.licensePlate} · {item.vehicleType}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-800">${item.totalCost.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">total cost</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Services</span>
                  <span className="font-medium">{item.totalLogs}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Completed</span>
                  <span className="font-medium text-green-600">{item.completedLogs}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">In Progress</span>
                  <span className="font-medium text-blue-600">{item.inProgressLogs}</span>
                </div>
                {item.lastService && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Last Service</span>
                    <span className="font-medium">{new Date(item.lastService).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
              <div className="mt-3 pt-3 border-t">
                <span className={`text-xs px-3 py-1 rounded-full font-medium border ${
                  item.vehicleStatus === 'InShop' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                  item.vehicleStatus === 'Available' ? 'bg-green-100 text-green-700 border-green-200' :
                  'bg-gray-100 text-gray-700 border-gray-200'
                }`}>
                  Vehicle: {item.vehicleStatus}
                </span>
              </div>
            </div>
          ))}
          {summary.length === 0 && (
            <div className="col-span-2 bg-white rounded-xl shadow-sm border p-8 text-center text-gray-500">
              No maintenance data available
            </div>
          )}
        </div>
      )}

      {/* Create Service Log Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">New Service Log</h2>
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-700 text-sm">
              ⚠️ Creating a service log will automatically set the vehicle status to <strong>"In Shop"</strong>,
              removing it from the dispatch pool.
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
                <select
                  value={form.vehicleId}
                  onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                >
                  <option value="">Select Vehicle</option>
                  {availableForService.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.name} ({v.licensePlate}) - {v.status}
                    </option>
                  ))}
                </select>
                {availableForService.length === 0 && (
                  <p className="text-xs text-orange-600 mt-1">No vehicles available for maintenance</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Preventive">Preventive</option>
                    <option value="Reactive">Reactive</option>
                    <option value="Inspection">Inspection</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost ($)</label>
                  <input
                    type="number"
                    value={form.cost}
                    onChange={(e) => setForm({ ...form, cost: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. Oil Change, Brake Pad Replacement, Tire Rotation"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  rows="2"
                  placeholder="Additional notes..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                  Create Service Log
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Maintenance;
