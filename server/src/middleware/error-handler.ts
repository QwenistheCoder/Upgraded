import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: "Validation error", details: err.errors });
  }

  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  if ((err as any).code === "ECONNREFUSED") {
    return res.status(503).json({ error: "Service unavailable" });
  }

  console.error("Unhandled error:", err);
  return res.status(500).json({ error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message });
}
