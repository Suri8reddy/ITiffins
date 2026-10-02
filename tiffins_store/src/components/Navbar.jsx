import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UtensilsCrossed, LayoutDashboard, PlusCircle, BarChart3, ShoppingBag, History, LogOut, UserCheck } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, logout, isManager } = useAuth();

  return (
    <header style={{
      background: 'rgba(255, 255, 255, 0.92)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid #e2e8f0',
      boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.04)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '12px 24px'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)',
            transition: 'transform 0.25s ease'
          }}>
            <UtensilsCrossed size={22} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.4px', color: '#0f172a' }}>
              Tiffin Express <span style={{ color: '#ea580c' }}>POS</span>
            </h1>
            <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Gourmet Store & Billing System</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: '#f1f5f9',
          padding: '5px',
          borderRadius: '14px',
          border: '1px solid #e2e8f0'
        }}>
          {isManager && (
            <>
              <button
                onClick={() => setActiveTab('admin_dashboard')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: activeTab === 'admin_dashboard' ? '#ffffff' : '#475569',
                  background: activeTab === 'admin_dashboard' ? 'linear-gradient(135deg, #f59e0b, #ea580c)' : 'transparent',
                  boxShadow: activeTab === 'admin_dashboard' ? '0 4px 12px rgba(234, 88, 12, 0.3)' : 'none',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                <LayoutDashboard size={17} />
                Dashboard
              </button>

              <button
                onClick={() => setActiveTab('admin_items')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: activeTab === 'admin_items' ? '#ffffff' : '#475569',
                  background: activeTab === 'admin_items' ? 'linear-gradient(135deg, #f59e0b, #ea580c)' : 'transparent',
                  boxShadow: activeTab === 'admin_items' ? '0 4px 12px rgba(234, 88, 12, 0.3)' : 'none',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                <PlusCircle size={17} />
                Food Items & Menu
              </button>

              <button
                onClick={() => setActiveTab('admin_reports')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: activeTab === 'admin_reports' ? '#ffffff' : '#475569',
                  background: activeTab === 'admin_reports' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'transparent',
                  boxShadow: activeTab === 'admin_reports' ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                <BarChart3 size={17} />
                Sales Reports
              </button>
            </>
          )}

          <button
            onClick={() => setActiveTab('cashier_pos')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '10px',
              fontSize: '0.88rem',
              fontWeight: 600,
              color: activeTab === 'cashier_pos' ? '#ffffff' : '#475569',
              background: activeTab === 'cashier_pos' ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
              boxShadow: activeTab === 'cashier_pos' ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <ShoppingBag size={17} />
            POS Billing
          </button>

          <button
            onClick={() => setActiveTab('cashier_history')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '10px',
              fontSize: '0.88rem',
              fontWeight: 600,
              color: activeTab === 'cashier_history' ? '#ffffff' : '#475569',
              background: activeTab === 'cashier_history' ? 'linear-gradient(135deg, #ea580c, #c2410c)' : 'transparent',
              boxShadow: activeTab === 'cashier_history' ? '0 4px 12px rgba(234, 88, 12, 0.3)' : 'none',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <History size={17} />
            Order History
          </button>
        </nav>

        {/* User Info & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '6px 14px',
            borderRadius: '12px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)'
          }}>
            <div style={{ position: 'relative' }}>
              <UserCheck size={18} color="#ea580c" />
              <span className="pulse-dot" style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#10b981'
              }} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                {user?.first_name || user?.username}
              </div>
              <span className={`badge ${user?.role === 'MANAGER' ? 'badge-manager' : 'badge-cashier'}`} style={{ fontSize: '0.65rem' }}>
                {user?.role}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            className="btn-secondary"
            title="Logout"
            style={{ padding: '8px 14px', borderRadius: '12px', fontSize: '0.85rem' }}
          >
            <LogOut size={16} color="#f43f5e" />
            <span style={{ fontWeight: 600, color: '#334155' }}>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}

