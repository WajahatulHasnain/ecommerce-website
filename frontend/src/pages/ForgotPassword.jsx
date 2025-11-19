import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Card from "../components/ui/Card";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/send-reset-code", { email });
      
      // Store email in sessionStorage for next step
      sessionStorage.setItem('resetEmail', email);
      
      // Handle development mode
      if (res.data.devMode && res.data.devCode) {
        sessionStorage.setItem('devCode', res.data.devCode);
      }
      
      // Redirect to verify code page
      navigate("/verify-code", { 
        state: { 
          email,
          message: res.data.msg,
          devMode: res.data.devMode,
          devCode: res.data.devCode
        } 
      });
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to send reset code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Forgot Password</h1>
          <p className="mt-2 text-gray-600">Enter your email to receive a verification code</p>
        </div>
        
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <Input
              label="Email Address"
              type="email"
              name="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !email.trim()}
            >
              {loading ? "Sending Code..." : "Send Verification Code"}
            </Button>
            
            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-blue-600 hover:text-blue-500 font-medium transition-colors"
              >
                Back to Customer Login
              </button>
              <br />
              <button
                type="button"
                onClick={() => navigate("/admin/login")}
                className="text-purple-600 hover:text-purple-500 font-medium transition-colors"
              >
                Back to Admin Login
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
