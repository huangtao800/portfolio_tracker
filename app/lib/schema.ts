import {
  mysqlTable,
  varchar,
  timestamp,
  date,
  decimal,
  index,
  unique,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  userId:    varchar("user_id",  { length: 36  }).primaryKey(),
  email:     varchar("email",    { length: 255 }).notNull().unique(),
  name:      varchar("name",     { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const securities = mysqlTable("securities", {
  securityId: varchar("security_id", { length: 36  }).primaryKey(),
  ticker:     varchar("ticker",      { length: 20  }).unique(),
  name:       varchar("name",        { length: 255 }).notNull(),
  exchange:   varchar("exchange",    { length: 20  }),
});

export const accounts = mysqlTable("accounts", {
  accountId:      varchar("account_id",       { length: 36  }).primaryKey(),
  userId:         varchar("user_id",          { length: 36  }).notNull(),
  itemId:         varchar("item_id",          { length: 36  }),
  plaidAccountId: varchar("plaid_account_id", { length: 255 }).unique(),
  name:           varchar("name",             { length: 255 }).notNull(),
  type:           varchar("type",             { length: 50  }),
  subtype:        varchar("subtype",          { length: 50  }),
  source:         varchar("source",           { length: 20  }).notNull(),
  createdAt:      timestamp("created_at").defaultNow().notNull(),
});

export const plaidItems = mysqlTable("plaid_items", {
  itemId:          varchar("item_id",          { length: 36  }).primaryKey(),
  userId:          varchar("user_id",          { length: 36  }).notNull(),
  plaidItemId:     varchar("plaid_item_id",    { length: 255 }).notNull().unique(),
  accessToken:     varchar("access_token",     { length: 255 }).notNull(),
  institutionId:   varchar("institution_id",   { length: 100 }),
  institutionName: varchar("institution_name", { length: 255 }),
  createdAt:       timestamp("created_at").defaultNow().notNull(),
});

export const snapshots = mysqlTable("snapshots", {
  snapshotId:   varchar("snapshot_id",   { length: 36 }).primaryKey(),
  userId:       varchar("user_id",       { length: 36 }).notNull().references(() => users.userId),
  snapshotDate: date("snapshot_date", { mode: "string" }).notNull(),
}, (t) => ({
  uniqUserDate: unique().on(t.userId, t.snapshotDate),
  idxUserId:    index("idx_snapshots_user_id").on(t.userId),
}));

export const holdings = mysqlTable("holdings", {
  holdingId:          varchar("holding_id",            { length: 36  }).primaryKey(),
  snapshotId:         varchar("snapshot_id",           { length: 36  }).notNull().references(() => snapshots.snapshotId),
  ticker:             varchar("ticker",                { length: 20  }),
  securityId:         varchar("security_id",           { length: 36  }).notNull(),
  broker:             varchar("broker",                { length: 100 }).notNull(),
  shares:             decimal("shares",                { precision: 18, scale: 6 }).notNull(),
  sharePrice:         decimal("share_price",           { precision: 18, scale: 4 }),
  totalValue:         decimal("total_value",           { precision: 18, scale: 2 }).notNull(),
  costBasis:          decimal("cost_basis",            { precision: 18, scale: 2 }),
  totalValueGainPct:  decimal("total_value_gain_pct",  { precision: 10, scale: 4 }),
  return1d:           decimal("return_1d",             { precision: 10, scale: 4 }),
  return1m:           decimal("return_1m",             { precision: 10, scale: 4 }),
  return6m:           decimal("return_6m",             { precision: 10, scale: 4 }),
}, (t) => ({
  idxSnapshotId: index("idx_holdings_snapshot_id").on(t.snapshotId),
  idxTicker:     index("idx_holdings_ticker").on(t.ticker),
}));
