import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Card from "../components/ui/Card";

export default function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  // Enhanced validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.includes('@');
  };

  const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSymbols = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    const score = [minLength, hasUpperCase, hasLowerCase, hasNumbers, hasSymbols].filter(Boolean).length;
    
    if (score < 3) return { isValid: false, strength: 'weak', message: 'Password must be at least 8 characters with mixed-case letters, numbers, and symbols' };
    if (score < 4) return { isValid: true, strength: 'medium', message: 'Good password strength' };
    return { isValid: true, strength: 'strong', message: 'Strong password!' };
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    }
    
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      errors.email = "Please enter a valid email address with @ symbol";
    }
    
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.message;
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
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
    
    // Update password strength in real-time
    if (e.target.name === 'password') {
      const validation = validatePassword(e.target.value);
      setPasswordStrength(validation);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      console.log('📝 Attempting signup...');
      const res = await api.post("/auth/signup", {
        name: formData.name,
        email: formData.email,
        password: formData.password
        // Role is automatically set to "customer" in backend
      });
      
      if (res.data.success) {
        login(res.data.token, res.data.user);
        navigate('/customer/dashboard'); // Always redirect to customer dashboard
      } else {
        setError(res.data.msg || "Registration failed");
      }
    } catch (err) {
      console.error('❌ Signup error:', err);
      setError(err.response?.data?.msg || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sage-light via-etsy-cream to-dusty-rose-light px-4 py-12">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-gradient-to-br from-sage/10 to-etsy-orange/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-gradient-to-br from-dusty-rose/10 to-warm-blue/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative max-w-md w-full space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-gradient-to-br from-sage via-etsy-orange to-dusty-rose rounded-3xl flex items-center justify-center mb-6 shadow-large transform hover:scale-105 transition-transform duration-300">
            <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-warm-gray-800 via-sage to-etsy-orange bg-clip-text text-transparent mb-3">Join Our Community</h1>
          <p className="text-warm-gray-600 text-lg">Create your customer account and start shopping</p>
        </div>
        
        {/* Signup Form */}
        <Card variant="elevated" className="p-8 shadow-xl border-0 bg-white/95 backdrop-blur-sm rounded-3xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Error Messages */}
            {error && (
              <div className="bg-gradient-to-r from-red-50 to-dusty-rose-light border border-dusty-rose/30 text-red-700 px-6 py-4 rounded-2xl text-sm font-medium">
                <div className="flex items-center">
                  <span className="text-lg mr-2">⚠️</span>
                  {error}
                </div>
              </div>
            )}
            
            {/* Name Input */}
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
                className="transition-all duration-300 rounded-2xl border-warm-gray-200 focus:border-sage focus:ring-sage/20"
                icon={
                  <svg className="h-5 w-5 text-warm-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
              />
            </div>
            
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
                className="transition-all duration-300 rounded-2xl border-warm-gray-200 focus:border-sage focus:ring-sage/20"
                icon={
                  <svg className="h-5 w-5 text-warm-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                }
              />
              <p className="text-xs text-warm-gray-500 mt-1">📧 Must contain @ symbol</p>
            </div>
            
            {/* Password Input */}
            <div className="space-y-2">
              <Input
                variant="modern"
                label="Password"
                type="password"
                name="password"
                placeholder="Create a secure password"
                value={formData.password}
                onChange={handleChange}
                error={validationErrors.password}
                required
                className="transition-all duration-300 rounded-2xl border-warm-gray-200 focus:border-sage focus:ring-sage/20"
                icon={
                  <svg className="h-5 w-5 text-warm-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                }
              />
              {/* Password Requirements */}
              <div className="bg-gradient-to-r from-warm-gray-50 to-sage-light/20 rounded-xl p-3 mt-2">
                <p className="text-xs font-semibold text-warm-gray-600 mb-2">Password must include:</p>
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
                  <div className={`flex items-center col-span-2 ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? 'text-green-600' : 'text-warm-gray-400'}`}>
                    <span className="mr-1">{/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? '✅' : '⚪'}</span>
                    Symbols (!@#$%^&*)
                  </div>
                </div>
                {passwordStrength && (
                  <div className={`mt-2 text-xs font-medium ${
                    passwordStrength.strength === 'strong' ? 'text-green-600' :
                    passwordStrength.strength === 'medium' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {passwordStrength.strength === 'strong' && '💪'}
                    {passwordStrength.strength === 'medium' && '👍'}
                    {passwordStrength.strength === 'weak' && '⚠️'}
                    {' '}{passwordStrength.message}
                  </div>
                )}
              </div>
            </div>
            
            {/* Confirm Password Input */}
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
                className="transition-all duration-300 rounded-2xl border-warm-gray-200 focus:border-sage focus:ring-sage/20"
                icon={
                  <svg className="h-5 w-5 text-warm-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
            </div>
            
            {/* Account Type Info */}
            <div className="bg-gradient-to-r from-sage-light/30 to-etsy-orange-light/20 border border-sage/20 rounded-2xl p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-sage to-etsy-orange rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🛍️</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-warm-gray-800">Customer Account</p>
                  <p className="text-xs text-warm-gray-600">Browse products, make purchases, and manage your orders</p>
                </div>
              </div>
            </div>
            
            {/* Signup Button */}
            <Button
              variant="primary"
              type="submit"
              className="w-full bg-gradient-to-r from-sage via-etsy-orange to-dusty-rose hover:from-sage-dark hover:via-etsy-orange-dark hover:to-dusty-rose-dark text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] shadow-medium hover:shadow-large"
              disabled={loading || formData.password !== formData.confirmPassword || !passwordStrength.isValid}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating your account...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <span className="mr-2">🚀</span>
                  Create My Account
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
            
            {/* Login Link */}
            <div className="text-center pt-6 border-t border-warm-gray-100">
              <span className="text-warm-gray-600">Already have an account? </span>
              <Link
                to="/login"
                className="text-etsy-orange hover:text-etsy-orange-dark font-semibold transition-colors hover:underline"
              >
                Sign In
              </Link>
            </div>
          </form>
        </Card>

        {/* Info */}
        <div className="text-center">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-warm-gray-100">
            <p className="text-sm text-warm-gray-600 font-medium">
              🛡️ Secure registration • 🛍️ Start shopping immediately
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
