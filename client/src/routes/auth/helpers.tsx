import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { authApi } from "@/api/auth-api";
import { Button } from "@/components/ui/button";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState<"pending" | "success" | "error">("pending");
  const [message, setMessage] = useState("");
  const token = params.get("token");

  const handleVerify = async () => {
    if (!token) { setStatus("error"); setMessage("No verification token."); return; }
    try {
      await authApi.verifyEmail(token);
      setStatus("success");
      setMessage("Email verified! You can now login.");
    } catch { setStatus("error"); setMessage("Invalid or expired token."); }
  };

  return (
    <div className="max-w-md mx-auto py-16">
      <div className="card text-center space-y-4">
        <h2 className="text-2xl font-bold">Email Verification</h2>
        {status === "pending" && <Button onClick={handleVerify}>Verify Now</Button>}
        {status === "success" && <p className="text-green-400">{message}</p>}
        {status === "error" && <p className="text-red-400">{message}</p>}
      </div>
    </div>
  );
}

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const send = async () => { await authApi.forgotPassword(email); setSent(true); };
  return (
    <div className="max-w-md mx-auto py-16">
      <div className="card space-y-4">
        <h2 className="text-2xl font-bold">Forgot Password</h2>
        {sent ?
          <p className="text-green-400">Reset link sent to your email.</p> : <>
            <input type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
            <Button onClick={send} className="w-full">Send Reset Link</Button>
          </>}
      </div>
    </div>
  );
}

export function ResetPassword() {
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);
  const reset = async (e: React.FormEvent) => { e.preventDefault(); await authApi.resetPassword("", password); setDone(true); };
  return (
    <div className="max-w-md mx-auto py-16">
      <div className="card space-y-4">
        <h2 className="text-2xl font-bold">Reset Password</h2>
        {done ? <p className="text-green-400">Password updated.</p> :
          <form onSubmit={reset} className="space-y-4">
            <input type="password" className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" required />
            <Button className="w-full" type="submit">Reset</Button>
          </form>}
      </div>
    </div>
  );
}
