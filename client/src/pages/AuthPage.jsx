import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser, registerUser } from '../api';
import Button from '../components/ui/Button';

export default function AuthPage({ mode = 'login' }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState(mode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (activeTab === 'register' && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const api = activeTab === 'login' ? loginUser : registerUser;
      const data = await api(email, password);
      login(data.token, data.user);
      navigate('/tailor');
    } catch (err) {
      console.error('Auth error:', err);
      const message = err.response?.data?.message || err.message || 'Authentication failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="w-full max-w-md p-10 bg-surface-container-lowest border border-outline-variant">
        {/* Branding */}
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl font-bold tracking-wider uppercase m-0">
            JobButler
          </h1>
          <p className="font-display text-[0.6rem] uppercase tracking-[0.25em] text-on-surface-variant mt-2">
            Technical Manuscript v1.0
          </p>
        </div>

        {/* Tabs */}
        <div className="flex mb-8">
          <button
            onClick={() => { setActiveTab('login'); setError(''); }}
            className={`flex-1 py-3 font-display text-xs font-semibold uppercase tracking-widest cursor-pointer border transition-colors duration-100 ${
              activeTab === 'login'
                ? 'bg-primary text-on-primary border-primary'
                : 'bg-transparent text-on-surface border-outline-variant'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => { setActiveTab('register'); setError(''); }}
            className={`flex-1 py-3 font-display text-xs font-semibold uppercase tracking-widest cursor-pointer border border-l-0 transition-colors duration-100 ${
              activeTab === 'register'
                ? 'bg-primary text-on-primary border-primary'
                : 'bg-transparent text-on-surface border-outline-variant'
            }`}
          >
            Register
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="font-display text-[0.6rem] font-semibold uppercase tracking-widest text-on-surface-variant block mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="editor-input"
              placeholder="engineer@company.com"
              required
            />
          </div>

          <div>
            <label className="font-display text-[0.6rem] font-semibold uppercase tracking-widest text-on-surface-variant block mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="editor-input"
              placeholder="Enter password"
              required
            />
          </div>

          {activeTab === 'register' && (
            <div>
              <label className="font-display text-[0.6rem] font-semibold uppercase tracking-widest text-on-surface-variant block mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="editor-input"
                placeholder="Confirm password"
                required
              />
            </div>
          )}

          {error && (
            <p className="font-display text-[0.6rem] uppercase tracking-widest text-error m-0">
              {error}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="w-full justify-center py-3.5 mt-2"
          >
            {activeTab === 'login' ? 'Authenticate' : 'Create Account'}
          </Button>
        </form>

        {/* Footer hint */}
        <p className="font-display text-[0.55rem] uppercase tracking-widest text-on-surface-variant text-center mt-6">
          {activeTab === 'login'
            ? 'No account? Switch to Register tab above.'
            : 'Already registered? Switch to Login tab above.'}
        </p>
      </div>
    </div>
  );
}
