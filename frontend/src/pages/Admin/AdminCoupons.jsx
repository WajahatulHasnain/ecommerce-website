import { useState, useEffect } from 'react';
import api from '../../utils/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null); // NEW: Edit state
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discount: '',
    type: 'percentage',
    minAmount: '',
    maxDiscount: '',
    expiryDate: '',
    usageLimit: ''
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      const response = await api.get('/admin/coupons', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setCoupons(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCoupon = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      
      if (editingCoupon) {
        // UPDATE existing coupon
        const response = await api.put(`/admin/coupons/${editingCoupon._id}`, newCoupon, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          setCoupons(coupons.map(coupon => 
            coupon._id === editingCoupon._id ? response.data.data : coupon
          ));
          setEditingCoupon(null);
          resetForm();
          alert('Coupon updated successfully!');
        }
      } else {
        // CREATE new coupon
        const response = await api.post('/admin/coupons', newCoupon, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          setCoupons([response.data.data, ...coupons]);
          resetForm();
          alert('Coupon created successfully!');
        }
      }
    } catch (error) {
      console.error('Failed to save coupon:', error);
      alert(error.response?.data?.msg || 'Failed to save coupon');
    }
  };

  const resetForm = () => {
    setNewCoupon({
      code: '', discount: '', type: 'percentage', 
      minAmount: '', maxDiscount: '', expiryDate: '', usageLimit: ''
    });
    setShowAddForm(false);
    setEditingCoupon(null);
  };

  const startEdit = (coupon) => {
    setEditingCoupon(coupon);
    setNewCoupon({
      code: coupon.code,
      discount: coupon.discount.toString(),
      type: coupon.type,
      minAmount: coupon.minAmount ? coupon.minAmount.toString() : '',
      maxDiscount: coupon.maxDiscount ? coupon.maxDiscount.toString() : '',
      expiryDate: coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().split('T')[0] : '',
      usageLimit: coupon.usageLimit ? coupon.usageLimit.toString() : ''
    });
    setShowAddForm(true);
  };

  const handleInputChange = (e) => {
    setNewCoupon({
      ...newCoupon,
      [e.target.name]: e.target.value
    });
  };

  const toggleCouponStatus = async (couponId) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      const response = await api.put(`/admin/coupons/${couponId}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setCoupons(coupons.map(coupon => 
          coupon._id === couponId 
            ? response.data.data
            : coupon
        ));
      }
    } catch (error) {
      console.error('Failed to toggle coupon status:', error);
      alert('Failed to update coupon status');
    }
  };

  const deleteCoupon = async (couponId) => {
    if (!confirm('Are you sure you want to delete this coupon? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      const response = await api.delete(`/admin/coupons/${couponId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setCoupons(coupons.filter(coupon => coupon._id !== couponId));
        alert('Coupon deleted successfully');
      }
    } catch (error) {
      console.error('Failed to delete coupon:', error);
      alert('Failed to delete coupon');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupons & Discounts</h1>
          <p className="text-gray-600">Manage promotional codes and discounts</p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-green-600 text-white hover:bg-green-700"
        >
          Create Coupon
        </Button>
      </div>

      {/* Add/Edit Coupon Form */}
      {showAddForm && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
          </h3>
          <form onSubmit={handleAddCoupon} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Coupon Code"
              name="code"
              value={newCoupon.code}
              onChange={handleInputChange}
              placeholder="SAVE20"
              required
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
              <select
                name="type"
                value={newCoupon.type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
              </select>
            </div>

            <Input
              label={`Discount ${newCoupon.type === 'percentage' ? 'Percentage' : 'Amount'}`}
              name="discount"
              type="number"
              value={newCoupon.discount}
              onChange={handleInputChange}
              placeholder={newCoupon.type === 'percentage' ? '20' : '50'}
              required
            />

            <Input
              label="Minimum Order Amount ($)"
              name="minAmount"
              type="number"
              step="0.01"
              value={newCoupon.minAmount}
              onChange={handleInputChange}
              placeholder="100.00"
            />

            {newCoupon.type === 'percentage' && (
              <Input
                label="Maximum Discount ($)"
                name="maxDiscount"
                type="number"
                step="0.01"
                value={newCoupon.maxDiscount}
                onChange={handleInputChange}
                placeholder="100.00"
              />
            )}

            <Input
              label="Expiry Date"
              name="expiryDate"
              type="date"
              value={newCoupon.expiryDate}
              onChange={handleInputChange}
            />

            <Input
              label="Usage Limit (optional)"
              name="usageLimit"
              type="number"
              value={newCoupon.usageLimit}
              onChange={handleInputChange}
              placeholder="100"
            />

            <div className="md:col-span-2 flex gap-4">
              <Button type="submit" className="bg-green-600 text-white hover:bg-green-700">
                {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
              </Button>
              <Button
                type="button"
                onClick={resetForm}
                className="bg-gray-600 text-white hover:bg-gray-700"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Coupons List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {coupons.length > 0 ? (
          coupons.map((coupon) => (
            <Card key={coupon._id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{coupon.code}</h3>
                  <p className="text-gray-600">
                    {coupon.type === 'percentage' 
                      ? `${coupon.discount}% off` 
                      : `$${coupon.discount} off`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${coupon.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className="text-sm text-gray-500">
                    {coupon.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                {coupon.minAmount && (
                  <div>Min order: ${coupon.minAmount}</div>
                )}
                {coupon.maxDiscount && (
                  <div>Max discount: ${coupon.maxDiscount}</div>
                )}
                {coupon.usageLimit && (
                  <div>Usage limit: {coupon.usageLimit}</div>
                )}
                {coupon.expiryDate && (
                  <div>Expires: {new Date(coupon.expiryDate).toLocaleDateString()}</div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => toggleCouponStatus(coupon._id)}
                  className={`text-sm px-3 py-1 ${
                    coupon.isActive 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-green-600 hover:bg-green-700'
                  } text-white`}
                >
                  {coupon.isActive ? 'Deactivate' : 'Activate'}
                </Button>
                <Button
                  onClick={() => startEdit(coupon)}
                  className="bg-blue-600 text-white text-sm px-3 py-1 hover:bg-blue-700"
                >
                  Edit
                </Button>
                <Button 
                  onClick={() => deleteCoupon(coupon._id)}
                  className="bg-red-600 text-white text-sm px-3 py-1 hover:bg-red-700"
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 text-lg">No coupons created yet</p>
            <p className="text-gray-400 mt-2">Create your first coupon to offer discounts</p>
          </div>
        )}
      </div>
    </div>
  );
}
