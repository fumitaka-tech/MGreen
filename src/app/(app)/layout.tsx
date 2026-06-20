import { Header } from "@/components/header";
import { BottomNav } from "@/components/bottom-nav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col bg-gradient-to-b from-green-50 to-white">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-4 pb-nav-safe sm:px-5 sm:py-6">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
