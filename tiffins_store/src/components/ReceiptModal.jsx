import React, { useState } from 'react';
import { Printer, X, CheckCircle, Copy, ShoppingBag, Check, Sliders, ArrowLeft, Banknote, CreditCard } from 'lucide-react';

export default function ReceiptModal({ order, onClose, onNewOrder }) {
  const [copied, setCopied] = useState(false);
  const [paperSize, setPaperSize] = useState('80mm'); // '58mm', '80mm', '110mm'

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyBillNo = () => {
    if (order?.bill_number) {
      navigator.clipboard.writeText(order.bill_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formattedDate = new Date(order.created_at).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  // Dimension settings per paper measurement
  const sizeConfig = {
    '58mm': {
      widthPx: '320px',
      padding: '16px 14px',
      titleSize: '1.2rem',
      fontSize: '0.8rem',
      label: '58mm (2" Mobile POS)'
    },
    '80mm': {
      widthPx: '400px',
      padding: '24px 20px',
      titleSize: '1.4rem',
      fontSize: '0.88rem',
      label: '80mm (3" Counter POS)'
    },
    '110mm': {
      widthPx: '540px',
      padding: '28px 24px',
      titleSize: '1.6rem',
      fontSize: '0.94rem',
      label: '110mm (4" Wide Slip)'
    }
  }[paperSize];

  const itemsList = order.items || order.order_items || [];
  const paymentMethod = order.payment_details?.payment_method || 'CASH';
  const amountReceived = order.payment_details?.amount_received ? Number(order.payment_details.amount_received).toFixed(2) : Number(order.total_amount).toFixed(2);
  const changeReturned = order.payment_details?.change_returned ? Number(order.payment_details.change_returned).toFixed(2) : '0.00';

  return (
    <div className="receipt-backdrop" style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(10px)',
      zIndex: 1000,
      overflowY: 'auto',
      padding: '24px 16px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      {/* Dynamic Thermal Print Styles */}
      <style>{`
        @media print {
          @page {
            size: ${paperSize} auto;
            margin: 0mm;
          }
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
          }
          body * {
            visibility: hidden !important;
          }
          .no-print, .no-print * {
            display: none !important;
            visibility: hidden !important;
          }
          .printable-invoice-paper,
          .printable-invoice-paper * {
            visibility: visible !important;
            color: #000000 !important;
            background: transparent !important;
            opacity: 1 !important;
          }
          .printable-invoice-paper {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: ${paperSize} !important;
            max-width: ${paperSize} !important;
            margin: 0 !important;
            padding: ${paperSize === '58mm' ? '2mm' : paperSize === '80mm' ? '4mm' : '6mm'} !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            overflow: visible !important;
            z-index: 999999 !important;
            font-size: ${paperSize === '58mm' ? '11px' : paperSize === '80mm' ? '13px' : '15px'} !important;
            font-family: 'Courier New', Courier, monospace !important;
          }
          .printable-invoice-paper h1 {
            font-size: ${paperSize === '58mm' ? '16px' : paperSize === '80mm' ? '18px' : '22px'} !important;
            color: #000000 !important;
            margin-bottom: 4px !important;
          }
          .printable-invoice-paper p,
          .printable-invoice-paper span,
          .printable-invoice-paper div,
          .printable-invoice-paper strong {
            color: #000000 !important;
          }
          .printable-invoice-paper table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin: 8px 0 !important;
          }
          .printable-invoice-paper th,
          .printable-invoice-paper td {
            color: #000000 !important;
            border-bottom: 1px dashed #000000 !important;
            padding: 4px 0 !important;
          }
          .printable-invoice-paper th {
            border-bottom: 2px solid #000000 !important;
          }
        }
      `}</style>

      <div className="receipt-modal-content pop-in" style={{
        width: '100%',
        maxWidth: '520px',
        background: '#ffffff',
        color: '#0f172a',
        borderRadius: '24px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 25px 60px rgba(15, 23, 42, 0.25)',
        overflow: 'hidden',
        position: 'relative',
        margin: 'auto',
        padding: '28px 24px'
      }}>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="no-print"
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: '#f1f5f9',
            border: '1px solid #e2e8f0',
            color: '#64748b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
          title="Close Modal"
        >
          <X size={18} />
        </button>
        
        {/* SUCCESS ICON & HEADER */}
        <div className="no-print" style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: '#ecfdf5',
            border: '2.5px solid #10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px auto',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.2)'
          }}>
            <Check size={32} color="#10b981" strokeWidth={3} />
          </div>

          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0', letterSpacing: '-0.3px' }}>
            Payment Successful!
          </h2>
          <p style={{ fontSize: '0.95rem', color: '#64748b', fontWeight: 500, margin: 0 }}>
            Bill No: <span style={{ color: '#0f172a', fontWeight: 700 }}>{order.bill_number}</span>
          </p>
        </div>

        {/* PAPER MEASUREMENT SELECTOR BAR (58mm, 80mm, 110mm) */}
        <div className="no-print" style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '14px',
          padding: '10px 14px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
            <Sliders size={15} color="#ea580c" />
            <span>Paper Size:</span>
          </div>

          <div style={{ display: 'flex', gap: '6px', background: '#ffffff', padding: '3px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
            {['58mm', '80mm', '110mm'].map((size) => {
              const active = paperSize === size;
              return (
                <button
                  key={size}
                  onClick={() => setPaperSize(size)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '7px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    color: active ? '#ffffff' : '#475569',
                    background: active ? 'linear-gradient(135deg, #f59e0b, #ea580c)' : 'transparent',
                    boxShadow: active ? '0 2px 6px rgba(234, 88, 12, 0.3)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>

        {/* THE FORMAL THERMAL RECEIPT CONTAINER */}
        <div className="printable-wrapper" style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="printable-invoice-paper" style={{
            width: '100%',
            maxWidth: sizeConfig.widthPx,
            background: '#ffffff',
            color: '#0f172a',
            borderRadius: '16px',
            padding: sizeConfig.padding,
            boxShadow: '0 8px 30px rgba(15, 23, 42, 0.08)',
            border: '1px solid #e2e8f0',
            fontSize: sizeConfig.fontSize,
            fontFamily: "'Courier New', Courier, monospace, system-ui, sans-serif",
            transition: 'all 0.3s ease',
            lineHeight: '1.4'
          }}>
            
            {/* Store Title & Address Header */}
            <div style={{ textAlign: 'center', marginBottom: '12px' }}>
              <h1 style={{
                fontSize: sizeConfig.titleSize,
                fontWeight: 900,
                color: '#000000',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                margin: '0 0 4px 0',
                fontFamily: "'Courier New', Courier, monospace"
              }}>
                TIFFIN SHOP
              </h1>
              <div style={{ fontSize: '0.85em', color: '#334155', fontWeight: 600 }}>
                #12 Main Road, Food Street
              </div>
              <div style={{ fontSize: '0.82em', color: '#475569' }}>
                Ph: +91 98765 43210
              </div>
            </div>

            {/* Dashed Line Separator */}
            <div style={{ borderBottom: '1.5px dashed #475569', margin: '10px 0' }} />

            {/* Bill Details */}
            <div style={{ fontSize: '0.9em', color: '#0f172a', lineHeight: '1.6' }}>
              <div><strong>Bill No:</strong> {order.bill_number}</div>
              <div><strong>Date:</strong> {formattedDate}</div>
              <div><strong>Cashier:</strong> {order.cashier_name || 'Pos Cashier'}</div>
            </div>

            {/* Dashed Line Separator */}
            <div style={{ borderBottom: '1.5px dashed #475569', margin: '10px 0' }} />

            {/* Itemized Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.92em' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #000000', color: '#000000', textAlign: 'left' }}>
                  <th style={{ padding: '4px 0', textAlign: 'left', fontWeight: 800 }}>Item</th>
                  <th style={{ padding: '4px 0', textAlign: 'center', width: '50px', fontWeight: 800 }}>Qty</th>
                  <th style={{ padding: '4px 0', textAlign: 'right', width: '65px', fontWeight: 800 }}>Price</th>
                  <th style={{ padding: '4px 0', textAlign: 'right', width: '75px', fontWeight: 800 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {itemsList.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: '6px 0', fontWeight: 600, color: '#0f172a', wordBreak: 'break-word' }}>{item.item_name}</td>
                    <td style={{ padding: '6px 0', textAlign: 'center', color: '#0f172a' }}>{item.quantity}</td>
                    <td style={{ padding: '6px 0', textAlign: 'right', color: '#0f172a' }}>₹{Number(item.unit_price).toFixed(0)}</td>
                    <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>₹{Number(item.subtotal).toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Dashed Line Separator */}
            <div style={{ borderBottom: '1.5px dashed #475569', margin: '10px 0' }} />

            {/* Subtotal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95em', fontWeight: 600, color: '#0f172a', margin: '4px 0' }}>
              <span>Subtotal:</span>
              <span>₹{Number(order.subtotal).toFixed(2)}</span>
            </div>

            {/* Discount if present */}
            {Number(order.discount) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9em', color: '#e11d48', margin: '2px 0' }}>
                <span>Discount:</span>
                <span>- ₹{Number(order.discount).toFixed(2)}</span>
              </div>
            )}

            {/* Tax if present */}
            {Number(order.tax_amount) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9em', color: '#475569', margin: '2px 0' }}>
                <span>GST ({order.tax_rate}%):</span>
                <span>+ ₹{Number(order.tax_amount).toFixed(2)}</span>
              </div>
            )}

            {/* Solid Line Separator */}
            <div style={{ borderBottom: '2px solid #000000', margin: '8px 0' }} />

            {/* GRAND TOTAL */}
            <div style={{
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
              fontSize: '1.15em',
              fontWeight: 900,
              color: '#000000',
              padding: '2px 0'
            }}>
              <span>GRAND TOTAL:</span>
              <span>₹{Number(order.total_amount).toFixed(2)}</span>
            </div>

            {/* Dashed Line Separator */}
            <div style={{ borderBottom: '1.5px dashed #475569', margin: '10px 0' }} />

            {/* Payment Info */}
            <div style={{ fontSize: '0.88em', color: '#0f172a', lineHeight: '1.6' }}>
              <div><strong>Payment Method:</strong> {paymentMethod}</div>
              {paymentMethod === 'CASH' && (
                <>
                  <div><strong>Amount Received:</strong> ₹{amountReceived}</div>
                  <div><strong>Change Returned:</strong> ₹{changeReturned}</div>
                </>
              )}
              <div><strong>Status:</strong> {order.payment_status || 'PAID'}</div>
            </div>

            {/* Dashed Line Separator */}
            <div style={{ borderBottom: '1.5px dashed #475569', margin: '12px 0 10px 0' }} />

            {/* Footer Notice */}
            <div style={{ textAlign: 'center', fontStyle: 'italic', fontSize: '0.88em', color: '#334155', fontWeight: 500 }}>
              Thank you! Visit Again.
            </div>

          </div>
        </div>

        {/* BOTTOM ACTION BUTTONS */}
        <div className="no-print" style={{
          marginTop: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handlePrint}
              className="btn-primary"
              style={{ flex: 1, justifyContent: 'center', padding: '12px 16px', borderRadius: '12px', fontSize: '0.92rem' }}
            >
              <Printer size={18} />
              Print Receipt ({paperSize})
            </button>

            <button
              onClick={handleCopyBillNo}
              className="btn-secondary"
              style={{ borderRadius: '12px', padding: '12px 16px' }}
              title="Copy Bill Number"
            >
              {copied ? <Check size={18} color="#059669" /> : <Copy size={18} color="#ea580c" />}
            </button>
          </div>

          {onNewOrder ? (
            <button
              onClick={onNewOrder}
              className="btn-success"
              style={{ width: '100%', justifyContent: 'center', padding: '12px 16px', borderRadius: '12px', fontSize: '0.92rem' }}
            >
              <ShoppingBag size={18} />
              Start Next Order
            </button>
          ) : (
            <button
              onClick={onClose}
              className="btn-secondary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px 16px', borderRadius: '12px', fontSize: '0.92rem' }}
            >
              <ArrowLeft size={18} />
              Back to History
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
