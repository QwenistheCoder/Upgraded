import Database from "better-sqlite3";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../../config/env";

const SALT_ROUNDS = 12;
const JWT_EXPIRES_IN = "7d";
const TOKEN_BYTES = 32;

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
    email_verified: boolean;
  };
}

export class AuthService {
  constructor(private db: Database.Database) {}

  register(input: RegisterInput): { user: Record<string, unknown> } {
    const passwordHash = bcrypt.hashSync(input.password, SALT_ROUNDS);
    const verificationToken = crypto.randomBytes(TOKEN_BYTES).toString("hex");

    const result = this.db.prepare(
      `INSERT INTO users (id, username, email, password_hash, verification_token)
       VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?)
       RETURNING id, username, email, role, email_verified, created_at`,
    ).get(input.username, input.email.toLowerCase(), passwordHash, verificationToken);

    return { user: result as Record<string, unknown> };
  }

  login(input: LoginInput): AuthResponse {
    const user = this.db.prepare(
      "SELECT id, username, email, password_hash, role, email_verified FROM users WHERE email = ?",
    ).get(input.email.toLowerCase()) as Record<string, unknown> | undefined;

    if (!user) {
      throw new Error("Invalid email or password");
    }

    const valid = bcrypt.compareSync(input.password, user.password_hash as string);

    if (!valid) {
      throw new Error("Invalid email or password");
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    );

    return {
      token,
      user: {
        id: user.id as string,
        username: user.username as string,
        email: user.email as string,
        role: user.role as string,
        email_verified: Boolean(user.email_verified),
      },
    };
  }

  verifyEmail(token: string): { success: boolean } {
    const result = this.db.prepare(
      "UPDATE users SET email_verified = 1, verification_token = NULL WHERE verification_token = ? RETURNING id",
    ).get(token);

    if (!result) {
      throw new Error("Invalid or expired verification token");
    }

    return { success: true };
  }

  forgotPassword(email: string): { resetToken: string; message: string } {
    const user = this.db.prepare(
      "SELECT id FROM users WHERE email = ?",
    ).get(email.toLowerCase()) as { id: string } | undefined;

    // Always return success to avoid email enumeration
    if (!user) {
      return { resetToken: "", message: "If the email exists, a reset link has been prepared" };
    }

    const resetToken = crypto.randomBytes(TOKEN_BYTES).toString("hex");
    this.db.prepare(
      "UPDATE users SET reset_token = ? WHERE id = ?",
    ).run(resetToken, user.id);

    // In production: await emailService.sendPasswordResetEmail(email, resetToken);
    return { resetToken, message: "If the email exists, a reset link has been prepared" };
  }

  resetPassword(token: string, newPassword: string): { success: boolean } {
    const passwordHash = bcrypt.hashSync(newPassword, SALT_ROUNDS);

    const result = this.db.prepare(
      "UPDATE users SET password_hash = ?, reset_token = NULL WHERE reset_token = ? RETURNING id",
    ).get(passwordHash, token);

    if (!result) {
      throw new Error("Invalid or expired reset token");
    }

    return { success: true };
  }
}
