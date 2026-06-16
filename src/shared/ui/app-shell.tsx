import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  FileText,
  LogOut,
  HelpCircle,
  Home,
  History,
  Menu,
  Shield,
  Plus,
  Search,
  Settings,
  Sparkles,
  User,
  Folder,
} from "lucide-react";
import { BRAND } from "@/shared/config/brand";
import { storage } from "@/shared/lib/storage";
import { useSession } from "@/features/auth/session/session.model";
import { useAvatarFile } from "@/features/profile/avatar.model";
import { useProfilePreferences } from "@/features/profile/profile-preferences.model";

type NavItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  to?:
    | "/dashboard"
    | "/resume-optimizer"
    | "/resume-manager"
    | "/jobs"
    | "/scan-history"
    | "/profile"
    | "/settings";
};

const navItems: NavItem[] = [
  { id: "dashboard", label: "Bảng điều khiển", icon: Home, to: "/dashboard" },
  {
    id: "ai-optimize",
    label: "Tối ưu bằng AI",
    icon: Sparkles,
    to: "/resume-optimizer",
  },
  { id: "find-jobs", label: "Tìm việc", icon: Search, to: "/jobs" },
  {
    id: "resume-manager",
    label: "Quản lý CV",
    icon: Folder,
    to: "/resume-manager",
  },
  {
    id: "scan-history",
    label: "Lịch sử phân tích",
    icon: History,
    to: "/scan-history",
  },
  {
    id: "profile",
    label: "Hồ sơ",
    icon: User,
    to: "/profile",
  },
  {
    id: "settings",
    label: "Cài đặt",
    icon: Settings,
    to: "/settings",
  },
];

type AppShellProps = {
  children: ReactNode;
  fullWidth?: boolean;
  headerTitle?: ReactNode;
  headerDescription?: ReactNode;
  headerActions?: ReactNode;
};

const SIDEBAR_COLLAPSED_STORAGE_KEY = "nextstep.sidebar.collapsed";

export function AppShell({
  children,
  fullWidth = false,
  headerTitle,
  headerDescription,
  headerActions,
}: AppShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return storage.get(SIDEBAR_COLLAPSED_STORAGE_KEY) === "true";
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [hasAvatarLoadError, setHasAvatarLoadError] = useState(false);
  const { logout, user } = useSession();
  const { profile } = useProfilePreferences(user);
  const { avatarSrc } = useAvatarFile(user?.avatar);
  const location = useLocation();
  const navigate = useNavigate();
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const displayName = profile.fullName || user?.name || "Người dùng";
  const displayEmail = profile.email || user?.email || "";
  const avatarFallback = displayName.charAt(0).toUpperCase();
  const visibleAvatarSrc = hasAvatarLoadError ? null : avatarSrc;

  useEffect(() => {
    setHasAvatarLoadError(false);
  }, [avatarSrc]);
  useEffect(() => {
    storage.set(SIDEBAR_COLLAPSED_STORAGE_KEY, String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (!userMenuRef.current) return;

      if (!userMenuRef.current.contains(event.target as Node)) {
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

  const collapsedBtnClass =
    "mx-auto w-10 h-10 rounded-lg flex items-center justify-center";
  const expandedBtnClass =
    "mx-2 w-[calc(100%-16px)] h-10 px-3 rounded-lg flex items-center gap-3 text-left";

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
          ${isCollapsed ? "lg:w-[72px]" : "lg:w-[220px]"} w-[240px]`}
      >
        <div
          className={`h-20 flex items-center border-b border-border ${
            isCollapsed ? "lg:justify-center" : "px-3 gap-2"
          }`}
        >
          <button
            onClick={() => {
              if (window.innerWidth < 1024) {
                setIsMobileOpen(false);
              } else {
                setIsCollapsed(!isCollapsed);
              }
            }}
            className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors flex-shrink-0"
            title="Thu gọn/mở rộng menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          {(!isCollapsed || window.innerWidth < 1024) && (
            <Link
              to="/"
              className="block flex-1 overflow-hidden whitespace-nowrap"
            >
              <div className="text-xl font-bold text-primary tracking-tight truncate">
                {BRAND.name}
              </div>
            </Link>
          )}
        </div>

        <div className="pt-4 pb-2">
          <button
            onClick={() => navigate({ to: "/resume-optimizer" })}
            className={`${
              isCollapsed ? "lg:collapsedBtnClass" : ""
            } ${isCollapsed ? collapsedBtnClass : expandedBtnClass} bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors`}
            title={isCollapsed ? "Phân tích mới" : undefined}
          >
            <Plus className="w-5 h-5 flex-shrink-0" />
            {(!isCollapsed || window.innerWidth < 1024) && (
              <span className="whitespace-nowrap">Phân tích mới</span>
            )}
          </button>
        </div>

        <nav className="flex-1 py-2 space-y-1 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.to ? location.pathname === item.to : false;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.to) {
                    navigate({ to: item.to });
                  }
                }}
                className={`${
                  isCollapsed ? collapsedBtnClass : expandedBtnClass
                } transition-colors ${
                  isActive
                    ? "bg-accent text-accent-foreground font-semibold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-primary" : ""}`}
                />
                {(!isCollapsed || window.innerWidth < 1024) && (
                  <span className="whitespace-nowrap">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-border py-4">
          <button
            className={`${
              isCollapsed ? collapsedBtnClass : expandedBtnClass
            } text-muted-foreground hover:bg-muted hover:text-foreground transition-colors`}
            title={isCollapsed ? "Trợ giúp" : undefined}
          >
            <HelpCircle className="w-5 h-5 flex-shrink-0" />
            {(!isCollapsed || window.innerWidth < 1024) && (
              <span className="whitespace-nowrap">Trợ giúp</span>
            )}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header
          className="flex h-20 flex-shrink-0 items-center justify-between gap-4 border-b border-border bg-card px-4 sm:px-6"
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden flex-shrink-0"
              title="Mở menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            {headerTitle ? (
              <div className="min-w-0">
                <h1 className="truncate text-lg sm:text-2xl font-extrabold tracking-tight text-foreground">
                  {headerTitle}
                </h1>
                {headerDescription ? (
                  <p className="mt-0.5 line-clamp-1 max-w-3xl text-xs sm:text-sm text-muted-foreground">
                    {headerDescription}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {headerActions ? (
              <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
                {headerActions}
              </div>
            ) : null}
            <button className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 sm:px-4 text-xs sm:text-sm font-semibold text-primary transition-colors hover:bg-primary/15">
              <Sparkles className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Nâng cấp Pro</span>
            </button>
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-sm font-bold text-primary transition-colors hover:bg-primary/15 cursor-pointer"
              >
                {visibleAvatarSrc ? (
                  <img
                    src={visibleAvatarSrc}
                    alt={displayName}
                    onError={() => setHasAvatarLoadError(true)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  avatarFallback
                )}
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 top-10 w-72 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-30">
                  <div className="px-4 py-3 border-b border-border flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {visibleAvatarSrc ? (
                        <img
                          src={visibleAvatarSrc}
                          alt={displayName}
                          onError={() => setHasAvatarLoadError(true)}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        avatarFallback
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {displayName}
                      </p>
                      {displayEmail ? (
                        <p className="text-xs text-muted-foreground">
                          {displayEmail}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="py-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        navigate({ to: "/settings" });
                      }}
                      className="w-full px-4 py-2.5 flex items-center gap-2 text-left text-sm text-foreground hover:bg-background"
                    >
                      <Settings className="w-4 h-4" />
                      Cài đặt tài khoản
                    </button>
                    <button
                      type="button"
                      className="w-full px-4 py-2.5 flex items-center gap-2 text-left text-sm text-foreground hover:bg-background"
                    >
                      <Shield className="w-4 h-4" />
                      Chính sách bảo mật
                    </button>
                    <button
                      type="button"
                      className="w-full px-4 py-2.5 flex items-center gap-2 text-left text-sm text-foreground hover:bg-background"
                    >
                      <FileText className="w-4 h-4" />
                      Điều khoản
                    </button>
                  </div>

                  <div className="border-t border-border p-2">
                    <button
                      type="button"
                      onClick={logout}
                      className="w-full px-3 py-2 rounded-lg flex items-center gap-2 text-left text-sm text-destructive hover:bg-destructive/10"
                    >
                      <LogOut className="w-4 h-4" />
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div
          id="app-shell-scroll-container"
          className="flex-1 overflow-y-auto p-5"
        >
          <div className={fullWidth ? "w-full" : "max-w-6xl mx-auto"}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
