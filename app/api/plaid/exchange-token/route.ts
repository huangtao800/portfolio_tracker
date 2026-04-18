import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomUUID } from "crypto";
import { authOptions } from "../../../lib/auth";
import { plaidClient } from "../../../lib/plaid";
import { db } from "../../../lib/db";
import { plaidItems, accounts } from "../../../lib/schema";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.userId;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { publicToken, institutionId, institutionName } = await request.json();

  // Exchange public token for access token
  const exchangeResponse = await plaidClient.itemPublicTokenExchange({
    public_token: publicToken,
  });
  const { access_token: accessToken, item_id: plaidItemId } = exchangeResponse.data;

  // Save plaid item
  const itemId = randomUUID();
  await db.insert(plaidItems).values({
    itemId,
    userId,
    plaidItemId,
    accessToken,
    institutionId: institutionId ?? null,
    institutionName: institutionName ?? null,
  });

  // Fetch accounts from Plaid and save them
  const accountsResponse = await plaidClient.accountsGet({ access_token: accessToken });
  const plaidAccounts = accountsResponse.data.accounts;

  for (const acct of plaidAccounts) {
    await db.insert(accounts).values({
      accountId:      randomUUID(),
      userId,
      plaidItemId:    itemId,
      plaidAccountId: acct.account_id,
      name:           acct.name,
      type:           acct.type,
      subtype:        acct.subtype ?? null,
      source:         "plaid",
    });
  }

  return NextResponse.json({ ok: true, accounts: plaidAccounts.length });
}
