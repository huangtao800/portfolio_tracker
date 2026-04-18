export interface RawHolding {
  ticker: string;
  name: string;
  exchange: string;
  broker: string;
  shares: string;
  sharePrice: string | null;
  totalValue: string;
  totalValueGainPct: string | null;
  costBasis: string | null;
  return1d: string | null;
  return1m: string | null;
  return6m: string | null;
  date: string;
  accountId: string;
  securityId?: string;
}

function parseNum(val: string): string | null {
  if (!val || val.trim() === "N/A") return null;
  const n = parseFloat(val.replace(/,/g, ""));
  return isNaN(n) ? null : String(n);
}

function parseLine(line: string): string[] {
  const cols: string[] = [];
  let cur = "", inQuotes = false;
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === "," && !inQuotes) { cols.push(cur.trim()); cur = ""; }
    else { cur += ch; }
  }
  cols.push(cur.trim());
  return cols;
}

export function parseCsv(content: string): RawHolding[] {
  const lines = content.split("\n").filter((l) => l.trim());
  const rows: RawHolding[] = [];
  for (let i = 1; i < lines.length; i++) {
    const c = parseLine(lines[i]);
    if (c.length < 14) continue;
    const accountId = c[4]?.trim() ?? "";
    if (!accountId) continue;
    const totalValue = parseNum(c[7]);
    if (!totalValue) continue;
    rows.push({
      ticker:           c[0].trim(),
      name:             c[1].trim(),
      exchange:         c[2].trim(),
      broker:           c[3].trim(),
      accountId,
      shares:           String(parseFloat(c[5]) || 0),
      sharePrice:       parseNum(c[6]),
      totalValue,
      totalValueGainPct: parseNum(c[8]),
      costBasis:        parseNum(c[9]),
      return1d:         parseNum(c[10]),
      return1m:         parseNum(c[11]),
      return6m:         parseNum(c[12]),
      date:             c[13]?.trim() ?? "",
    });
  }
  return rows;
}
