import { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function CustomerOrders() {
  const [orders] = useState([
    {
      id: 'ORD-001',
      date: '2024-01-15',
      status: 'delivered',
      total: 299.99,
      items: [
        { name: 'Wireless Headphones', quantity: 1, price: 99.99 },
        { name: 'Phone Case', quantity: 2, price: 100.00 }
      ]
    },
    {
      id: 'ORD-002',
      date: '2024-01-20',
      status: 'shipped',
      total: 159.50,
      items: [
        { name: 'USB Cable', quantity: 3, price: 159.50 }
      ]
    },
    {
      id: 'ORD-003',
      date: '2024-01-22',
      status: 'pending',
      total: 89.99,
      items: [
        { name: 'Smartphone Stand', quantity: 1, price: 89.99 }
      ]
    }
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
        <p className="text-gray-600">Track your order history and status</p>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id} className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <h3 className="text-lg font-semibold">Order {order.id}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <span>Order Date: {new Date(order.date).toLocaleDateString()}</span>
                  <span className="ml-4">Total: ${order.total}</span>
                </div>
              </div>
              <Button className="bg-blue-600 text-white mt-4 lg:mt-0">
                View Details
              </Button>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Items ({order.items.length})</h4>
              <div className="space-y-2">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                      <span className="font-medium">{item.name}</span>
                      <span className="text-gray-500 ml-2">x{item.quantity}</span>
                    </div>
                    <span className="font-semibold">${item.price}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
