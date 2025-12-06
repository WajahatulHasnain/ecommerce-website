import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

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
  const [isNavigating, setIsNavigating] = useState(false);
  const { login, adminLogin } = useAuth();

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Enhanced Password validation with individual requirements
  const validatePassword = (password) => {
    const requirements = {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSymbols: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };
    
    const metCount = Object.values(requirements).filter(Boolean).length;
    const isStrong = metCount === 5; // All requirements must be met
    
    return {
      requirements,
      isStrong,
      strength: isStrong ? 'strong' : metCount >= 3 ? 'medium' : 'weak'
    };
  };

  const validateForm = () => {
    const errors = {};
    
    if (!isLogin && !formData.name.trim()) {
      errors.name = "Full name is required";
    }
    
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      errors.email = "Please enter a valid email address";
    }
    
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (!isLogin) {
      const passwordCheck = validatePassword(formData.password);
      if (!passwordCheck.isStrong) {
        errors.password = "Password must meet all requirements for strong security";
      }
    }
    
    if (!isLogin && formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors({ ...validationErrors, [name]: "" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError("");

    try {
      let response;
      const email = formData.email.toLowerCase().trim();
      
      if (isLogin) {
        // Single authentication endpoint for both admin and customer
        response = await api.post("/auth/login", {
          email: formData.email,
          password: formData.password,
        });
      } else {
        // Signup (customers only)
        response = await api.post("/auth/signup", {
          name: formData.name,
          email: formData.email,
          password: formData.password,
        });
      }

      if (response.data.success) {
        const { token, user } = response.data;
        
        // Store token and update context  
        if (user.role === 'admin') {
          localStorage.setItem('adminToken', token);
          adminLogin(token, user);
          navigate('/admin/dashboard');
        } else {
          localStorage.setItem('token', token);
          login(token, user);
          navigate('/customer/products');
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(
        err.response?.data?.msg || 
        err.response?.data?.message || 
        err.response?.data?.error || 
        'Authentication failed. Please check your credentials.'
      );
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
    <div className={`min-h-screen bg-warm-cream flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-opacity duration-300 ${isNavigating ? 'opacity-0' : 'opacity-100'}`}>
      <div className="max-w-md w-full space-y-8">
        
        {/* Simple Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-etsy-orange rounded-full flex items-center justify-center mb-6">
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isLogin ? "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" : "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"} />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-warm-gray-900 mb-2">
            {isLogin ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="text-warm-gray-600 text-sm">
            {isLogin ? 'Sign in to your account' : 'Join us today and start shopping'}
          </p>
        </div>

        {/* Clean Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Success/Error Messages */}
          {location.state?.message && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4">
              <div className="flex">
                <span className="text-green-400 mr-3">✓</span>
                <p className="text-green-700 text-sm">{location.state.message}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <span className="text-red-400 mr-3">!</span>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}
          
          {/* Name Field (Signup only) */}
          {!isLogin && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-warm-gray-700 mb-2">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required={!isLogin}
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-etsy-orange focus:border-etsy-orange transition-colors ${
                  validationErrors.name ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {validationErrors.name && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
              )}
            </div>
          )}
          
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-warm-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="your@email.com"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-etsy-orange focus:border-etsy-orange transition-colors ${
                validationErrors.email ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {validationErrors.email && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-warm-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-etsy-orange focus:border-etsy-orange transition-colors ${
                validationErrors.password ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {validationErrors.password && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
            )}
            
            {/* Password Requirements (Signup only) */}
            {!isLogin && formData.password && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-600">Password Requirements:</span>
                  <div className={`px-2 py-1 text-xs rounded ${
                    passwordValidation.isStrong ? 'bg-green-100 text-green-800' :
                    passwordValidation.strength === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {passwordValidation.strength}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className={`flex items-center text-xs ${
                    passwordValidation.requirements.minLength ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    <span className="mr-2">{passwordValidation.requirements.minLength ? '✓' : '○'}</span>
                    At least 8 characters
                  </div>
                  <div className={`flex items-center text-xs ${
                    passwordValidation.requirements.hasUpperCase ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    <span className="mr-2">{passwordValidation.requirements.hasUpperCase ? '✓' : '○'}</span>
                    One uppercase letter (A-Z)
                  </div>
                  <div className={`flex items-center text-xs ${
                    passwordValidation.requirements.hasLowerCase ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    <span className="mr-2">{passwordValidation.requirements.hasLowerCase ? '✓' : '○'}</span>
                    One lowercase letter (a-z)
                  </div>
                  <div className={`flex items-center text-xs ${
                    passwordValidation.requirements.hasNumbers ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    <span className="mr-2">{passwordValidation.requirements.hasNumbers ? '✓' : '○'}</span>
                    One number (0-9)
                  </div>
                  <div className={`flex items-center text-xs ${
                    passwordValidation.requirements.hasSymbols ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    <span className="mr-2">{passwordValidation.requirements.hasSymbols ? '✓' : '○'}</span>
                    One symbol (!@#$%^&*)
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Field (Signup only) */}
          {!isLogin && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-warm-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required={!isLogin}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-etsy-orange focus:border-etsy-orange transition-colors ${
                  validationErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {validationErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.confirmPassword}</p>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || (!isLogin && formData.password && !passwordValidation.isStrong)}
            className={`w-full font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              (!isLogin && formData.password && !passwordValidation.isStrong) 
                ? 'bg-gray-300 text-gray-500' 
                : 'bg-etsy-orange hover:bg-etsy-orange-dark text-white'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                {isLogin ? 'Signing in...' : 'Creating account...'}
              </div>
            ) : (
              <>
                {isLogin ? 'Sign in' : 'Create account'}
                {!isLogin && formData.password && !passwordValidation.isStrong && (
                  <span className="block text-xs mt-1 opacity-75">Complete all password requirements</span>
                )}
              </>
            )}
          </button>
        </form>

        {/* Switch Mode */}
        <div className="text-center">
          <p className="text-sm text-warm-gray-600">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            {' '}
            <button
              type="button"
              onClick={switchMode}
              className="font-medium text-etsy-orange hover:text-etsy-orange-dark transition-colors"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

        {/* Guest Mode Links */}
        <div className="pt-6 border-t border-warm-gray-200">
          <p className="text-center text-sm font-medium text-warm-gray-600 mb-4">Want to browse first?</p>
          <button
            type="button"
            onClick={() => {
              setIsNavigating(true);
              setTimeout(() => navigate('/'), 300);
            }}
            disabled={isNavigating}
            className={`w-full bg-gradient-to-r from-etsy-orange to-etsy-orange-light hover:from-etsy-orange-dark hover:to-etsy-orange text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center space-x-3 group disabled:opacity-75 ${isNavigating ? 'opacity-50' : ''}`}
          >
            <svg className={`w-6 h-6 group-hover:scale-110 transition-transform duration-300 ${isNavigating ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <div className={`flex flex-col items-start transition-opacity duration-300 ${isNavigating ? 'opacity-75' : ''}`}>
              <span className="text-base">{isNavigating ? 'Loading...' : 'Continue as Guest'}</span>
              <span className="text-xs opacity-90">{isNavigating ? 'Redirecting' : 'Browse products instantly'}</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}