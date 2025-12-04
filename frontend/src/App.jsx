import React from "react";
import { Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SettingsProvider } from "./context/SettingsContext";
import { GuestProvider } from "./context/GuestContext";
import { AdminRoute, CustomerRoute } from "./components/ProtectedRoute";
import AuthRequiredModal from "./components/AuthRequiredModal";

// Auth pages
import AuthPage from "./pages/AuthPage";

// Admin pages
import AdminLayout from "./pages/Admin/AdminLayout";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminProducts from "./pages/Admin/AdminProducts";
import AdminOrders from "./pages/Admin/AdminOrders";
import AdminUsers from "./pages/Admin/AdminUsers";
import AdminCoupons from "./pages/Admin/AdminCoupons";
import AdminAnalytics from "./pages/Admin/AdminAnalytics";
import AdminSettings from "./pages/Admin/AdminSettings";

// Customer pages
import CustomerLayout from "./pages/customer/CustomerLayout";
import CustomerDashboard from "./pages/customer/CustomerDashboard";
import CustomerProducts from "./pages/customer/CustomerProducts";
import CustomerCart from "./pages/customer/CustomerCart";
import CustomerOrders from "./pages/customer/CustomerOrders";
import CustomerWishlist from "./pages/customer/CustomerWishlist";

function Navigation() {
  const { user, logout } = useAuth();
  const location = useLocation();
  
  // Hide navigation on auth pages, customer pages, and admin pages (they have their own layouts)
  const authPages = [
    '/login', '/signup', '/auth'
  ];
  const isAuthPage = authPages.includes(location.pathname);
  const isCustomerPage = location.pathname.startsWith('/customer');
  const isAdminPage = location.pathname.startsWith('/admin');
  
  if (isAuthPage || isCustomerPage || isAdminPage) return null;
  
  return (
    <header className="nav-primary">
      <div className="container-custom">
        <div className="flex justify-between items-center h-12 sm:h-14 md:h-16">
          <Link to="/" className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-gradient-to-r from-etsy-orange to-etsy-orange-dark rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs sm:text-sm">E</span>
            </div>
            <span className="text-lg sm:text-xl font-bold text-warm-gray-900 truncate">Ecommerce Store</span>
          </Link>
          
          <nav className="flex items-center space-x-2 sm:space-x-4 md:space-x-6">
            {/* Products link - different behavior based on user role */}
            {user?.role === 'admin' ? (
              <Link 
                to="/admin/products" 
                className={`nav-link text-xs sm:text-sm md:text-base hidden sm:inline-flex ${
                  location.pathname === '/admin/products' ? 'nav-link-active' : ''
                }`}
              >
                <span className="hidden md:inline">📦 </span>Products
              </Link>
            ) : (
              <Link 
                to="/products" 
                className={`nav-link text-xs sm:text-sm md:text-base hidden sm:inline-flex ${
                  location.pathname === '/products' ? 'nav-link-active' : ''
                }`}
              >
                <span className="hidden md:inline">🛍️ </span>Products
              </Link>
            )}
            
            {!user ? (
              // Guest user navigation
              <>
                <span className="text-warm-gray-500 text-xs sm:text-sm hidden md:block">👤 Guest</span>
                <Link to="/auth?mode=signin" className="nav-link text-xs sm:text-sm">
                  Sign In
                </Link>
                <Link to="/auth?mode=signup" className="btn-primary text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2">
                  Sign Up
                </Link>
              </>
            ) : (
              // Authenticated user navigation
              <>
                {user.role === 'customer' && (
                  <>
                    <Link 
                      to="/customer/dashboard" 
                      className={`text-gray-600 hover:text-blue-600 transition-colors font-medium text-xs sm:text-sm hidden md:block ${
                        location.pathname.includes('/customer/dashboard') ? 'text-blue-600 font-semibold' : ''
                      }`}
                    >
                      <span className="hidden lg:inline">🏠 </span>Dashboard
                    </Link>
                    <Link 
                      to="/customer/cart" 
                      className={`text-gray-600 hover:text-blue-600 transition-colors font-medium text-xs sm:text-sm ${
                        location.pathname.includes('/customer/cart') ? 'text-blue-600 font-semibold' : ''
                      }`}
                    >
                      <span className="hidden sm:inline">🛒 </span><span className="sm:hidden">Cart</span><span className="hidden sm:inline">Cart</span>
                    </Link>
                    <Link 
                      to="/customer/orders" 
                      className={`nav-link text-xs sm:text-sm hidden md:block ${
                        location.pathname.includes('/customer/orders') ? 'nav-link-active' : ''
                      }`}
                    >
                      <span className="hidden lg:inline">📋 </span>Orders
                    </Link>
                    <Link 
                      to="/customer/wishlist" 
                      className={`nav-link text-xs sm:text-sm hidden lg:block ${
                        location.pathname.includes('/customer/wishlist') ? 'nav-link-active' : ''
                      }`}
                    >
                      <span className="hidden xl:inline">❤️ </span>Wishlist
                    </Link>
                  </>
                )}
                
                {user.role === 'admin' && (
                  <Link 
                    to="/admin/dashboard" 
                    className={`nav-link text-xs sm:text-sm hidden sm:block ${
                      location.pathname.includes('/admin') ? 'text-lavender font-semibold' : ''
                    }`}
                  >
                    <span className="hidden md:inline">⚙️ </span>Admin
                  </Link>
                )}
                
                <div className="flex items-center space-x-2 md:space-x-4">
                  <div className="flex items-center space-x-1 sm:space-x-2 hidden md:flex">
                    <div className={`w-2 h-2 rounded-full ${
                      user.role === 'admin' ? 'bg-lavender' : 'bg-sage-green'
                    }`}></div>
                    <span className="text-warm-gray-600 hidden lg:block">
                      <span className="font-medium text-sm">{user.name}</span>
                      <span className="text-xs text-warm-gray-400 ml-1">({user.role})</span>
                    </span>
                  </div>
                  {user.role === 'admin' && (
                    <Link 
                      to="/admin/settings"
                      className="nav-link text-xs sm:text-sm hidden sm:block"
                    >
                      <span className="hidden md:inline">⚙️ </span>Settings
                    </Link>
                  )}
                  <button
                    onClick={logout}
                    className="text-etsy-orange-dark hover:text-etsy-orange transition-colors font-medium text-xs sm:text-sm"
                  >
                    <span className="hidden sm:inline">🚪 </span>Logout
                  </button>
                </div>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

function AppContent() {
  return (
    <GuestProvider>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main>
          <Routes>
          {/* Public Routes - Guest Mode */}
          <Route path="/" element={<CustomerProducts />} />
          <Route path="/products" element={<CustomerProducts />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/signup" element={<AuthPage />} />
          <Route path="/auth" element={<AuthPage />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* Customer Routes */}
          <Route path="/customer" element={
            <CustomerRoute>
              <CustomerLayout />
            </CustomerRoute>
          }>
            <Route index element={<CustomerProducts />} />
            <Route path="dashboard" element={<CustomerDashboard />} />
            <Route path="products" element={<CustomerProducts />} />
            <Route path="cart" element={<CustomerCart />} />
            <Route path="orders" element={<CustomerOrders />} />
            <Route path="wishlist" element={<CustomerWishlist />} />
          </Route>
        </Routes>
      </main>
      <AuthRequiredModal />
      </div>
    </GuestProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
