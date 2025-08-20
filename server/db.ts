import 'dotenv/config';
import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import pg from 'pg';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

function shouldUseNeon(url: string): boolean {
  try {
    const host = new URL(url).host;
    return process.env.DB_DRIVER === 'neon' || host.includes('neon.tech');
  } catch {
    return process.env.DB_DRIVER === 'neon';
  }
}

let db: ReturnType<typeof drizzleNeon> | ReturnType<typeof drizzlePg>;

if (shouldUseNeon(databaseUrl)) {
  const pool = new NeonPool({ connectionString: databaseUrl });
  db = drizzleNeon({ client: pool, schema });
} else {
  const { Pool } = pg;
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.PGSSL_DISABLE === '1' ? undefined : { rejectUnauthorized: false },
  });
  db = drizzlePg(pool, { schema });
}

export { db };