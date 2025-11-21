import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useSettings } from '../../context/SettingsContext';

export default function CustomerCart() {
  const { formatPrice, getCurrencySymbol, settings } = useSettings();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponData, setCouponData] = useState(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    }
  });
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/customer/cart', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setCartItems(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity === 0) {
      removeItem(productId);
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await api.put(`/customer/cart/${productId}`, 
        { quantity: newQuantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setCartItems(prev => prev.map(item =>
          item.productId._id === productId 
            ? { ...item, quantity: newQuantity }
            : item
        ));
      }
    } catch (error) {
      console.error('Failed to update quantity:', error);
      if (error.response?.data?.msg) {
        alert(`Error: ${error.response.data.msg}`);
      }
    }
  };

  const removeItem = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.delete(`/customer/cart/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setCartItems(prev => prev.filter(item => item.productId._id !== productId));
      }
    } catch (error) {
      console.error('Failed to remove item:', error);
      alert('Failed to remove item from cart');
    }
  };

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      alert('Please enter a coupon code');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(`/customer/coupons/validate/${couponCode}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const coupon = response.data.data;
        const subtotal = calculateSubtotal();
        
        if (coupon.minAmount && subtotal < coupon.minAmount) {
          alert(`Minimum order amount $${coupon.minAmount} required`);
          return;
        }
        
        let discount = 0;
        if (coupon.type === 'percentage') {
          discount = (subtotal * coupon.discount) / 100;
          if (coupon.maxDiscount && discount > coupon.maxDiscount) {
            discount = coupon.maxDiscount;
          }
        } else {
          discount = Math.min(coupon.discount, subtotal);
        }
        
        setCouponData(coupon);
        setCouponDiscount(discount);
        alert(`Coupon applied! You saved ${formatPrice(discount)}`);
      }
    } catch (error) {
      console.error('Coupon validation failed:', error);
      alert(error.response?.data?.msg || 'Invalid coupon code');
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => 
      total + ((item.productId.finalPrice || item.productId.price) * item.quantity), 0
    );
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert('Your cart is empty');
      return;
    }
    setShowCheckoutModal(true);
  };

  const handlePurchase = async () => {
    // Validate customer info
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone || 
        !customerInfo.address.street || !customerInfo.address.city || 
        !customerInfo.address.state) {
      alert('Please fill in all required customer information');
      return;
    }

    const subtotal = calculateSubtotal();
    const finalTotal = Math.max(0, subtotal - couponDiscount);
    
    const purchaseData = {
      products: cartItems.map(item => ({
        productId: item.productId._id,
        qty: item.quantity,
        title: item.productId.title,
        price: item.productId.finalPrice || item.productId.price
      })),
      customerInfo,
      coupon: couponData ? {
        code: couponData.code,
        discount: couponDiscount
      } : null,
      subtotal,
      discount: couponDiscount,
      totalPrice: finalTotal
    };

    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await api.post('/customer/purchase', purchaseData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        // Clear cart after successful purchase
        await api.delete('/customer/cart', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        alert('Order placed successfully!');
        setShowCheckoutModal(false);
        navigate('/customer/orders');
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      alert(error.response?.data?.msg || 'Checkout failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-orange-600"></div>
      </div>
    );
  }

  const subtotal = calculateSubtotal();
  const tax = subtotal * 0.1; // 10% tax
  const shipping = subtotal > 50 ? 0 : 5.99; // Free shipping over $50
  const total = Math.max(0, subtotal - couponDiscount) + tax + shipping;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
        <p className="text-gray-600">{cartItems.length} items in your cart</p>
      </div>

      {cartItems.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item._id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 p-6">
                  <div className="flex gap-4">
                    {/* Product Image - 120x120 */}
                    <div className="relative w-30 h-30 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
                      {item.productId.imageUrl ? (
                        <img
                          src={item.productId.imageUrl}
                          alt={item.productId.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    {/* Product Details */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg mb-1">{item.productId.title}</h3>
                          <p className="text-sm text-gray-500">{item.productId.stock} in stock</p>
                        </div>
                        <button
                          onClick={() => removeItem(item.productId._id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                      
                      <div className="flex justify-between items-end">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateQuantity(item.productId._id, item.quantity - 1)}
                            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-semibold transition-colors">
                            −
                          </button>
                          <span className="w-12 text-center font-semibold text-lg">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId._id, item.quantity + 1)}
                            disabled={item.quantity >= item.productId.stock}
                            className="w-8 h-8 rounded-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white flex items-center justify-center font-semibold transition-colors">
                            +
                          </button>
                        </div>
                        <div className="text-right">
                          {item.productId.discount?.enabled && item.productId.finalPrice < item.productId.price ? (
                            <div>
                              <div className="text-sm text-gray-400 line-through">
                                {formatPrice(item.productId.price * item.quantity)}
                              </div>
                              <div className="text-xl font-bold text-orange-600">
                                {formatPrice(item.productId.finalPrice * item.quantity)}
                              </div>
                            </div>
                          ) : (
                            <div className="text-xl font-bold text-gray-900">
                              {formatPrice(item.productId.price * item.quantity)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Discount badge */}
                  {item.productId.discount?.enabled && item.productId.finalPrice < item.productId.price && (
                    <div className="absolute top-2 right-8 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold shadow-lg backdrop-blur-sm">
                      {item.productId.discount.type === 'percentage' 
                        ? `${item.productId.discount.value}% OFF`
                        : `$${item.productId.discount.value} OFF`
                      }
                    </div>
                  )}
                  </div>
                  
                  {/* Product details - right side */}
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-base mb-2 line-clamp-2">{item.productId.title}</h3>
                      
                      {/* Price Display */}
                      <div className="flex items-center gap-2 mb-2">
                        {item.productId.discount?.enabled && item.productId.finalPrice < item.productId.price ? (
                          <>
                            <span className="text-gray-400 text-sm line-through">
                              {formatPrice(item.productId.price * item.quantity)}
                            </span>
                            <span className="text-orange-600 text-lg font-bold">
                              {formatPrice(item.productId.finalPrice * item.quantity)}
                            </span>
                          </>
                        ) : (
                          <span className="text-gray-900 text-lg font-bold">
                            {formatPrice(item.productId.price * item.quantity)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      {/* Stock Badge */}
                      <span className="px-2 py-1 text-xs font-bold rounded-full bg-green-500/90 text-white shadow">
                        {item.productId.stock} in stock
                      </span>
                      <span className="text-sm text-gray-500">Qty: {item.quantity}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>          {/* Order Summary - Sticky */}
          <div className="space-y-4 sticky top-4">
            {/* Coupon Section */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Apply Coupon</h3>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter coupon code"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button
                  onClick={validateCoupon}
                  className="bg-orange-600 text-white hover:bg-orange-700"
                >
                  Apply
                </Button>
              </div>
              {couponData && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                  ✅ Coupon "{couponData.code}" applied - Save {formatPrice(couponDiscount)}
                </div>
              )}
            </Card>

            {/* Order Summary */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal ({cartItems.length} items)</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Coupon Discount</span>
                    <span>-{formatPrice(couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Tax ({settings.taxRate}%)</span>
                  <span>{formatPrice(tax)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
                </div>
                <hr />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
              
              <Button
                onClick={handleCheckout}
                className="w-full mt-6 bg-orange-600 text-white hover:bg-orange-700 py-4 text-lg font-semibold"
              >
                Proceed to Checkout
              </Button>
            </Card>
          </div>
        </div>
      ) : (
        <div className="text-center py-16">
          <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
          </svg>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-8">Add some products to get started</p>
          <Button
            onClick={() => navigate('/customer/products')}
            className="bg-orange-600 text-white hover:bg-orange-700 px-8 py-3"
          >
            Continue Shopping
          </Button>
        </div>
      )}
      
      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Complete Your Order</h2>
              
              {/* Order Summary */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Order Summary</h3>
                <div className="space-y-2">
                  {cartItems.map(item => (
                    <div key={item._id} className="flex justify-between items-center p-2 border rounded">
                      <div className="flex items-center space-x-3">
                        <img
                          src={item.productId.imageUrl || '/placeholder.png'}
                          alt={item.productId.title}
                          className="w-10 h-10 object-cover rounded"
                        />
                        <div>
                          <span className="font-medium">{item.productId.title}</span>
                          <div className="text-sm text-gray-600">Qty: {item.quantity}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        {item.productId.discount?.enabled && item.productId.finalPrice < item.productId.price ? (
                          <div>
                            <div className="text-green-600 font-semibold">{formatPrice((item.productId.finalPrice || item.productId.price) * item.quantity)}</div>
                            <div className="text-xs text-gray-400 line-through">{formatPrice(item.productId.price * item.quantity)}</div>
                          </div>
                        ) : (
                          <div className="font-semibold">{formatPrice((item.productId.finalPrice || item.productId.price) * item.quantity)}</div>
                        )}
                      </div>
                    </div>
                  ))}\n                </div>
                
                <div className="mt-4 p-4 bg-gray-50 rounded">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Subtotal:</span>
                    <span className="font-semibold">{formatPrice(calculateSubtotal())}</span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between items-center text-green-600">
                      <span>Coupon Discount:</span>
                      <span>-{formatPrice(couponDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-lg font-bold border-t pt-2 mt-2">
                    <span>Total:</span>
                    <span>{formatPrice(Math.max(0, calculateSubtotal() - couponDiscount))}</span>
                  </div>
                </div>
              </div>

              {/* Customer Information Form */}
              <div className="space-y-4">
                <h3 className="font-semibold">Customer Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Enter your phone number"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
                  <input
                    type="text"
                    value={customerInfo.address.street}
                    onChange={(e) => setCustomerInfo(prev => ({
                      ...prev,
                      address: { ...prev.address, street: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Enter your street address"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                    <input
                      type="text"
                      value={customerInfo.address.city}
                      onChange={(e) => setCustomerInfo(prev => ({
                        ...prev,
                        address: { ...prev.address, city: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="City"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                    <input
                      type="text"
                      value={customerInfo.address.state}
                      onChange={(e) => setCustomerInfo(prev => ({
                        ...prev,
                        address: { ...prev.address, state: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="State"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                    <input
                      type="text"
                      value={customerInfo.address.zipCode}
                      onChange={(e) => setCustomerInfo(prev => ({
                        ...prev,
                        address: { ...prev.address, zipCode: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="ZIP Code"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <input
                      type="text"
                      value={customerInfo.address.country}
                      onChange={(e) => setCustomerInfo(prev => ({
                        ...prev,
                        address: { ...prev.address, country: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Country"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handlePurchase}
                  disabled={processing}
                  className="flex-1 bg-green-600 text-white hover:bg-green-700 py-3"
                >
                  {processing ? 'Processing...' : `Place Order - ${formatPrice(Math.max(0, calculateSubtotal() - couponDiscount))}`}
                </Button>
                <Button
                  onClick={() => setShowCheckoutModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 hover:bg-gray-400 py-3"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
