import { assetCategories } from "./assetCategories";
import yahooFinance from "yahoo-finance2";

export async function getAssetCategory(symbol: string): Promise<string> {
  // Check if the symbol is a US bond cusip
  const regex = /^[a-zA-Z0-9]{9}$/;
  if (regex.test(symbol)) {
    return "US Bond";
  }

  // Check local mapping
  if (assetCategories[symbol]) {
    return assetCategories[symbol].subCategory;
  }

  // If not found, try Yahoo Finance
  try {
    const result = await yahooFinance.quoteSummary(symbol, {
      modules: ["fundProfile", "assetProfile", "quoteType"],
    });
    if (result.fundProfile?.categoryName) {
      assetCategories[symbol] = {
        category: result.fundProfile.categoryName,
        subCategory: result.fundProfile.categoryName,
      };
      return result.fundProfile.categoryName;
    }
    assetCategories[symbol] = {
      category: symbol,
      subCategory: symbol,
    };
    return symbol;
  } catch (error) {
    console.error(`Failed to get category for ${symbol}:`, error);
    return "Other";
  }
}
