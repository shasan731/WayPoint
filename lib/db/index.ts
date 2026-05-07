import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import * as schema from "@/lib/db/schema";

export type Database = NeonHttpDatabase<typeof schema>;

let cachedDb: Database | null = null;

export function getDb(): Database {
  if (cachedDb) {
    return cachedDb;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const client = neon(databaseUrl, {
    fetchOptions: {
      cache: "no-store"
    }
  });

  cachedDb = drizzle(client, { schema });
  return cachedDb;
}

export const db = new Proxy({} as Database, {
  get(_target, property, receiver) {
    return Reflect.get(getDb(), property, receiver);
  }
});

export async function withDbRetry<T>(operation: (database: Database) => Promise<T>): Promise<T> {
  try {
    return await operation(getDb());
  } catch {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return operation(getDb());
  }
}

export async function pingDb(): Promise<boolean> {
  await withDbRetry((database) => database.execute(sql`select 1`));
  return true;
}
