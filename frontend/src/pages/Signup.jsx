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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-etsy-orange rounded-2xl flex items-center justify-center mb-4 shadow-sm">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600">Sign up to start shopping</p>
        </div>
        
        {/* Signup Form */}
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Error Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
                <div className="flex items-center">
                  <span className="mr-2">!</span>
                  {error}
                </div>
              </div>
            )}
            
            {/* Name Input */}
            <div>
              <Input
                label="Full Name"
                type="text"
                name="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                error={validationErrors.name}
                required
              />
            </div>
            
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
                placeholder="Create a secure password"
                value={formData.password}
                onChange={handleChange}
                error={validationErrors.password}
                required
              />
              {/* Password Requirements */}
              <div className="bg-gray-50 rounded-md p-3 mt-2">
                <p className="text-xs font-medium text-gray-700 mb-2">Password requirements:</p>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div className={`flex items-center ${formData.password.length >= 8 ? 'text-green-600' : 'text-gray-400'}`}>
                    <span className="mr-1">{formData.password.length >= 8 ? '✓' : '○'}</span>
                    8+ characters
                  </div>
                  <div className={`flex items-center ${/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}`}>
                    <span className="mr-1">{/[A-Z]/.test(formData.password) ? '✓' : '○'}</span>
                    Uppercase
                  </div>
                  <div className={`flex items-center ${/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}`}>
                    <span className="mr-1">{/[a-z]/.test(formData.password) ? '✓' : '○'}</span>
                    Lowercase
                  </div>
                  <div className={`flex items-center ${/\d/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}`}>
                    <span className="mr-1">{/\d/.test(formData.password) ? '✓' : '○'}</span>
                    Numbers
                  </div>
                  <div className={`flex items-center col-span-2 ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}`}>
                    <span className="mr-1">{/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? '✓' : '○'}</span>
                    Special characters
                  </div>
                </div>
                {passwordStrength && (
                  <div className={`mt-2 text-xs font-medium ${
                    passwordStrength.strength === 'strong' ? 'text-green-600' :
                    passwordStrength.strength === 'medium' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {passwordStrength.message}
                  </div>
                )}
              </div>
            </div>
            
            {/* Confirm Password Input */}
            <div>
              <Input
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={validationErrors.confirmPassword}
                required
              />
            </div>
            
            {/* Signup Button */}
            <Button
              type="submit"
              className="w-full bg-etsy-orange hover:bg-etsy-orange-dark text-white font-medium py-3 rounded-md transition-colors mt-6"
              disabled={loading || formData.password !== formData.confirmPassword || !passwordStrength.isValid}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </div>
              ) : (
                "Create Account"
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
          
          {/* Login Link */}
          <div className="text-center mt-6">
            <span className="text-gray-600">Already have an account? </span>
            <Link
              to="/login"
              className="text-etsy-orange hover:text-etsy-orange-dark font-medium hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
