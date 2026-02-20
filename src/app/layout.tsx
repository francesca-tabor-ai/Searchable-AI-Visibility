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
      <body>{children}</body>
    </html>
  );
}
