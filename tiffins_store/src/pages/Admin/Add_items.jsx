import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import Toast from '../../components/Toast';
import { PlusCircle, Utensils, Tag, IndianRupee, Image as ImageIcon, CheckCircle, XCircle, Search, Trash2, Edit3, FolderPlus, RefreshCw, Layers } from 'lucide-react';

export default function Add_items() {
  const [categories, setCategories] = useState([]);
  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // Form State for Food Item Creation
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [piecesPerPlate, setPiecesPerPlate] = useState('1');
  const [description, setDescription] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Category Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Edit Item Modal State
  const [editingItem, setEditingItem] = useState(null);
  const [editName, setEditName] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editPiecesPerPlate, setEditPiecesPerPlate] = useState('1');
  const [editDescription, setEditDescription] = useState('');
  const [editIsAvailable, setEditIsAvailable] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [cats, items] = await Promise.all([
        api.getCategories(),
        api.getFoodItems({ category: filterCategory, search: searchTerm })
      ]);
      setCategories(cats);
      setFoodItems(items);
      if (cats.length > 0 && !categoryId) {
        setCategoryId(cats[0].id);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch menu data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterCategory, searchTerm]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      const created = await api.createCategory({ name: newCatName, description: newCatDesc });
      showToast(`Category "${created.name}" created successfully!`);
      setNewCatName('');
      setNewCatDesc('');
      setShowCategoryModal(false);
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to create category', 'error');
    }
  };

  const handleCreateFoodItem = async (e) => {
    e.preventDefault();
    if (!name.trim() || !categoryId || !price) {
      showToast('Please fill in all required fields (Name, Category, Price)', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('category_id', categoryId);
      formData.append('price', price);
      formData.append('pieces_per_plate', piecesPerPlate || '1');
      formData.append('description', description);
      formData.append('is_available', isAvailable);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const created = await api.createFoodItem(formData);
      showToast(`Food Item "${created.name}" added successfully!`);

      // Reset form
      setName('');
      setPrice('');
      setPiecesPerPlate('1');
      setDescription('');
      setImageFile(null);
      setIsAvailable(true);
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to add food item', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleAvailability = async (item) => {
    try {
      const res = await api.toggleItemAvailability(item.id);
      showToast(res.message);
      setFoodItems(foodItems.map(f => f.id === item.id ? { ...f, is_available: res.is_available } : f));
    } catch (err) {
      showToast(err.message || 'Failed to update availability', 'error');
    }
  };

  const handleDeleteItem = async (item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.name}"?`)) return;

    try {
      await api.deleteFoodItem(item.id);
      showToast(`"${item.name}" deleted successfully.`);
      setFoodItems(foodItems.filter(f => f.id !== item.id));
    } catch (err) {
      showToast(err.message || 'Failed to delete food item', 'error');
    }
  };

  const startEditItem = (item) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditCategoryId(item.category || item.category_id || categories[0]?.id);
    setEditPrice(item.price);
    setEditPiecesPerPlate(item.pieces_per_plate ? item.pieces_per_plate.toString() : '1');
    setEditDescription(item.description || '');
    setEditIsAvailable(item.is_available);
  };

  const handleSaveEditItem = async (e) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      const updated = await api.updateFoodItem(editingItem.id, {
        name: editName,
        category_id: editCategoryId,
        price: editPrice,
        pieces_per_plate: editPiecesPerPlate || '1',
        description: editDescription,
        is_available: editIsAvailable
      });
      showToast(`Item "${updated.name}" updated successfully!`);
      setEditingItem(null);
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to update food item', 'error');
    }
  };

  // Helper calculation for price per piece
  const priceNum = Number(price) || 0;
  const piecesNum = Math.max(1, Number(piecesPerPlate) || 1);
  const singlePiecePrice = (priceNum / piecesNum).toFixed(2);

  const editPriceNum = Number(editPrice) || 0;
  const editPiecesNum = Math.max(1, Number(editPiecesPerPlate) || 1);
  const editSinglePiecePrice = (editPriceNum / editPiecesNum).toFixed(2);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
            Food Items & Menu Manager
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 500 }}>Configure tiffin dishes, pieces per plate & individual piece prices</p>
        </div>
        <button onClick={() => setShowCategoryModal(true)} className="btn-secondary" style={{ borderRadius: '12px', padding: '10px 18px' }}>
          <FolderPlus size={18} color="#ea580c" />
          <span style={{ color: '#0f172a', fontWeight: 700 }}>Create Food Category</span>
        </button>
      </div>

      <div className="admin-grid-container">
        {/* ADD FOOD ITEM FORM */}
        <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <PlusCircle size={20} color="#ea580c" />
            Add New Tiffin Item
          </h3>

          <form onSubmit={handleCreateFoodItem} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Item Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Idli, Masala Dosa, Medu Vada"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Category *
              </label>
              {categories.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: '#e11d48', fontWeight: 500 }}>No categories created yet. Click "Create Food Category" above first.</p>
              ) : (
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  style={{ width: '100%' }}
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({cat.items_count || 0} items)
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Full Plate Price (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 40.00"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Pieces / Plate *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={piecesPerPlate}
                  onChange={(e) => setPiecesPerPlate(e.target.value)}
                  placeholder="e.g. 2"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* Calculated Piece Price Helper Box */}
            {priceNum > 0 && (
              <div style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '0.82rem',
                color: '#b45309',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontWeight: 600
              }}>
                <span>Individual Piece Price:</span>
                <strong style={{ fontSize: '0.95rem', color: '#d97706', fontWeight: 800 }}>₹{singlePiecePrice} / piece</strong>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Description / Ingredients
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Served with coconut chutney and hot sambar"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Item Image (Optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0])}
                style={{ width: '100%', padding: '8px' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
              <input
                type="checkbox"
                id="is_available_check"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#ea580c' }}
              />
              <label htmlFor="is_available_check" style={{ fontSize: '0.9rem', color: '#334155', cursor: 'pointer', fontWeight: 600 }}>
                Available in Cashier Counter POS
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting || categories.length === 0}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '8px', height: '46px', borderRadius: '12px' }}
            >
              {submitting ? 'Saving Food Item...' : 'Add Food Item'}
            </button>
          </form>
        </div>

        {/* FOOD ITEMS LIST TABLE */}
        <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
          {/* Controls: Search & Category Filter */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
              Menu Items List ({foodItems.length})
            </h3>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
              {/* Search */}
              <div style={{ position: 'relative', width: '200px' }}>
                <Search size={16} color="#64748b" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', paddingLeft: '32px', height: '38px', fontSize: '0.85rem' }}
                />
              </div>

              {/* Filter */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{ height: '38px', fontSize: '0.85rem' }}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>

              <button onClick={loadData} className="btn-secondary" style={{ padding: '6px 12px', height: '38px', borderRadius: '8px' }}>
                <RefreshCw size={15} />
              </button>
            </div>
          </div>

          {loading ? (
            <p style={{ textAlign: 'center', color: '#64748b', padding: '30px', fontWeight: 500 }}>Loading menu items...</p>
          ) : foodItems.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>
              <Utensils size={36} style={{ marginBottom: '12px', opacity: 0.5, color: '#ea580c' }} />
              <p style={{ fontWeight: 600 }}>No food items found. Add your first tiffin item using the form!</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#475569', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    <th style={{ padding: '12px' }}>Item Name</th>
                    <th style={{ padding: '12px' }}>Category</th>
                    <th style={{ padding: '12px' }}>Plate Price</th>
                    <th style={{ padding: '12px' }}>Pcs / Plate</th>
                    <th style={{ padding: '12px' }}>Piece Price</th>
                    <th style={{ padding: '12px' }}>Availability</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {foodItems.map((item) => {
                    const pcs = item.pieces_per_plate || 1;
                    const pcPrice = (Number(item.price) / pcs).toFixed(2);
                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.name} style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fef3c7', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Utensils size={20} color="#ea580c" />
                              </div>
                            )}
                            <div>
                              <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.name}</div>
                              {item.description && (
                                <div style={{ fontSize: '0.78rem', color: '#64748b', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {item.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 12px', color: '#334155' }}>
                          <span style={{ background: '#f1f5f9', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600 }}>
                            {item.category_name}
                          </span>
                        </td>
                        <td style={{ padding: '14px 12px', fontWeight: 800, color: '#059669' }}>
                          ₹{Number(item.price).toFixed(2)}
                        </td>
                        <td style={{ padding: '14px 12px', color: '#d97706', fontWeight: 700 }}>
                          {pcs} {pcs > 1 ? 'pcs' : 'pc'} / plate
                        </td>
                        <td style={{ padding: '14px 12px', color: '#475569', fontSize: '0.85rem', fontWeight: 600 }}>
                          ₹{pcPrice} / pc
                        </td>
                        <td style={{ padding: '14px 12px' }}>
                          <button
                            onClick={() => handleToggleAvailability(item)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 12px',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: item.is_available ? '#ecfdf5' : '#fff1f2',
                              color: item.is_available ? '#047857' : '#be123c',
                              border: `1px solid ${item.is_available ? '#a7f3d0' : '#fecdd3'}`,
                              cursor: 'pointer'
                            }}
                          >
                            {item.is_available ? <CheckCircle size={13} /> : <XCircle size={13} />}
                            {item.is_available ? 'Available' : 'Unavailable'}
                          </button>
                        </td>
                        <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button onClick={() => startEditItem(item)} className="btn-secondary" style={{ padding: '6px 10px', borderRadius: '8px' }} title="Edit">
                              <Edit3 size={15} color="#d97706" />
                            </button>
                            <button onClick={() => handleDeleteItem(item)} className="btn-secondary" style={{ padding: '6px 10px', borderRadius: '8px' }} title="Delete">
                              <Trash2 size={15} color="#e11d48" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* CREATE CATEGORY MODAL */}
      {showCategoryModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-card pop-in" style={{ width: '100%', maxWidth: '420px', padding: '28px', borderRadius: '24px', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>
              Create Food Category
            </h3>
            <form onSubmit={handleCreateCategory} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Breakfast, Lunch, Snacks, Dinner"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Category description..."
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center', borderRadius: '12px' }}>
                  Create Category
                </button>
                <button type="button" onClick={() => setShowCategoryModal(false)} className="btn-secondary" style={{ borderRadius: '12px' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT FOOD ITEM MODAL */}
      {editingItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-card pop-in" style={{ width: '100%', maxWidth: '440px', padding: '28px', borderRadius: '24px', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>
              Edit Food Item: {editingItem.name}
            </h3>
            <form onSubmit={handleSaveEditItem} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Item Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Plate Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Pcs / Plate
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editPiecesPerPlate}
                    onChange={(e) => setEditPiecesPerPlate(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {editPriceNum > 0 && (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '10px 14px', fontSize: '0.82rem', color: '#b45309', display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                  <span>Piece Price:</span>
                  <strong style={{ color: '#d97706', fontWeight: 800 }}>₹{editSinglePiecePrice} / pc</strong>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="edit_avail"
                  checked={editIsAvailable}
                  onChange={(e) => setEditIsAvailable(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#ea580c' }}
                />
                <label htmlFor="edit_avail" style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 600 }}>
                  Available in POS
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center', borderRadius: '12px' }}>
                  Save Changes
                </button>
                <button type="button" onClick={() => setEditingItem(null)} className="btn-secondary" style={{ borderRadius: '12px' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}