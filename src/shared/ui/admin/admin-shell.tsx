import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BRAND } from "@/shared/config/brand";
import { storage } from "@/shared/lib/storage";
import { useSession } from "@/features/auth/session/session.model";

type AdminNavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  to: string;
};

const adminNavItems: AdminNavItem[] = [
  { id: "overview", label: "Tổng quan", icon: LayoutDashboard, to: "/admin" },
  { id: "users", label: "Người dùng", icon: Users, to: "/admin/users" },
  { id: "jobs", label: "Việc làm", icon: BriefcaseBusiness, to: "/admin/jobs" },
  {
    id: "companies",
    label: "Công ty",
    icon: Building2,
    to: "/admin/companies",
  },
  { id: "skills", label: "Kỹ năng", icon: BadgeCheck, to: "/admin/skills" },
  {
    id: "courses",
    label: "Khóa học",
    icon: GraduationCap,
    to: "/admin/courses",
  },
  { id: "settings", label: "Cài đặt", icon: Settings, to: "/admin/settings" },
];

type AdminShellProps = {
  children: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  fullWidth?: boolean;
};

const ADMIN_SIDEBAR_STORAGE_KEY = "nextstep.admin.sidebar.collapsed";

export function AdminShell({
  children,
  title,
  description,
  actions,
  fullWidth = false,
}: AdminShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return storage.get(ADMIN_SIDEBAR_STORAGE_KEY) === "true";
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useSession();
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const displayName = user?.name || "Admin";
  const displayEmail = user?.email || "";

  useEffect(() => {
    storage.set(ADMIN_SIDEBAR_STORAGE_KEY, String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, []);

  const navButtonBase = isCollapsed
    ? "mx-auto h-10 w-10 lg:justify-center"
    : "mx-2 h-10 w-[calc(100%-16px)] gap-3 px-3";

  return (
    <div className="flex h-screen bg-background text-foreground font-sans">
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`bg-card border-r border-border flex flex-col overflow-hidden transition-all duration-300 z-40 lg:z-10
          fixed inset-y-0 left-0 lg:static lg:translate-x-0 lg:flex-shrink-0
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
          ${isCollapsed ? "lg:w-[72px]" : "lg:w-[244px]"} w-[240px]`}
      >
        <div
          className={`flex h-20 items-center border-b border-border ${
            isCollapsed ? "lg:justify-center" : "gap-2 px-3"
          }`}
        >
          <button
            type="button"
            onClick={() => {
              if (window.innerWidth < 1024) {
                setIsMobileOpen(false);
              } else {
                setIsCollapsed((value) => !value);
              }
            }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Thu gọn/mở rộng menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {(!isCollapsed || window.innerWidth < 1024) ? (
            <Link to="/admin" className="min-w-0 flex-1">
              <p className="truncate text-lg font-extrabold tracking-tight text-primary">
                {BRAND.name}
              </p>
              <p className="truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Admin Console
              </p>
            </Link>
          ) : null}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden py-4">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.to === "/admin"
                ? location.pathname === "/admin"
                : location.pathname.startsWith(item.to);

            return (
              <Link
                key={item.id}
                to={item.to}
                className={`flex items-center rounded-lg text-sm transition-colors ${navButtonBase} ${
                  isActive
                    ? "bg-accent font-bold text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  className={`h-5 w-5 shrink-0 ${isActive ? "text-primary" : ""}`}
                />
                {(!isCollapsed || window.innerWidth < 1024) ? (
                  <span className="truncate">{item.label}</span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-3">
          <div
            className={`rounded-lg border border-border bg-background/60 ${
              isCollapsed ? "p-2" : "p-3"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-40" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              {(!isCollapsed || window.innerWidth < 1024) ? (
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-foreground">
                    Hệ thống ổn định
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    Backend, AI, Database online
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-20 shrink-0 items-center justify-between gap-4 border-b border-border bg-card px-4 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden flex-shrink-0"
              title="Mở menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              {title ? (
                <h1 className="truncate text-lg sm:text-2xl font-extrabold tracking-tight text-foreground">
                  {title}
                </h1>
              ) : null}
              {description ? (
                <p className="mt-0.5 line-clamp-1 text-xs sm:text-sm text-muted-foreground">
                  {description}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {actions ? (
              <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
                {actions}
              </div>
            ) : null}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen((value) => !value)}
                className="flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-2 text-sm font-semibold text-foreground hover:bg-muted"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-xs font-extrabold text-primary">
                  {displayName.charAt(0).toUpperCase()}
                </span>
                <span className="hidden max-w-[120px] truncate xl:block">
                  {displayName}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>

              {isUserMenuOpen ? (
                <div className="absolute right-0 top-12 z-30 w-72 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
                  <div className="border-b border-border px-4 py-3">
                    <p className="text-sm font-bold text-foreground">
                      {displayName}
                    </p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {displayEmail}
                    </p>
                  </div>
                  <div className="p-2">
                    <button
                      type="button"
                      onClick={logout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
                    >
                      <LogOut className="h-4 w-4" />
                      Đăng xuất
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5">
          <div className={fullWidth ? "w-full" : "mx-auto max-w-7xl"}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
