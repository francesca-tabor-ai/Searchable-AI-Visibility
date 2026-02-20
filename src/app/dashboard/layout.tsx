import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="grid min-h-screen grid-cols-1 md:grid-cols-[minmax(0,16rem)_1fr]">
        <DashboardSidebar />
        <main className="min-w-0 px-4 py-6 md:px-6 md:py-8 lg:px-8 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
