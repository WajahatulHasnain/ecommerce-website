import React from "react";
import { Link } from "react-router-dom";

export default function AdminNav() {
  return (
    <nav className="bg-white p-4 shadow flex space-x-4">
      <Link to="/admin" className="font-semibold text-indigo-600">Dashboard</Link>
      <Link to="/admin/orders" className="text-gray-700">Orders</Link>
      <Link to="/admin/sales" className="text-gray-700">Sales</Link>
      <Link to="/admin/coupons" className="text-gray-700">Coupons</Link>
      <Link to="/admin/notifications" className="text-gray-700">Notifications</Link>
    </nav>
  );
}
