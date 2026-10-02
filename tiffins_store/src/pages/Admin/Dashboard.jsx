import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { IndianRupee, ShoppingBag, CheckCircle, Utensils, TrendingUp, RefreshCw, PlusCircle, BarChart3 } from 'lucide-react';

export default function AdminDashboard({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
        <RefreshCw size={28} className="spin" style={{ marginBottom: '12px', color: '#ea580c' }} />
        <p style={{ fontWeight: 600 }}>Loading Dashboard Analytics...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
      {/* Title Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
            Manager Overview
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 500 }}>Real-time sales, revenue metrics & recent store activity</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={fetchStats} className="btn-secondary" style={{ borderRadius: '12px', padding: '10px 16px' }}>
            <RefreshCw size={16} />
            Refresh
          </button>
          <button onClick={() => onNavigate('admin_items')} className="btn-primary" style={{ borderRadius: '12px', padding: '10px 18px' }}>
            <PlusCircle size={18} />
            Manage Food Items
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '16px', borderRadius: '12px', background: '#fff1f2', border: '1px solid #fecdd3', color: '#e11d48', marginBottom: '24px', fontWeight: 500 }}>
          {error}
        </div>
      )}

      {/* Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {/* Today Sales */}
        <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Today's Total Revenue</p>
              <h3 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
                ₹{Number(stats?.total_sales_today || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#ecfdf5', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IndianRupee size={24} color="#059669" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#059669', fontWeight: 600 }}>
            <TrendingUp size={16} />
            <span>Updated live from store POS</span>
          </div>
        </div>

        {/* Total Orders Today */}
        <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Total Orders Today</p>
              <h3 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
                {stats?.total_orders_today || 0}
              </h3>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#e0e7ff', border: '1px solid #c7d2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={24} color="#4f46e5" />
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>
            All pending & completed bills
          </div>
        </div>

        {/* Paid Bills Today */}
        <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Completed / Paid Bills</p>
              <h3 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
                {stats?.total_paid_bills_today || 0}
              </h3>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#cffaff', border: '1px solid #a5f3fc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={24} color="#0891b2" />
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>
            {stats?.total_orders_today ? Math.round(((stats?.total_paid_bills_today || 0) / stats?.total_orders_today) * 100) : 100}% Settlement rate
          </div>
        </div>

        {/* Total Food Items */}
        <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Active Menu Items</p>
              <h3 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
                {stats?.total_food_items || 0}
              </h3>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#fef3c7', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Utensils size={24} color="#d97706" />
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>
            Items available for billing
          </div>
        </div>
      </div>

      {/* Main Content: Recent Transactions Feed */}
      <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
              Recent Transactions
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>Latest order activity across cashier counters</p>
          </div>
          <button onClick={() => onNavigate('admin_reports')} className="btn-secondary" style={{ fontSize: '0.85rem', borderRadius: '10px' }}>
            <BarChart3 size={16} />
            Full Sales Report
          </button>
        </div>

        {stats?.recent_transactions?.length === 0 ? (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '30px' }}>No transactions recorded today yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#475569', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '12px' }}>Bill Number</th>
                  <th style={{ padding: '12px' }}>Cashier</th>
                  <th style={{ padding: '12px' }}>Items Count</th>
                  <th style={{ padding: '12px' }}>Total Amount</th>
                  <th style={{ padding: '12px' }}>Payment Method</th>
                  <th style={{ padding: '12px' }}>Status</th>
                  <th style={{ padding: '12px' }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recent_transactions?.map((order) => (
                  <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 12px', fontWeight: 700, color: '#4f46e5' }}>
                      {order.bill_number}
                    </td>
                    <td style={{ padding: '14px 12px', color: '#334155', fontWeight: 600 }}>
                      {order.cashier_name}
                    </td>
                    <td style={{ padding: '14px 12px', color: '#475569' }}>
                      {order.items?.length || 0} items
                    </td>
                    <td style={{ padding: '14px 12px', fontWeight: 800, color: '#0f172a' }}>
                      ₹{Number(order.total_amount).toFixed(2)}
                    </td>
                    <td style={{ padding: '14px 12px', color: '#64748b', fontWeight: 500 }}>
                      {order.payment_details?.payment_method || 'N/A'}
                    </td>
                    <td style={{ padding: '14px 12px' }}>
                      <span className={`badge ${order.payment_status === 'PAID' ? 'badge-paid' : 'badge-pending'}`}>
                        {order.payment_status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 12px', color: '#64748b', fontSize: '0.82rem', fontWeight: 500 }}>
                      {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

