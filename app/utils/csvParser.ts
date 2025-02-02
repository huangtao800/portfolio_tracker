import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import { PortfolioEntry } from '../types/portfolio';

const DATA_DIR = '/Users/taohuang/Documents/fidelity_downloads';

export async function readLatestCSV(): Promise<PortfolioEntry[]> {
  // Get all CSV files in the directory
  const files = fs.readdirSync(DATA_DIR)
    .filter(file => file.startsWith('combined_') && file.endsWith('.csv'))
    .sort()
    .reverse();

  if (files.length === 0) {
    throw new Error('No CSV files found');
  }

  const latestFile = files[0];
  const filePath = path.join(DATA_DIR, latestFile);
  
  return new Promise((resolve, reject) => {
    const results: PortfolioEntry[] = [];
    
    fs.createReadStream(filePath)
      .pipe(parse({
        columns: true,
        skip_empty_lines: true,
        cast: true
      }))
      .on('data', (data) => {
        results.push({
          date: data.Date,
          accountName: data['Account Name'],
          accountNumber: data['Account Number'],
          symbol: data.Symbol,
          description: data.Description,
          quantity: parseFloat(data.Quantity),
          lastPrice: parseFloat(data['Last Price']),
          currentValue: parseFloat(data['Current Value']),
          costBasisTotal: parseFloat(data['Cost Basis Total']),
          averageCostBasis: parseFloat(data['Average Cost Basis'])
        });
      })
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

export async function getHistoricalData(): Promise<PortfolioEntry[]> {
  const files = fs.readdirSync(DATA_DIR)
    .filter(file => file.startsWith('combined_') && file.endsWith('.csv'))
    .sort();
    
  const allEntries: PortfolioEntry[] = [];
  
  for (const file of files) {
    const filePath = path.join(DATA_DIR, file);
    const entries = await new Promise<PortfolioEntry[]>((resolve, reject) => {
      const results: PortfolioEntry[] = [];
      fs.createReadStream(filePath)
        .pipe(parse({
          columns: true,
          skip_empty_lines: true,
          cast: true
        }))
        .on('data', (data) => {
          results.push({
            date: data.Date,
            accountName: data['Account Name'],
            accountNumber: data['Account Number'],
            symbol: data.Symbol,
            description: data.Description,
            quantity: parseFloat(data.Quantity),
            lastPrice: parseFloat(data['Last Price']),
            currentValue: parseFloat(data['Current Value']),
            costBasisTotal: parseFloat(data['Cost Basis Total']),
            averageCostBasis: parseFloat(data['Average Cost Basis'])
          });
        })
        .on('end', () => resolve(results))
        .on('error', reject);
    });
    
    allEntries.push(...entries);
  }
  
  return allEntries;
} 