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
  { id: "dashboard", label: "Dashboard", icon: Home, to: "/dashboard" },
  {
    id: "ai-optimize",
    label: "AI Optimize",
    icon: Sparkles,
    to: "/resume-optimizer",
  },
  // { id: "cover-letter", label: "AI Cover Letter", icon: FileText },
  // { id: "linkedin", label: "LinkedIn Scan", icon: Linkedin },
  // { id: "job-tracker", label: "Job Tracker", icon: Calendar },
  { id: "find-jobs", label: "Find Jobs", icon: Search, to: "/jobs" },
  // { id: "resume-builder", label: "Resume Builder", icon: Pencil },
  {
    id: "resume-manager",
    label: "Resume Manager",
    icon: Folder,
    to: "/resume-manager",
  },
  {
    id: "scan-history",
    label: "Scan History",
    icon: History,
    to: "/scan-history",
  },
  {
    id: "profile",
    label: "Profile",
    icon: User,
    to: "/profile",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    to: "/settings",
  },
];

type AppShellProps = {
  children: ReactNode;
  fullWidth?: boolean;
};

const SIDEBAR_COLLAPSED_STORAGE_KEY = "nextstep.sidebar.collapsed";

export function AppShell({ children, fullWidth = false }: AppShellProps) {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return storage.get(SIDEBAR_COLLAPSED_STORAGE_KEY) === "true";
  });
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { logout, user, isSessionLoading } = useSession();
  const { profile } = useProfilePreferences(user);
  const location = useLocation();
  const navigate = useNavigate();
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const displayName = profile.fullName;
  const displayEmail = profile.email;
  const avatarFallback = displayName.charAt(0).toUpperCase() || "U";

  useEffect(() => {
    storage.set(SIDEBAR_COLLAPSED_STORAGE_KEY, String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!userMenuRef.current) return;

      if (!userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const collapsedBtnClass =
    "mx-auto w-10 h-10 rounded-lg flex items-center justify-center";
  const expandedBtnClass =
    "mx-2 w-[calc(100%-16px)] h-10 px-3 rounded-lg flex items-center gap-3 text-left";

  return (
    <div className="flex h-screen bg-background text-foreground font-[Instrument_Sans,sans-serif]">
      <aside
        className={`${
          isCollapsed ? "w-[72px]" : "w-[220px]"
        } bg-card border-r border-border flex flex-col overflow-hidden flex-shrink-0 transition-all duration-300 z-10`}
      >
        <div
          className={`h-16 flex items-center border-b border-border ${isCollapsed ? "justify-center" : "px-3 gap-2"}`}
        >
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors flex-shrink-0"
            title="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {!isCollapsed && (
            <Link
              to="/"
              className="block flex-1 overflow-hidden whitespace-nowrap"
            >
              <div className="text-lg font-bold text-primary tracking-tight truncate">
                {BRAND.name}
              </div>
            </Link>
          )}
        </div>

        <div className="pt-4 pb-2">
          <button
            className={`${
              isCollapsed ? collapsedBtnClass : expandedBtnClass
            } bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors`}
            title={isCollapsed ? "New Scan" : undefined}
          >
            <Plus className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && (
              <span className="whitespace-nowrap">New Scan</span>
            )}
          </button>
        </div>

        <nav className="flex-1 py-2 space-y-1 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.to
              ? location.pathname === item.to
              : item.id === activeTab;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.to) {
                    navigate({ to: item.to });
                    return;
                  }

                  setActiveTab(item.id);
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
                {!isCollapsed && (
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
            title={isCollapsed ? "Help" : undefined}
          >
            <HelpCircle className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="whitespace-nowrap">Help</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 flex-shrink-0">
          <h1 className="text-2xl font-bold text-foreground">
            {isSessionLoading || !displayName
              ? "Welcome"
              : `Welcome, ${displayName}!`}
          </h1>
          <div className="flex items-center gap-3">
            <button className="bg-accent text-accent-foreground border border-primary/20 rounded-full px-4 py-1.5 text-sm font-semibold hover:bg-background transition-colors">
              ⭐ Get 7 days free
            </button>
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-primary cursor-pointer hover:bg-background transition-colors"
              >
                {avatarFallback}
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 top-10 w-72 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-30">
                  <div className="px-4 py-3 border-b border-border flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <User className="w-5 h-5" />
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
                      Account Settings
                    </button>
                    <button
                      type="button"
                      className="w-full px-4 py-2.5 flex items-center gap-2 text-left text-sm text-foreground hover:bg-background"
                    >
                      <Shield className="w-4 h-4" />
                      Privacy Policy
                    </button>
                    <button
                      type="button"
                      className="w-full px-4 py-2.5 flex items-center gap-2 text-left text-sm text-foreground hover:bg-background"
                    >
                      <FileText className="w-4 h-4" />
                      Terms
                    </button>
                  </div>

                  <div className="border-t border-border p-2">
                    <button
                      type="button"
                      onClick={logout}
                      className="w-full px-3 py-2 rounded-lg flex items-center gap-2 text-left text-sm text-destructive hover:bg-destructive/10"
                    >
                      <LogOut className="w-4 h-4" />
                      Log out
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
