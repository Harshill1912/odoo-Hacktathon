import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import api from '../utils/api';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const Analytics = () => {
  const [fuelData, setFuelData] = useState([]);
  const [roiData, setRoiData] = useState([]);
  const [driverPerf, setDriverPerf] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('fuel'); // fuel | roi | drivers

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fuelRes, roiRes, driverRes] = await Promise.all([
          api.get('/analytics/fuel-efficiency'),
          api.get('/analytics/vehicle-roi'),
          api.get('/analytics/driver-performance'),
        ]);
        setFuelData(fuelRes.data);
        setRoiData(roiRes.data);
        setDriverPerf(driverRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleExportCSV = async (type) => {
    try {
      const endpoint = type === 'fuel' ? '/analytics/export/fuel-csv' : '/analytics/export/roi-csv';
      const response = await api.get(endpoint, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', type === 'fuel' ? 'fuel-efficiency-report.csv' : 'vehicle-roi-report.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export failed. Please try again.');
      console.error(err);
    }
  };

  const handleExportDriverCSV = () => {
    let csv = 'Driver,License,Category,Status,Safety Score,Total Trips,Completed,Cancelled,Completion Rate (%),Total Distance (km),Total Revenue ($),Total Cargo (kg)\n';

    driverPerf.forEach((d) => {
      csv += `"${d.name}","${d.licenseNumber}","${d.category}","${d.status}",${d.safetyScore},${d.totalTrips},${d.completedTrips},${d.cancelledTrips},${d.completionRate},${d.totalDistance},${d.totalRevenue},${d.totalCargo}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'driver-performance-report.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

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

  const driverChartData = driverPerf.map((d) => ({
    name: d.name,
    'Completion Rate': d.completionRate,
    'Safety Score': d.safetyScore,
    'Trips': d.totalTrips,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Operational Analytics & Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Data-driven decision making</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setTab('fuel')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${tab === 'fuel' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          ⛽ Fuel Efficiency
        </button>
        <button
          onClick={() => setTab('roi')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${tab === 'roi' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          💰 Vehicle ROI
        </button>
        <button
          onClick={() => setTab('drivers')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${tab === 'drivers' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          👤 Driver Performance
        </button>
      </div>

      {/* Fuel Efficiency Tab */}
      {tab === 'fuel' && (
        <div>
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Fuel Efficiency (km/L)</h2>
              <button
                onClick={() => handleExportCSV('fuel')}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
              >
                📥 Export CSV
              </button>
            </div>
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
                        <th className="text-left px-4 py-2 font-medium text-gray-600">Cost/km</th>
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
                          <td className="px-4 py-2 text-gray-600">
                            ${item.totalDistance > 0 ? (item.totalFuelCost / item.totalDistance).toFixed(2) : '0.00'}/km
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Vehicle ROI Tab */}
      {tab === 'roi' && (
        <div>
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Vehicle ROI</h2>
                <p className="text-xs text-gray-500">ROI = (Revenue − (Fuel + Maintenance)) / Acquisition Cost × 100</p>
              </div>
              <button
                onClick={() => handleExportCSV('roi')}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
              >
                📥 Export CSV
              </button>
            </div>
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
      )}

      {/* Driver Performance Tab */}
      {tab === 'drivers' && (
        <div>
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Driver Performance Overview</h2>
              <button
                onClick={handleExportDriverCSV}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
              >
                📥 Export CSV
              </button>
            </div>
            {driverPerf.length === 0 ? (
              <p className="text-gray-500 text-sm">No driver performance data available.</p>
            ) : (
              <>
                {/* Chart */}
                <div className="h-72 mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={driverChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Completion Rate" fill="#10B981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Safety Score" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Driver Performance Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {driverPerf.map((d) => (
                    <div key={d.driverId} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-800">{d.name}</h3>
                          <p className="text-xs text-gray-500">{d.licenseNumber} · {d.category}</p>
                        </div>
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                          d.status === 'OnDuty' ? 'bg-green-100 text-green-700' :
                          d.status === 'OnTrip' ? 'bg-blue-100 text-blue-700' :
                          d.status === 'Suspended' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {d.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">Safety Score</span>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${d.safetyScore >= 80 ? 'bg-green-500' : d.safetyScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${d.safetyScore}%` }}
                              />
                            </div>
                            <span className="font-medium text-xs">{d.safetyScore}</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Completion Rate</span>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="h-2 rounded-full bg-blue-500"
                                style={{ width: `${d.completionRate}%` }}
                              />
                            </div>
                            <span className="font-medium text-xs">{d.completionRate}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t">
                        <div className="text-center">
                          <p className="text-lg font-bold text-gray-800">{d.totalTrips}</p>
                          <p className="text-xs text-gray-500">Trips</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-green-600">{d.completedTrips}</p>
                          <p className="text-xs text-gray-500">Done</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-blue-600">{d.totalDistance}</p>
                          <p className="text-xs text-gray-500">km</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-purple-600">${d.totalRevenue}</p>
                          <p className="text-xs text-gray-500">Rev</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
