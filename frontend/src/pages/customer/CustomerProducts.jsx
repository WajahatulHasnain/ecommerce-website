import { useState, useEffect } from 'react';
import api from '../../utils/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function CustomerProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    minPrice: '',
    maxPrice: ''
  });
  const [cart, setCart] = useState([]);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
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
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchWishlist();
  }, [filters]);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key] !== 'all') {
          params.append(key, filters[key]);
        }
      });

      const response = await api.get(`/customer/products?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setProducts(response.data.data.products);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWishlist = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/customer/wishlist', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setWishlist(response.data.data.map(item => item.productId._id));
      }
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
    }
  };

  const handleFilterChange = (e) => {
    setFilters(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const addToCart = async (product) => {
    // First update local cart for immediate purchase flow
    setCart(prev => {
      const existing = prev.find(item => item.productId === product._id);
      if (existing) {
        return prev.map(item =>
          item.productId === product._id
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      }
      return [...prev, {
        productId: product._id,
        title: product.title,
        price: product.price,
        imageUrl: product.imageUrl,
        qty: 1,
        maxStock: product.stock
      }];
    });
    
    // Also save to backend cart for persistent storage
    try {
      const token = localStorage.getItem('token');
      await api.post(`/customer/cart/${product._id}`, 
        { quantity: 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Show success message
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      toast.textContent = `${product.title} added to cart!`;
      document.body.appendChild(toast);
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 3000);
      
    } catch (error) {
      console.error('Failed to save to cart:', error);
      // Don't show error to user as local cart still works
    }
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const updateCartQty = (productId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(prev =>
      prev.map(item =>
        item.productId === productId
          ? { ...item, qty: Math.min(newQty, item.maxStock) }
          : item
      )
    );
  };

  const handlePurchase = async () => {
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }

    setPurchasing(true);
    try {
      const token = localStorage.getItem('token');
      
      // Calculate subtotal
      const subtotal = cart.reduce((total, item) => total + (item.price * item.qty), 0);
      
      // Apply coupon discount if available
      let discount = 0;
      let finalTotal = subtotal;
      
      if (appliedCoupon) {
        if (appliedCoupon.type === 'percentage') {
          discount = (subtotal * appliedCoupon.discount) / 100;
          if (appliedCoupon.maxDiscount && discount > appliedCoupon.maxDiscount) {
            discount = appliedCoupon.maxDiscount;
          }
        } else {
          discount = appliedCoupon.discount;
        }
        finalTotal = Math.max(0, subtotal - discount);
      }

      const response = await api.post('/customer/purchase', {
        products: cart,
        customerInfo,
        coupon: appliedCoupon ? {
          code: appliedCoupon.code,
          discount,
          type: appliedCoupon.type
        } : null,
        subtotal,
        discount,
        finalTotal
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        alert('Order placed successfully!');
        setCart([]);
        setAppliedCoupon(null);
        setCouponCode('');
        setShowPurchaseModal(false);
        fetchProducts(); // Refresh products to update stock
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      alert('Purchase failed: ' + (error.response?.data?.msg || error.message));
    } finally {
      setPurchasing(false);
    }
  };

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await api.get(`/customer/coupons/validate/${couponCode}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const coupon = response.data.data;
        const subtotal = getTotalPrice();
        
        // Check minimum amount requirement
        if (coupon.minAmount && subtotal < coupon.minAmount) {
          setCouponError(`Minimum order amount $${coupon.minAmount} required`);
          return;
        }

        setAppliedCoupon(coupon);
        setCouponError('');
        alert(`Coupon applied! You save ${coupon.type === 'percentage' ? coupon.discount + '%' : '$' + coupon.discount}`);
      }
    } catch (error) {
      setCouponError(error.response?.data?.msg || 'Invalid coupon code');
      setAppliedCoupon(null);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const toggleWishlist = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      const isInWishlist = wishlist.includes(productId);

      if (isInWishlist) {
        // Remove from wishlist
        const response = await api.delete(`/customer/wishlist/${productId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          setWishlist(prev => prev.filter(id => id !== productId));
        }
      } else {
        // Add to wishlist
        const response = await api.post(`/customer/wishlist/${productId}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          setWishlist(prev => [...prev, productId]);
        }
      }
    } catch (error) {
      console.error('Failed to toggle wishlist:', error);
      alert('Failed to update wishlist');
    }
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.qty), 0);
  };

  const getDiscountAmount = () => {
    if (!appliedCoupon) return 0;
    
    const subtotal = getTotalPrice();
    if (appliedCoupon.type === 'percentage') {
      let discount = (subtotal * appliedCoupon.discount) / 100;
      if (appliedCoupon.maxDiscount && discount > appliedCoupon.maxDiscount) {
        discount = appliedCoupon.maxDiscount;
      }
      return discount;
    } else {
      return Math.min(appliedCoupon.discount, subtotal);
    }
  };

  const getFinalTotal = () => {
    const subtotal = getTotalPrice();
    const discount = getDiscountAmount();
    return Math.max(0, subtotal - discount);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <p className="text-gray-600">Discover amazing products</p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Search products..."
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
          />
          
          <select
            name="category"
            value={filters.category}
            onChange={handleFilterChange}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="electronics">Electronics</option>
            <option value="clothing">Clothing</option>
            <option value="home">Home & Garden</option>
            <option value="sports">Sports & Fitness</option>
            <option value="books">Books</option>
            <option value="beauty">Beauty & Personal Care</option>
            <option value="other">Other</option>
          </select>
          
          <Input
            placeholder="Min Price"
            name="minPrice"
            type="number"
            value={filters.minPrice}
            onChange={handleFilterChange}
          />
          
          <Input
            placeholder="Max Price"
            name="maxPrice"
            type="number"
            value={filters.maxPrice}
            onChange={handleFilterChange}
          />
        </div>
      </Card>

      {/* Cart Summary */}
      {cart.length > 0 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex justify-between items-center">
            <div>
              <span className="font-medium">
                Cart: {cart.length} item(s)
              </span>
              {appliedCoupon && (
                <div className="text-sm text-green-600 mt-1">
                  Coupon "{appliedCoupon.code}" applied!
                </div>
              )}
            </div>
            <div className="text-right">
              {appliedCoupon ? (
                <div>
                  <div className="text-sm text-gray-500 line-through">
                    ${getTotalPrice().toFixed(2)}
                  </div>
                  <div className="font-bold text-green-600">
                    ${getFinalTotal().toFixed(2)}
                  </div>
                </div>
              ) : (
                <span className="font-medium">${getTotalPrice().toFixed(2)}</span>
              )}
            </div>
            <Button 
              onClick={() => setShowPurchaseModal(true)}
              className="bg-green-600 text-white hover:bg-green-700 ml-4"
            >
              Proceed to Checkout
            </Button>
          </div>
        </Card>
      )}

      {/* Products Grid */}
      {loading ? (
        <div className="text-center py-8">Loading products...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map(product => (
            <Card key={product._id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-square bg-gray-200 relative">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <span className="text-4xl">📦</span>
                  </div>
                )}
                {/* Wishlist Heart Button */}
                <button
                  onClick={() => toggleWishlist(product._id)}
                  className={`absolute top-2 right-2 p-2 rounded-full transition-colors ${
                    wishlist.includes(product._id)
                      ? 'bg-red-500 text-white'
                      : 'bg-white text-gray-400 hover:text-red-500'
                  } shadow-md hover:shadow-lg`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </button>
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1">{product.title}</h3>
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">{product.description}</p>
                
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-bold text-green-600">${product.price}</span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {product.category}
                  </span>
                </div>

                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-gray-600">Stock: {product.stock}</span>
                  {product.tags && product.tags.length > 0 && (
                    <span className="text-xs text-blue-600">#{product.tags[0]}</span>
                  )}
                </div>
                
                <Button
                  onClick={() => addToCart(product)}
                  disabled={product.stock === 0}
                  className="w-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300"
                >
                  {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {products.length === 0 && !loading && (
        <Card className="p-12 text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Products Found</h3>
          <p className="text-gray-600">Try adjusting your search filters</p>
        </Card>
      )}

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Checkout</h2>
              
              {/* Cart Items */}
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Order Items</h3>
                <div className="space-y-2">
                  {cart.map(item => (
                    <div key={item.productId} className="flex justify-between items-center p-2 border rounded">
                      <div className="flex items-center space-x-3">
                        <img
                          src={item.imageUrl || '/placeholder.png'}
                          alt={item.title}
                          className="w-10 h-10 object-cover rounded"
                        />
                        <span className="font-medium">{item.title}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="1"
                          max={item.maxStock}
                          value={item.qty}
                          onChange={(e) => updateCartQty(item.productId, parseInt(e.target.value))}
                          className="w-16 px-2 py-1 border rounded text-center"
                        />
                        <span className="font-semibold">${(item.price * item.qty).toFixed(2)}</span>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-right mt-4">
                  <div className="text-lg">
                    <span className="text-gray-600">Subtotal: ${getTotalPrice().toFixed(2)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="text-green-600">
                      Discount ({appliedCoupon.code}): -${getDiscountAmount().toFixed(2)}
                    </div>
                  )}
                  <div className="text-xl font-bold border-t pt-2">
                    Total: ${getFinalTotal().toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Coupon Section */}
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Coupon Code</h3>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded">
                    <div>
                      <span className="font-medium text-green-800">{appliedCoupon.code}</span>
                      <span className="text-green-600 ml-2">
                        ({appliedCoupon.type === 'percentage' ? `${appliedCoupon.discount}%` : `$${appliedCoupon.discount}`} off)
                      </span>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Enter coupon code"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <Button
                      onClick={validateCoupon}
                      className="bg-blue-600 text-white hover:bg-blue-700"
                    >
                      Apply
                    </Button>
                  </div>
                )}
                {couponError && (
                  <p className="text-red-500 text-sm mt-1">{couponError}</p>
                )}
              </div>

              {/* Customer Info Form */}
              <div className="space-y-4">
                <h3 className="font-semibold">Customer Information</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))
                    }
                    required
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))
                    }
                    required
                  />
                </div>
                
                <Input
                  label="Phone"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))
                  }
                  required
                />
                
                <Input
                  label="Street Address"
                  value={customerInfo.address.street}
                  onChange={(e) => setCustomerInfo(prev => ({
                    ...prev,
                    address: { ...prev.address, street: e.target.value }
                  }))}
                  required
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="City"
                    value={customerInfo.address.city}
                    onChange={(e) => setCustomerInfo(prev => ({
                      ...prev,
                      address: { ...prev.address, city: e.target.value }
                    }))}
                    required
                  />
                  <Input
                    label="State"
                    value={customerInfo.address.state}
                    onChange={(e) => setCustomerInfo(prev => ({
                      ...prev,
                      address: { ...prev.address, state: e.target.value }
                    }))}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handlePurchase}
                  disabled={purchasing || cart.length === 0}
                  className="flex-1 bg-green-600 text-white hover:bg-green-700"
                >
                  {purchasing ? 'Processing...' : `Place Order - $${getFinalTotal().toFixed(2)}`}
                </Button>
                <Button
                  onClick={() => setShowPurchaseModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 hover:bg-gray-400"
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
