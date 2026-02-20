import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

export const metadata = {
  title: "Searchable — AI Search Visibility",
  description: "AI Citation Tracking for Search Visibility",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
