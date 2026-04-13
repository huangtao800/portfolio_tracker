import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "./components/AuthProvider";
import UserMenu from "./components/UserMenu";

export const metadata: Metadata = {
  title: "Portfolio Roaster",
  description: "Track your investment portfolio",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 min-h-screen">
        <AuthProvider>
          <header className="border-b border-gray-800">
            <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
              <span className="font-semibold text-gray-100">Portfolio Roaster</span>
              <UserMenu />
            </div>
          </header>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
