import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import SnapShopLogo from '../../components/SnapShopLogo';

export default function CustomerLayout() {
  // Get sidebar state from localStorage or default to false
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('customerSidebarOpen');
    return saved ? JSON.parse(saved) : false;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Persist sidebar state to localStorage when it changes
  const handleSidebarToggle = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem('customerSidebarOpen', JSON.stringify(newState));
  };

  const navigation = [
    { name: 'Dashboard', href: '/customer/dashboard', icon: '🏠' },
    { name: 'Products', href: '/customer/products', icon: '🛍️' },
    { name: 'Cart', href: '/customer/cart', icon: '🛒' },
    { name: 'Orders', href: '/customer/orders', icon: '📋' },
    { name: 'Wishlist', href: '/customer/wishlist', icon: '❤️' }
  ];

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/customer/products?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <div className="customer-layout min-h-screen bg-warm-cream flex flex-col">
      {/* Top Navigation - Keep intact */}
      <header className="nav-primary">
        <div className="container-custom">
          <div className="flex justify-between items-center h-12 sm:h-14 md:h-16">
            <div className="flex items-center space-x-4 md:space-x-8">
              {/* Simple Menu Button - Upper Left */}
              <button
                onClick={handleSidebarToggle}
                className="p-2 rounded-md hover:bg-warm-gray-50 transition-colors"
                title="Toggle Menu"
              >
                <svg className="w-6 h-6 text-etsy-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              <SnapShopLogo className="h-8 w-8 sm:h-10 sm:w-10" textClassName="text-lg sm:text-xl" />
              
              {/* Desktop Navigation */}
              <nav className="hidden lg:flex space-x-4 xl:space-x-6">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center space-x-1 xl:space-x-2 px-2 xl:px-3 py-2 rounded-xl transition-colors text-sm ${
                        isActive
                          ? 'nav-link-active'
                          : 'nav-link'
                      }`}
                    >
                      <span>{item.icon}</span>
                      <span className="font-medium hidden xl:inline">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Search Bar */}
              <div className="hidden md:block">
                <form onSubmit={handleSearchSubmit}>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search..."
                    className="input-search w-32 lg:w-48 xl:w-64 text-sm"
                  />
                </form>
              </div>

              {/* User Menu */}
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="text-right hidden xl:block">
                  <p className="font-medium text-warm-gray-800 text-sm truncate max-w-32">{user?.name}</p>
                  <p className="text-xs text-warm-gray-600 truncate max-w-32">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-etsy-orange-dark text-white px-2 sm:px-3 md:px-4 py-1 sm:py-2 rounded-xl hover:bg-etsy-orange transition-colors text-xs sm:text-sm"
                >
                  <span className="hidden sm:inline">Logout</span>
                  <span className="sm:hidden">Exit</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden bg-white border-t border-warm-gray-100 px-4 py-2">
          <form onSubmit={handleSearchSubmit}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products..."
              className="input-search w-full text-sm"
            />
          </form>
        </div>
      </header>

      {/* Main Layout with Sidebar */}
      <div className="flex flex-1 relative">
        {/* Sidebar */}
        <div className={`bg-warm-white shadow-lg border-r border-warm-gray-100 transition-all duration-300 ${
          // Mobile: 20% width when open, hidden when closed
          // Desktop: Fixed width sidebar
          sidebarOpen 
            ? 'fixed left-0 top-[48px] sm:top-[56px] md:top-[64px] bottom-0 z-50 w-[20%] min-w-[150px] lg:relative lg:top-0 lg:w-64' 
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
                  {user?.name?.charAt(0) || 'C'}
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
        <main className={`flex-1 customer-content transition-all duration-300 ${
          sidebarOpen ? 'md:ml-0' : ''
        }`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
