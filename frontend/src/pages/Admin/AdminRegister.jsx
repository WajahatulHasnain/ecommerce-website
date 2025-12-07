import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/api";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Card from "../../components/ui/Card";
import SnapShopLogo from "../../components/SnapShopLogo";

export default function AdminRegister() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { adminLogin } = useAuth();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/admin/register", form);
      adminLogin(res.data.token, res.data.user);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.response?.data?.msg || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <SnapShopLogo className="h-16 w-16" textClassName="text-3xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Registration</h1>
          <p className="mt-2 text-gray-600">Create your SnapShop admin account</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <Input
              label="Full Name"
              type="text"
              name="name"
              placeholder="Enter your full name"
              value={form.name}
              onChange={handleChange}
              required
            />

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
              placeholder="Create a strong password"
              value={form.password}
              onChange={handleChange}
              required
            />

            <Button
              type="submit"
              variant="success"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </Button>

            <div className="text-center">
              <span className="text-gray-600">Already an admin? </span>
              <button
                type="button"
                onClick={() => navigate("/admin/login")}
                className="text-green-600 hover:text-green-500 font-medium transition-colors"
              >
                Sign In
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
