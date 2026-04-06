import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const register = useAuthStore((s) => s.register);
  const loading = useAuthStore((s) => s.loading);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await register(username, email, password);
      setSuccess(true);
    } catch {
      setError("Registration failed. Username or email may be taken.");
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <div className="card">
          <h2 className="text-xl font-semibold mb-2 text-green-400">Check your email</h2>
          <p className="text-surface-400 mb-4">
            Click the verification link to activate your account.
          </p>
          <Button onClick={() => navigate("/login")}>Go to Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-16">
      <h1 className="text-3xl font-bold mb-8 text-center">Register</h1>
      <form onSubmit={handleSubmit} className="card space-y-4">
        {error && <div className="text-red-400 text-sm">{error}</div>}
        <div>
          <label className="block text-sm mb-1 text-surface-400">Username</label>
          <input type="text" className="input-field" value={username} onChange={(e) => setUsername(e.target.value)} required minLength={2} maxLength={50} />
        </div>
        <div>
          <label className="block text-sm mb-1 text-surface-400">Email</label>
          <input type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm mb-1 text-surface-400">Password</label>
          <input type="password" className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating account..." : "Register"}
        </Button>
        <div className="text-center text-sm text-surface-500">
          Already have an account?{" "}
          <Link to="/login" className="text-brand-400 hover:underline">Login</Link>
        </div>
      </form>
    </div>
  );
}
