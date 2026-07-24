import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, AlertCircle } from 'lucide-react';
import MainLayout from '../../layouts/MainLayout.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { ICON_STROKE } from '../../constants/icons.js';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { registerUser } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await registerUser(formData.name, formData.email, formData.password, formData.phone);
      navigate('/verify-otp', { state: { email: formData.email } });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex justify-center" style={{ padding: 'var(--space-6) 0' }}>
        <div className="panel" style={{ width: '100%', maxWidth: '440px' }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
            <div
              className="flex items-center justify-center"
              style={{ width: '44px', height: '44px', flexShrink: 0, border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', color: 'var(--accent)', margin: '0 auto var(--space-3)' }}
            >
              <UserPlus size={20} strokeWidth={ICON_STROKE} />
            </div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-1)' }}>Create Citizen Account</h2>
            <p className="text-small text-muted">Register to report issues and track resolutions</p>
          </div>

          {error && (
            <div className="alert alert-danger" style={{ marginBottom: 'var(--space-3)' }}>
              <AlertCircle size={15} strokeWidth={ICON_STROKE} style={{ color: 'var(--status-rejected)', flexShrink: 0 }} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="stack">
            <div className="field">
              <label>Full Name</label>
              <input type="text" name="name" className="input" value={formData.name} onChange={handleChange} required />
            </div>

            <div className="field">
              <label>Email Address</label>
              <input type="email" name="email" className="input" value={formData.email} onChange={handleChange} required />
            </div>

            <div className="field">
              <label>Phone Number (10 digits)</label>
              <input
                type="tel"
                name="phone"
                pattern="\d{10}"
                className="input"
                placeholder="e.g. 9876543210"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="field">
              <label>Password (Min 8 characters)</label>
              <input type="password" name="password" className="input" value={formData.password} onChange={handleChange} required />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Registering…' : 'Register'}
            </button>
          </form>

          <div
            className="text-small"
            style={{ textAlign: 'center', marginTop: 'var(--space-4)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border)' }}
          >
            <span className="text-muted">Already have an account? </span>
            <Link to="/login">Login here</Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Register;
