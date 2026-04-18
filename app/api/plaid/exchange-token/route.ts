import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
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

  // Upsert plaid item (reconnecting the same institution reuses the same plaid_item_id)
  await db
    .insert(plaidItems)
    .values({
      itemId: randomUUID(),
      userId,
      plaidItemId,
      accessToken,
      institutionId:   institutionId ?? null,
      institutionName: institutionName ?? null,
    })
    .onDuplicateKeyUpdate({
      set: { accessToken, institutionId: institutionId ?? null, institutionName: institutionName ?? null },
    });

  // Look up our internal itemId after upsert
  const [savedItem] = await db
    .select({ itemId: plaidItems.itemId })
    .from(plaidItems)
    .where(eq(plaidItems.plaidItemId, plaidItemId))
    .limit(1);
  const itemId = savedItem.itemId;

  // Fetch accounts from Plaid and upsert them
  const accountsResponse = await plaidClient.accountsGet({ access_token: accessToken });
  const plaidAccounts = accountsResponse.data.accounts;

  for (const acct of plaidAccounts) {
    await db
      .insert(accounts)
      .values({
        accountId:      randomUUID(),
        userId,
        plaidItemId:    itemId,
        plaidAccountId: acct.account_id,
        name:           acct.name,
        type:           acct.type,
        subtype:        acct.subtype ?? null,
        source:         "plaid",
      })
      .onDuplicateKeyUpdate({
        set: { name: acct.name, type: acct.type, subtype: acct.subtype ?? null, plaidItemId: itemId },
      });
  }

  return NextResponse.json({ ok: true, accounts: plaidAccounts.length });
}
