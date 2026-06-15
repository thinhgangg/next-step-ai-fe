import { Navigate } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import type React from "react";
import { useQuery } from "@apollo/client/react";
import { CURRENT_USER_ROLE_QUERY } from "@/features/auth/query/current-user-role.query";
import { isUnauthenticatedError } from "@/shared/api/graphql/auth-errors";
import { BRAND } from "@/shared/config/brand";
import { getAccessToken } from "@/shared/lib/storage";

type AdminMeResponse = {
  me: {
    userId: string;
    email: string;
    role?: string | null;
  } | null;
};

function isAdminRole(role?: string | null) {
  return role?.toLowerCase() === "admin";
}

export function AdminProtected({ children }: { children: React.ReactNode }) {
  const accessToken = getAccessToken();
  const { data, loading, error } = useQuery<AdminMeResponse>(
    CURRENT_USER_ROLE_QUERY,
    {
      skip: !accessToken,
      fetchPolicy: "network-only",
      nextFetchPolicy: "network-only",
      notifyOnNetworkStatusChange: true,
    },
  );

  if (!accessToken || isUnauthenticatedError(error)) {
    return <Navigate to="/login" />;
  }

  if (loading || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Đang tải...
      </div>
    );
  }

  if (!isAdminRole(data?.me?.role)) {
    return (
      <div className="min-h-screen bg-muted text-foreground font-sans">
        <header className="border-b border-border bg-card">
          <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
            <a href="/" className="text-lg font-bold tracking-tight text-primary">
              {BRAND.name}
            </a>
            <a
              href="/dashboard"
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-primary"
            >
              Về trang người dùng
            </a>
          </div>
        </header>

        <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
          <section className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <h1 className="mt-5 text-2xl font-bold text-foreground">
              Không có quyền truy cập
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Khu vực này chỉ dành cho tài khoản quản trị. Vui lòng đăng nhập
              bằng tài khoản admin để tiếp tục.
            </p>
          </section>
        </main>
      </div>
    );
  }

  return <>{children}</>;
}
