import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Card from "../components/ui/Card";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      errors.email = "Please enter a valid email address with @ symbol";
    }
    
    if (!formData.password.trim()) {
      errors.password = "Password is required";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = e => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError("");
    
    // Clear specific field validation error when user types
    if (validationErrors[e.target.name]) {
      setValidationErrors(prev => ({
        ...prev,
        [e.target.name]: ""
      }));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('🔐 Attempting login...');
      const res = await api.post("/auth/login", formData);
      
      if (res.data.success) {
        login(res.data.token, res.data.user);
        
        // ✅ Enhanced: Redirect customers to products page instead of dashboard
        const redirectTo = location.state?.from?.pathname ||
          (res.data.user.role === 'admin' ? '/admin/dashboard' : '/customer/products');
        
        console.log(`✅ Login successful, redirecting ${res.data.user.role} to:`, redirectTo);
        navigate(redirectTo, { replace: true });
      } else {
        setError(res.data.msg || "Login failed");
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      setError(err.response?.data?.msg || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-etsy-cream via-sage-light to-dusty-rose-light px-4 py-12">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-etsy-orange/10 to-warm-blue/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gradient-to-br from-sage/10 to-dusty-rose/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative max-w-md w-full space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-gradient-to-br from-etsy-orange via-etsy-orange-dark to-warm-blue rounded-3xl flex items-center justify-center mb-6 shadow-large transform hover:scale-105 transition-transform duration-300">
            <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-warm-gray-800 via-etsy-orange to-warm-blue bg-clip-text text-transparent mb-3">Welcome Back</h1>
          <p className="text-warm-gray-600 text-lg">Sign in to continue your shopping journey</p>
        </div>
        
        {/* Login Form */}
        <Card variant="elevated" className="p-8 shadow-xl border-0 bg-white/95 backdrop-blur-sm rounded-3xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Success/Error Messages */}
            {location.state?.message && (
              <div className="bg-gradient-to-r from-sage-light to-sage/20 border border-sage/30 text-sage-dark px-6 py-4 rounded-2xl text-sm font-medium">
                <div className="flex items-center">
                  <span className="text-lg mr-2">✅</span>
                  {location.state.message}
                </div>
              </div>
            )}

            {error && (
              <div className="bg-gradient-to-r from-red-50 to-dusty-rose-light border border-dusty-rose/30 text-red-700 px-6 py-4 rounded-2xl text-sm font-medium">
                <div className="flex items-center">
                  <span className="text-lg mr-2">⚠️</span>
                  {error}
                </div>
              </div>
            )}
            
            {/* Email Input */}
            <div className="space-y-2">
              <Input
                variant="modern"
                label="Email Address"
                type="email"
                name="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleChange}
                error={validationErrors.email}
                required
                className="transition-all duration-300 rounded-2xl border-warm-gray-200 focus:border-etsy-orange focus:ring-etsy-orange/20"
                icon={
                  <svg className="h-5 w-5 text-warm-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                }
              />
            </div>
            
            {/* Password Input */}
            <div className="space-y-2">
              <Input
                variant="modern"
                label="Password"
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                error={validationErrors.password}
                required
                className="transition-all duration-300 rounded-2xl border-warm-gray-200 focus:border-etsy-orange focus:ring-etsy-orange/20"
                icon={
                  <svg className="h-5 w-5 text-warm-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                }
              />
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-sm text-etsy-orange hover:text-etsy-orange-dark font-medium transition-colors hover:underline"
              >
                Forgot your password?
              </Link>
            </div>
            
            {/* Login Button */}
            <Button
              variant="primary"
              type="submit"
              className="w-full bg-gradient-to-r from-etsy-orange via-etsy-orange-dark to-warm-blue hover:from-etsy-orange-dark hover:via-warm-blue hover:to-lavender text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] shadow-medium hover:shadow-large"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing you in...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <span className="mr-2">🔐</span>
                  Sign In
                </div>
              )}
            </Button>
            
            {/* OR Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-warm-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-warm-gray-500 font-medium">OR</span>
              </div>
            </div>
            
            {/* Guest Mode Button - Prominent */}
            <Link
              to="/customer/products"
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center space-x-3"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-lg">Browse as Guest</span>
              <span className="text-2xl">🛍️</span>
            </Link>
            
            {/* Signup Link */}
            <div className="text-center pt-6 border-t border-warm-gray-100">
              <span className="text-warm-gray-600">New to our platform? </span>
              <Link
                to="/signup"
                className="text-etsy-orange hover:text-etsy-orange-dark font-semibold transition-colors hover:underline"
              >
                Create Account
              </Link>
            </div>
          </form>
        </Card>

        {/* Info */}
        <div className="text-center">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-warm-gray-100">
            <p className="text-sm text-warm-gray-600 font-medium">
              🛡️ Secure authentication • 🛍️ Shopping made easy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
