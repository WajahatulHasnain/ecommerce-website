import React, { useState } from "react";
import { Outlet, Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from '../../context/AuthContext';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
    { name: 'Products', href: '/admin/products', icon: '📦' },
    { name: 'Orders', href: '/admin/orders', icon: '🛍️' },
    { name: 'Users', href: '/admin/users', icon: '👥' },
    { name: 'Coupons', href: '/admin/coupons', icon: '🎫' },
    { name: 'Analytics', href: '/admin/analytics', icon: '📈' },
    { name: 'Settings', href: '/admin/settings', icon: '⚙️' }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user || user.role !== 'admin') return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-warm-cream flex">
      {/* Sidebar */}
      <div className={`bg-warm-white shadow-lg border-r border-warm-gray-100 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-16'}`}>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <h1 className={`font-bold text-xl text-warm-gray-800 ${!sidebarOpen && 'hidden'}`}>
              Admin Panel
            </h1>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-warm-gray-50 text-etsy-orange"
            >
              {sidebarOpen ? '←' : '→'}
            </button>
          </div>
        </div>

        <nav className="mt-8">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-4 py-3 mx-2 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-etsy-orange text-white shadow-md' 
                    : 'text-warm-gray-700 hover:bg-warm-gray-50 hover:text-etsy-orange'
                }`}
              >
                <span className="text-2xl mr-3">{item.icon}</span>
                <span className={`${!sidebarOpen && 'hidden'}`}>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-warm-white shadow-sm border-b border-warm-gray-100 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold text-warm-gray-800">
                {navigation.find(nav => nav.href === location.pathname)?.name || 'Admin Panel'}
              </h2>
              <p className="text-warm-gray-600">Manage your ecommerce platform</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-medium text-warm-gray-800">{user?.name}</p>
                <p className="text-sm text-warm-gray-600">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-etsy-orange text-white px-4 py-2 rounded-lg hover:bg-etsy-orange-dark transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 bg-warm-cream">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
