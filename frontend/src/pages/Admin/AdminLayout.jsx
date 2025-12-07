import React, { useState } from "react";
import { Outlet, Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from '../../context/AuthContext';
import SnapShopLogo from '../../components/SnapShopLogo';

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
          <div className="flex items-center gap-2">
            <SnapShopLogo className="h-8 w-8 sm:h-10 sm:w-10" textClassName="text-base sm:text-lg" />
            <span className="text-xs sm:text-sm text-warm-gray-600 font-medium">Admin</span>
          </div>
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
        // Mobile: 20% width when open, hidden when closed
        // Desktop: Fixed width sidebar
        sidebarOpen 
          ? 'fixed left-0 top-0 bottom-0 z-50 w-[20%] min-w-[150px] lg:relative lg:w-64' 
          : 'hidden lg:block lg:w-16'
      }`}>
        {/* No backdrop on mobile to keep content visible */}
        {sidebarOpen && (
          <div 
            className="hidden lg:block absolute inset-0 bg-black/50 z-40"
            onClick={handleSidebarToggle}
          />
        )}
        
        {/* Sidebar content */}
        <div className={`relative z-50 bg-warm-white h-full ${
          sidebarOpen ? 'w-full lg:w-64' : 'lg:w-16'
        } transition-all duration-300`}>
          <div className="p-2 lg:p-3">
            <div className="flex items-center justify-between">
              <h1 className={`font-bold text-xs lg:text-sm text-warm-gray-800 truncate ${
                !sidebarOpen && 'lg:hidden'
              }`}>
                <span className="text-etsy-orange">Snap</span><span className="text-warm-blue">Shop</span>
              </h1>
              <button
                onClick={handleSidebarToggle}
                className="p-1 lg:p-1.5 rounded-lg hover:bg-warm-gray-50 text-etsy-orange flex-shrink-0"
              >
                <span className="text-sm lg:text-base">{sidebarOpen ? '←' : '→'}</span>
              </button>
            </div>
          </div>

        <nav className="mt-2 lg:mt-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex flex-col lg:flex-row items-center px-1 lg:px-3 py-2 lg:py-3 mx-1 lg:mx-2 rounded-lg transition-colors text-xs lg:text-sm ${
                  isActive 
                    ? 'bg-etsy-orange text-white shadow-md' 
                    : 'text-warm-gray-700 hover:bg-warm-gray-50 hover:text-etsy-orange'
                }`}
              >
                <span className="text-base lg:text-2xl mb-1 lg:mb-0 lg:mr-2">{item.icon}</span>
                <span className={`text-[10px] lg:text-sm truncate w-full text-center lg:text-left ${!sidebarOpen && 'lg:hidden'}`}>{item.name}</span>
              </Link>
            );
          })}
        </nav>
        
        {/* User info and logout - moved to bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-2 lg:p-3 border-t border-warm-gray-100">
          <div className={`flex flex-col lg:flex-row items-center lg:space-x-3 mb-2 lg:mb-3 ${
            !sidebarOpen && 'lg:justify-center'
          }`}>
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-lavender rounded-full flex items-center justify-center mb-1 lg:mb-0">
              <span className="text-white font-bold text-xs lg:text-base">
                {user?.name?.charAt(0) || 'A'}
              </span>
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0 text-center lg:text-left">
                <p className="font-medium text-warm-gray-800 text-[10px] lg:text-sm truncate">
                  {user?.name}
                </p>
                <p className="text-[8px] lg:text-xs text-warm-gray-500 truncate">
                  {user?.email}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={`w-full bg-etsy-orange hover:bg-etsy-orange-dark text-white font-medium py-1.5 lg:py-2 rounded-lg transition-colors duration-200 text-xs lg:text-sm ${
              !sidebarOpen && 'lg:px-2'
            }`}
          >
            {sidebarOpen ? <span className="hidden lg:inline">Logout</span> : '🚪'}
            {sidebarOpen && <span className="lg:hidden">Out</span>}
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
