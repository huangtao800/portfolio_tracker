import React from 'react';
import type { ReactNode } from 'react';
import { PortfolioProvider } from './context/PortfolioContext';
import './globals.css';

export const metadata = {
  title: 'Portfolio Tracker',
  description: 'Track your investment portfolio performance',
};

export default function RootLayout({
    children,
  }: {
    children: ReactNode;
  }) {
    return (
      <html lang="en">
        <body className="min-h-screen">
          <PortfolioProvider>
            {children}
          </PortfolioProvider>
        </body>
      </html>
    )
  }