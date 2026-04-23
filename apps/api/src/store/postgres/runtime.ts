import type { PostgresStoreConfig } from "../../config.js";

export interface PgClient {
  query(text: string, values?: unknown[]): Promise<{ rows: Record<string, unknown>[]; rowCount: number }>;
  release(): void;
}

export interface PgPool {
  connect(): Promise<PgClient>;
  query(text: string, values?: unknown[]): Promise<{ rows: Record<string, unknown>[]; rowCount: number }>;
  end(): Promise<void>;
}

interface PgPoolConstructor {
  new(config: Record<string, unknown>): PgPool;
}

let pgModule: { Pool: PgPoolConstructor } | null = null;

export async function loadPgModule(): Promise<{ Pool: PgPoolConstructor }> {
  if (pgModule) {
    return pgModule;
  }
  const mod = await import("pg");
  pgModule = { Pool: mod.Pool as unknown as PgPoolConstructor };
  return pgModule;
}

export function buildPoolConfig(config: PostgresStoreConfig): Record<string, unknown> {
  const poolCfg: Record<string, unknown> = {
    connectionString: config.connectionString || config.directUrl,
    max: 20,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    application_name: config.applicationName
  };

  if (config.sslMode === "disable") {
    poolCfg.ssl = false;
  } else {
    poolCfg.ssl = { rejectUnauthorized: config.sslMode === "require" };
  }

  return poolCfg;
}
