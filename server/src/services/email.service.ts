/**
 * Email service stub.
 * In production, integrate with SendGrid, Resend, AWS SES, or similar.
 */
import { env } from "../config/env";

function getAppUrl(): string {
  const port = env.NODE_ENV === "production" ? "" : `:${env.PORT}`;
  const host = "http://localhost";
  return `${host}${port}`;
}

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const url = `${getAppUrl()}/verify-email?token=${token}`;

  if (env.NODE_ENV === "development") {
    console.log(`[DEV] Verification email for ${email}: ${url}`);
    return;
  }

  // Production implementation:
  // await resend.emails.send({
  //   from: "noreply@raisk.gg",
  //   to: email,
  //   subject: "Verify your RaiSK account",
  //   html: `<p>Click <a href="${url}">here</a> to verify your email.</p>`,
  // });
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const url = `${getAppUrl()}/reset-password?token=${token}`;

  if (env.NODE_ENV === "development") {
    console.log(`[DEV] Password reset email for ${email}: ${url}`);
    return;
  }

  // Production implementation:
  // await resend.emails.send({
  //   from: "noreply@raisk.gg",
  //   to: email,
  //   subject: "Reset your RaiSK password",
  //   html: `<p>Click <a href="${url}">here</a> to reset your password. This link expires in 1 hour.</p>`,
  // });
}
