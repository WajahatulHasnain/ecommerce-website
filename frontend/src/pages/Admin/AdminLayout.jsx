import React, { useState } from "react";
import { Outlet, Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from '../../context/AuthContext';

export default function AdminLayout() {
  // Get sidebar state from localStorage or default to false
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('adminSidebarOpen');
    return saved ? JSON.parse(saved) : false;
  });
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Persist sidebar state to localStorage when it changes
  const handleSidebarToggle = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem('adminSidebarOpen', JSON.stringify(newState));
  };

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
    <div className="min-h-screen bg-warm-cream flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <div className="lg:hidden bg-warm-white shadow-sm border-b border-warm-gray-100 p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <h1 className="font-bold text-lg sm:text-xl text-warm-gray-800">
            Admin Panel
          </h1>
          <button
            onClick={handleSidebarToggle}
            className="p-2 rounded-lg hover:bg-warm-gray-50 text-etsy-orange text-lg sm:text-xl"
          >
            ☰
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div className={`bg-warm-white shadow-lg border-r border-warm-gray-100 transition-all duration-300 ${
        // Mobile: Full overlay when open, hidden when closed
        // Desktop: Fixed width sidebar
        sidebarOpen 
          ? 'fixed inset-0 z-50 w-full lg:relative lg:w-64 lg:inset-auto' 
          : 'hidden lg:block lg:w-16'
      }`}>
        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div 
            className="lg:hidden absolute inset-0 bg-black/50 z-40"
            onClick={handleSidebarToggle}
          />
        )}
        
        {/* Sidebar content */}
        <div className={`relative z-50 bg-warm-white h-full ${
          sidebarOpen ? 'w-64' : 'lg:w-16'
        } transition-all duration-300`}>
          <div className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <h1 className={`font-bold text-lg sm:text-xl text-warm-gray-800 ${
                !sidebarOpen && 'lg:hidden'
              }`}>
                Admin Panel
              </h1>
              <button
                onClick={handleSidebarToggle}
                className="p-1.5 sm:p-2 rounded-lg hover:bg-warm-gray-50 text-etsy-orange"
              >
                {sidebarOpen ? '←' : '→'}
              </button>
            </div>
          </div>

        <nav className="mt-4 sm:mt-8">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-3 sm:px-4 py-2 sm:py-3 mx-2 rounded-lg transition-colors text-sm sm:text-base ${
                  isActive 
                    ? 'bg-etsy-orange text-white shadow-md' 
                    : 'text-warm-gray-700 hover:bg-warm-gray-50 hover:text-etsy-orange'
                }`}
              >
                <span className="text-lg sm:text-2xl mr-2 sm:mr-3">{item.icon}</span>
                <span className={`${!sidebarOpen && 'lg:hidden'}`}>{item.name}</span>
              </Link>
            );
          })}
        </nav>
        
        {/* User info and logout - moved to bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 border-t border-warm-gray-100">
          <div className={`flex items-center space-x-3 mb-2 sm:mb-3 ${
            !sidebarOpen && 'lg:justify-center'
          }`}>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-lavender rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm sm:text-base">
                {user?.name?.charAt(0) || 'A'}
              </span>
            </div>
            {sidebarOpen && (
              <div className="flex-1">
                <p className="font-medium text-warm-gray-800 text-sm sm:text-base truncate">
                  {user?.name}
                </p>
                <p className="text-xs sm:text-sm text-warm-gray-500 truncate">
                  {user?.email}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={`w-full bg-etsy-orange hover:bg-etsy-orange-dark text-white font-medium py-2 rounded-lg transition-colors duration-200 text-sm sm:text-base ${
              !sidebarOpen && 'lg:px-2'
            }`}
          >
            {sidebarOpen ? 'Logout' : '🚪'}
          </button>
        </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-warm-white shadow-sm border-b border-warm-gray-100 px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-warm-gray-800">
                {navigation.find(nav => nav.href === location.pathname)?.name || 'Admin Panel'}
              </h2>
              <p className="text-sm sm:text-base text-warm-gray-600 hidden sm:block">Manage your ecommerce platform</p>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="text-right hidden md:block">
                <p className="font-medium text-warm-gray-800 text-sm sm:text-base">{user?.name}</p>
                <p className="text-xs sm:text-sm text-warm-gray-600">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-etsy-orange text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-etsy-orange-dark transition-colors text-sm sm:text-base"
              >
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">🚪</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 bg-warm-cream overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
