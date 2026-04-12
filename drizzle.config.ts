import type { Config } from "drizzle-kit";

export default {
  schema: "./app/lib/schema.ts",
  out:    "./drizzle/migrations",
  dialect: "mysql",
  dbCredentials: {
    host:     process.env.MYSQL_HOST     ?? "localhost",
    port:     Number(process.env.MYSQL_PORT ?? 3306),
    user:     process.env.MYSQL_USER     ?? "portfolio_user",
    password: process.env.MYSQL_PASSWORD ?? "portfolio_pass",
    database: process.env.MYSQL_DATABASE ?? "portfolio",
  },
} satisfies Config;
