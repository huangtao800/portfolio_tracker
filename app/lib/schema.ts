import { mysqlTable, varchar, timestamp } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  userId:    varchar("user_id",  { length: 36  }).primaryKey(),
  email:     varchar("email",    { length: 255 }).notNull().unique(),
  name:      varchar("name",     { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
