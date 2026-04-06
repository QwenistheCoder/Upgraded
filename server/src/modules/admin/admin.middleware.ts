import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";

export interface AdminUser {
  id: string;
  email: string;
  role: string;
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const parts = header.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  try {
    const decoded = jwt.verify(parts[1], env.JWT_SECRET) as AdminUser;
    if (decoded.role !== "admin") {
      res.status(403).json({ error: "Admin access required" });
      return;
    }
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
