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
  const [selectedOrder, setSelectedOrder] = useState(null);
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
              {/* Simplified Preview: Only Product Title + Total */}
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">Order #{order.displayOrderId || order._id.slice(-8).toUpperCase()}</h3>
                  <div className="space-y-1">
                    {order.products?.slice(0, 2).map((item, i) => (
                      <p key={i} className="text-gray-600 text-sm">
                        {item.title} {item.quantity > 1 && `(x${item.quantity})`}
                      </p>
                    ))}
                    {order.products?.length > 2 && (
                      <p className="text-gray-500 text-sm">
                        +{order.products.length - 2} more item{order.products.length - 2 > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="text-right ml-4">
                  <div className="text-xl font-bold text-gray-900 mb-2">
                    {formatPrice(order.totalPrice)}
                  </div>
                  <Button 
                    onClick={() => setSelectedOrder(order)}
                    className="bg-orange-600 text-white hover:bg-orange-700"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-start mb-6 pb-4 border-b">
                <div>
                  <h2 className="text-2xl font-bold">Order Details</h2>
                  <p className="text-gray-500">Order #{selectedOrder.displayOrderId || selectedOrder._id.slice(-8).toUpperCase()}</p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Order Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Order Information</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Order Date:</span> {new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                    <p><span className="font-medium">Status:</span> 
                      <span className={`ml-2 px-3 py-1 rounded-full text-sm ${getStatusColor(selectedOrder.status)}`}>
                        {selectedOrder.status}
                      </span>
                    </p>
                    <p><span className="font-medium">Payment Method:</span> {selectedOrder.paymentMethod || 'Card'}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Shipping Address</h3>
                  <div className="text-gray-600">
                    <p>{selectedOrder.shippingAddress?.name || 'N/A'}</p>
                    <p>{selectedOrder.shippingAddress?.street || 'N/A'}</p>
                    <p>{selectedOrder.shippingAddress?.city || 'N/A'}, {selectedOrder.shippingAddress?.state || 'N/A'} {selectedOrder.shippingAddress?.zipCode || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Products */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Order Items</h3>
                <div className="space-y-4">
                  {selectedOrder.products?.map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                      {item.productId?.images?.[0] && (
                        <img 
                          src={item.productId.images[0]} 
                          alt={item.title}
                          className="w-20 h-20 object-cover rounded-lg" 
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium text-lg">{item.title}</h4>
                        <p className="text-gray-500">Quantity: {item.quantity}</p>
                        <p className="text-gray-500">Unit Price: {formatPrice(item.price)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t pt-4">
                <div className="max-w-md ml-auto space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatPrice((selectedOrder.totalPrice + (selectedOrder.discount || 0)))}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span>-{formatPrice(selectedOrder.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>{formatPrice(selectedOrder.totalPrice)}</span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <Button
                  onClick={() => setSelectedOrder(null)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Close
                </Button>
                {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                  <Button className="px-6 py-2 bg-red-600 text-white hover:bg-red-700">
                    Cancel Order
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
