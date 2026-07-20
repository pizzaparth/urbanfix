import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout.jsx';
import { useAuth } from '../../hooks/useAuth.js';

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
      // Redirect to OTP page passing email context state
      navigate('/verify-otp', { state: { email: formData.email } });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="d-flex justify-content-center align-items-center py-4">
        <div className="card shadow-sm border-0 rounded-3 p-4 bg-white w-100" style={{ maxWidth: '480px' }}>
          <div className="text-center mb-4">
            <i className="bi bi-person-plus-fill text-primary fs-1 mb-2"></i>
            <h2 className="fs-4 fw-bold mb-1">Create Citizen Account</h2>
            <p className="text-muted small">Register to report issues and track resolutions</p>
          </div>

          {error && (
            <div className="alert alert-danger border-0 small py-2 mb-3" role="alert">
              <i className="bi bi-exclamation-circle me-1"></i> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label small fw-semibold text-secondary">Full Name</label>
              <input
                type="text"
                name="name"
                className="form-control form-control-sm"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="mb-3">
              <label className="form-label small fw-semibold text-secondary">Email Address</label>
              <input
                type="email"
                name="email"
                className="form-control form-control-sm"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label small fw-semibold text-secondary">Phone Number (10 digits)</label>
              <input
                type="tel"
                name="phone"
                pattern="\d{10}"
                className="form-control form-control-sm"
                placeholder="e.g. 9876543210"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-4">
              <label className="form-label small fw-semibold text-secondary">Password (Min 8 characters)</label>
              <input
                type="password"
                name="password"
                className="form-control form-control-sm"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary w-100 fw-bold" disabled={loading}>
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>

          <div className="text-center mt-3 pt-3 border-top small">
            <span className="text-muted">Already have an account? </span>
            <Link to="/login" className="fw-semibold text-primary text-decoration-none">Login Here</Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Register;
