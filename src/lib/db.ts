import { Pool, PoolConfig } from "pg";

let poolPromise: Promise<Pool> | null = null;

const resolveSSL = (connectionString: string | undefined) => {
  if (!connectionString) {
    return undefined;
  }

  if (process.env.DATABASE_SSL === "false") {
    return undefined;
  }

  if (process.env.DATABASE_SSL === "true") {
    return { rejectUnauthorized: false };
  }

  const isLocal =
    connectionString.includes("localhost") ||
    connectionString.includes("127.0.0.1") ||
    connectionString.includes("::1");

  return isLocal ? undefined : { rejectUnauthorized: false };
};

async function createPool() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Update your .env file with the Tiger Data connection string."
    );
  }

  const config: PoolConfig = {
    connectionString,
  };

  const ssl = resolveSSL(connectionString);
  if (ssl) {
    config.ssl = ssl;
  }

  return new Pool(config);
}

export async function getPool() {
  if (!poolPromise) {
    poolPromise = createPool();
  }

  return poolPromise;
}

export async function runQuery<T = unknown>(text: string, params?: unknown[]) {
  const pool = await getPool();
  return pool.query<T>(text, params);
}
