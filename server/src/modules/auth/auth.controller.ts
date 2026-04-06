import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service";
import { getDb } from "../../config/database";

const authService = new AuthService(getDb()!);

export const register = (req: Request, res: Response, _next: NextFunction) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "username, email, and password are required" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  const result = authService.register({ username, email, password });
  return res.status(201).json(result);
};

export const login = (req: Request, res: Response, _next: NextFunction) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const result = authService.login({ email, password });
  return res.status(200).json(result);
};

export const verifyEmail = (req: Request, res: Response, _next: NextFunction) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: "token is required" });
  }

  authService.verifyEmail(token);
  return res.status(200).json({ message: "Email verified successfully" });
};

export const forgotPassword = (req: Request, res: Response, _next: NextFunction) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "email is required" });
  }

  authService.forgotPassword(email);
  return res.status(200).json({ message: "If the email exists, a reset link has been sent" });
};

export const resetPassword = (req: Request, res: Response, _next: NextFunction) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: "token and newPassword are required" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  authService.resetPassword(token, newPassword);
  return res.status(200).json({ message: "Password reset successfully" });
};
