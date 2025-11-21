import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useSettings } from '../../context/SettingsContext';

export default function CustomerOrders() {
  const { formatPrice } = useSettings();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/customer/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setOrders(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
        <p className="text-gray-600">
          {orders.length > 0 ? `You have ${orders.length} order${orders.length !== 1 ? 's' : ''}` : 'Track your order history and status'}
        </p>
      </div>

      {orders.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">No orders yet</h3>
            <p className="text-gray-500 mb-6">Start shopping to see orders here</p>
            <Button 
              onClick={() => navigate('/customer/products')}
              className="px-8 py-3 bg-orange-600 hover:bg-orange-700 text-white"
            >
              Start Shopping
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order._id} className="p-6 hover:shadow-lg transition-shadow">
              {/* Header: Order # + Status Badge */}
              <div className="flex justify-between items-start mb-4 pb-4 border-b">
                <div>
                  <h3 className="text-lg font-semibold">Order #{order.displayOrderId || order._id.slice(-8).toUpperCase()}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                  order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                  order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {order.status}
                </span>
              </div>

              {/* Products */}
              <div className="space-y-3 mb-4">
                {order.products?.map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    {item.productId?.images?.[0] && (
                      <img 
                        src={item.productId.images[0]} 
                        alt={item.title}
                        className="w-16 h-16 object-cover rounded" 
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              {/* Footer: Total + View Details */}
              <div className="flex justify-between items-center pt-4 border-t">
                <div>
                  {order.discount > 0 && (
                    <p className="text-sm text-green-600">Discount: -{formatPrice(order.discount)}</p>
                  )}
                  <p className="text-lg font-bold">Total: {formatPrice(order.totalPrice)}</p>
                </div>
                <Button className="bg-orange-600 text-white hover:bg-orange-700">
                  View Details
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
