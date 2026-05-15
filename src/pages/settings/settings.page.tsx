import type { ComponentType, ReactNode } from "react";
import {
  Bell,
  Camera,
  CheckCircle2,
  Crown,
  Github,
  Globe2,
  Linkedin,
  Lock,
  LogOut,
  Mail,
  Moon,
  Shield,
  Sparkles,
  Sun,
  Trash2,
  User,
} from "lucide-react";
import { AppShell } from "@/shared/ui/app-shell";
import { useSession } from "@/features/auth/session/session.model";

function PageCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-border bg-card shadow-sm ${className}`}
    >
      {children}
    </section>
  );
}

function SettingRow({
  icon: Icon,
  title,
  description,
  enabled = true,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  enabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-4 last:border-b-0">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <button
        className={`relative h-7 w-12 rounded-full transition ${
          enabled ? "bg-primary" : "bg-muted"
        }`}
        aria-label={title}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-card shadow transition ${
            enabled ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[140px_1fr_auto] items-center gap-3 border-b border-border py-4 last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-sm font-semibold text-foreground">
        {value}
      </span>
      <button className="text-sm font-semibold text-primary hover:text-primary/80">
        Edit
      </button>
    </div>
  );
}

export function SettingsPage() {
  const { user, logout } = useSession();
  const displayName = user?.name?.trim() || "Your account";
  const displayEmail = user?.email?.trim() || "Not provided";
  const avatarFallback = displayName.charAt(0).toUpperCase() || "U";

  return (
    <AppShell fullWidth>
      <div className="mx-auto max-w-[1480px] space-y-5">
        <section>
          <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Account preferences
          </p>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            Settings
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Manage account details, notifications, security, integrations, and
            display preferences.
          </p>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1fr_320px_1fr]">
          <PageCard className="p-5">
            <h2 className="mb-4 text-base font-bold text-foreground">
              Account information
            </h2>
            <InfoRow label="Full name" value={displayName} />
            <InfoRow label="Email" value={displayEmail} />
            <InfoRow label="Phone" value="Not provided" />
            <InfoRow label="Location" value="Ho Chi Minh City, Vietnam" />
            <InfoRow label="Password" value="****************" />
          </PageCard>

          <PageCard className="p-5 text-center">
            <h2 className="mb-4 text-left text-base font-bold text-foreground">
              Avatar
            </h2>
            <div className="relative mx-auto flex h-32 w-32 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-5xl font-black text-primary">
              {avatarFallback}
              <button className="absolute bottom-1 right-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-primary shadow-sm">
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              JPG, PNG, or GIF. Max 5MB.
            </p>
            <button className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-lg border border-primary/30 bg-card px-4 text-sm font-semibold text-primary hover:bg-primary/5">
              Change photo
            </button>
          </PageCard>

          <PageCard className="p-5">
            <h2 className="mb-2 text-base font-bold text-foreground">
              Notifications
            </h2>
            <SettingRow
              icon={Bell}
              title="New job matches"
              description="Notify me when new matching jobs are found."
            />
            <SettingRow
              icon={CheckCircle2}
              title="CV analysis updates"
              description="Notify me when an analysis is complete."
            />
            <SettingRow
              icon={Mail}
              title="Email marketing"
              description="Receive product updates and offers."
              enabled={false}
            />
          </PageCard>
        </section>

        <section className="grid gap-5 xl:grid-cols-3">
          <PageCard className="p-5">
            <h2 className="mb-2 text-base font-bold text-foreground">
              Security
            </h2>
            <div className="space-y-3">
              {[
                [Lock, "Change password", "Update your password regularly."],
                [
                  Shield,
                  "Two-factor authentication",
                  "Add extra account protection.",
                ],
                [User, "Login sessions", "Review active devices."],
              ].map(([Icon, title, description]) => {
                const TypedIcon = Icon as ComponentType<{
                  className?: string;
                }>;
                return (
                  <button
                    key={String(title)}
                    className="flex w-full items-center gap-3 rounded-xl border border-border bg-background/50 p-3 text-left hover:border-primary/30 hover:bg-primary/5"
                  >
                    <TypedIcon className="h-4 w-4 text-primary" />
                    <span>
                      <span className="block text-sm font-semibold text-foreground">
                        {String(title)}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {String(description)}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </PageCard>

          <PageCard className="p-5">
            <h2 className="mb-4 text-base font-bold text-foreground">
              Application preferences
            </h2>
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm text-muted-foreground">
                  Preferred roles
                </span>
                <select className="mt-2 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none">
                  <option>Backend Engineer, DevOps Engineer</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm text-muted-foreground">
                  Preferred location
                </span>
                <select className="mt-2 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none">
                  <option>Ho Chi Minh City, Ha Noi</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm text-muted-foreground">
                  Work style
                </span>
                <select className="mt-2 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none">
                  <option>Hybrid or remote</option>
                </select>
              </label>
            </div>
          </PageCard>

          <PageCard className="p-5">
            <h2 className="mb-2 text-base font-bold text-foreground">
              Connected accounts
            </h2>
            <div className="space-y-3">
              {[
                [Linkedin, "LinkedIn", "Connected"],
                [Github, "GitHub", "Connected"],
                [Globe2, "Google", "Not connected"],
              ].map(([Icon, label, status]) => {
                const TypedIcon = Icon as ComponentType<{
                  className?: string;
                }>;
                const connected = status === "Connected";
                return (
                  <div
                    key={String(label)}
                    className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-b-0"
                  >
                    <span className="flex items-center gap-3 text-sm font-semibold text-foreground">
                      <TypedIcon className="h-4 w-4 text-primary" />
                      {String(label)}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        connected
                          ? "bg-emerald-500/10 text-emerald-700"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {String(status)}
                    </span>
                  </div>
                );
              })}
            </div>
          </PageCard>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
          <PageCard className="p-5">
            <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-foreground">
              <Crown className="h-4 w-4 text-amber-500" />
              Subscription
            </h2>
            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="text-3xl font-black text-primary">Pro</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Unlimited CV analysis, advanced JD matching, and priority
                  recommendations.
                </p>
              </div>
              <button className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                Manage plan
              </button>
            </div>
          </PageCard>

          <PageCard className="p-5">
            <h2 className="mb-4 text-base font-bold text-foreground">
              Interface
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/10 text-sm font-semibold text-primary">
                <Sun className="h-4 w-4" />
                Light
              </button>
              <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-card text-sm font-semibold text-foreground hover:bg-muted">
                <Moon className="h-4 w-4" />
                Dark
              </button>
              <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-card text-sm font-semibold text-foreground hover:bg-muted">
                Auto
              </button>
            </div>
          </PageCard>
        </section>

        <PageCard className="border-destructive/30 bg-destructive/5 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-destructive">
                Danger zone
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                These actions are sensitive and may affect account access.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={logout}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-destructive/30 bg-card px-4 text-sm font-semibold text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
                Log out all devices
              </button>
              <button className="inline-flex h-10 items-center gap-2 rounded-lg bg-destructive px-4 text-sm font-semibold text-destructive-foreground">
                <Trash2 className="h-4 w-4" />
                Delete account
              </button>
            </div>
          </div>
        </PageCard>
      </div>
    </AppShell>
  );
}
