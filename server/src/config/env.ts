import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().default("3001"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().default("file:./data/raisk.db"),
  JWT_SECRET: z.string({
    description: "CRITICAL: Set this to a random 64+ byte hex string in production. Run: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\"",
  }).default("dev-secret-change-me"),
  ENCRYPTION_KEY: z.string().optional(),
  ALLOWED_ORIGINS: z.string().default("*"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
});

export const env = envSchema.parse(process.env);
