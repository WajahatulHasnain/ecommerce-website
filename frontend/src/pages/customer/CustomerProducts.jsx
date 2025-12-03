import { useState, useEffect, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../utils/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ProductFilters from '../../components/ProductFilters';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { useGuest } from '../../context/GuestContext';

export default function CustomerProducts() {
  const { formatPrice, getCurrencySymbol } = useSettings();
  const { user } = useAuth();
  const { requireAuth } = useGuest();
  const location = useLocation();
  
  // State management
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [wishlist, setWishlist] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    minPrice: '',
    maxPrice: '',
    discount: 'all'
  });
  // Temporary filters that user can edit without triggering API calls
  const [tempFilters, setTempFilters] = useState({
    search: '',
    category: 'all',
    minPrice: '',
    maxPrice: '',
    discount: 'all'
  });
  const [cart, setCart] = useState([]);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
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

  // Handle URL search parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const searchQuery = urlParams.get('search');
    if (searchQuery) {
      const newFilters = {
        search: searchQuery,
        category: 'all',
        minPrice: '',
        maxPrice: '',
        discount: 'all'
      };
      setFilters(newFilters);
      setTempFilters(newFilters);
    }
  }, [location.search]);

  // Fetch data only when actual filters change (not tempFilters)
  useEffect(() => {
    fetchProducts();
    fetchWishlist();
  }, [filters]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      // Add filters except discount (handle locally)
      Object.keys(filters).forEach(key => {
        if (key !== 'discount' && filters[key] && filters[key] !== 'all') {
          params.append(key, filters[key]);
        }
      });

      // Use appropriate endpoint for guests or authenticated users
      const endpoint = user ? '/customer/products' : '/public/products';
      const headers = user && token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await api.get(`${endpoint}?${params}`, { headers });
      
      if (response.data.success) {
        let filteredProducts = response.data.data.products || response.data.data;
        
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
      // Fallback for guests
      if (!user) {
        try {
          const response = await api.get('/products');
          if (response.data.success) {
            setProducts(response.data.data.products || response.data.data);
          }
        } catch (fallbackError) {
          console.error('Fallback fetch failed:', fallbackError);
          setProducts([]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchWishlist = async () => {
    if (!user) {
      setWishlist([]);
      return;
    }
    
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
      setWishlist([]);
    }
  };

  const handleTempFilterChange = (name, value) => {
    setTempFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleApplyFilters = () => {
    // Validate price inputs
    let validatedFilters = { ...tempFilters };
    
    // Clean up price values - remove any non-numeric characters except decimal point
    if (validatedFilters.minPrice) {
      const cleanMin = validatedFilters.minPrice.replace(/[^0-9.]/g, '');
      validatedFilters.minPrice = cleanMin && !isNaN(parseFloat(cleanMin)) ? cleanMin : '';
    }
    
    if (validatedFilters.maxPrice) {
      const cleanMax = validatedFilters.maxPrice.replace(/[^0-9.]/g, '');
      validatedFilters.maxPrice = cleanMax && !isNaN(parseFloat(cleanMax)) ? cleanMax : '';
    }
    
    // Update actual filters (this will trigger the useEffect to fetch products)
    setFilters(validatedFilters);
    setTempFilters(validatedFilters);
  };

  const handleClearAll = () => {
    const clearedFilters = {
      search: '',
      category: 'all',
      minPrice: '',
      maxPrice: '',
      discount: 'all'
    };
    setFilters(clearedFilters);
    setTempFilters(clearedFilters);
  };

  const addToCart = async (product) => {
    if (!user) {
      requireAuth('add items to cart');
      return;
    }
    
    const effectivePrice = product.discount?.type && product.discount?.value > 0 && product.finalPrice < product.price 
      ? product.finalPrice 
      : product.price;
    
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
    
    try {
      const token = localStorage.getItem('token');
      await api.post(`/customer/cart/${product._id}`, 
        { quantity: 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      showToast(`${product.title} added to cart!`, 'success');
    } catch (error) {
      console.error('Failed to save to cart:', error);
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
        
        if (coupon.minAmount && subtotal < coupon.minAmount) {
          setCouponError(`Minimum order amount $${coupon.minAmount} required`);
          return;
        }

        setAppliedCoupon(coupon);
        setCouponError('');
        showToast(`Coupon applied! You save ${coupon.type === 'percentage' ? coupon.discount + '%' : '$' + coupon.discount}`, 'success');
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

  const handlePurchase = async () => {
    if (cart.length === 0) {
      showToast('Cart is empty', 'error');
      return;
    }
    
    if (!customerInfo.name?.trim() || !customerInfo.email?.trim() || !customerInfo.phone?.trim() || 
        !customerInfo.address.street?.trim() || !customerInfo.address.city?.trim()) {
      showToast('Please fill in all required customer information', 'error');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerInfo.email)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    setPurchasing(true);
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        showToast('Please log in to complete your purchase', 'error');
        return;
      }
      
      const subtotal = cart.reduce((total, item) => total + (item.price * item.qty), 0);
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
        showToast('🎉 Order placed successfully! Thank you for your purchase.', 'success');
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
        fetchProducts();
      } else {
        showToast('Order failed: ' + (response.data.msg || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      const errorMessage = error.response?.data?.msg || error.message || 'Purchase failed. Please try again.';
      showToast('❌ Purchase Error: ' + errorMessage, 'error');
    } finally {
      setPurchasing(false);
    }
  };

  const showToast = (message, type = 'info') => {
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
    toast.className = `fixed top-4 right-4 ${bgColor} text-white px-4 py-2 rounded-lg shadow-lg z-50`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 3000);
  };

  const toggleWishlist = async (productId) => {
    if (!user) {
      requireAuth('manage your wishlist');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const isInWishlist = wishlist.includes(productId);

      if (isInWishlist) {
        const response = await api.delete(`/customer/wishlist/${productId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          setWishlist(prev => prev.filter(id => id !== productId));
        }
      } else {
        const response = await api.post(`/customer/wishlist/${productId}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          setWishlist(prev => [...prev, productId]);
        }
      }
    } catch (error) {
      console.error('Failed to toggle wishlist:', error);
      showToast('Failed to update wishlist', 'error');
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
    <div className="w-full min-h-screen bg-warm-white">
      <div className="w-full max-w-none px-2 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6">
        {/* Guest welcome message only for non-logged in users on home page */}
        {!user && location.pathname === '/' && (
          <div className="mb-4 sm:mb-6 p-4 sm:p-6 bg-warm-cream border border-warm-gray-200 rounded-2xl">
            <p className="text-warm-gray-800 text-sm sm:text-base">
              👋 <strong>Welcome Guest!</strong> You can browse all products. 
              <a href="/auth" className="text-etsy-orange hover:text-etsy-orange-dark underline ml-1">Sign in</a> to add items to cart and make purchases.
            </p>
          </div>
        )}

        {/* Mobile-Friendly Search & Filters */}
        <ProductFilters 
          filters={filters}
          tempFilters={tempFilters}
          onTempFilterChange={handleTempFilterChange}
          onApplyFilters={handleApplyFilters}
          onClearAll={handleClearAll}
        />

        {/* Mini Cart Summary - Only for authenticated users */}
        {user && cart.length > 0 && (
          <Card className="p-4 sm:p-6 bg-gradient-to-r from-etsy-orange/5 via-sage/5 to-dusty-rose/5 border border-etsy-orange/20 shadow-sm hover:shadow-md transition-all duration-200 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-etsy-orange to-etsy-orange-dark rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.68 4.36M7 13l1.68 4.36m0 0L16 15M9 19a2 2 0 11-4 0 2 2 0 014 0zm8 0a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <span className="font-semibold text-warm-gray-800 text-base sm:text-lg">
                    {cart.length} item{cart.length !== 1 ? 's' : ''} in cart
                  </span>
                  {appliedCoupon && (
                    <div className="text-sm text-sage-dark font-medium mt-1 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Coupon "{appliedCoupon.code}" applied!
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-6">
                <div className="text-center sm:text-right">
                  {appliedCoupon ? (
                    <>
                      <div className="text-sm text-warm-gray-500 line-through">
                        {formatPrice(getTotalPrice())}
                      </div>
                      <div className="font-bold text-sage-dark text-lg sm:text-xl">
                        {formatPrice(getFinalTotal())}
                      </div>
                      <div className="text-sm text-sage font-medium">
                        You save {formatPrice(getTotalPrice() - getFinalTotal())}
                      </div>
                    </>
                  ) : (
                    <div className="font-bold text-warm-gray-900 text-lg sm:text-xl">
                      {formatPrice(getTotalPrice())}
                    </div>
                  )}
                </div>
                
                <Button 
                  onClick={() => {
                    if (!user) {
                      requireAuth('proceed to checkout');
                      return;
                    }
                    setShowPurchaseModal(true);
                  }}
                  className="bg-gradient-to-r from-etsy-orange to-etsy-orange-dark hover:from-etsy-orange-dark hover:to-warm-blue text-white px-4 sm:px-8 py-2 sm:py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 text-sm sm:text-base"
                >
                  Checkout
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-etsy-orange mx-auto"></div>
            <p className="text-warm-gray-600 mt-6 text-lg">Loading products...</p>
          </div>
        ) : (
          <>
            {products.length > 0 ? (
              <div className="w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                  {products.map(product => (
                    <div key={product._id} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group">
                      <div className="relative w-full h-80 bg-gray-100 overflow-hidden">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-warm-gray-400 bg-warm-gray-100">
                            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                        
                        {/* Wishlist Heart Button */}
                        <button
                          onClick={() => {
                            if (!user) {
                              requireAuth('manage your wishlist');
                              return;
                            }
                            toggleWishlist(product._id);
                          }}
                          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all duration-200 z-20 ${
                            user && wishlist.includes(product._id)
                              ? 'bg-red-500/90 text-white scale-110'
                              : 'bg-white/80 text-gray-600 hover:text-red-500 hover:bg-white/95'
                          } shadow-lg hover:shadow-xl hover:scale-110`}
                          title={!user ? 'Sign in to add to wishlist' : 
                            wishlist.includes(product._id) ? 'Remove from wishlist' : 'Add to wishlist'}
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                          </svg>
                        </button>
                        
                        {/* Discount Badge */}
                        {product.discount?.type && product.discount.value > 0 && (
                          <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-lg backdrop-blur-sm">
                            {product.discount.type === 'percentage' 
                              ? `${product.discount.value}% OFF`
                              : `$${product.discount.value} OFF`
                            }
                          </div>
                        )}

                        {/* Product Info Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4">
                          <div className="text-white space-y-2">
                            <h3 className="font-bold text-xl leading-tight line-clamp-2 text-white drop-shadow-lg">
                              {product.title}
                            </h3>
                            <div className="flex items-center justify-between">
                              <div className="flex flex-col">
                                {product.discount?.type && product.discount?.value > 0 && product.finalPrice < product.price ? (
                                  <div className="flex items-center space-x-2">
                                    <span className="text-lg font-bold text-white">
                                      {formatPrice(product.finalPrice)}
                                    </span>
                                    <span className="text-sm text-gray-300 line-through">
                                      {formatPrice(product.price)}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-lg font-bold text-white">
                                    {formatPrice(product.price)}
                                  </span>
                                )}
                                {product.stock > 0 ? (
                                  <span className="text-sm text-green-300 font-medium">In Stock</span>
                                ) : (
                                  <span className="text-sm text-red-300 font-medium">Out of Stock</span>
                                )}
                              </div>
                              
                              {/* Add to Cart Button */}
                              <button
                                onClick={() => {
                                  if (!user) {
                                    requireAuth('add items to cart');
                                    return;
                                  }
                                  addToCart(product);
                                }}
                                disabled={product.stock === 0}
                                className="px-4 py-2 bg-white/90 text-gray-900 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white hover:shadow-lg active:scale-95 backdrop-blur-sm"
                              >
                                {product.stock === 0 ? '✖️' : '🛒'}
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Hover Action Buttons */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="flex flex-col space-y-2">
                            {/* Add to Cart Button */}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!user) {
                                  requireAuth('add items to cart', 'cart');
                                  return;
                                }
                                addToCart(product);
                              }}
                              disabled={product.stock === 0}
                              className="px-6 py-3 text-sm bg-etsy-orange/95 text-white rounded-xl font-semibold transition-all duration-200 hover:bg-etsy-orange hover:shadow-xl backdrop-blur-sm transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                            >
                              <span className="text-base">{product.stock === 0 ? '❌' : '🛒'}</span>
                              <span>{product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
                            </button>
                            
                            {/* Quick View/Details Button */}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProduct(product);
                              }}
                              className="px-6 py-3 text-sm bg-white/95 text-gray-900 rounded-xl font-semibold transition-all duration-200 hover:bg-white hover:shadow-xl backdrop-blur-sm transform hover:scale-105 flex items-center justify-center space-x-2 border border-white/50"
                            >
                              <span className="text-base">👁️</span>
                              <span>View Details</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Card className="p-8 sm:p-12 text-center">
                <div className="max-w-xs sm:max-w-md mx-auto">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-warm-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <svg className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-warm-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-warm-gray-900 mb-2 sm:mb-3">No products found</h3>
                  <p className="text-sm sm:text-base text-warm-gray-500 mb-4 sm:mb-6">Try adjusting your search or filter criteria</p>
                  <Button 
                    onClick={() => setFilters({ search: '', category: 'all', minPrice: '', maxPrice: '', discount: 'all' })}
                    className="bg-etsy-orange hover:bg-etsy-orange-dark text-white text-sm sm:text-base"
                    size="sm"
                  >
                    Clear Filters
                  </Button>
                </div>
              </Card>
            )}
          </>
        )}

        {/* Purchase Modal */}
        {showPurchaseModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-lg sm:rounded-xl max-w-xs sm:max-w-lg md:max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Checkout</h2>
                
                {/* Cart Items */}
                <div className="mb-4 sm:mb-6">
                  <h3 className="font-semibold mb-2 text-sm sm:text-base">Order Items</h3>
                  <div className="grid grid-cols-1 gap-3 sm:gap-4">
                    {cart.map(item => (
                      <div key={item.productId} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group">
                        <div className="relative w-full h-80 bg-gray-100 overflow-hidden">
                          {item.imageUrl ? (
                            <>
                              <img
                                src={item.imageUrl}
                                alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-200">
                              <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                          
                          <button
                            onClick={() => removeFromCart(item.productId)}
                            className="absolute top-3 right-3 p-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-red-500/90 hover:border-red-400 transition-all duration-300 group z-20 shadow-lg hover:shadow-xl hover:scale-110"
                            title="Remove from cart"
                          >
                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                          
                          {item.hasDiscount && (
                            <div className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-lg backdrop-blur-sm">
                              DISCOUNT
                            </div>
                          )}
                          
                          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                            <h3 className="font-semibold text-white text-base mb-3 line-clamp-2 drop-shadow-lg">
                              {item.title}
                            </h3>
                            
                            <div className="flex items-end justify-between mb-3">
                              <div className="flex items-center gap-2">
                                {item.hasDiscount ? (
                                  <>
                                    <span className="text-gray-300 text-sm line-through">
                                      ${(item.originalPrice * item.qty).toFixed(2)}
                                    </span>
                                    <span className="text-white text-2xl font-bold drop-shadow-lg">
                                      ${(item.price * item.qty).toFixed(2)}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-white text-2xl font-bold drop-shadow-lg">
                                    ${(item.price * item.qty).toFixed(2)}
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => updateCartQty(item.productId, item.qty - 1)}
                                  className="bg-white/20 backdrop-blur-md text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/30 transition-all duration-200"
                                >
                                  −
                                </button>
                                <span className="bg-white/90 text-gray-900 px-3 py-1 rounded-full text-sm font-bold min-w-[3rem] text-center">
                                  Qty: {item.qty}
                                </span>
                                <button
                                  onClick={() => updateCartQty(item.productId, item.qty + 1)}
                                  disabled={item.qty >= item.maxStock}
                                  className="bg-white/20 backdrop-blur-md text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                            
                            <div className="text-center">
                              <span className="bg-blue-500/90 text-white px-3 py-1 text-xs font-bold rounded-full backdrop-blur-md shadow-lg">
                                {item.maxStock - item.qty} left in stock
                              </span>
                            </div>
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
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                    <Input
                      label="Email"
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <Input
                    label="Phone"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
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
        
        {/* Product Details Modal */}
        {selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Product Details</h2>
                    <p className="text-lg text-gray-600 mt-1">{selectedProduct.title}</p>
                  </div>
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
                    
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-700">Category:</span>
                      <span className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-700 uppercase">
                        {selectedProduct.category}
                      </span>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-gray-700 mb-2">Description</h3>
                      <p className="text-gray-600 leading-relaxed">
                        {selectedProduct.description || 'No description available.'}
                      </p>
                    </div>
                    
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => {
                          if (!user) {
                            requireAuth('add items to cart');
                            return;
                          }
                          addToCart(selectedProduct);
                          setSelectedProduct(null);
                        }}
                        disabled={selectedProduct.stock === 0}
                        className="flex-1 bg-orange-500 text-white hover:bg-orange-600 py-3 px-6 rounded-lg transition-colors disabled:bg-gray-300 font-medium"
                      >
                        {selectedProduct.stock === 0 ? 'Out of Stock' : 
                         !user ? '🔒 Sign in to Add to Cart' : 'Add to Cart'}
                      </button>
                      <button
                        onClick={() => {
                          if (!user) {
                            requireAuth('manage your wishlist');
                            return;
                          }
                          toggleWishlist(selectedProduct._id);
                        }}
                        className={`px-6 py-3 rounded-lg transition-colors font-medium ${
                          user && wishlist.includes(selectedProduct._id)
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {!user ? '🔒 Sign in for Wishlist' :
                         wishlist.includes(selectedProduct._id) ? '♥ Remove from Wishlist' : '♡ Add to Wishlist'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
