import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, AlertCircle } from 'lucide-react';
import MainLayout from '../../layouts/MainLayout.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { ICON_STROKE } from '../../constants/icons.js';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await loginUser(formData.email, formData.password);
      if (data.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      if (err.response?.status === 403) {
        navigate('/verify-otp', { state: { email: formData.email } });
      } else {
        setError(err.response?.data?.message || 'Login failed. Please check credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex justify-center" style={{ padding: 'var(--space-6) 0' }}>
        <div className="panel" style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
            <div
              className="flex items-center justify-center"
              style={{ width: '44px', height: '44px', flexShrink: 0, border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', color: 'var(--accent)', margin: '0 auto var(--space-3)' }}
            >
              <ShieldCheck size={20} strokeWidth={ICON_STROKE} />
            </div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-1)' }}>Admin Portal Login</h2>
            <p className="text-small text-muted">Sign in to access the complaints management console</p>
          </div>

          {error && (
            <div className="alert alert-danger" style={{ marginBottom: 'var(--space-3)' }}>
              <AlertCircle size={15} strokeWidth={ICON_STROKE} style={{ color: 'var(--status-rejected)', flexShrink: 0 }} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="stack">
            <div className="field">
              <label>Admin Email Address</label>
              <input type="email" name="email" className="input" value={formData.email} onChange={handleChange} required />
            </div>

            <div className="field">
              <label>Password</label>
              <input type="password" name="password" className="input" value={formData.password} onChange={handleChange} required />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In as Admin'}
            </button>
          </form>
        </div>
      </div>
    </MainLayout>
  );
};

export default Login;
