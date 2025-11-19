import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../utils/api";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Card from "../components/ui/Card";

export default function ResetPassword() {
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Get email and token from navigation state or session storage
    const emailFromState = location.state?.email;
    const tokenFromState = location.state?.resetToken;
    const emailFromSession = sessionStorage.getItem('resetEmail');
    const tokenFromSession = sessionStorage.getItem('resetToken');
    
    if (emailFromState && tokenFromState) {
      setEmail(emailFromState);
      setResetToken(tokenFromState);
    } else if (emailFromSession && tokenFromSession) {
      setEmail(emailFromSession);
      setResetToken(tokenFromSession);
    } else {
      // No required data found, redirect to forgot password
      navigate('/forgot-password');
    }
  }, [location.state, navigate]);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError(""); // Clear error when user types
  };

  const validatePasswords = () => {
    if (formData.newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return false;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!validatePasswords()) return;
    
    setLoading(true);

    try {
      const res = await api.post("/auth/reset-password", {
        email,
        newPassword: formData.newPassword,
        resetToken
      });
      
      // Clear session storage
      sessionStorage.removeItem('resetEmail');
      sessionStorage.removeItem('resetToken');
      
      // Redirect to login with success message
      navigate("/login", { 
        state: { 
          message: res.data.msg || "Password reset successfully!"
        } 
      });
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-100 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reset Password</h1>
          <p className="mt-2 text-gray-600">Enter your new password</p>
        </div>
        
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <Input
              label="New Password"
              type="password"
              name="newPassword"
              placeholder="Enter new password"
              value={formData.newPassword}
              onChange={handleChange}
              required
              error={formData.newPassword && formData.newPassword.length < 6 ? "Password too short" : ""}
            />
            
            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              placeholder="Confirm new password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              error={
                formData.confirmPassword && 
                formData.newPassword !== formData.confirmPassword ? 
                "Passwords do not match" : ""
              }
            />
            
            <Button
              type="submit"
              variant="success"
              className="w-full"
              disabled={
                loading || 
                !formData.newPassword || 
                !formData.confirmPassword ||
                formData.newPassword.length < 6 ||
                formData.newPassword !== formData.confirmPassword
              }
            >
              {loading ? "Resetting Password..." : "Reset Password"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
