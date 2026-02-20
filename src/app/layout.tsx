import { Source_Sans_3 } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import ChatWidget from "@/components/ChatWidget";
import "./globals.css";

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

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
    <html lang="en" className={sourceSans.variable}>
      <body>
        {children}
        <ChatWidget />
        <Analytics />
      </body>
    </html>
  );
}
