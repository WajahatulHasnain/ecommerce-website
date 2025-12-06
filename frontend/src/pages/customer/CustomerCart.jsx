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
    },
    paymentMethod: 'cod' // Default to Cash on Delivery
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
      // ✅ Enhanced: Convert coupon to uppercase for case-insensitive validation
      const normalizedCouponCode = couponCode.trim().toUpperCase();
      
      const response = await api.get(`/customer/coupons/validate/${normalizedCouponCode}`, {
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
        
        // ✅ Enhanced: Update the input to show the normalized code
        setCouponCode(normalizedCouponCode);
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
      totalPrice: finalTotal,
      paymentMethod: customerInfo.paymentMethod || 'cod'
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
  const finalTotal = Math.max(0, subtotal - couponDiscount);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
        <p className="text-gray-600">{cartItems.length} items in your cart</p>
      </div>

      {cartItems.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items - Compact Product Cards */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {cartItems.map((item) => (
                <div key={item._id} className="product-card-unified group relative">
                  {/* Product Image Container */}
                  <div className="product-card-unified-image">
                    {item.productId.imageUrl ? (
                      <img
                        src={item.productId.imageUrl}
                        alt={item.productId.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-warm-gray-400 bg-warm-gray-100">
                        <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    
                    {/* Remove Button - Top Right */}
                    <button
                      onClick={() => removeItem(item.productId._id)}
                      className="absolute top-3 right-3 p-2 rounded-full backdrop-blur-md bg-red-500/90 text-white hover:bg-red-600 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-110 z-20"
                      title="Remove from cart"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    
                    {/* Quantity Controls - Top Left */}
                    <div className="absolute top-3 left-3 flex items-center space-x-1 backdrop-blur-md bg-white/90 rounded-full px-3 py-2 shadow-lg z-20">
                      <button
                        onClick={() => updateQuantity(item.productId._id, item.quantity - 1)}
                        className="w-6 h-6 bg-warm-gray-200 text-warm-gray-700 text-sm hover:bg-warm-gray-300 rounded-full flex items-center justify-center font-bold transition-colors"
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-bold text-warm-gray-800 text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId._id, item.quantity + 1)}
                        className="w-6 h-6 bg-etsy-orange text-white text-sm hover:bg-etsy-orange-dark rounded-full flex items-center justify-center font-bold transition-colors"
                        disabled={item.quantity >= item.productId.stock}
                      >
                        +
                      </button>
                    </div>
                    
                    {/* Discount Badge */}
                    {item.productId.discount?.enabled && item.productId.finalPrice < item.productId.price && (
                      <div className="absolute top-3 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg backdrop-blur-sm">
                        {item.productId.discount.type === 'percentage' 
                          ? `${item.productId.discount.value}% OFF`
                          : `$${item.productId.discount.value} OFF`
                        }
                      </div>
                    )}
                    
                    {/* Product Info Overlay */}
                    <div className="product-card-overlay">
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-4">
                        <div className="text-white space-y-2">
                          <h3 className="font-semibold text-sm leading-tight line-clamp-2">
                            {item.productId.title}
                          </h3>
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              {item.productId.discount?.enabled && item.productId.finalPrice < item.productId.price ? (
                                <div className="space-y-1">
                                  <span className="text-lg font-bold text-white">
                                    {formatPrice(item.productId.finalPrice * item.quantity)}
                                  </span>
                                  <span className="text-xs text-gray-300 line-through">
                                    {formatPrice(item.productId.price * item.quantity)}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-lg font-bold text-white">
                                  {formatPrice(item.productId.price * item.quantity)}
                                </span>
                              )}
                              <span className={`text-xs font-medium ${
                                item.productId.stock > 0 
                                  ? 'text-green-300' 
                                  : 'text-red-300'
                              }`}>
                                {item.productId.stock > 0 ? `${item.productId.stock} left` : 'Out of Stock'}
                              </span>
                            </div>
                            
                            {/* Item Total Badge */}
                            <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                              <span className="text-xs text-white font-medium">
                                {item.quantity} × {formatPrice(item.productId.finalPrice || item.productId.price)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Order Summary (Sticky Sidebar) */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                
                {/* Coupon Section */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Apply Coupon
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Enter coupon code"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                    <Button
                      onClick={validateCoupon}
                      className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg"
                    >
                      Apply
                    </Button>
                  </div>
                  {couponData && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                      ✅ Coupon "{couponData.code}" applied - Save {formatPrice(couponDiscount)}
                    </div>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({cartItems.length} items)</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>Discount ({couponData?.code})</span>
                      <span>-{formatPrice(couponDiscount)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span className="text-green-600 font-medium">Free</span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center mb-6">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-orange-600">
                    {formatPrice(finalTotal)}
                  </span>
                </div>

                {/* Checkout Button */}
                <Button
                  onClick={() => setShowCheckoutModal(true)}
                  className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white text-lg font-semibold rounded-lg transition-colors"
                >
                  Proceed to Checkout
                </Button>

                <p className="text-xs text-gray-500 text-center mt-4">
                  Secure checkout · Free shipping on all orders
                </p>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        <div className="container mx-auto px-4 py-8">
          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">Your cart is empty</h3>
              <p className="text-gray-500 mb-6">Add some products to get started</p>
              <Button 
                onClick={() => navigate('/customer/products')}
                className="px-8 py-3 bg-orange-600 hover:bg-orange-700 text-white"
              >
                Continue Shopping
              </Button>
            </div>
          </Card>
        </div>
      )}
      
      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4 overflow-y-auto">
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

              {/* Payment Method Selection */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Payment Method</label>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={customerInfo.paymentMethod === 'cod'}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, paymentMethod: e.target.value }))}
                      className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300"
                    />
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">💵</span>
                      <div>
                        <span className="font-medium text-gray-900">Cash on Delivery (COD)</span>
                        <p className="text-sm text-gray-600">Pay when your order is delivered to your doorstep</p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handlePurchase}
                  disabled={processing}
                  className="flex-1 bg-orange-600 text-white hover:bg-orange-700 py-3"
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
