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
import CustomerProfile from "./pages/customer/CustomerProfile";

function Navigation() {
  const { user, logout } = useAuth();
  const location = useLocation();
  
  // Hide navigation on auth pages and customer pages (CustomerLayout handles its own nav)
  const authPages = [
    '/login', '/signup', '/auth'
  ];
  const isAuthPage = authPages.includes(location.pathname);
  const isCustomerPage = location.pathname.startsWith('/customer');
  
  if (isAuthPage || isCustomerPage) return null;
  
  return (
    <header className="nav-primary">
      <div className="container-custom">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-etsy-orange to-etsy-orange-dark rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <span className="text-xl font-bold text-warm-gray-900">Ecommerce Store</span>
          </Link>
          
          <nav className="flex items-center space-x-6">
            {/* Always show Products for everyone */}
            <Link 
              to="/products" 
              className={`nav-link ${
                location.pathname === '/products' ? 'nav-link-active' : ''
              }`}
            >
              🛍️ Products
            </Link>
            
            {!user ? (
              // Guest user navigation
              <>
                <span className="text-warm-gray-500 text-sm">👤 Guest Mode</span>
                <Link to="/auth" className="nav-link">
                  Sign In
                </Link>
                <Link to="/auth" className="btn-primary">
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
                      className={`text-gray-600 hover:text-blue-600 transition-colors font-medium ${
                        location.pathname.includes('/customer/dashboard') ? 'text-blue-600 font-semibold' : ''
                      }`}
                    >
                      🏠 Dashboard
                    </Link>
                    <Link 
                      to="/customer/cart" 
                      className={`text-gray-600 hover:text-blue-600 transition-colors font-medium ${
                        location.pathname.includes('/customer/cart') ? 'text-blue-600 font-semibold' : ''
                      }`}
                    >
                      🛒 Cart
                    </Link>
                    <Link 
                      to="/customer/orders" 
                      className={`nav-link ${
                        location.pathname.includes('/customer/orders') ? 'nav-link-active' : ''
                      }`}
                    >
                      📋 Orders
                    </Link>
                    <Link 
                      to="/customer/wishlist" 
                      className={`nav-link ${
                        location.pathname.includes('/customer/wishlist') ? 'nav-link-active' : ''
                      }`}
                    >
                      ❤️ Wishlist
                    </Link>
                  </>
                )}
                
                {user.role === 'admin' && (
                  <Link 
                    to="/admin/dashboard" 
                    className={`nav-link ${
                      location.pathname.includes('/admin') ? 'text-lavender font-semibold' : ''
                    }`}
                  >
                    ⚙️ Admin Panel
                  </Link>
                )}
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      user.role === 'admin' ? 'bg-lavender' : 'bg-sage-green'
                    }`}></div>
                    <span className="text-warm-gray-600">
                      <span className="font-medium">{user.name}</span>
                      <span className="text-sm text-warm-gray-400 ml-1">({user.role})</span>
                    </span>
                  </div>
                  <Link 
                    to={user.role === 'customer' ? '/customer/profile' : '/admin/settings'}
                    className="nav-link"
                  >
                    👤 Profile
                  </Link>
                  <button
                    onClick={logout}
                    className="text-etsy-orange-dark hover:text-etsy-orange transition-colors font-medium"
                  >
                    🚪 Logout
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
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/products" replace />} />
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
            <Route index element={<CustomerDashboard />} />
            <Route path="dashboard" element={<CustomerDashboard />} />
            <Route path="products" element={<CustomerProducts />} />
            <Route path="cart" element={<CustomerCart />} />
            <Route path="orders" element={<CustomerOrders />} />
            <Route path="wishlist" element={<CustomerWishlist />} />
            <Route path="profile" element={<CustomerProfile />} />
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
