import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/api";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Card from "../../components/ui/Card";
import SnapShopLogo from "../../components/SnapShopLogo";

export default function AdminLogin() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { adminLogin } = useAuth();

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    
    try {
      console.log('Attempting admin login...');
      const res = await api.post("/admin/login", form);
      console.log('Admin login response:', res.data);
      
      if (res.data.success) {
        adminLogin(res.data.token, res.data.user);
        navigate("/admin/dashboard");
      } else {
        setError(res.data.msg || "Login failed");
      }
    } catch (err) {
      console.error('Admin login error:', err);
      const errorMsg = err.response?.data?.msg || "Login failed";
      console.log('Setting admin error message:', errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <SnapShopLogo className="h-16 w-16" textClassName="text-3xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Portal</h1>
          <p className="mt-2 text-gray-600">Sign in to access your dashboard</p>
        </div>
        
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="fixed top-4 right-4 z-[9999] animate-slide-in-right">
                <div className="bg-white border-l-4 border-red-500 shadow-2xl rounded-lg px-6 py-4 max-w-md min-w-[320px]">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className="text-sm font-semibold text-gray-900">Login Failed</h3>
                      <p className="mt-1 text-sm text-gray-700">{error}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        console.log('Closing admin error message');
                        setError("");
                      }}
                      className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                      type="button"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {location.state?.message && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                {location.state.message}
              </div>
            )}
            
            <Input
              label="Email Address"
              type="email"
              name="email"
              placeholder="admin@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
            
            <Input
              label="Password"
              type="password"
              name="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              required
            />

            <div className="text-right">
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-sm text-blue-600 hover:text-blue-500 transition-colors"
              >
                Forgot Password?
              </button>
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
            
            <div className="text-center">
              <span className="text-gray-600">New admin? </span>
              <button
                type="button"
                onClick={() => navigate("/admin/register")}
                className="text-blue-600 hover:text-blue-500 font-medium transition-colors"
              >
                Create Account
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
