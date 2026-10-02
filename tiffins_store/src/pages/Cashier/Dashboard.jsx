import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import Toast from '../../components/Toast';
import ReceiptModal from '../../components/ReceiptModal';
import { ShoppingCart, Plus, Minus, Trash2, Utensils, Search, Percent, IndianRupee, CreditCard, Banknote, CheckCircle, RefreshCw, X, Layers, Disc } from 'lucide-react';

export default function CashierDashboard() {
  const [categories, setCategories] = useState([]);
  const [foodItems, setFoodItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingItems, setLoadingItems] = useState(true);

  // Cart State
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState('0');
  const [applyGst, setApplyGst] = useState(false);
  const [gstRate, setGstRate] = useState(5.0);

  // Checkout Modal State
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [amountReceived, setAmountReceived] = useState('');
  const [txRef, setTxRef] = useState('');
  const [processing, setProcessing] = useState(false);

  // Receipt Modal State
  const [activeReceiptOrder, setActiveReceiptOrder] = useState(null);

  // Toast
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const loadMenu = async () => {
    setLoadingItems(true);
    try {
      const [cats, items] = await Promise.all([
        api.getCategories(),
        api.getFoodItems({ category: selectedCategory, availableOnly: true, search: searchTerm })
      ]);
      setCategories(cats);
      setFoodItems(items);
    } catch (err) {
      showToast(err.message || 'Failed to load menu items', 'error');
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    loadMenu();
  }, [selectedCategory, searchTerm]);

  // Cart Handlers - Add Full Plate or Single Piece
  const addToCart = (item, isSinglePiece = false) => {
    const pcsPerPlate = item.pieces_per_plate || 1;
    const unitPrice = isSinglePiece 
      ? Number((Number(item.price) / pcsPerPlate).toFixed(2)) 
      : Number(item.price);
    
    const cartItemId = `${item.id}_${isSinglePiece ? 'pc' : 'plate'}`;
    const displayName = isSinglePiece 
      ? `${item.name} (Single Piece)` 
      : (pcsPerPlate > 1 ? `${item.name} (${pcsPerPlate} Pcs Plate)` : item.name);

    const existingIndex = cart.findIndex(c => c.cart_id === cartItemId);

    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      setCart([...cart, {
        cart_id: cartItemId,
        food_item_id: item.id,
        name: displayName,
        raw_name: item.name,
        price: unitPrice,
        quantity: 1,
        is_single_piece: isSinglePiece
      }]);
    }

    showToast(`Added ${displayName} to cart`);
  };

  const updateQuantity = (cartId, delta) => {
    setCart(cart.map(c => {
      if (c.cart_id === cartId) {
        const newQty = c.quantity + delta;
        return newQty > 0 ? { ...c, quantity: newQty } : null;
      }
      return c;
    }).filter(Boolean));
  };

  const removeFromCart = (cartId) => {
    setCart(cart.filter(c => c.cart_id !== cartId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount('0');
    setApplyGst(false);
  };

  // Financial Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountVal = Math.min(subtotal, Math.max(0, Number(discount) || 0));
  const subtotalAfterDiscount = Math.max(0, subtotal - discountVal);
  const taxAmount = applyGst ? Number((subtotalAfterDiscount * (gstRate / 100)).toFixed(2)) : 0;
  const grandTotal = Number((subtotalAfterDiscount + taxAmount).toFixed(2));

  // Payment Change Calculation
  const amountRecNum = Number(amountReceived) || 0;
  const effectiveAmountReceived = (paymentMethod === 'CASH')
    ? (amountRecNum > 0 ? amountRecNum : grandTotal)
    : grandTotal;
  const effectiveChange = paymentMethod === 'CASH' ? Math.max(0, effectiveAmountReceived - grandTotal) : 0;

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      showToast('Cart is empty', 'error');
      return;
    }

    // Auto-confirm amount received if blank/0
    const finalAmountReceived = (paymentMethod === 'CASH' && (amountRecNum === 0 || !amountReceived))
      ? grandTotal
      : amountRecNum;

    if (paymentMethod === 'CASH' && finalAmountReceived < grandTotal) {
      showToast(`Amount received (₹${finalAmountReceived}) is less than total bill (₹${grandTotal})`, 'error');
      return;
    }

    setProcessing(true);
    try {
      // 1. Create Order
      const orderPayload = {
        discount: discountVal,
        apply_gst: applyGst,
        gst_rate: gstRate,
        items: cart.map(item => ({
          food_item_id: item.food_item_id,
          quantity: item.quantity
        }))
      };

      const createdOrder = await api.createOrder(orderPayload);

      // Overwrite items display names in response for bill preview if needed
      createdOrder.items = createdOrder.items.map((it, idx) => {
        const cartMatch = cart[idx];
        return {
          ...it,
          item_name: cartMatch?.name || it.item_name,
          unit_price: cartMatch?.price || it.unit_price,
          subtotal: (cartMatch?.price * it.quantity) || it.subtotal
        };
      });

      // Recalculate order subtotal matching cart
      createdOrder.subtotal = subtotal;
      createdOrder.total_amount = grandTotal;

      // 2. Process Payment
      const paymentPayload = {
        order_id: createdOrder.id,
        payment_method: paymentMethod,
        amount_received: paymentMethod === 'CASH' ? finalAmountReceived : grandTotal,
        transaction_reference: txRef
      };

      const paymentRes = await api.processPayment(paymentPayload);
      paymentRes.order.items = createdOrder.items;
      paymentRes.order.subtotal = subtotal;
      paymentRes.order.total_amount = grandTotal;

      showToast(`Payment of ₹${grandTotal.toFixed(2)} confirmed successfully!`);
      clearCart();
      setShowCheckout(false);
      setAmountReceived('');
      setTxRef('');

      // Open Receipt Modal to display bill to customer
      setActiveReceiptOrder(paymentRes.order);
    } catch (err) {
      showToast(err.message || 'Payment processing failed', 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />

      <div className="pos-grid-container">
        
        {/* LEFT COLUMN: FOOD MENU CATALOG */}
        <div>
          {/* Filter Bar */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.4px' }}>
              Select Tiffin Dishes & Pieces
            </h2>

            {/* Search Box */}
            <div style={{ position: 'relative', width: '260px' }}>
              <Search size={16} color="#64748b" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search menu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', paddingLeft: '38px', height: '42px', borderRadius: '12px', background: '#ffffff' }}
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '20px' }}>
            <button
              onClick={() => setSelectedCategory('')}
              style={{
                padding: '8px 18px',
                borderRadius: '12px',
                fontWeight: 600,
                fontSize: '0.85rem',
                whiteSpace: 'nowrap',
                color: selectedCategory === '' ? '#ffffff' : '#475569',
                background: selectedCategory === '' ? 'linear-gradient(135deg, #f59e0b, #ea580c)' : '#ffffff',
                border: selectedCategory === '' ? 'none' : '1px solid #e2e8f0',
                boxShadow: selectedCategory === '' ? '0 4px 12px rgba(234, 88, 12, 0.3)' : '0 1px 3px rgba(15, 23, 42, 0.04)',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              All Items
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id.toString())}
                style={{
                  padding: '8px 18px',
                  borderRadius: '12px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  whiteSpace: 'nowrap',
                  color: selectedCategory === cat.id.toString() ? '#ffffff' : '#475569',
                  background: selectedCategory === cat.id.toString() ? 'linear-gradient(135deg, #f59e0b, #ea580c)' : '#ffffff',
                  border: selectedCategory === cat.id.toString() ? 'none' : '1px solid #e2e8f0',
                  boxShadow: selectedCategory === cat.id.toString() ? '0 4px 12px rgba(234, 88, 12, 0.3)' : '0 1px 3px rgba(15, 23, 42, 0.04)',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Items Grid */}
          {loadingItems ? (
            <p style={{ color: '#64748b', textAlign: 'center', padding: '40px', fontWeight: 500 }}>Loading tiffin menu...</p>
          ) : foodItems.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#64748b', padding: '40px', background: '#ffffff' }} className="glass-card">
              <Utensils size={36} style={{ marginBottom: '12px', opacity: 0.5, color: '#ea580c' }} />
              <p style={{ fontWeight: 600 }}>No food items found matching criteria.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '18px' }}>
              {foodItems.map((item) => {
                const pcsPerPlate = item.pieces_per_plate || 1;
                const platePrice = Number(item.price);
                const pcPrice = Number((platePrice / pcsPerPlate).toFixed(2));

                return (
                  <div
                    key={item.id}
                    className="glass-card"
                    onClick={() => addToCart(item, false)}
                    style={{
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '12px',
                      position: 'relative',
                      background: '#ffffff',
                      cursor: 'pointer',
                      userSelect: 'none',
                      transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                  >
                    <div>
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '115px', objectFit: 'cover', borderRadius: '12px', marginBottom: '10px' }} />
                      ) : (
                        <div style={{ width: '100%', height: '115px', borderRadius: '12px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                          <Utensils size={32} color="#ea580c" />
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '2px' }}>
                          {item.name}
                        </h4>
                        <span style={{ fontSize: '0.72rem', background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                          {pcsPerPlate} {pcsPerPlate > 1 ? 'Pcs/Plate' : 'Pc'}
                        </span>
                      </div>
                      
                      <p style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>{item.category_name}</p>
                      
                      <div style={{ marginTop: '8px', fontSize: '0.82rem', color: '#475569' }}>
                        <div>Plate: <strong style={{ color: '#059669', fontSize: '0.95rem' }}>₹{platePrice.toFixed(2)}</strong></div>
                        {pcsPerPlate > 1 && (
                          <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '2px' }}>
                            Single Piece: <strong style={{ color: '#d97706' }}>₹{pcPrice.toFixed(2)} / pc</strong>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ACTION BUTTONS: FULL PLATE vs SINGLE PIECE */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(item, false);
                        }}
                        className="btn-success"
                        style={{ flex: 1, padding: '8px 10px', fontSize: '0.8rem', borderRadius: '10px', justifyContent: 'center' }}
                        title={`Add Full Plate (₹${platePrice.toFixed(2)})`}
                      >
                        <Plus size={15} /> Full Plate
                      </button>

                      {pcsPerPlate > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(item, true);
                          }}
                          className="btn-secondary"
                          style={{ flex: 1, padding: '8px 10px', fontSize: '0.8rem', borderRadius: '10px', justifyContent: 'center', borderColor: '#fde68a', background: '#fffbeb', color: '#b45309' }}
                          title={`Add Single Piece (₹${pcPrice.toFixed(2)})`}
                        >
                          <Disc size={15} /> 1 Piece
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: LIVE CART & CHECKOUT SIDEBAR */}
        <div className="glass-card" style={{ padding: '24px', position: 'sticky', top: '80px', alignSelf: 'start', maxHeight: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', background: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
              <ShoppingCart size={20} color="#ea580c" />
              Current Order Cart
            </div>
            {cart.length > 0 && (
              <button onClick={clearCart} style={{ background: 'none', border: 'none', color: '#e11d48', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>
                Clear All
              </button>
            )}
          </div>

          {/* Cart Items List */}
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
              <ShoppingCart size={36} style={{ marginBottom: '10px', opacity: 0.4, color: '#ea580c' }} />
              <p style={{ fontSize: '0.92rem', fontWeight: 600, color: '#334155' }}>Cart is empty</p>
              <p style={{ fontSize: '0.78rem', marginTop: '4px', color: '#64748b' }}>Click "+ Full Plate" or "+ 1 Piece" to add items</p>
            </div>
          ) : (
            <>
              <div style={{ flex: 1, overflowY: 'auto', maxHeight: 'calc(100vh - 380px)', marginBottom: '16px', paddingRight: '4px' }}>
                {cart.map((item) => (
                  <div key={item.cart_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>{item.name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600 }}>₹{item.price.toFixed(2)} / unit</div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button onClick={() => updateQuantity(item.cart_id, -1)} style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Minus size={14} />
                      </button>
                      <span style={{ fontWeight: 800, fontSize: '0.92rem', width: '22px', textAlign: 'center', color: '#0f172a' }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.cart_id, 1)} style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Plus size={14} />
                      </button>
                      <button onClick={() => removeFromCart(item.cart_id)} style={{ background: 'none', border: 'none', color: '#f43f5e', padding: '4px', cursor: 'pointer', marginLeft: '4px' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Discount & Tax Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>Discount (₹):</span>
                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    style={{ width: '100px', height: '36px', textAlign: 'right', fontSize: '0.88rem', borderRadius: '8px' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label htmlFor="gst_toggle" style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="checkbox"
                      id="gst_toggle"
                      checked={applyGst}
                      onChange={(e) => setApplyGst(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: '#ea580c' }}
                    />
                    Apply GST Tax (5%)
                  </label>
                  {applyGst && <span style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 700 }}>+ ₹{taxAmount.toFixed(2)}</span>}
                </div>
              </div>

              {/* Order Calculations Summary */}
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b', marginBottom: '6px' }}>
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                {discountVal > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#e11d48', marginBottom: '6px', fontWeight: 600 }}>
                    <span>Discount</span>
                    <span>- ₹{discountVal.toFixed(2)}</span>
                  </div>
                )}
                {applyGst && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b', marginBottom: '6px' }}>
                    <span>GST (5%)</span>
                    <span>+ ₹{taxAmount.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', borderTop: '1px solid #e2e8f0', paddingTop: '8px', marginTop: '8px' }}>
                  <span>Total Bill</span>
                  <span style={{ color: '#059669' }}>₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={() => setShowCheckout(true)}
                className="btn-success"
                style={{ width: '100%', height: '48px', fontSize: '1rem', fontWeight: 700, justifyContent: 'center', borderRadius: '12px' }}
              >
                Proceed to Pay ₹{grandTotal.toFixed(2)}
              </button>
            </>
          )}
        </div>
      </div>

      {/* PAYMENT & CHECKOUT MODAL */}
      {showCheckout && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-card pop-in" style={{ width: '100%', maxWidth: '440px', padding: '28px', borderRadius: '24px', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>
                Complete Payment
              </h3>
              <button onClick={() => setShowCheckout(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ background: '#ecfdf5', padding: '16px', borderRadius: '14px', marginBottom: '20px', textAlign: 'center', border: '1px solid #a7f3d0' }}>
              <p style={{ fontSize: '0.85rem', color: '#047857', fontWeight: 600 }}>Grand Amount Due</p>
              <h2 style={{ fontSize: '2.1rem', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
                ₹{grandTotal.toFixed(2)}
              </h2>
            </div>

            <form onSubmit={handleCheckoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Payment Method Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                  Select Payment Method
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontWeight: 700,
                      color: paymentMethod === 'CASH' ? '#ffffff' : '#475569',
                      background: paymentMethod === 'CASH' ? 'linear-gradient(135deg, #10b981, #059669)' : '#f8fafc',
                      border: paymentMethod === 'CASH' ? 'none' : '1px solid #cbd5e1',
                      boxShadow: paymentMethod === 'CASH' ? '0 4px 14px rgba(16, 185, 129, 0.3)' : 'none'
                    }}
                  >
                    <Banknote size={18} /> Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('UPI')}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontWeight: 700,
                      color: paymentMethod === 'UPI' ? '#ffffff' : '#475569',
                      background: paymentMethod === 'UPI' ? 'linear-gradient(135deg, #f59e0b, #ea580c)' : '#f8fafc',
                      border: paymentMethod === 'UPI' ? 'none' : '1px solid #cbd5e1',
                      boxShadow: paymentMethod === 'UPI' ? '0 4px 14px rgba(234, 88, 12, 0.3)' : 'none'
                    }}
                  >
                    <CreditCard size={18} /> UPI / QR
                  </button>
                </div>
              </div>

              {/* Cash specific input */}
              {paymentMethod === 'CASH' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                      Cash Received from Customer (₹)
                    </label>
                    <button
                      type="button"
                      onClick={() => setAmountReceived(grandTotal.toFixed(2))}
                      style={{ fontSize: '0.75rem', color: '#059669', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}
                    >
                      Fill Exact ₹{grandTotal.toFixed(2)}
                    </button>
                  </div>

                  <input
                    type="number"
                    step="0.01"
                    placeholder={`Min ₹${grandTotal.toFixed(2)}`}
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    style={{ width: '100%', height: '48px', fontSize: '1.1rem', fontWeight: 700 }}
                  />

                  {effectiveAmountReceived > 0 && (
                    <div style={{ marginTop: '12px', padding: '12px', borderRadius: '12px', background: effectiveAmountReceived >= grandTotal ? '#ecfdf5' : '#fff1f2', border: `1px solid ${effectiveAmountReceived >= grandTotal ? '#a7f3d0' : '#fecdd3'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.88rem', color: effectiveAmountReceived >= grandTotal ? '#047857' : '#be123c', fontWeight: 600 }}>
                        {effectiveAmountReceived >= grandTotal ? 'Change to Return:' : 'Insufficient Amount:'}
                      </span>
                      <strong style={{ fontSize: '1.1rem', color: effectiveAmountReceived >= grandTotal ? '#047857' : '#be123c', fontWeight: 800 }}>
                        ₹{effectiveChange.toFixed(2)}
                      </strong>
                    </div>
                  )}
                </div>
              )}

              {/* UPI specific input */}
              {paymentMethod === 'UPI' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    UPI Tx Reference / UTR Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 329182379123"
                    value={txRef}
                    onChange={(e) => setTxRef(e.target.value)}
                    style={{ width: '100%', height: '48px' }}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={processing || (paymentMethod === 'CASH' && amountRecNum > 0 && amountRecNum < grandTotal)}
                className="btn-success"
                style={{ width: '100%', height: '50px', fontSize: '1.05rem', fontWeight: 800, justifyContent: 'center', borderRadius: '12px', marginTop: '10px' }}
              >
                {processing ? 'Processing Payment...' : 'Confirm & Print Receipt'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE RECEIPT MODAL */}
      {activeReceiptOrder && (
        <ReceiptModal
          order={activeReceiptOrder}
          onClose={() => setActiveReceiptOrder(null)}
          onNewOrder={() => setActiveReceiptOrder(null)}
        />
      )}
    </div>
  );
}
