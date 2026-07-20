import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout.jsx';
import { useAuth } from '../../hooks/useAuth.js';

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
        // Redirect user to verify unverified registrations
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
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="card border-0 rounded-3 p-4 bg-white w-100" style={{ maxWidth: '440px', boxShadow: '0 4px 20px rgba(15,23,42,.06)', border: '1px solid #E2E8F0' }}>
          <div className="text-center mb-4">
            <i className="bi bi-shield-lock-fill fs-1 mb-2" style={{ color: '#2563EB' }}></i>
            <h2 className="fs-4 fw-bold mb-1" style={{ color: '#0F172A', fontFamily: 'Poppins, sans-serif' }}>Admin Portal Login</h2>
            <p style={{ color: '#64748B', fontSize: '0.875rem' }}>Sign in to access the complaints management console</p>
          </div>

          {error && (
            <div className="alert border-0 small py-2 mb-3" style={{ backgroundColor: '#FEE2E2', border: '1px solid #EF4444', color: '#991B1B' }} role="alert">
              <i className="bi bi-exclamation-circle me-1"></i> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label small fw-semibold" style={{ color: '#1E293B' }}>Admin Email Address</label>
              <input
                type="email"
                name="email"
                className="form-control form-control-sm"
                style={{ borderColor: '#CBD5E1', color: '#1E293B' }}
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-4">
              <label className="form-label small fw-semibold" style={{ color: '#1E293B' }}>Password</label>
              <input
                type="password"
                name="password"
                className="form-control form-control-sm"
                style={{ borderColor: '#CBD5E1', color: '#1E293B' }}
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary w-100 fw-bold border-0" style={{ backgroundColor: '#2563EB', color: '#FFFFFF', padding: '0.5rem 1rem' }} disabled={loading}>
              {loading ? 'Logging in...' : 'Sign In as Admin'}
            </button>
          </form>
        </div>
      </div>
    </MainLayout>
  );
};

export default Login;
