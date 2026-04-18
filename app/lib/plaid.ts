import "server-only";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

const env = process.env.PLAID_ENV ?? "sandbox";
const secret =
  env === "production"
    ? process.env.PLAID_SECRET_PRODUCTION!
    : process.env.PLAID_SECRET_SANDBOX!;

const config = new Configuration({
  basePath: PlaidEnvironments[env as keyof typeof PlaidEnvironments],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID!,
      "PLAID-SECRET": secret,
    },
  },
});

export const plaidClient = new PlaidApi(config);
