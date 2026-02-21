import { useState, useEffect } from 'react';
import api from '../utils/api';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [byVehicle, setByVehicle] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ vehicleId: '', type: 'Fuel', liters: '', cost: '', date: '' });
  const [tab, setTab] = useState('list'); // list | summary

  const fetchData = async () => {
    try {
      const [expRes, vehRes, summaryRes] = await Promise.all([
        api.get('/expenses'),
        api.get('/vehicles'),
        api.get('/expenses/by-vehicle'),
      ]);
      setExpenses(expRes.data);
      setVehicles(vehRes.data);
      setByVehicle(summaryRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/expenses', {
        vehicleId: form.vehicleId,
        type: form.type,
        liters: Number(form.liters) || 0,
        cost: Number(form.cost),
        date: form.date || undefined,
      });
      setShowForm(false);
      setForm({ vehicleId: '', type: 'Fuel', liters: '', cost: '', date: '' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create expense');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Expenses</h1>
        <button onClick={() => { setShowForm(true); setError(''); }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
          + Log Expense
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab('list')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${tab === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          All Expenses
        </button>
        <button
          onClick={() => setTab('summary')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${tab === 'summary' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Cost per Vehicle
        </button>
      </div>

      {tab === 'list' && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">Date</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">Vehicle</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">Type</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">Liters</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {expenses.map((exp) => (
                  <tr key={exp._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-600">{new Date(exp.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {exp.vehicleId?.name || 'N/A'}
                      <span className="block text-xs text-gray-500">{exp.vehicleId?.licensePlate}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${exp.type === 'Fuel' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                        {exp.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{exp.liters > 0 ? `${exp.liters} L` : '-'}</td>
                    <td className="px-6 py-4 font-medium text-gray-800">${exp.cost.toLocaleString()}</td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No expenses found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'summary' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {byVehicle.map((item) => (
            <div key={item.vehicleId} className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-800">{item.vehicleName}</h3>
                  <p className="text-sm text-gray-500">{item.licensePlate}</p>
                </div>
                <p className="text-xl font-bold text-gray-800">${item.totalCost.toLocaleString()}</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">⛽ Fuel</span>
                  <span className="font-medium">${item.totalFuelCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">🔧 Maintenance</span>
                  <span className="font-medium">${item.totalMaintenanceCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">⛽ Total Liters</span>
                  <span className="font-medium">{item.totalLiters} L</span>
                </div>
              </div>
            </div>
          ))}
          {byVehicle.length === 0 && (
            <div className="col-span-2 bg-white rounded-xl shadow-sm border p-8 text-center text-gray-500">No expense data available</div>
          )}
        </div>
      )}

      {/* Log Expense Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Log Expense</h2>
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
                <select value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required>
                  <option value="">Select Vehicle</option>
                  {vehicles.map((v) => (
                    <option key={v._id} value={v._id}>{v.name} ({v.licensePlate})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="Fuel">Fuel</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
                {form.type === 'Maintenance' && (
                  <p className="text-xs text-orange-600 mt-1">⚠️ This will set the vehicle status to "In Shop"</p>
                )}
              </div>
              {form.type === 'Fuel' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Liters</label>
                  <input type="number" value={form.liters} onChange={(e) => setForm({ ...form, liters: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" min="0" step="0.1" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost ($)</label>
                  <input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required min="0" step="0.01" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">Log Expense</button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
