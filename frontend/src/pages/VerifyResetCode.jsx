import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../utils/api";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Card from "../components/ui/Card";

export default function VerifyResetCode() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Get email from navigation state or session storage
    const emailFromState = location.state?.email;
    const emailFromSession = sessionStorage.getItem('resetEmail');
    
    if (emailFromState) {
      setEmail(emailFromState);
    } else if (emailFromSession) {
      setEmail(emailFromSession);
    } else {
      navigate('/forgot-password');
    }

    // Handle development mode
    if (location.state?.devMode && location.state?.devCode) {
      setCode(location.state.devCode);
    }
  }, [location.state, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/verify-reset-code", { email, code });
      
      // Store reset token for next step
      sessionStorage.setItem('resetToken', res.data.resetToken);
      
      // Redirect to reset password page
      navigate("/reset-password", { 
        state: { 
          email,
          resetToken: res.data.resetToken
        } 
      });
    } catch (err) {
      setError(err.response?.data?.msg || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError("");
    setLoading(true);

    try {
      await api.post("/auth/send-reset-code", { email });
      setError("");
      // Show success message or handle as needed
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to resend code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-cyan-100 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Verify Code</h1>
          <p className="mt-2 text-gray-600">
            Enter the 6-digit code sent to <br />
            <span className="font-medium">{email}</span>
          </p>
        </div>
        
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {location.state?.message && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                {location.state.message}
              </div>
            )}
            
            <Input
              label="Verification Code"
              type="text"
              name="code"
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              className="text-center text-2xl font-mono tracking-widest"
              required
            />
            
            <Button
              type="submit"
              className="w-full"
              disabled={loading || code.length !== 6}
            >
              {loading ? "Verifying..." : "Verify Code"}
            </Button>

            <div className="text-center">
              <span className="text-gray-600">Didn't receive the code? </span>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={loading}
                className="text-blue-600 hover:text-blue-500 font-medium transition-colors disabled:opacity-50"
              >
                Resend Code
              </button>
            </div>
            
            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                ← Use different email
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
