import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function CustomerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Vertical sidebar state
  const [searchTerm, setSearchTerm] = useState('');
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

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
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-md hover:bg-warm-gray-50 transition-colors"
                title="Toggle Menu"
              >
                <svg className="w-6 h-6 text-etsy-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              <h1 className="text-lg sm:text-xl font-bold text-warm-gray-900 truncate">Ecommerce Store</h1>
              
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
        {/* Vertical Sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/50"
              onClick={() => setSidebarOpen(false)}
            />
            
            {/* Sidebar Content */}
            <div className="relative w-64 h-full bg-warm-white shadow-lg border-r border-warm-gray-200 animate-slideIn">
              {/* Sidebar Header */}
              <div className="flex items-center justify-between p-4 border-b border-warm-gray-200 bg-warm-cream">
                <h3 className="font-semibold text-lg text-warm-gray-800">Menu</h3>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-md hover:bg-warm-gray-100 text-etsy-orange"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Sidebar Navigation */}
              <nav className="p-4 space-y-1">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-md transition-colors duration-200 ${
                        isActive 
                          ? 'bg-etsy-orange text-white font-medium' 
                          : 'text-warm-gray-700 hover:bg-warm-gray-50 hover:text-etsy-orange'
                      }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Sidebar Footer */}
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-warm-gray-200 bg-warm-cream">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-etsy-orange rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {user?.name?.charAt(0) || 'C'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-warm-gray-800 text-sm truncate">
                      {user?.name}
                    </p>
                    <p className="text-xs text-warm-gray-600 truncate">
                      Customer
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSidebarOpen(false);
                    handleLogout();
                  }}
                  className="w-full bg-etsy-orange hover:bg-etsy-orange-dark text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 text-sm"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}

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
