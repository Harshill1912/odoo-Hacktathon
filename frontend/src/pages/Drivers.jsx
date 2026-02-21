import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const statusPill = (status) => {
  const colors = {
    OnDuty: 'bg-green-100 text-green-700',
    OffDuty: 'bg-gray-100 text-gray-600',
    Suspended: 'bg-red-100 text-red-700',
    OnTrip: 'bg-blue-100 text-blue-700',
  };
  return <span className={`text-xs px-3 py-1 rounded-full font-medium ${colors[status] || 'bg-gray-100'}`}>{status}</span>;
};

const emptyDriver = {
  name: '', licenseNumber: '', licenseExpiry: '', category: 'Van', safetyScore: 100,
};

const Drivers = () => {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState([]);
  const [driverPerf, setDriverPerf] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyDriver });
  const [error, setError] = useState('');
  const [tab, setTab] = useState('table'); // table | cards
  const canEdit = ['manager', 'dispatcher', 'safety'].includes(user?.role);

  const fetchDrivers = async () => {
    try {
      const [driversRes, perfRes] = await Promise.all([
        api.get('/drivers'),
        api.get('/analytics/driver-performance'),
      ]);
      setDrivers(driversRes.data);

      // Index perf data by driverId
      const perfMap = {};
      perfRes.data.forEach(p => { perfMap[p.driverId] = p; });
      setDriverPerf(perfMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDrivers(); }, []);

  const isLicenseExpiringSoon = (expiry) => {
    const days = Math.ceil((new Date(expiry) - new Date()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyDriver });
    setError('');
    setShowModal(true);
  };

  const openEdit = (d) => {
    setEditing(d._id);
    setForm({
      name: d.name,
      licenseNumber: d.licenseNumber,
      licenseExpiry: d.licenseExpiry ? d.licenseExpiry.split('T')[0] : '',
      category: d.category,
      safetyScore: d.safetyScore,
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        await api.put(`/drivers/${editing}`, { ...form, safetyScore: Number(form.safetyScore) });
      } else {
        await api.post('/drivers', { ...form, safetyScore: Number(form.safetyScore) });
      }
      setShowModal(false);
      fetchDrivers();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleToggle = async (id) => {
    try {
      await api.put(`/drivers/${id}/toggle-status`);
      fetchDrivers();
    } catch (err) {
      alert(err.response?.data?.message || 'Toggle failed');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Driver Performance & Safety</h1>
          <p className="text-sm text-gray-500 mt-1">Compliance management and performance tracking</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-lg">
            <button
              onClick={() => setTab('table')}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${tab === 'table' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}
            >
              Table
            </button>
            <button
              onClick={() => setTab('cards')}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${tab === 'cards' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}
            >
              Cards
            </button>
          </div>
          {canEdit && (
            <button onClick={openAdd} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
              + Add Driver
            </button>
          )}
        </div>
      </div>

      {tab === 'table' && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">License #</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">License Expiry</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">Category</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">Safety Score</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">Trips</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">Completion</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">Status</th>
                  {canEdit && <th className="text-left px-6 py-3 font-medium text-gray-600">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y">
                {drivers.map((d) => {
                  const daysUntilExpiry = isLicenseExpiringSoon(d.licenseExpiry);
                  const expiryWarning = daysUntilExpiry <= 30;
                  const expired = daysUntilExpiry <= 0;
                  const perf = driverPerf[d._id] || {};
                  return (
                    <tr key={d._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-800">{d.name}</td>
                      <td className="px-6 py-4 text-gray-600 font-mono">{d.licenseNumber}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={expired ? 'text-red-600 font-medium' : expiryWarning ? 'text-orange-600' : 'text-gray-600'}>
                            {new Date(d.licenseExpiry).toLocaleDateString()}
                          </span>
                          {expired && <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">EXPIRED</span>}
                          {!expired && expiryWarning && <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full font-medium">{daysUntilExpiry}d left</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{d.category}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${d.safetyScore >= 80 ? 'bg-green-500' : d.safetyScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${d.safetyScore}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{d.safetyScore}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        <span className="font-medium">{perf.completedTrips || 0}</span>
                        <span className="text-gray-400">/{perf.totalTrips || 0}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-12 bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-blue-500"
                              style={{ width: `${perf.completionRate || 0}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{perf.completionRate || 0}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{statusPill(d.status)}</td>
                      {canEdit && (
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button onClick={() => openEdit(d)} className="text-blue-600 hover:text-blue-800 font-medium text-xs">Edit</button>
                            {d.status !== 'OnTrip' && (
                              <button onClick={() => handleToggle(d._id)} className="text-purple-600 hover:text-purple-800 font-medium text-xs">
                                {d.status === 'OnDuty' ? 'Set Off Duty' : 'Set On Duty'}
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {drivers.length === 0 && (
                  <tr><td colSpan={canEdit ? 9 : 8} className="px-6 py-8 text-center text-gray-500">No drivers found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {drivers.map((d) => {
            const daysUntilExpiry = isLicenseExpiringSoon(d.licenseExpiry);
            const expiryWarning = daysUntilExpiry <= 30;
            const expired = daysUntilExpiry <= 0;
            const perf = driverPerf[d._id] || {};
            return (
              <div key={d._id} className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                      {d.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{d.name}</h3>
                      <p className="text-xs text-gray-500">{d.licenseNumber} · {d.category}</p>
                    </div>
                  </div>
                  {statusPill(d.status)}
                </div>

                {/* License Expiry */}
                <div className="mb-3 p-2 rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">License Expiry</span>
                    <span className={`font-medium ${expired ? 'text-red-600' : expiryWarning ? 'text-orange-600' : 'text-gray-700'}`}>
                      {new Date(d.licenseExpiry).toLocaleDateString()}
                      {expired && ' (EXPIRED)'}
                      {!expired && expiryWarning && ` (${daysUntilExpiry}d)`}
                    </span>
                  </div>
                </div>

                {/* Safety Score */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Safety Score</span>
                    <span className="font-medium">{d.safetyScore}/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${d.safetyScore >= 80 ? 'bg-green-500' : d.safetyScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${d.safetyScore}%` }}
                    />
                  </div>
                </div>

                {/* Trip Stats */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t">
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-800">{perf.totalTrips || 0}</p>
                    <p className="text-xs text-gray-500">Total</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-green-600">{perf.completedTrips || 0}</p>
                    <p className="text-xs text-gray-500">Done</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-blue-600">{perf.completionRate || 0}%</p>
                    <p className="text-xs text-gray-500">Rate</p>
                  </div>
                </div>

                {/* Actions */}
                {canEdit && (
                  <div className="flex gap-2 mt-4 pt-3 border-t">
                    <button onClick={() => openEdit(d)} className="flex-1 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors">
                      Edit
                    </button>
                    {d.status !== 'OnTrip' && (
                      <button onClick={() => handleToggle(d._id)} className="flex-1 py-1.5 text-sm text-purple-600 hover:bg-purple-50 rounded-lg font-medium transition-colors">
                        {d.status === 'OnDuty' ? 'Off Duty' : 'On Duty'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {drivers.length === 0 && (
            <div className="col-span-3 bg-white rounded-xl shadow-sm border p-8 text-center text-gray-500">
              No drivers found
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">{editing ? 'Edit Driver' : 'Add Driver'}</h2>
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                <input value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License Expiry</label>
                  <input type="date" value={form.licenseExpiry} onChange={(e) => setForm({ ...form, licenseExpiry: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="Van">Van</option>
                    <option value="Truck">Truck</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Safety Score (0-100)</label>
                <input type="number" min="0" max="100" value={form.safetyScore} onChange={(e) => setForm({ ...form, safetyScore: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">{editing ? 'Update' : 'Create'}</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Drivers;
