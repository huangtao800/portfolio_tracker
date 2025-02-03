"use client";

import React from "react";
import { usePortfolio } from "../context/PortfolioContext";
import { PortfolioEntry } from "../types/portfolio";

interface MergedHolding {
  symbol: string;
  description: string;
  quantity: number;
  currentValue: number;
}

export default function HoldingsList() {
  const { assetAllocation, selectedAssetClass, isLoading, error } =
    usePortfolio();

  if (isLoading) {
    return <div className="bg-white rounded-lg p-4 border">Loading...</div>;
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg p-4 border text-red-500">{error}</div>
    );
  }

  const rawHoldings = selectedAssetClass
    ? assetAllocation.find((a) => a.assetClass === selectedAssetClass)
        ?.holdings || []
    : assetAllocation.flatMap((a) => a.holdings);

  // Merge holdings with same symbol
  const mergedHoldings = rawHoldings.reduce<MergedHolding[]>((acc, holding) => {
    const existingHolding = acc.find((h) => h.symbol === holding.symbol);
    if (existingHolding) {
      existingHolding.quantity += holding.quantity || 0;
      existingHolding.currentValue += holding.currentValue || 0;
    } else {
      acc.push({
        symbol: holding.symbol,
        description: holding.description,
        quantity: holding.quantity || 0,
        currentValue: holding.currentValue || 0,
      });
    }
    return acc;
  }, []);

  // Sort by current value in descending order
  const sortedHoldings = mergedHoldings.sort(
    (a, b) => b.currentValue - a.currentValue
  );

  return (
    <div className="bg-white rounded-lg p-4 border">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left py-2">Symbol</th>
              <th className="text-left py-2">Description</th>
              <th className="text-right py-2">Quantity</th>
              <th className="text-right py-2">Current Value</th>
            </tr>
          </thead>
          <tbody>
            {sortedHoldings.map((holding) => (
              <tr key={holding.symbol} className="border-t">
                <td className="py-2">{holding.symbol}</td>
                <td className="py-2">{holding.description}</td>
                <td className="py-2 text-right">
                  {holding.quantity.toFixed(2)}
                </td>
                <td className="py-2 text-right">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(holding.currentValue)}
                </td>
              </tr>
            ))}
            <tr className="border-t">
              <td className="py-2">Total</td>
              <td className="py-2"></td>
              <td className="py-2"></td>
              <td className="py-2 text-right">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(
                  sortedHoldings.reduce(
                    (acc, holding) => acc + holding.currentValue,
                    0
                  )
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
