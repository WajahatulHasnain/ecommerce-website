import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function CustomerCart() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponData, setCouponData] = useState(null);
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
        alert(`Coupon applied! You saved $${discount.toFixed(2)}`);
      }
    } catch (error) {
      console.error('Coupon validation failed:', error);
      alert(error.response?.data?.msg || 'Invalid coupon code');
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => 
      total + (item.productId.price * item.quantity), 0
    );
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      alert('Your cart is empty');
      return;
    }

    const subtotal = calculateSubtotal();
    const finalTotal = Math.max(0, subtotal - couponDiscount);
    
    const purchaseData = {
      products: cartItems.map(item => ({
        productId: item.productId._id,
        qty: item.quantity
      })),
      customerInfo: {
        // You can add customer info collection here
      },
      coupon: couponData ? {
        code: couponData.code,
        discount: couponDiscount
      } : null,
      subtotal,
      discount: couponDiscount,
      finalTotal
    };

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
        navigate('/customer/orders');
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      alert(error.response?.data?.msg || 'Checkout failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <Card key={item._id} className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden">
                    {item.productId.imageUrl ? (
                      <img
                        src={item.productId.imageUrl}
                        alt={item.productId.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <span className="text-2xl">📦</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.productId.title}</h3>
                    <p className="text-sm text-gray-600 mb-1">{item.productId.category}</p>
                    <p className="text-green-600 font-bold">${item.productId.price}</p>
                    <p className="text-xs text-gray-500">{item.productId.stock} in stock</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => updateQuantity(item.productId._id, item.quantity - 1)}
                      className="w-8 h-8 bg-gray-200 text-gray-700 text-sm hover:bg-gray-300"
                    >
                      -
                    </Button>
                    <span className="w-12 text-center font-medium">{item.quantity}</span>
                    <Button
                      onClick={() => updateQuantity(item.productId._id, item.quantity + 1)}
                      className="w-8 h-8 bg-gray-200 text-gray-700 text-sm hover:bg-gray-300"
                      disabled={item.quantity >= item.productId.stock}
                    >
                      +
                    </Button>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold">${(item.productId.price * item.quantity).toFixed(2)}</p>
                    <Button
                      onClick={() => removeItem(item.productId._id)}
                      className="text-red-600 text-sm hover:text-red-800 mt-1"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
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
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  Apply
                </Button>
              </div>
              {couponData && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                  ✅ Coupon "{couponData.code}" applied - Save ${couponDiscount.toFixed(2)}
                </div>
              )}
            </Card>

            {/* Order Summary */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal ({cartItems.length} items)</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Coupon Discount</span>
                    <span>-${couponDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Tax (10%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
                </div>
                <hr />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
              
              <Button
                onClick={handleCheckout}
                className="w-full mt-6 bg-green-600 text-white hover:bg-green-700 py-3"
              >
                Proceed to Checkout
              </Button>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="p-12 text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h3>
          <p className="text-gray-600 mb-6">Add some products to get started</p>
          <Button
            onClick={() => navigate('/customer/products')}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            Continue Shopping
          </Button>
        </Card>
      )}
    </div>
  );
}
