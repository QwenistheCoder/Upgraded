import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate("/");
    } catch {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="max-w-md mx-auto py-16">
      <h1 className="text-3xl font-bold mb-8 text-center">Login</h1>
      <form onSubmit={handleSubmit} className="card space-y-4">
        {error && <div className="text-red-400 text-sm">{error}</div>}
        <div>
          <label className="block text-sm mb-1 text-surface-400">Email</label>
          <input
            type="email"
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1 text-surface-400">Password</label>
          <input
            type="password"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </Button>
        <div className="text-center text-sm text-surface-500">
          Don't have an account?{" "}
          <Link to="/register" className="text-brand-400 hover:underline">
            Register
          </Link>
          {" · "}
          <Link to="/forgot-password" className="text-brand-400 hover:underline">
            Forgot password?
          </Link>
        </div>
      </form>
    </div>
  );
}
