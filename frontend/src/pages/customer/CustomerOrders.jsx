import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useSettings } from '../../context/SettingsContext';

export default function CustomerOrders() {
  const { formatPrice } = useSettings();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter orders when status filter or orders change
  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(order => order.status === statusFilter));
    }
  }, [orders, statusFilter]);

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
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return '⏳';
      case 'processing': return '🔄';
      case 'shipped': return '🚚';
      case 'delivered': return '✅';
      case 'cancelled': return '❌';
      default: return '📦';
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-600">
            {orders.length > 0 ? `You have ${orders.length} order${orders.length !== 1 ? 's' : ''}` : 'Track your order history and status'}
          </p>
        </div>
        <div className="text-sm text-gray-500">
          Total Orders: <span className="font-semibold text-gray-900">{orders.length}</span>
        </div>
      </div>

      {/* Filter Bar */}
      {orders.length > 0 && (
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Filter by Status</h3>
          <div className="flex flex-wrap gap-2">
            {[
              { status: 'all', label: 'All Orders', icon: '📦' },
              { status: 'pending', label: 'Pending', icon: '⏳' },
              { status: 'processing', label: 'Processing', icon: '🔄' },
              { status: 'shipped', label: 'Shipped', icon: '🚚' },
              { status: 'delivered', label: 'Delivered', icon: '✅' },
              { status: 'cancelled', label: 'Cancelled', icon: '❌' }
            ].map(({ status, label, icon }) => {
              const count = status === 'all' ? orders.length : orders.filter(order => order.status === status).length;
              return (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors flex items-center gap-2 ${
                    statusFilter === status
                      ? 'bg-orange-600 text-white border-orange-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span>{icon}</span>
                  {label}
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                    statusFilter === status
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

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
      ) : filteredOrders.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No {statusFilter} orders
          </h3>
          <p className="text-gray-600">
            No orders with {statusFilter} status found
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredOrders.map((order) => (
            <Card key={order._id} className="p-4 hover:shadow-lg transition-shadow border-l-4 border-orange-500 flex flex-col">
              {/* Order Header */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900 truncate flex-1 mr-2">
                  #{order.displayOrderId || order._id.slice(-8).toUpperCase()}
                </h3>
                <div className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 border whitespace-nowrap ${getStatusColor(order.status)}`}>
                  <span>{getStatusIcon(order.status)}</span>
                  {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                </div>
              </div>
              
              {/* Order Summary */}
              <div className="space-y-2 mb-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Total:</span>
                  <span className="text-sm font-bold text-green-600">{formatPrice(order.totalPrice)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Items:</span>
                  <span className="text-xs text-gray-700">{order.products?.length || 0} product(s)</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Payment:</span>
                  <span className="text-xs text-orange-600 whitespace-nowrap">
                    {order.paymentMethod === 'cod' ? '💵 COD' : 
                     order.paymentMethod === 'credit_card' ? '💳 Card' : '💵 COD'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Date:</span>
                  <span className="text-xs text-gray-700 whitespace-nowrap">
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
              
              {/* Product Preview */}
              <div className="mb-3 flex-1 min-h-[3.5rem]">
                {order.products && order.products.length > 0 && (
                  <>
                    <div className="text-xs text-gray-500 mb-1">Products:</div>
                    <div className="space-y-1">
                      {order.products.slice(0, 2).map((item, index) => (
                        <div key={index} className="text-xs text-gray-700 truncate">
                          {item.title} {item.quantity > 1 && `(x${item.quantity})`}
                        </div>
                      ))}
                      {order.products.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{order.products.length - 2} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
              
              {/* Action Button */}
              <Button 
                onClick={() => setSelectedOrder(order)}
                className="w-full bg-orange-600 text-white text-xs py-2 hover:bg-orange-700 mt-auto"
              >
                📋 View Details
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-start mb-4 sm:mb-6 pb-3 sm:pb-4 border-b">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold">Order Details</h2>
                  <p className="text-sm sm:text-base text-gray-500">Order #{selectedOrder.displayOrderId || selectedOrder._id.slice(-8).toUpperCase()}</p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Order Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-3">Order Information</h3>
                  <div className="space-y-2 text-sm sm:text-base">
                    <p><span className="font-medium">Order Date:</span> {new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                    <p><span className="font-medium">Status:</span> 
                      <span className={`ml-2 px-3 py-1 rounded-full text-sm ${getStatusColor(selectedOrder.status)}`}>
                        {selectedOrder.status}
                      </span>
                    </p>
                    <p><span className="font-medium">Payment Method:</span> 
                      <span className={`ml-2 px-3 py-1 rounded-full text-sm ${
                        selectedOrder.paymentMethod === 'cod' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {selectedOrder.paymentMethod === 'cod' ? '💵 Cash on Delivery' : 
                         selectedOrder.paymentMethod === 'credit_card' ? '💳 Credit Card' : 
                         selectedOrder.paymentMethod?.replace('_', ' ').toUpperCase() || '💵 Cash on Delivery'
                        }
                      </span>
                    </p>
                    <p><span className="font-medium">Payment Status:</span> 
                      <span className={`ml-2 px-3 py-1 rounded-full text-sm ${
                        selectedOrder.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                        selectedOrder.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedOrder.paymentStatus === 'pending' ? '⏳ Payment Pending' : 
                         selectedOrder.paymentStatus === 'completed' ? '✅ Paid' : 
                         selectedOrder.paymentStatus?.charAt(0).toUpperCase() + selectedOrder.paymentStatus?.slice(1)
                        }
                      </span>
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-3">Shipping Address</h3>
                  <div className="text-gray-600 text-sm sm:text-base">
                    {selectedOrder.customerInfo?.address ? (
                      <>
                        <p>{selectedOrder.customerInfo.address.street || 'N/A'}</p>
                        <p>{selectedOrder.customerInfo.address.city || 'N/A'}{selectedOrder.customerInfo.address.state ? `, ${selectedOrder.customerInfo.address.state}` : ''} {selectedOrder.customerInfo.address.zipCode || ''}</p>
                        {selectedOrder.customerInfo.address.country && <p>{selectedOrder.customerInfo.address.country}</p>}
                      </>
                    ) : selectedOrder.shippingAddress ? (
                      <>
                        <p>{selectedOrder.shippingAddress.street || 'N/A'}</p>
                        <p>{selectedOrder.shippingAddress.city || 'N/A'}{selectedOrder.shippingAddress.state ? `, ${selectedOrder.shippingAddress.state}` : ''} {selectedOrder.shippingAddress.zipCode || ''}</p>
                        {selectedOrder.shippingAddress.country && <p>{selectedOrder.shippingAddress.country}</p>}
                      </>
                    ) : (
                      <p>N/A</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Products */}
              <div className="mb-6">
                <h3 className="text-base sm:text-lg font-semibold mb-4">Order Items</h3>
                <div className="space-y-3 sm:space-y-4">
                  {selectedOrder.products?.map((item, i) => (
                    <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg">
                      {item.productId?.images?.[0] && (
                        <img 
                          src={item.productId.images[0]} 
                          alt={item.title}
                          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg flex-shrink-0" 
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm sm:text-lg truncate">{item.title}</h4>
                        <p className="text-xs sm:text-sm text-gray-500">Quantity: {item.quantity}</p>
                        <p className="text-xs sm:text-sm text-gray-500">Unit Price: {formatPrice(item.price)}</p>
                      </div>
                      <div className="text-left sm:text-right w-full sm:w-auto">
                        <p className="text-base sm:text-lg font-semibold">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t pt-4">
                <div className="max-w-md sm:ml-auto space-y-2">
                  <div className="flex justify-between text-sm sm:text-base">
                    <span>Subtotal:</span>
                    <span>{formatPrice((selectedOrder.totalPrice + (selectedOrder.discount || 0)))}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-green-600 text-sm sm:text-base">
                      <span>Discount:</span>
                      <span>-{formatPrice(selectedOrder.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg sm:text-xl font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>{formatPrice(selectedOrder.totalPrice)}</span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <Button
                  onClick={() => setSelectedOrder(null)}
                  className="px-8 py-3 bg-etsy-orange text-white hover:bg-etsy-orange-dark transition-colors font-medium rounded-lg"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
