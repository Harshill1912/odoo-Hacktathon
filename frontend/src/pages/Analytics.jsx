import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../utils/api';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const Analytics = () => {
  const [fuelData, setFuelData] = useState([]);
  const [roiData, setRoiData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fuelRes, roiRes] = await Promise.all([
          api.get('/analytics/fuel-efficiency'),
          api.get('/analytics/vehicle-roi'),
        ]);
        setFuelData(fuelRes.data);
        setRoiData(roiRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  const fuelChartData = fuelData.map((item) => ({
    name: item.vehicleName,
    'km/L': item.efficiency,
    'Total Distance (km)': item.totalDistance,
    'Fuel Cost ($)': item.totalFuelCost,
  }));

  const roiChartData = roiData.map((item) => ({
    name: item.vehicleName,
    'Revenue ($)': item.totalRevenue,
    'Expenses ($)': item.totalExpenses,
    'ROI (%)': item.roi,
  }));

  const expensePieData = roiData.map((item) => ({
    name: item.vehicleName,
    value: item.totalExpenses,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Analytics</h1>

      {/* Fuel Efficiency */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Fuel Efficiency (km/L)</h2>
        {fuelData.length === 0 ? (
          <p className="text-gray-500 text-sm">No fuel efficiency data available. Complete trips and log fuel expenses to see data here.</p>
        ) : (
          <>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fuelChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="km/L" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Fuel data table */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">Vehicle</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">Distance</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">Fuel Used</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">Fuel Cost</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">Efficiency</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {fuelData.map((item) => (
                    <tr key={item.vehicleId}>
                      <td className="px-4 py-2 font-medium">{item.vehicleName}</td>
                      <td className="px-4 py-2">{item.totalDistance} km</td>
                      <td className="px-4 py-2">{item.totalLiters} L</td>
                      <td className="px-4 py-2">${item.totalFuelCost}</td>
                      <td className="px-4 py-2 font-medium text-blue-600">{item.efficiency} km/L</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Vehicle ROI */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Vehicle ROI</h2>
        <p className="text-xs text-gray-500 mb-4">ROI = (Revenue − (Fuel + Maintenance)) / Acquisition Cost × 100</p>
        {roiData.length === 0 ? (
          <p className="text-gray-500 text-sm">No ROI data available.</p>
        ) : (
          <>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roiChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Revenue ($)" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Expenses ($)" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* ROI table */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">Vehicle</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">Type</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">Acquisition</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">Revenue</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">Fuel Cost</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">Maintenance</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">ROI</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {roiData.map((item) => (
                    <tr key={item.vehicleId}>
                      <td className="px-4 py-2 font-medium">{item.vehicleName}</td>
                      <td className="px-4 py-2">{item.type}</td>
                      <td className="px-4 py-2">${item.acquisitionCost.toLocaleString()}</td>
                      <td className="px-4 py-2 text-green-600">${item.totalRevenue.toLocaleString()}</td>
                      <td className="px-4 py-2 text-red-600">${item.totalFuelCost.toLocaleString()}</td>
                      <td className="px-4 py-2 text-orange-600">${item.totalMaintenanceCost.toLocaleString()}</td>
                      <td className={`px-4 py-2 font-bold ${item.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>{item.roi}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Expense Distribution Pie Chart */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Expense Distribution by Vehicle</h2>
        {expensePieData.filter((d) => d.value > 0).length === 0 ? (
          <p className="text-gray-500 text-sm">No expense data to display.</p>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expensePieData.filter((d) => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, value }) => `${name}: $${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expensePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
