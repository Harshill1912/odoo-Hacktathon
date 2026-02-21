import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  if (user) {
    navigate('/dashboard');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(email, password);
      // Role-based redirect
      switch (data.role) {
        case 'manager':
          navigate('/dashboard');
          break;
        case 'dispatcher':
          navigate('/dispatch');
          break;
        case 'safety':
          navigate('/drivers');
          break;
        case 'finance':
          navigate('/expenses');
          break;
        default:
          navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { email: 'manager@fleetflow.com', role: 'Manager', color: 'bg-blue-100 text-blue-800' },
    { email: 'dispatcher@fleetflow.com', role: 'Dispatcher', color: 'bg-green-100 text-green-800' },
    { email: 'safety@fleetflow.com', role: 'Safety', color: 'bg-yellow-100 text-yellow-800' },
    { email: 'finance@fleetflow.com', role: 'Finance', color: 'bg-purple-100 text-purple-800' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">🚚 FleetFlow</h1>
          <p className="text-blue-300 text-lg">Fleet Management System</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Sign In</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="Enter your password"
                required
              />
            </div>

            <div className="mb-6 text-right">
              <button
                type="button"
                onClick={() => alert('Please contact your fleet administrator to reset your password.')}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 border-t pt-4">
            <p className="text-sm text-gray-500 mb-3">Demo Accounts (password: <code className="bg-gray-100 px-1 rounded">password123</code>)</p>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword('password123');
                  }}
                  className={`text-xs px-3 py-2 rounded-lg font-medium ${acc.color} hover:opacity-80 transition`}
                >
                  {acc.role}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
