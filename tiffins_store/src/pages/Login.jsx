import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UtensilsCrossed, Lock, User, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const user = await login(username, password);
      if (onLoginSuccess) {
        onLoginSuccess(user);
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = (role) => {
    if (role === 'MANAGER') {
      setUsername('admin');
      setPassword('admin123');
    } else {
      setUsername('cashier');
      setPassword('cashier123');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative'
    }}>
      <div className="glass-card pop-in" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '38px 36px',
        borderRadius: '24px',
        background: '#ffffff',
        boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.08), 0 2px 10px rgba(15, 23, 42, 0.03)',
        border: '1px solid #e2e8f0'
      }}>
        {/* Header Icon */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(234, 88, 12, 0.35)',
            marginBottom: '16px'
          }}>
            <UtensilsCrossed size={32} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
            Tiffin Express
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '4px', fontWeight: 500 }}>
            Sign in to access Cashier POS or Admin Dashboard
          </p>
        </div>

        {error && (
          <div style={{
            background: '#fff1f2',
            border: '1px solid #fecdd3',
            color: '#e11d48',
            padding: '12px 16px',
            borderRadius: '12px',
            fontSize: '0.88rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: 500
          }}>
            <ShieldCheck size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <User size={18} color="#ea580c" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                style={{ width: '100%', paddingLeft: '42px', height: '48px', borderRadius: '12px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="#ea580c" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                style={{ width: '100%', paddingLeft: '42px', paddingRight: '42px', height: '48px', borderRadius: '12px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary"
            style={{
              width: '100%',
              height: '48px',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: 700,
              justifyContent: 'center',
              marginTop: '8px'
            }}
          >
            {submitting ? 'Authenticating...' : 'Sign In'}
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Demo Preset Buttons */}
        <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
          <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
            Quick Demo Credentials
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => handleDemoLogin('MANAGER')}
              className="btn-secondary"
              style={{ flex: 1, justifyContent: 'center', fontSize: '0.82rem', padding: '10px 12px', borderRadius: '10px' }}
            >
              Fill Manager Demo
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('CASHIER')}
              className="btn-secondary"
              style={{ flex: 1, justifyContent: 'center', fontSize: '0.82rem', padding: '10px 12px', borderRadius: '10px' }}
            >
              Fill Cashier Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

