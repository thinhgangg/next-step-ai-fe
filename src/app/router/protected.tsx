import { useSession } from "@/features/auth/session/session.model";
import { Navigate } from "@tanstack/react-router";
import { Home, RefreshCw, WifiOff } from "lucide-react";
import type React from "react";

export function Protected({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isSessionLoading, isSessionUnavailable } =
    useSession();

  if (isSessionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Checking your session...
      </div>
    );
  }

  if (isSessionUnavailable) {
    return (
      <div className="min-h-screen bg-muted text-foreground [font-family:'Instrument_Sans',sans-serif]">
        <header className="border-b border-border bg-card">
          <div className="mx-auto flex h-16 w-full max-w-7xl items-center px-4 sm:px-6">
            <a href="/" className="text-lg font-bold tracking-tight text-primary">
              NextStepAI
            </a>
          </div>
        </header>

        <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
          <section className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <WifiOff className="h-7 w-7" />
            </div>
            <h1 className="mt-5 text-2xl font-bold text-foreground">
              Cannot reach the server
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Your session is still saved, but we could not verify it right now.
              Check your connection or try again in a moment.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <RefreshCw className="h-4 w-4" />
                Try again
              </button>
              <a
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <Home className="h-4 w-4" />
                Back to home
              </a>
            </div>
          </section>
        </main>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}
