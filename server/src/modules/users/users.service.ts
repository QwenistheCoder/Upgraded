import Database from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: string;
  email_verified: boolean;
  avatar_url: string | null;
  elo_default: number;
  created_at: string;
}

export interface UpdateProfileInput {
  username?: string;
  avatar_url?: string;
}

export interface ApiKeyRow {
  id: string;
  provider: string;
  encrypted_key: string;
  created_at: string;
}

export interface CustomProviderRow {
  id: string;
  name: string;
  base_url: string;
  api_key_header: string;
  default_model: string | null;
  extra_headers: Record<string, unknown>;
  protocol: string;
  created_at: string;
}

export interface SaveApiKeyInput {
  provider: string;
  encryptedKey: string;
}

export interface SaveCustomProviderInput {
  name: string;
  base_url: string;
  api_key_encrypted?: string | null;
  api_key_header?: string;
  default_model?: string;
  extra_headers?: Record<string, unknown>;
  protocol?: string;
}

export class UsersService {
  constructor(private db: Database.Database) {}

  // -- Profile --

  getUserProfile(userId: string): UserProfile | null {
    return this.db.prepare(
      `SELECT id, username, email, role, email_verified, avatar_url, elo_default, created_at
       FROM users WHERE id = ?`,
    ).get(userId) as UserProfile | null;
  }

  updateUserProfile(userId: string, input: UpdateProfileInput): UserProfile {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (input.username !== undefined) {
      fields.push(`username = ?`);
      values.push(input.username);
    }
    if (input.avatar_url !== undefined) {
      fields.push(`avatar_url = ?`);
      values.push(input.avatar_url);
    }

    if (fields.length === 0) {
      const existing = this.getUserProfile(userId);
      if (!existing) throw new Error("User not found");
      return existing;
    }

    values.push(userId);
    const result = this.db.prepare(
      `UPDATE users SET ${fields.join(", ")}
       WHERE id = ?
       RETURNING id, username, email, role, email_verified, avatar_url, elo_default, created_at`,
    ).get(...values);

    if (!result) throw new Error("User not found");
    return result as UserProfile;
  }

  // -- API Keys --

  getApiKeys(userId: string): ApiKeyRow[] {
    return this.db.prepare(
      "SELECT id, provider, encrypted_key, created_at FROM api_keys WHERE user_id = ? ORDER BY created_at DESC",
    ).all(userId) as ApiKeyRow[];
  }

  saveApiKey(userId: string, input: SaveApiKeyInput): ApiKeyRow {
    const result = this.db.prepare(
      `INSERT INTO api_keys (user_id, provider, encrypted_key)
       VALUES (?, ?, ?)
       RETURNING id, provider, encrypted_key, created_at`,
    ).get(userId, input.provider, input.encryptedKey);

    if (result) return result as ApiKeyRow;

    // Row already existed — update it
    const updated = this.db.prepare(
      `UPDATE api_keys SET encrypted_key = ?
       WHERE user_id = ? AND provider = ?
       RETURNING id, provider, encrypted_key, created_at`,
    ).get(input.encryptedKey, userId, input.provider);

    if (!updated) throw new Error("Failed to save API key");
    return updated as ApiKeyRow;
  }

  deleteApiKey(userId: string, provider: string): void {
    this.db.prepare(
      "DELETE FROM api_keys WHERE user_id = ? AND provider = ?",
    ).run(userId, provider);
  }

  getApiKey(userId: string, provider: string): ApiKeyRow | null {
    return this.db.prepare(
      "SELECT id, provider, encrypted_key, created_at FROM api_keys WHERE user_id = ? AND provider = ?",
    ).get(userId, provider) as ApiKeyRow | null;
  }

  // -- Custom Providers --

  getCustomProviders(userId: string): CustomProviderRow[] {
    return this.db.prepare(
      `SELECT id, name, base_url, api_key_header, default_model, extra_headers, protocol, created_at
       FROM custom_providers WHERE user_id = ? ORDER BY created_at DESC`,
    ).all(userId) as CustomProviderRow[];
  }

  saveCustomProvider(
    userId: string,
    input: SaveCustomProviderInput,
  ): CustomProviderRow {
    const result = this.db.prepare(
      `INSERT INTO custom_providers
        (id, user_id, name, base_url, api_key_encrypted, api_key_header, default_model, extra_headers, protocol)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING id, name, base_url, api_key_header, default_model, extra_headers, protocol, created_at`,
    ).get(
      uuidv4(),
      userId,
      input.name,
      input.base_url,
      input.api_key_encrypted ?? null,
      input.api_key_header ?? "Authorization",
      input.default_model ?? null,
      JSON.stringify(input.extra_headers ?? {}),
      input.protocol ?? "openai",
    );

    if (!result) throw new Error("Failed to save custom provider");
    // extra_headers stored as JSON string in DB, parse for return
    const parsed = result as CustomProviderRow;
    if (typeof parsed.extra_headers === "string") {
      parsed.extra_headers = JSON.parse(parsed.extra_headers);
    }
    return parsed;
  }

  updateCustomProvider(
    userId: string,
    providerId: string,
    input: Partial<SaveCustomProviderInput>,
  ): CustomProviderRow {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (input.name !== undefined) { fields.push(`name = ?`); values.push(input.name); }
    if (input.base_url !== undefined) { fields.push(`base_url = ?`); values.push(input.base_url); }
    if (input.api_key_encrypted !== undefined) { fields.push(`api_key_encrypted = ?`); values.push(input.api_key_encrypted); }
    if (input.api_key_header !== undefined) { fields.push(`api_key_header = ?`); values.push(input.api_key_header); }
    if (input.default_model !== undefined) { fields.push(`default_model = ?`); values.push(input.default_model); }
    if (input.extra_headers !== undefined) { fields.push(`extra_headers = ?`); values.push(JSON.stringify(input.extra_headers)); }
    if (input.protocol !== undefined) { fields.push(`protocol = ?`); values.push(input.protocol); }

    if (fields.length === 0) {
      const existing = this.getCustomProvider(userId, providerId);
      if (!existing) throw new Error("Custom provider not found");
      // Parse extra_headers if needed
      if (typeof existing.extra_headers === "string") {
        existing.extra_headers = JSON.parse(existing.extra_headers);
      }
      return existing;
    }

    values.push(userId, providerId);
    const result = this.db.prepare(
      `UPDATE custom_providers SET ${fields.join(", ")}
       WHERE id = ? AND user_id = ?
       RETURNING id, name, base_url, api_key_header, default_model, extra_headers, protocol, created_at`,
    ).get(...values) as CustomProviderRow;

    if (!result) throw new Error("Custom provider not found");
    // extra_headers stored as JSON string in DB, parse for return
    if (typeof result.extra_headers === "string") {
      result.extra_headers = JSON.parse(result.extra_headers);
    }
    return result;
  }

  deleteCustomProvider(userId: string, providerId: string): void {
    const result = this.db.prepare(
      "DELETE FROM custom_providers WHERE id = ? AND user_id = ?",
    ).run(providerId, userId);
    if (result.changes === 0) throw new Error("Custom provider not found");
  }

  getCustomProvider(userId: string, providerId: string): CustomProviderRow | null {
    const result = this.db.prepare(
      `SELECT id, name, base_url, api_key_header, default_model, extra_headers, protocol, created_at
       FROM custom_providers WHERE id = ? AND user_id = ?`,
    ).get(providerId, userId) as CustomProviderRow | null;
    // extra_headers stored as JSON string in DB, parse for return
    if (result && typeof result.extra_headers === "string") {
      result.extra_headers = JSON.parse(result.extra_headers);
    }
    return result;
  }
}
