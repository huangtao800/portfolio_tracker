import "server-only";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

const pool = mysql.createPool({
  host:        process.env.MYSQL_HOST     ?? "localhost",
  port:        Number(process.env.MYSQL_PORT ?? 3306),
  user:        process.env.MYSQL_USER     ?? "portfolio_user",
  password:    process.env.MYSQL_PASSWORD ?? "portfolio_pass",
  database:    process.env.MYSQL_DATABASE ?? "portfolio",
  dateStrings: true, // return DATE/DATETIME as "YYYY-MM-DD" strings, not JS Date objects
});

export const db = drizzle(pool, { schema, mode: "default" });
