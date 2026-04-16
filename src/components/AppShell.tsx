import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ThemeToggle } from "./ThemeToggle";
import type { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
  title?: string;
  showNav?: boolean;
};

export function AppShell({
  children,
  title = "Task Management",
  showNav = true,
}: AppShellProps) {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Link
              to={isAuthenticated ? "/dashboard" : "/login"}
              className="truncate text-lg font-semibold tracking-tight text-violet-700 dark:text-violet-400 sm:text-xl"
            >
              {title}
            </Link>
            {showNav && isAuthenticated && (
              <nav
                className="hidden items-center gap-2 sm:flex"
                aria-label="Main"
              >
                <Link
                  to="/dashboard"
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  Dashboard
                </Link>
                <Link
                  to="/monitoring"
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  Monitoring
                </Link>
              </nav>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {isAuthenticated && user && (
              <span className="hidden max-w-[12rem] truncate text-sm text-slate-500 dark:text-slate-400 md:inline">
                {user.email}
              </span>
            )}
            <ThemeToggle />
            {isAuthenticated && (
              <button
                type="button"
                data-testid="logout-button"
                onClick={logout}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Log out
              </button>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {children}
      </main>
      <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-500">
        Built with React, TypeScript & Tailwind CSS
      </footer>
    </div>
  );
}
