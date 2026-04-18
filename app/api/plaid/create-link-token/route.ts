import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { CountryCode, Products, InvestmentAccountSubtype } from "plaid";
import { authOptions } from "../../../lib/auth";
import { plaidClient } from "../../../lib/plaid";

export async function POST() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.userId;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const response = await plaidClient.linkTokenCreate({
    user: { client_user_id: userId },
    client_name: "Portfolio Tracker",
    products: [Products.Investments],
    country_codes: [CountryCode.Us],
    language: "en",
    account_filters: {
      investment: {
        account_subtypes: [InvestmentAccountSubtype.Brokerage],
      },
    },
  });

  return NextResponse.json({ linkToken: response.data.link_token });
}
