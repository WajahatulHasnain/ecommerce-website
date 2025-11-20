import { useState, useEffect } from 'react';
import api from '../../utils/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useSettings } from '../../context/SettingsContext';

export default function CustomerProducts() {
  const { formatPrice, getCurrencySymbol } = useSettings();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    minPrice: '',
    maxPrice: '',
    discount: 'all'
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
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchWishlist();
  }, [filters]);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      // Add filters except discount (handle locally)
      Object.keys(filters).forEach(key => {
        if (key !== 'discount' && filters[key] && filters[key] !== 'all') {
          params.append(key, filters[key]);
        }
      });

      const response = await api.get(`/customer/products?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        let filteredProducts = response.data.data.products;
        
        // Apply discount filter locally
        if (filters.discount === 'discount') {
          filteredProducts = filteredProducts.filter(product => 
            product.discount?.type && product.discount?.value > 0
          );
        }
        
        setProducts(filteredProducts);
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
    // Use finalPrice if product has active discount, otherwise use original price
    const effectivePrice = product.discount?.type && product.discount?.value > 0 && product.finalPrice < product.price 
      ? product.finalPrice 
      : product.price;
    
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
        price: effectivePrice,
        originalPrice: product.price,
        imageUrl: product.imageUrl,
        qty: 1,
        maxStock: product.stock,
        hasDiscount: product.discount?.type && product.discount?.value > 0 && product.finalPrice < product.price
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
    
    // Validate customer info
    if (!customerInfo.name?.trim() || !customerInfo.email?.trim() || !customerInfo.phone?.trim() || 
        !customerInfo.address.street?.trim() || !customerInfo.address.city?.trim()) {
      alert('Please fill in all required customer information (Name, Email, Phone, Street Address, and City)');
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerInfo.email)) {
      alert('Please enter a valid email address');
      return;
    }

    setPurchasing(true);
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Please log in to complete your purchase');
        setPurchasing(false);
        return;
      }
      
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
          discount = Math.min(appliedCoupon.discount, subtotal);
        }
        finalTotal = Math.max(0, subtotal - discount);
      }

      const response = await api.post('/customer/purchase', {
        products: cart.map(item => ({
          productId: item.productId,
          qty: item.qty,
          title: item.title,
          price: item.price
        })),
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
        alert('🎉 Order placed successfully! Thank you for your purchase.');
        setCart([]);
        setAppliedCoupon(null);
        setCouponCode('');
        setCustomerInfo({
          name: '',
          email: '',
          phone: '',
          address: { street: '', city: '', state: '', zipCode: '', country: '' }
        });
        setShowPurchaseModal(false);
        fetchProducts(); // Refresh products to update stock
      } else {
        alert('Order failed: ' + (response.data.msg || 'Unknown error'));
      }
    } catch (error) {
      console.error('Purchase error:', error);
      const errorMessage = error.response?.data?.msg || error.message || 'Purchase failed. Please try again.';
      alert('❌ Purchase Error: ' + errorMessage);
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
    return cart.reduce((total, item) => {
      // Calculate item total with any product discounts already applied
      const itemTotal = item.price * item.qty;
      return total + itemTotal;
    }, 0);
  };
  
  const getProductDiscountSavings = () => {
    return cart.reduce((total, item) => {
      if (item.hasDiscount) {
        const savings = (item.originalPrice - item.price) * item.qty;
        return total + savings;
      }
      return total;
    }, 0);
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
          
          <select
            name="discount"
            value={filters.discount}
            onChange={handleFilterChange}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">All Products</option>
            <option value="discount">🏷️ On Discount</option>
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
                    {formatPrice(getTotalPrice())}
                  </div>
                  <div className="font-bold text-green-600">
                    {formatPrice(getFinalTotal())}
                  </div>
                </div>
              ) : (
                  <span className="font-medium">{formatPrice(getTotalPrice())}</span>
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
            <div key={product._id} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group">
              {/* Full-height product image with gradient overlay */}
              <div className="relative w-full h-80 bg-gray-100 overflow-hidden">
                {product.imageUrl ? (
                  <>
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Dark gradient overlay for better text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-200">
                    <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                
                {/* Wishlist Heart Button - Top Right */}
                <button
                  onClick={() => toggleWishlist(product._id)}
                  className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all duration-200 ${
                    wishlist.includes(product._id)
                      ? 'bg-red-500/90 text-white scale-110'
                      : 'bg-white/80 text-gray-600 hover:text-red-500 hover:bg-white/95'
                  } shadow-lg hover:shadow-xl hover:scale-110`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </button>
                
                {/* Discount badge - Top Left */}
                {product.discount?.type && product.discount.value > 0 && (
                  <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-lg backdrop-blur-sm">
                    {product.discount.type === 'percentage' 
                      ? `${product.discount.value}% OFF`
                      : `$${product.discount.value} OFF`
                    }
                  </div>
                )}
                
                {/* Product Title - Bottom with transparency */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <h3 className="font-semibold text-white text-base mb-3 line-clamp-2 drop-shadow-lg">
                    {product.title}
                  </h3>
                  
                  {/* Price and Stock Row */}
                  <div className="flex items-end justify-between">
                      {/* Price Display */}
                      <div className="flex items-center gap-2">
                        {product.discount?.type && product.discount?.value > 0 && product.finalPrice < product.price ? (
                          <>
                            <span className="text-gray-300 text-sm line-through">
                              {formatPrice(product.price)}
                            </span>
                            <span className="text-white text-2xl font-bold drop-shadow-lg">
                              {formatPrice(product.finalPrice)}
                            </span>
                          </>
                        ) : (
                          <span className="text-white text-2xl font-bold drop-shadow-lg">
                            {formatPrice(product.price)}
                          </span>
                        )}
                      </div>                    {/* Stock Badge */}
                    <span className={`px-3 py-1 text-xs font-bold rounded-full backdrop-blur-md ${
                      product.stock > 0 
                        ? 'bg-green-500/90 text-white' 
                        : 'bg-red-500/90 text-white'
                    } shadow-lg`}>
                      {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>
                </div>
                
                {/* Action Buttons - Appear on hover */}
                <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-sm">
                  <button
                    onClick={() => addToCart(product)}
                    disabled={product.stock === 0}
                    className="bg-orange-500 text-white hover:bg-orange-600 text-sm py-3 px-6 rounded-lg font-semibold transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100"
                  >
                    Add to Cart
                  </button>
                  <button
                    onClick={() => setSelectedProduct(product)}
                    className="bg-white text-gray-900 hover:bg-gray-100 text-sm py-3 px-6 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
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
                <div className="space-y-3">
                  {cart.map(item => (
                    <div key={item.productId} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 group">
                      <div className="relative h-32 bg-gray-100 overflow-hidden">
                        {item.imageUrl ? (
                          <>
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-200">
                            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                        
                        {/* Item details overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                          <h4 className="text-white font-semibold text-sm mb-1 line-clamp-1 drop-shadow-lg">{item.title}</h4>
                          <div className="flex items-center justify-between">
                            <span className="text-white text-xs backdrop-blur-md bg-white/20 px-2 py-1 rounded-full">Qty: {item.qty}</span>
                            <div className="flex items-center gap-2">
                              {item.hasDiscount ? (
                                <>
                                  <span className="text-gray-300 text-sm line-through">
                                    ${(item.originalPrice * item.qty).toFixed(2)}
                                  </span>
                                  <span className="text-white text-lg font-bold drop-shadow-lg">
                                    ${(item.price * item.qty).toFixed(2)}
                                  </span>
                                </>
                              ) : (
                                <span className="text-white text-lg font-bold drop-shadow-lg">${(item.price * item.qty).toFixed(2)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Remove button on hover */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <button
                            onClick={() => removeFromCart(item.productId)}
                            className="bg-red-500/90 text-white p-1 rounded-full hover:bg-red-600 transition-colors backdrop-blur-md shadow-lg"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Order Summary */}
                <div className="bg-blue-50 p-4 rounded-lg mt-4 border border-blue-200">
                  <div className="space-y-3">
                    <div className="flex justify-between text-gray-700 text-lg">
                      <span>Subtotal:</span>
                    <span className="font-bold text-xl">{formatPrice(getTotalPrice())}</span>
                    </div>
                    {getProductDiscountSavings() > 0 && (
                      <div className="flex justify-between text-green-600 text-lg">
                        <span>Product Discounts:</span>
                        <span className="font-bold text-xl">-${getProductDiscountSavings().toFixed(2)}</span>
                      </div>
                    )}
                    {appliedCoupon && (
                      <div className="flex justify-between text-green-600 text-lg">
                        <span>Coupon Discount ({appliedCoupon.code}):</span>
                        <span className="font-bold text-xl">-${getDiscountAmount().toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t border-blue-300 pt-3 flex justify-between text-2xl font-bold text-blue-900">
                      <span>Total:</span>
                      <span>{formatPrice(getFinalTotal())}</span>
                    </div>
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
                  {purchasing ? 'Processing...' : `Place Order - ${formatPrice(getFinalTotal())}`}
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
      
      {/* Detailed Product View Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{selectedProduct.title}</h2>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Product Image */}
                <div className="relative">
                  <div className="w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
                    {selectedProduct.imageUrl ? (
                      <img
                        src={selectedProduct.imageUrl}
                        alt={selectedProduct.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  {/* Discount Badge on Image */}
                  {selectedProduct.discount?.type && selectedProduct.discount.value > 0 && (
                    <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-2 rounded-lg text-sm font-semibold">
                      {selectedProduct.discount.type === 'percentage' 
                        ? `${selectedProduct.discount.value}% OFF`
                        : `$${selectedProduct.discount.value} OFF`
                      }
                    </div>
                  )}
                </div>
                
                {/* Product Details */}
                <div className="space-y-6">
                  {/* Price Section */}
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-2">Price</h3>
                    {selectedProduct.discount?.type && selectedProduct.discount?.value > 0 && selectedProduct.finalPrice < selectedProduct.price ? (
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-4 mb-2">
                          <div className="relative">
                            <span className="text-white text-2xl font-bold line-through opacity-75">
                              ${selectedProduct.price}
                            </span>
                            <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-red-400 font-bold text-3xl">×</span>
                          </div>
                          <span className="text-white text-5xl font-bold">${selectedProduct.finalPrice}</span>
                        </div>
                        <div className="text-green-400 text-lg font-medium">
                          You save ${(selectedProduct.price - selectedProduct.finalPrice).toFixed(2)}
                        </div>
                      </div>
                    ) : (
                      <div className="text-white text-5xl font-bold text-center">${selectedProduct.price}</div>
                    )}
                  </div>
                  
                  {/* Stock Status */}
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-700">Availability:</span>
                    <span className={`px-4 py-2 rounded-full text-lg font-bold ${
                      selectedProduct.stock > 0 
                        ? 'bg-green-500 text-white' 
                        : 'bg-red-500 text-white'
                    }`}>
                      {selectedProduct.stock > 0 ? `In Stock (${selectedProduct.stock} available)` : 'Out of Stock'}
                    </span>
                  </div>
                  
                  {/* Category */}
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-700">Category:</span>
                    <span className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-700 uppercase">
                      {selectedProduct.category}
                    </span>
                  </div>
                  
                  {/* Description */}
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Description</h3>
                    <p className="text-gray-600 leading-relaxed">
                      {selectedProduct.description || 'No description available.'}
                    </p>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => {
                        addToCart(selectedProduct);
                        setSelectedProduct(null);
                      }}
                      disabled={selectedProduct.stock === 0}
                      className="flex-1 bg-orange-500 text-white hover:bg-orange-600 py-3 px-6 rounded-lg transition-colors disabled:bg-gray-300 font-medium"
                    >
                      {selectedProduct.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                    <button
                      onClick={() => toggleWishlist(selectedProduct._id)}
                      className={`px-6 py-3 rounded-lg transition-colors font-medium ${
                        wishlist.includes(selectedProduct._id)
                          ? 'bg-red-500 text-white hover:bg-red-600'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {wishlist.includes(selectedProduct._id) ? '♥ Remove from Wishlist' : '♡ Add to Wishlist'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
