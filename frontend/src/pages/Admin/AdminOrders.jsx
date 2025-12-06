import { useState, useEffect } from 'react';
import api from '../../utils/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all'); // New filter state

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
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      const response = await api.get('/admin/orders', {
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

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      const response = await api.put(`/admin/orders/${orderId}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        // Update the order in state with both status and payment status
        setOrders(orders.map(order => 
          order._id === orderId ? {
            ...order, 
            status: newStatus,
            paymentStatus: newStatus === 'delivered' ? 'completed' : 
                          ['pending', 'processing', 'shipped'].includes(newStatus) ? 'pending' : order.paymentStatus
          } : order
        ));
        
        // Show success message with payment status update info
        if (newStatus === 'delivered') {
          alert(`Order marked as delivered! Payment status updated to 'Paid'.`);
        } else {
          alert(`Order status updated to ${newStatus}`);
        }
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
      alert('Failed to update order status');
    }
  };

  const migrateOrdersToCOD = async () => {
    if (window.confirm('This will update all existing orders to use COD payment method. Continue?')) {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
        const response = await api.post('/admin/orders/migrate-to-cod', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          alert(response.data.msg);
          fetchOrders(); // Refresh orders list
        }
      } catch (error) {
        console.error('Failed to migrate orders:', error);
        alert('Failed to migrate orders to COD');
      }
    }
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'processing': return '🔄';
      case 'shipped': return '🚚';
      case 'delivered': return '✅';
      case 'cancelled': return '❌';
      default: return '📦';
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
          <h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>
          <p className="text-gray-600 mt-1">Manage customer orders and track shipments</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={migrateOrdersToCOD}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
          >
            🔄 Migrate to COD
          </button>
          <div className="text-sm text-gray-500">
            Total Orders: <span className="font-semibold text-gray-900">{orders.length}</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
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
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span>{icon}</span>
                {label}
                <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                  statusFilter === status
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders Grid */}
      <div className="space-y-4">
        {filteredOrders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredOrders.map((order) => (
              <Card key={order._id} className="p-4 hover:shadow-lg transition-shadow border-l-4 border-blue-500 flex flex-col">
                {/* Order Header */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-900 truncate flex-1 mr-2">
                    #{order.orderId || `Order${order.orderNumber}` || order._id.slice(-4)}
                  </h3>
                  <div className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 whitespace-nowrap ${getStatusColor(order.status)}`}>
                    <span>{getStatusIcon(order.status)}</span>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </div>
                </div>
                
                {/* Customer Info */}
                <div className="mb-3 min-h-[2.5rem]">
                  <p className="text-sm font-medium text-gray-900 truncate">{order.customerInfo?.name || 'N/A'}</p>
                  <p className="text-xs text-gray-500 truncate">{order.customerInfo?.email || ''}</p>
                </div>
                
                {/* Order Summary */}
                <div className="space-y-2 mb-3 flex-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Total:</span>
                    <span className="text-sm font-bold text-green-600">${order.totalPrice?.toFixed(2) || '0.00'}</span>
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
                
                {/* Action Buttons */}
                <div className="space-y-2 mt-auto">
                  {order.status === 'pending' && (
                    <Button
                      onClick={() => updateOrderStatus(order._id, 'processing')}
                      className="w-full bg-blue-600 text-white text-xs py-2 hover:bg-blue-700"
                    >
                      🔄 Process
                    </Button>
                  )}
                  
                  {order.status === 'processing' && (
                    <Button
                      onClick={() => updateOrderStatus(order._id, 'shipped')}
                      className="w-full bg-purple-600 text-white text-xs py-2 hover:bg-purple-700"
                    >
                      🚚 Ship
                    </Button>
                  )}
                  
                  {order.status === 'shipped' && (
                    <Button
                      onClick={() => updateOrderStatus(order._id, 'delivered')}
                      className="w-full bg-green-600 text-white text-xs py-2 hover:bg-green-700"
                    >
                      ✅ Delivered
                    </Button>
                  )}
                  
                  <Button 
                    onClick={() => viewOrderDetails(order)}
                    className="w-full bg-gray-600 text-white text-xs py-2 hover:bg-gray-700"
                  >
                    📋 Details
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {statusFilter === 'all' ? 'No orders found' : `No ${statusFilter} orders`}
            </h3>
            <p className="text-gray-600">
              {statusFilter === 'all' 
                ? 'Orders will appear here once customers place them'
                : `No orders with ${statusFilter} status found`
              }
            </p>
          </Card>
        )}
      </div>

      {/* Order Details Modal */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Order Details {selectedOrder.orderId || `Order${selectedOrder.orderNumber}` || selectedOrder._id.slice(-4)}
                </h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Customer Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Customer Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Name:</span> {selectedOrder.customerInfo?.name}</div>
                    <div><span className="font-medium">Email:</span> {selectedOrder.customerInfo?.email}</div>
                    <div><span className="font-medium">Phone:</span> {selectedOrder.customerInfo?.phone}</div>
                    {selectedOrder.customerInfo?.address && (
                      <div>
                        <span className="font-medium">Address:</span>
                        <div className="ml-2 text-gray-600">
                          {selectedOrder.customerInfo.address.street}<br/>
                          {selectedOrder.customerInfo.address.city}, {selectedOrder.customerInfo.address.state}<br/>
                          {selectedOrder.customerInfo.address.zipCode}, {selectedOrder.customerInfo.address.country}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Order ID:</span>
                      <span className="font-mono">{selectedOrder.orderId || `Order${selectedOrder.orderNumber}` || selectedOrder._id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span>{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(selectedOrder.status)}`}>
                        {selectedOrder.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payment:</span>
                      <span className="text-green-600">{selectedOrder.paymentStatus || 'Completed'}</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Order Items */}
              <Card className="p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr className="text-left">
                        <th className="pb-2">Product</th>
                        <th className="pb-2">Price</th>
                        <th className="pb-2">Quantity</th>
                        <th className="pb-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.products?.map((item, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-3">
                            <div className="flex items-center gap-3">
                              {item.imageUrl && (
                                <img 
                                  src={item.imageUrl} 
                                  alt={item.title}
                                  className="w-12 h-12 object-cover rounded"
                                />
                              )}
                              <div>
                                <div className="font-medium">{item.title}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3">${item.price?.toFixed(2)}</td>
                          <td className="py-3">{item.quantity}</td>
                          <td className="py-3 font-semibold">${(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Order Totals */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex flex-col gap-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${selectedOrder.subtotal?.toFixed(2) || selectedOrder.totalPrice?.toFixed(2)}</span>
                    </div>
                    {selectedOrder.discount > 0 && (
                      <>
                        <div className="flex justify-between text-green-600">
                          <span>Discount {selectedOrder.coupon ? `(${selectedOrder.coupon.code})` : ''}:</span>
                          <span>-${selectedOrder.discount?.toFixed(2)}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span>${selectedOrder.totalPrice?.toFixed(2)}</span>
                    </div>
                    
                    {/* Payment Information */}
                    <div className="mt-4 pt-4 border-t bg-orange-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-orange-800">Payment Method:</span>
                        <span className="text-orange-600">
                          {selectedOrder.paymentMethod === 'cod' ? '💵 Cash on Delivery' : 
                           selectedOrder.paymentMethod === 'credit_card' ? '💳 Credit Card' : 
                           selectedOrder.paymentMethod?.replace('_', ' ').toUpperCase() || '💵 COD'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-orange-800">Payment Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          selectedOrder.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          selectedOrder.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedOrder.paymentStatus === 'pending' ? '⏳ Payment Pending' : 
                           selectedOrder.paymentStatus === 'completed' ? '✅ Paid' : 
                           selectedOrder.paymentStatus?.charAt(0).toUpperCase() + selectedOrder.paymentStatus?.slice(1)
                          }
                        </span>
                      </div>
                      {selectedOrder.paymentMethod === 'cod' && (
                        <div className="mt-2 text-xs text-orange-600">
                          💡 Customer will pay cash when the order is delivered
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              <div className="flex justify-end">
                <Button
                  onClick={() => setShowDetailModal(false)}
                  className="bg-gray-600 text-white hover:bg-gray-700"
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
