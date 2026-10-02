import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const IconComponent = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info
  }[type];

  const theme = {
    success: { bg: '#ecfdf5', border: '#a7f3d0', icon: '#059669', text: '#065f46' },
    error: { bg: '#fff1f2', border: '#fecdd3', icon: '#e11d48', text: '#9f1239' },
    info: { bg: '#e0e7ff', border: '#c7d2fe', icon: '#4f46e5', text: '#3730a3' }
  }[type];

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '14px 20px',
      borderRadius: '14px',
      background: '#ffffff',
      border: `1.5px solid ${theme.border}`,
      color: '#0f172a',
      boxShadow: '0 12px 32px -4px rgba(15, 23, 42, 0.12), 0 4px 12px rgba(15, 23, 42, 0.05)',
      backdropFilter: 'blur(12px)',
      animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      <div style={{
        width: '30px',
        height: '30px',
        borderRadius: '8px',
        background: theme.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <IconComponent size={18} color={theme.icon} />
      </div>
      <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a' }}>{message}</span>
      <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px', marginLeft: '4px' }}>
        <X size={16} />
      </button>
    </div>
  );
}

