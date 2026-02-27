import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mokhtar Dashboard",
  description: "Sales, expenses, debts, and reports"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-dvh">{children}</div>
      </body>
    </html>
  );
}
