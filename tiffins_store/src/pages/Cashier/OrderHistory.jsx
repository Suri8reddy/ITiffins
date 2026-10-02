import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import ReceiptModal from '../../components/ReceiptModal';
import Toast from '../../components/Toast';
import { History, Search, Printer, CreditCard, RefreshCw } from 'lucide-react';

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeOrder, setActiveOrder] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await api.getOrders({
        payment_status: paymentStatusFilter,
        search: searchTerm
      });
      setOrders(data);
    } catch (err) {
      setToast({ message: err.message || 'Failed to fetch order history', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [paymentStatusFilter, searchTerm]);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
            Store Order History
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 500 }}>Search previous bills, reprint receipts, and check settlement statuses</p>
        </div>

        <button onClick={loadOrders} className="btn-secondary" style={{ borderRadius: '12px', padding: '10px 16px' }}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-card" style={{ padding: '16px 24px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', background: '#ffffff' }}>
        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search by Bill No (TIF-1001)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', paddingLeft: '38px', height: '42px', borderRadius: '12px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', background: '#f1f5f9', padding: '5px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <button
            onClick={() => setPaymentStatusFilter('')}
            style={{
              padding: '8px 18px',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '0.85rem',
              color: paymentStatusFilter === '' ? '#ffffff' : '#475569',
              background: paymentStatusFilter === '' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'transparent',
              boxShadow: paymentStatusFilter === '' ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            All Statuses
          </button>
          <button
            onClick={() => setPaymentStatusFilter('PAID')}
            style={{
              padding: '8px 18px',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '0.85rem',
              color: paymentStatusFilter === 'PAID' ? '#ffffff' : '#475569',
              background: paymentStatusFilter === 'PAID' ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
              boxShadow: paymentStatusFilter === 'PAID' ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            Paid Only
          </button>
          <button
            onClick={() => setPaymentStatusFilter('PENDING')}
            style={{
              padding: '8px 18px',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '0.85rem',
              color: paymentStatusFilter === 'PENDING' ? '#ffffff' : '#475569',
              background: paymentStatusFilter === 'PENDING' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'transparent',
              boxShadow: paymentStatusFilter === 'PENDING' ? '0 4px 12px rgba(245, 158, 11, 0.3)' : 'none',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            Pending Only
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#64748b', padding: '30px', fontWeight: 500 }}>Loading order history...</p>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>
            <History size={36} style={{ marginBottom: '12px', opacity: 0.5, color: '#ea580c' }} />
            <p style={{ fontWeight: 600 }}>No orders found matching filters.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#475569', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '12px' }}>Bill Number</th>
                  <th style={{ padding: '12px' }}>Date & Time</th>
                  <th style={{ padding: '12px' }}>Cashier</th>
                  <th style={{ padding: '12px' }}>Items Summary</th>
                  <th style={{ padding: '12px' }}>Total Bill</th>
                  <th style={{ padding: '12px' }}>Payment Status</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 12px', fontWeight: 700, color: '#4f46e5' }}>
                      {order.bill_number}
                    </td>
                    <td style={{ padding: '14px 12px', color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>
                      {new Date(order.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td style={{ padding: '14px 12px', color: '#334155', fontWeight: 600 }}>
                      {order.cashier_name}
                    </td>
                    <td style={{ padding: '14px 12px', color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>
                      {order.items?.map(i => `${i.quantity}x ${i.item_name}`).join(', ')}
                    </td>
                    <td style={{ padding: '14px 12px', fontWeight: 800, color: '#059669' }}>
                      ₹{Number(order.total_amount).toFixed(2)}
                    </td>
                    <td style={{ padding: '14px 12px' }}>
                      <span className={`badge ${order.payment_status === 'PAID' ? 'badge-paid' : 'badge-pending'}`}>
                        {order.payment_status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                      <button
                        onClick={() => setActiveOrder(order)}
                        className="btn-secondary"
                        style={{ padding: '6px 14px', fontSize: '0.82rem', borderRadius: '10px' }}
                      >
                        <Printer size={15} color="#ea580c" /> View / Print Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {activeOrder && (
        <ReceiptModal order={activeOrder} onClose={() => setActiveOrder(null)} />
      )}
    </div>
  );
}

