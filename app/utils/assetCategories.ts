interface AssetCategoryMapping {
  [symbol: string]: {
    category: string;
    subCategory: string;
  };
}

export const assetCategories: AssetCategoryMapping = {
  // US Large Cap
  SPY: { category: "US Equity", subCategory: "Large Blend" },
  VOO: { category: "US Equity", subCategory: "Large Blend" },
  FXAIX: { category: "US Equity", subCategory: "Large Blend" },
  IVV: { category: "US Equity", subCategory: "Large Blend" },
  SCHX: { category: "US Equity", subCategory: "Large Blend" },
  SWPPX: { category: "US Equity", subCategory: "Large Blend" },
  VTI: { category: "US Equity", subCategory: "Large Blend" },

  // US Total Market
  ITOT: { category: "US Equity", subCategory: "Total Market" },
  SCHB: { category: "US Equity", subCategory: "Total Market" },

  // US Bonds
  AGG: { category: "Fixed Income", subCategory: "US Bond" },
  BND: { category: "Fixed Income", subCategory: "US Bond" },
  SCHZ: { category: "Fixed Income", subCategory: "US Bond" },
  TLT: { category: "Fixed Income", subCategory: "US Bond" },

  // International Equity
  VXUS: {
    category: "International Equity",
    subCategory: "Foreign Large Blend",
  },
  IXUS: {
    category: "International Equity",
    subCategory: "Foreign Large Blend",
  },
  SCHF: {
    category: "International Equity",
    subCategory: "Foreign Large Blend",
  },

  // Emerging Markets
  VWO: { category: "International Equity", subCategory: "Emerging Markets" },
  IEMG: { category: "International Equity", subCategory: "Emerging Markets" },
  SCHE: { category: "International Equity", subCategory: "Emerging Markets" },

  // Cash & Money Market
  VMFXX: { category: "Cash", subCategory: "Money Market" },
  SPAXX: { category: "Cash", subCategory: "Money Market" },
  SWVXX: { category: "Cash", subCategory: "Money Market" },
  FDRXX: { category: "Cash", subCategory: "Money Market" },

  // TIPS
  TIP: { category: "Fixed Income", subCategory: "TIPS" },
  VTIP: { category: "Fixed Income", subCategory: "TIPS" },
  SCHP: { category: "Fixed Income", subCategory: "TIPS" },

  // REITs
  VNQ: { category: "Real Estate", subCategory: "US REIT" },
  IYR: { category: "Real Estate", subCategory: "US REIT" },
  SCHH: { category: "Real Estate", subCategory: "US REIT" },
};

export function getAssetCategory(symbol: string): string {
  return assetCategories[symbol]?.category || "Other";
}

export function getAssetSubCategory(symbol: string): string {
  const regex = /^[a-zA-Z0-9]{9}$/;
  if (regex.test(symbol)) {
    return "US Bond";
  }
  return assetCategories[symbol]?.subCategory || "Other";
}

export const categoryColors: { [key: string]: string } = {
  "US Equity": "#2563eb", // Blue
  "International Equity": "#16a34a", // Green
  "Fixed Income": "#9333ea", // Purple
  "Real Estate": "#dc2626", // Red
  Cash: "#ca8a04", // Yellow
  Other: "#64748b", // Gray
};

export const subCategoryOrder = [
  "Large Blend",
  "Total Market",
  "Foreign Large Blend",
  "Emerging Markets",
  "US Bond",
  "TIPS",
  "US REIT",
  "Money Market",
  "Other",
];
