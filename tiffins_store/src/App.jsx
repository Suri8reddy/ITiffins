import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import AdminDashboard from './pages/Admin/Dashboard';
import Add_items from './pages/Admin/Add_items';
import SalesReports from './pages/Admin/SalesReports';
import CashierDashboard from './pages/Cashier/Dashboard';
import OrderHistory from './pages/Cashier/OrderHistory';
import { UtensilsCrossed, RefreshCw } from 'lucide-react';
import './App.css';

// Path mapping helper
const tabToPath = {
  'admin_dashboard': '/admin',
  'admin_items': '/items',
  'admin_reports': '/reports',
  'cashier_pos': '/cashier',
  'cashier_history': '/history',
};

const resolvePathToTab = (pathname, userRole) => {
  const path = pathname.toLowerCase();
  if (path.includes('/history')) return 'cashier_history';
  if (path.includes('/cashier')) return 'cashier_pos';
  if (path.includes('/items') || path.includes('/menu')) return userRole === 'MANAGER' ? 'admin_items' : 'cashier_pos';
  if (path.includes('/reports')) return userRole === 'MANAGER' ? 'admin_reports' : 'cashier_pos';
  if (path.includes('/admin')) return userRole === 'MANAGER' ? 'admin_dashboard' : 'cashier_pos';

  // Default fallback based on role
  return userRole === 'MANAGER' ? 'admin_dashboard' : 'cashier_pos';
};

function MainApp() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState(() => {
    return resolvePathToTab(window.location.pathname, user?.role);
  });

  // Sync state with URL pathname & browser navigation
  useEffect(() => {
    if (!user) return;

    const handleLocationChange = () => {
      const targetTab = resolvePathToTab(window.location.pathname, user.role);
      setActiveTab(targetTab);
    };

    handleLocationChange();

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, [user]);

  // Tab change handler that updates state & browser URL path
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    const targetPath = tabToPath[newTab] || '/';
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#94a3b8',
        background: '#0c0f17'
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
          boxShadow: '0 8px 24px rgba(234, 88, 12, 0.4)'
        }}>
          <UtensilsCrossed size={28} color="#ffffff" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}>
          <RefreshCw size={18} className="spin" />
          Loading Tiffin Express...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Login
        onLoginSuccess={(u) => {
          const initialTab = resolvePathToTab(window.location.pathname, u.role);
          handleTabChange(initialTab);
        }}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar activeTab={activeTab} setActiveTab={handleTabChange} />
      <main style={{ flex: 1, paddingBottom: '40px' }}>
        {activeTab === 'admin_dashboard' && <AdminDashboard onNavigate={handleTabChange} />}
        {activeTab === 'admin_items' && <Add_items />}
        {activeTab === 'admin_reports' && <SalesReports />}
        {activeTab === 'cashier_pos' && <CashierDashboard />}
        {activeTab === 'cashier_history' && <OrderHistory />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
