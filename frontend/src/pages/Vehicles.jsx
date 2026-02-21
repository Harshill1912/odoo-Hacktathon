import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const statusPill = (status) => {
  const colors = {
    Available: 'bg-green-100 text-green-700 border-green-200',
    OnTrip: 'bg-blue-100 text-blue-700 border-blue-200',
    InShop: 'bg-orange-100 text-orange-700 border-orange-200',
    Retired: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  return (
    <span className={`text-xs px-3 py-1 rounded-full font-medium border ${colors[status] || 'bg-gray-100'}`}>
      {status}
    </span>
  );
};

const emptyVehicle = {
  name: '', licensePlate: '', type: 'Van', maxCapacity: '', odometer: 0, status: 'Available', acquisitionCost: '',
};

const Vehicles = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyVehicle });
  const [error, setError] = useState('');
  const canEdit = ['manager', 'dispatcher'].includes(user?.role);

  const fetchVehicles = async () => {
    try {
      const { data } = await api.get('/vehicles');
      setVehicles(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVehicles(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyVehicle });
    setError('');
    setShowModal(true);
  };

  const openEdit = (v) => {
    setEditing(v._id);
    setForm({ name: v.name, licensePlate: v.licensePlate, type: v.type, maxCapacity: v.maxCapacity, odometer: v.odometer, status: v.status, acquisitionCost: v.acquisitionCost });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        await api.put(`/vehicles/${editing}`, { ...form, maxCapacity: Number(form.maxCapacity), acquisitionCost: Number(form.acquisitionCost), odometer: Number(form.odometer) });
      } else {
        await api.post('/vehicles', { ...form, maxCapacity: Number(form.maxCapacity), acquisitionCost: Number(form.acquisitionCost), odometer: Number(form.odometer) });
      }
      setShowModal(false);
      fetchVehicles();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const markAvailable = async (id) => {
    try {
      await api.put(`/vehicles/${id}`, { status: 'Available' });
      fetchVehicles();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Vehicles</h1>
        {canEdit && (
          <button onClick={openAdd} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
            + Add Vehicle
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Plate</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Type</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Capacity</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Odometer</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Cost</th>
                {canEdit && <th className="text-left px-6 py-3 font-medium text-gray-600">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {vehicles.map((v) => (
                <tr key={v._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-800">{v.name}</td>
                  <td className="px-6 py-4 text-gray-600 font-mono">{v.licensePlate}</td>
                  <td className="px-6 py-4 text-gray-600">{v.type}</td>
                  <td className="px-6 py-4 text-gray-600">{v.maxCapacity} kg</td>
                  <td className="px-6 py-4 text-gray-600">{v.odometer.toLocaleString()} km</td>
                  <td className="px-6 py-4">{statusPill(v.status)}</td>
                  <td className="px-6 py-4 text-gray-600">${v.acquisitionCost.toLocaleString()}</td>
                  {canEdit && (
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(v)} className="text-blue-600 hover:text-blue-800 font-medium text-xs">Edit</button>
                        {v.status === 'InShop' && (
                          <button onClick={() => markAvailable(v._id)} className="text-green-600 hover:text-green-800 font-medium text-xs">Mark Available</button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {vehicles.length === 0 && (
                <tr><td colSpan="8" className="px-6 py-8 text-center text-gray-500">No vehicles found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">{editing ? 'Edit Vehicle' : 'Add Vehicle'}</h2>
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">License Plate</label>
                <input value={form.licensePlate} onChange={(e) => setForm({ ...form, licensePlate: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="Van">Van</option>
                    <option value="Truck">Truck</option>
                    <option value="Bike">Bike</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Capacity (kg)</label>
                  <input type="number" value={form.maxCapacity} onChange={(e) => setForm({ ...form, maxCapacity: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Odometer (km)</label>
                  <input type="number" value={form.odometer} onChange={(e) => setForm({ ...form, odometer: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Acquisition Cost ($)</label>
                  <input type="number" value={form.acquisitionCost} onChange={(e) => setForm({ ...form, acquisitionCost: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
              </div>
              {editing && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="Available">Available</option>
                    <option value="InShop">In Shop</option>
                    <option value="Retired">Retired</option>
                  </select>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                  {editing ? 'Update' : 'Create'}
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

export default Vehicles;
