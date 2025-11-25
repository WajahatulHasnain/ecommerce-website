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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-etsy-orange rounded-2xl flex items-center justify-center mb-4 shadow-sm">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>
        
        {/* Login Form */}
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Success/Error Messages */}
            {location.state?.message && (
              <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md text-sm">
                <div className="flex items-center">
                  <span className="mr-2">✓</span>
                  {location.state.message}
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
                <div className="flex items-center">
                  <span className="mr-2">!</span>
                  {error}
                </div>
              </div>
            )}
            
            {/* Email Input */}
            <div>
              <Input
                label="Email Address"
                type="email"
                name="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleChange}
                error={validationErrors.email}
                required
              />
            </div>
            
            {/* Password Input */}
            <div>
              <Input
                label="Password"
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                error={validationErrors.password}
                required
              />
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-sm text-etsy-orange hover:text-etsy-orange-dark hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            
            {/* Login Button */}
            <Button
              type="submit"
              className="w-full bg-etsy-orange hover:bg-etsy-orange-dark text-white font-medium py-3 rounded-md transition-colors"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </div>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
          
          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>
          
          {/* Guest Mode Button */}
          <Link
            to="/customer/products"
            className="w-full block text-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-md transition-colors"
          >
            Continue as Guest
          </Link>
          
          {/* Signup Link */}
          <div className="text-center mt-6">
            <span className="text-gray-600">New here? </span>
            <Link
              to="/signup"
              className="text-etsy-orange hover:text-etsy-orange-dark font-medium hover:underline"
            >
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
