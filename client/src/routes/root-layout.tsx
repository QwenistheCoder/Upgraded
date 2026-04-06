import { Outlet, useLocation } from "react-router-dom";
import { Header } from "@/components/layout/header";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";

export default function RootLayout() {
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t border-surface-800 py-6 text-center text-sm text-surface-500">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <span>RaiSK Upgraded &copy; 2026</span>
          <div className="flex gap-4">
            <a href="/about" className="hover:text-surface-300">About</a>
            <a href="/guide" className="hover:text-surface-300">Guide</a>
            <a href="/privacy" className="hover:text-surface-300">Privacy</a>
            <a href="/terms" className="hover:text-surface-300">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
