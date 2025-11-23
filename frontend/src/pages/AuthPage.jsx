import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Card from "../components/ui/Card";

export default function AuthPage() {
  // Check URL parameters for auth mode
  const navigate = useNavigate();
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const mode = urlParams.get('mode');
  
  const [isLogin, setIsLogin] = useState(mode !== 'signup');
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const { login } = useAuth();

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Password validation
  const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSymbols = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    const score = [minLength, hasUpperCase, hasLowerCase, hasNumbers, hasSymbols].filter(Boolean).length;
    
    if (score < 3) return { isValid: false, strength: 'weak' };
    if (score < 4) return { isValid: true, strength: 'medium' };
    return { isValid: true, strength: 'strong' };
  };

  const validateForm = () => {
    const errors = {};
    
    if (!isLogin && !formData.name.trim()) {
      errors.name = "Name is required";
    }
    
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      errors.email = "Please enter a valid email address";
    }
    
    if (!formData.password.trim()) {
      errors.password = "Password is required";
    } else if (!isLogin && !validatePassword(formData.password).isValid) {
      errors.password = "Password must be at least 8 characters with mixed-case letters, numbers, and symbols";
    }
    
    if (!isLogin && formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/signup";
      const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : { name: formData.name, email: formData.email, password: formData.password };
      
      console.log(`${isLogin ? '🔐' : '📝'} Attempting ${isLogin ? 'login' : 'signup'}...`);
      
      const res = await api.post(endpoint, payload);
      
      if (res.data.success) {
        login(res.data.token, res.data.user);
        
        // Enhanced redirect logic - Admin auto-redirect to dashboard
        let redirectTo;
        if (res.data.user.role === 'admin') {
          redirectTo = '/admin/dashboard';
        } else {
          redirectTo = location.state?.from?.pathname || '/products';
        }
        
        console.log(`✅ ${isLogin ? 'Login' : 'Signup'} successful, redirecting ${res.data.user.role} to:`, redirectTo);
        navigate(redirectTo, { replace: true });
      } else {
        setError(res.data.msg || `${isLogin ? 'Login' : 'Registration'} failed`);
      }
    } catch (err) {
      console.error(`❌ ${isLogin ? 'Login' : 'Signup'} error:`, err);
      setError(err.response?.data?.msg || `${isLogin ? 'Invalid email or password' : 'Registration failed. Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setFormData({ name: "", email: "", password: "", confirmPassword: "" });
    setError("");
    setValidationErrors({});
  };

  const passwordValidation = validatePassword(formData.password);

  return (
    <div className="auth-container">
      {/* Background Decorations */}
      <div className="auth-background-decoration">
        <div className="absolute -top-12 sm:-top-24 -right-12 sm:-right-24 w-48 h-48 sm:w-96 sm:h-96 bg-gradient-to-br from-etsy-orange/10 to-etsy-orange-light/10 rounded-full blur-2xl sm:blur-3xl"></div>
        <div className="absolute -bottom-12 sm:-bottom-24 -left-12 sm:-left-24 w-48 h-48 sm:w-96 sm:h-96 bg-gradient-to-br from-sage-green/10 to-warm-blue/10 rounded-full blur-2xl sm:blur-3xl"></div>
      </div>
      
      <div className="relative max-w-xs sm:max-w-md w-full space-y-4 sm:space-y-6 md:space-y-8">
        
        {/* Header */}
        <div className="auth-header">
          <div className="auth-icon">
            <svg className="h-8 w-8 sm:h-10 sm:w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isLogin ? "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" : "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"} />
            </svg>
          </div>
          <h1 className="auth-title text-xl sm:text-2xl md:text-3xl">
            {isLogin ? 'Welcome Back' : 'Join Us Today'}
          </h1>
          <p className="auth-subtitle text-sm sm:text-base">
            {isLogin ? 'Sign in to continue your shopping journey' : 'Create your account and start shopping'}
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="auth-toggle">
          <button
            type="button"
            onClick={() => !isLogin && switchMode()}
            className={`auth-toggle-btn ${
              isLogin ? 'active' : 'inactive'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => isLogin && switchMode()}
            className={`auth-toggle-btn ${
              !isLogin ? 'active' : 'inactive'
            }`}
          >
            Sign Up
          </button>
        </div>
        
        {/* Auth Form */}
        <Card variant="elevated" className="auth-card">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Success/Error Messages */}
            {location.state?.message && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-700 px-6 py-4 rounded-2xl text-sm font-medium">
                <div className="flex items-center">
                  <span className="text-lg mr-2">✅</span>
                  {location.state.message}
                </div>
              </div>
            )}

            {error && (
              <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 text-red-700 px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl md:rounded-2xl text-xs sm:text-sm font-medium">
                <div className="flex items-center">
                  <span className="text-base sm:text-lg mr-2">⚠️</span>
                  {error}
                </div>
              </div>
            )}
            
            {/* Name Input (Signup only) */}
            {!isLogin && (
              <div className="space-y-2">
                <Input
                  variant="modern"
                  label="Full Name"
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  error={validationErrors.name}
                  required
                  className="auth-input"
                  icon={
                    <svg className="h-5 w-5 text-warm-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  }
                />
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
                className="auth-input"
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
                placeholder={isLogin ? "Enter your password" : "Create a secure password"}
                value={formData.password}
                onChange={handleChange}
                error={validationErrors.password}
                required
                className="auth-input"
                icon={
                  <svg className="h-5 w-5 text-warm-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                }
              />

              {/* Password Requirements (Signup only) */}
              {!isLogin && formData.password && (
                <div className="bg-gradient-to-r from-warm-gray-50 to-warm-cream rounded-xl p-3 mt-2">
                  <p className="text-xs font-semibold text-warm-gray-600 mb-2">Password Requirements:</p>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div className={`flex items-center ${formData.password.length >= 8 ? 'text-green-600' : 'text-warm-gray-400'}`}>
                      <span className="mr-1">{formData.password.length >= 8 ? '✅' : '⚪'}</span>
                      8+ characters
                    </div>
                    <div className={`flex items-center ${/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-warm-gray-400'}`}>
                      <span className="mr-1">{/[A-Z]/.test(formData.password) ? '✅' : '⚪'}</span>
                      Uppercase
                    </div>
                    <div className={`flex items-center ${/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-warm-gray-400'}`}>
                      <span className="mr-1">{/[a-z]/.test(formData.password) ? '✅' : '⚪'}</span>
                      Lowercase
                    </div>
                    <div className={`flex items-center ${/\d/.test(formData.password) ? 'text-green-600' : 'text-warm-gray-400'}`}>
                      <span className="mr-1">{/\d/.test(formData.password) ? '✅' : '⚪'}</span>
                      Numbers
                    </div>
                  </div>
                  <div className={`mt-2 text-xs font-medium ${
                    passwordValidation.strength === 'strong' ? 'text-green-600' :
                    passwordValidation.strength === 'medium' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    Password Strength: {passwordValidation.strength.toUpperCase()}
                    {passwordValidation.strength === 'strong' && ' 💪'}
                    {passwordValidation.strength === 'medium' && ' 👍'}
                    {passwordValidation.strength === 'weak' && ' ⚠️'}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password (Signup only) */}
            {!isLogin && (
              <div className="space-y-2">
                <Input
                  variant="modern"
                  label="Confirm Password"
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={validationErrors.confirmPassword}
                  required
                  className="auth-input"
                  icon={
                    <svg className="h-5 w-5 text-warm-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                />
              </div>
            )}

            {/* Account Type Info (Signup only) */}
            {!isLogin && (
              <div className="auth-info-card">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-etsy-orange to-etsy-orange-dark rounded-xl flex items-center justify-center">
                    <span className="text-2xl">🛍️</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-warm-gray-800">Customer Account</p>
                    <p className="text-xs text-warm-gray-600">Browse products, make purchases, and manage orders</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Submit Button */}
            <Button
              variant="primary"
              type="submit"
              className="auth-submit-btn"
              disabled={loading || (!isLogin && formData.password !== formData.confirmPassword)}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isLogin ? 'Signing you in...' : 'Creating your account...'}
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <span className="mr-2">{isLogin ? '🔐' : '🚀'}</span>
                  {isLogin ? 'Sign In' : 'Create Account'}
                </div>
              )}
            </Button>
            
            {/* Switch Mode Link */}
            <div className="text-center pt-6 border-t border-warm-gray-100">
              <span className="text-warm-gray-600">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
              </span>
              <button
                type="button"
                onClick={switchMode}
                className="text-etsy-orange hover:text-etsy-orange-dark font-semibold transition-colors hover:underline"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </div>
          </form>
        </Card>

        {/* Info */}
        <div className="text-center">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-gray-100">
            <p className="text-sm text-gray-600 font-medium">
              🛡️ Secure authentication • 🛍️ Shopping made easy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}