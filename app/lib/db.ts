import "server-only";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

function makePoolConfig(): mysql.PoolOptions {
  if (process.env.MYSQL_URL) {
    const u = new URL(process.env.MYSQL_URL);
    return {
      host:        u.hostname,
      port:        Number(u.port) || 3306,
      user:        u.username,
      password:    u.password,
      database:    u.pathname.slice(1),
      dateStrings: true,
    };
  }
  return {
    host:        process.env.MYSQL_HOST     ?? "localhost",
    port:        Number(process.env.MYSQL_PORT ?? 3306),
    user:        process.env.MYSQL_USER     ?? "portfolio_user",
    password:    process.env.MYSQL_PASSWORD ?? "portfolio_pass",
    database:    process.env.MYSQL_DATABASE ?? "portfolio",
    dateStrings: true,
  };
}

const pool = mysql.createPool(makePoolConfig());

export const db = drizzle(pool, { schema, mode: "default" });
