import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { BarChart3, Calendar, IndianRupee, CreditCard, ShoppingBag, Utensils, RefreshCw, FileText } from 'lucide-react';

export default function SalesReports() {
  const [reportType, setReportType] = useState('daily'); // 'daily', 'weekly', 'monthly'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      let data = null;
      if (reportType === 'daily') {
        data = await api.getDailySalesReport(selectedDate);
      } else if (reportType === 'weekly') {
        data = await api.getWeeklySalesReport(selectedDate);
      } else {
        data = await api.getMonthlySalesReport(selectedYear, selectedMonth);
      }
      setReportData(data);
    } catch (err) {
      setError(err.message || 'Failed to load sales report data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, selectedDate, selectedYear, selectedMonth]);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
      {/* Page Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
            Sales & Revenue Analytics
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 500 }}>Detailed breakdown of store sales, payment methods & top selling tiffin items</p>
        </div>

        {/* Report Type Selector */}
        <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', padding: '5px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <button
            onClick={() => setReportType('daily')}
            style={{
              padding: '8px 18px',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '0.85rem',
              color: reportType === 'daily' ? '#ffffff' : '#475569',
              background: reportType === 'daily' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'transparent',
              boxShadow: reportType === 'daily' ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            Daily Report
          </button>
          <button
            onClick={() => setReportType('weekly')}
            style={{
              padding: '8px 18px',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '0.85rem',
              color: reportType === 'weekly' ? '#ffffff' : '#475569',
              background: reportType === 'weekly' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'transparent',
              boxShadow: reportType === 'weekly' ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            Weekly Report
          </button>
          <button
            onClick={() => setReportType('monthly')}
            style={{
              padding: '8px 18px',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '0.85rem',
              color: reportType === 'monthly' ? '#ffffff' : '#475569',
              background: reportType === 'monthly' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'transparent',
              boxShadow: reportType === 'monthly' ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            Monthly Report
          </button>
        </div>
      </div>

      {/* Date Filter Toolbar */}
      <div className="glass-card" style={{ padding: '16px 24px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', background: '#ffffff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Calendar size={18} color="#4f46e5" />
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>Select Period:</span>
          {reportType !== 'monthly' ? (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ height: '40px', padding: '6px 14px', borderRadius: '10px' }}
            />
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={{ height: '40px', borderRadius: '10px' }}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m.toString()}>
                    {new Date(2026, m - 1, 1).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
              <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={{ height: '40px', borderRadius: '10px' }}>
                {['2024', '2025', '2026', '2027'].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <button onClick={fetchReport} className="btn-secondary" style={{ borderRadius: '10px' }}>
          <RefreshCw size={15} />
          Reload Data
        </button>
      </div>

      {error && (
        <div style={{ padding: '16px', borderRadius: '12px', background: '#fff1f2', border: '1px solid #fecdd3', color: '#e11d48', marginBottom: '24px', fontWeight: 500 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          <RefreshCw size={28} className="spin" style={{ marginBottom: '12px', color: '#4f46e5' }} />
          <p style={{ fontWeight: 600 }}>Generating Sales Report...</p>
        </div>
      ) : reportData && (
        <>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '28px' }}>
            <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
              <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Total Sales Revenue</p>
              <h3 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#059669', marginTop: '6px' }}>
                ₹{Number(reportData.total_sales || reportData.total_revenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
            </div>

            <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
              <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Total Paid Bills</p>
              <h3 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
                {reportData.total_paid_orders || reportData.total_orders || 0} Bills
              </h3>
            </div>

            <div className="glass-card" style={{ padding: '24px', background: '#ffffff', border: '1px solid #fed7aa' }}>
              <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Payment Distribution</p>
              <div style={{ marginTop: '10px', fontSize: '0.95rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Cash:</span>
                  <strong style={{ color: '#059669', fontWeight: 800, fontSize: '1.05rem' }}>
                    ₹{Number(reportData.cash_sales ?? (reportData.orders?.filter(o => (o.payment_details?.payment_method === 'CASH' || o.payment?.payment_method === 'CASH')).reduce((sum, o) => sum + Number(o.total_amount), 0) || 0)).toFixed(2)}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>UPI / QR:</span>
                  <strong style={{ color: '#d97706', fontWeight: 800, fontSize: '1.05rem' }}>
                    ₹{Number(reportData.upi_sales ?? (reportData.orders?.filter(o => (o.payment_details?.payment_method === 'UPI' || o.payment?.payment_method === 'UPI')).reduce((sum, o) => sum + Number(o.total_amount), 0) || 0)).toFixed(2)}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Items Sold Breakdown */}
          <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Utensils size={20} color="#4f46e5" />
              Item-wise Sales Breakdown
            </h3>

            {(!reportData.items_summary && !reportData.top_items && !reportData.items_sold) ? (
              <p style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>No item sales recorded for this period.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#475569', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      <th style={{ padding: '12px' }}>Food Item</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Total Quantity Sold</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Total Revenue Generated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(reportData.items_summary || reportData.top_items || reportData.items_sold || []).map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 12px', fontWeight: 700, color: '#0f172a' }}>
                          {item.item_name || item.name}
                        </td>
                        <td style={{ padding: '14px 12px', textAlign: 'center', color: '#334155', fontWeight: 600 }}>
                          {item.total_qty || item.quantity_sold || item.total_quantity}
                        </td>
                        <td style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 800, color: '#059669' }}>
                          ₹{Number(item.total_sales || item.total_revenue || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

