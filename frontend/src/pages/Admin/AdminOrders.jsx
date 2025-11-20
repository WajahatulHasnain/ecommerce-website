import { useState, useEffect } from 'react';
import api from '../../utils/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

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
        setOrders(orders.map(order => 
          order._id === orderId ? { ...order, status: newStatus } : order
        ));
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
      alert('Failed to update order status');
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
          <div className="text-sm text-gray-500">
            Total Orders: <span className="font-semibold text-gray-900">{orders.length}</span>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.length > 0 ? (
          orders.map((order) => (
            <Card key={order._id} className="p-6 hover:shadow-lg transition-shadow border-l-4 border-blue-500">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1">
                  {/* Order Header */}
                  <div className="flex items-center gap-4 mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Order{order.orderNumber || order._id.slice(-4)}</h3>
                      <p className="text-sm text-gray-500">Order ID</p>
                    </div>
                    <div className={`px-3 py-2 rounded-lg border text-sm font-semibold flex items-center gap-2 ${getStatusColor(order.status)}`}>
                      <span>{getStatusIcon(order.status)}</span>
                      {order.status.toUpperCase()}
                    </div>
                  </div>
                  
                  {/* Order Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase font-semibold">Customer</p>
                      <p className="text-sm font-medium text-gray-900">{order.customerInfo?.name || 'N/A'}</p>
                      <p className="text-xs text-gray-600">{order.customerInfo?.email || ''}</p>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase font-semibold">Total Amount</p>
                      <p className="text-lg font-bold text-green-600">${order.totalPrice?.toFixed(2) || '0.00'}</p>
                      {order.discount > 0 && (
                        <p className="text-xs text-gray-600">Discount: -${order.discount.toFixed(2)}</p>
                      )}
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase font-semibold">Order Date</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                      <p className="text-xs text-gray-600">
                        {new Date(order.createdAt).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase font-semibold">Items</p>
                      <p className="text-sm font-medium text-gray-900">
                        {order.products?.length || 0} item(s)
                      </p>
                      <p className="text-xs text-gray-600">
                        {order.products?.reduce((total, item) => total + item.quantity, 0) || 0} total qty
                      </p>
                    </div>
                  </div>

                  {/* Quick Product Preview */}
                  {order.products && order.products.length > 0 && (
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xs text-gray-500 font-semibold">PRODUCTS:</span>
                      <div className="flex gap-2 overflow-x-auto">
                        {order.products.slice(0, 3).map((product, index) => (
                          <div key={index} className="flex-shrink-0 bg-white border rounded p-2 min-w-0">
                            <p className="text-xs font-medium text-gray-900 truncate" style={{maxWidth: '120px'}}>
                              {product.title}
                            </p>
                            <p className="text-xs text-gray-600">Qty: {product.quantity}</p>
                          </div>
                        ))}
                        {order.products.length > 3 && (
                          <div className="flex-shrink-0 bg-gray-100 border rounded p-2 flex items-center">
                            <span className="text-xs text-gray-600">+{order.products.length - 3} more</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 mt-4 lg:mt-0 lg:ml-6">
                  {order.status === 'pending' && (
                    <Button
                      onClick={() => updateOrderStatus(order._id, 'processing')}
                      className="bg-blue-600 text-white text-sm px-4 py-2 hover:bg-blue-700"
                    >
                      🔄 Mark Processing
                    </Button>
                  )}
                  
                  {order.status === 'processing' && (
                    <Button
                      onClick={() => updateOrderStatus(order._id, 'shipped')}
                      className="bg-purple-600 text-white text-sm px-4 py-2 hover:bg-purple-700"
                    >
                      🚚 Mark Shipped
                    </Button>
                  )}
                  
                  {order.status === 'shipped' && (
                    <Button
                      onClick={() => updateOrderStatus(order._id, 'delivered')}
                      className="bg-green-600 text-white text-sm px-4 py-2 hover:bg-green-700"
                    >
                      ✅ Mark Delivered
                    </Button>
                  )}
                  
                  <Button 
                    onClick={() => viewOrderDetails(order)}
                    className="bg-gray-600 text-white text-sm px-4 py-2 hover:bg-gray-700"
                  >
                    📋 View Details
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600">Orders will appear here once customers place them</p>
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
                  Order Details Order{selectedOrder.orderNumber || selectedOrder._id.slice(-4)}
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
                      <span className="font-mono">{selectedOrder.orderNumber ? `Order${selectedOrder.orderNumber}` : selectedOrder._id}</span>
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
