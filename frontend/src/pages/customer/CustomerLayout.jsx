import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function CustomerLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', href: '/customer/dashboard', icon: '🏠' },
    { name: 'Products', href: '/customer/products', icon: '🛍️' },
    { name: 'Cart', href: '/customer/cart', icon: '🛒' },
    { name: 'Orders', href: '/customer/orders', icon: '📋' },
    { name: 'Wishlist', href: '/customer/wishlist', icon: '❤️' },
    { name: 'Profile', href: '/customer/profile', icon: '👤' }
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
    <div className="customer-layout">
      {/* Top Navigation */}
      <header className="nav-primary">
        <div className="container-custom">
          <div className="flex justify-between items-center h-12 sm:h-14 md:h-16">
            <div className="flex items-center space-x-4 md:space-x-8">
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

              {/* Mobile Menu Button */}
              <button
                className="lg:hidden p-1 sm:p-2 text-warm-gray-600 hover:text-etsy-orange"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <span className="text-lg sm:text-xl">☰</span>
              </button>
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

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-warm-gray-100">
            <nav className="px-4 py-4 space-y-1 sm:space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="nav-link flex items-center space-x-2 sm:space-x-3 px-3 py-2 rounded-xl text-sm sm:text-base"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="customer-content">
        <Outlet />
      </main>
    </div>
  );
}
