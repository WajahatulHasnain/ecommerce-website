import React, { useEffect, useState } from "react";
import api from "../../utils/api";

export default function Orders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.get("/admin/orders").then(res => setOrders(res.data)).catch(() => {});
  }, []);

  const updateStatus = (id, status) => {
    api.put(`/admin/orders/${id}/status`, { status }).then(res => {
      setOrders(o => o.map(item => item._id === id ? res.data : item));
    });
  };

  const remove = (id) => {
    if (!confirm("Delete order?")) return;
    api.delete(`/admin/orders/${id}`).then(() => setOrders(o => o.filter(x => x._id !== id)));
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Orders</h2>
      <div className="bg-white rounded shadow">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">#</th>
              <th className="p-2 text-left">User</th>
              <th className="p-2 text-left">Total</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o._id} className="border-t">
                <td className="p-2">{o._id.slice(-6)}</td>
                <td className="p-2">{o.user?.name || o.user}</td>
                <td className="p-2">${o.total}</td>
                <td className="p-2">{o.status}</td>
                <td className="p-2 space-x-2">
                  <select defaultValue={o.status} onChange={(e)=> updateStatus(o._id, e.target.value)} className="border p-1 rounded">
                    <option value="pending">pending</option>
                    <option value="shipped">shipped</option>
                    <option value="completed">completed</option>
                    <option value="canceled">canceled</option>
                  </select>
                  <button onClick={()=> remove(o._id)} className="ml-2 text-red-600">Delete</button>
                </td>
              </tr>
            ))}
            {orders.length===0 && <tr><td className="p-4" colSpan="5">No orders</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
