import type { ComponentType, ReactNode } from "react";
import {
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  Github,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Sparkles,
  Target,
  UploadCloud,
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

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-base font-bold text-foreground">{title}</h2>
      <button className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80">
        <Pencil className="h-3.5 w-3.5" />
        Edit
      </button>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[24px_140px_1fr] items-center gap-3 border-b border-border py-3 last:border-b-0">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-sm font-semibold text-foreground">
        {value}
      </span>
    </div>
  );
}

function SkillPill({ skill }: { skill: string }) {
  return (
    <span className="rounded-full border border-primary/10 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
      {skill}
    </span>
  );
}

export function ProfilePage() {
  const { user } = useSession();
  const displayName = user?.name?.trim() || "Your profile";
  const displayEmail = user?.email?.trim() || "Not provided";
  const avatarFallback = displayName.charAt(0).toUpperCase() || "U";
  const skills = [
    "Python",
    "Django",
    "RESTful API",
    "PostgreSQL",
    "Docker",
    "AWS",
    "Git",
    "CI/CD",
    "Clean Code",
    "OOP",
  ];

  return (
    <AppShell fullWidth>
      <div className="mx-auto max-w-[1480px] space-y-5">
        <section>
          <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Candidate profile
          </p>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            Profile
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Keep your career profile, skills, and target preferences up to date
            for better job recommendations.
          </p>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <PageCard className="p-5">
            <div className="grid gap-6 md:grid-cols-[140px_1fr_auto] md:items-center">
              <div className="relative mx-auto flex h-32 w-32 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-5xl font-black text-primary md:mx-0">
                {avatarFallback}
                <button className="absolute bottom-1 right-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-primary shadow-sm">
                  <UploadCloud className="h-4 w-4" />
                </button>
              </div>

              <div className="min-w-0 text-center md:text-left">
                <h2 className="text-2xl font-black text-foreground">
                  {displayName}
                </h2>
                <p className="mt-2 inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700">
                  Open to work
                </p>
                <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                  <span className="inline-flex items-center gap-2">
                    <BriefcaseBusiness className="h-4 w-4" />
                    Backend Engineer
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Ho Chi Minh City, Vietnam
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Target className="h-4 w-4" />5 years experience
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Target salary: 40 - 60M VND
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                  <Pencil className="h-4 w-4" />
                  Edit profile
                </button>
                <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold text-primary hover:bg-muted">
                  <UploadCloud className="h-4 w-4" />
                  Upload CV
                </button>
              </div>
            </div>
          </PageCard>

          <PageCard className="p-5">
            <h2 className="text-base font-bold text-foreground">
              Profile strength
            </h2>
            <div className="mt-5 flex items-center gap-5">
              <div
                className="relative h-28 w-28 rounded-full"
                style={{
                  background: "conic-gradient(#4f46e5 82%, #e9e7ff 82% 100%)",
                }}
              >
                <div className="absolute inset-[8px] flex flex-col items-center justify-center rounded-full bg-card">
                  <span className="text-3xl font-black text-foreground">
                    82%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    complete
                  </span>
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  Your profile is ready for better matches.
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Add certificates and portfolio links to improve recruiter
                  confidence.
                </p>
              </div>
            </div>
          </PageCard>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1fr_1fr_360px]">
          <PageCard className="p-5">
            <SectionTitle title="Basic information" />
            <InfoRow icon={User} label="Full name" value={displayName} />
            <InfoRow icon={Mail} label="Email" value={displayEmail} />
            <InfoRow icon={Phone} label="Phone" value="Not provided" />
            <InfoRow
              icon={MapPin}
              label="Current location"
              value="Ho Chi Minh City, Vietnam"
            />
            <InfoRow icon={Github} label="GitHub" value="Not connected" />
          </PageCard>

          <PageCard className="p-5">
            <SectionTitle title="Core skills" />
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <SkillPill key={skill} skill={skill} />
              ))}
            </div>
          </PageCard>

          <PageCard className="p-5">
            <h2 className="text-base font-bold text-foreground">
              Suggested improvements
            </h2>
            <div className="mt-4 space-y-3">
              {[
                "Add a short professional summary.",
                "Connect GitHub or portfolio.",
                "Add measurable project outcomes.",
                "Update latest work experience.",
              ].map((item, index) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-xl border border-border bg-background/50 p-3 text-sm"
                >
                  <CheckCircle2
                    className={`mt-0.5 h-4 w-4 ${
                      index < 2 ? "text-emerald-600" : "text-amber-600"
                    }`}
                  />
                  <span className="text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </PageCard>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
          <PageCard className="p-5">
            <SectionTitle title="Experience highlights" />
            <div className="space-y-4">
              {[
                ["Backend Engineer", "VNG Corporation", "2022 - Present"],
                ["Software Engineer", "FPT Software", "2020 - 2022"],
                ["Junior Developer", "TMA Solutions", "2018 - 2020"],
              ].map(([role, company, time]) => (
                <div
                  key={`${role}-${company}`}
                  className="rounded-xl border border-border bg-background/50 p-4"
                >
                  <h3 className="font-bold text-foreground">{role}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {company} - {time}
                  </p>
                </div>
              ))}
            </div>
          </PageCard>

          <PageCard className="p-5">
            <SectionTitle title="Career goals" />
            <div className="grid gap-3 text-sm">
              {[
                ["Target role", "Backend Engineer"],
                ["Preferred location", "Ho Chi Minh City"],
                ["Work style", "Hybrid or remote"],
                ["Goal", "Senior Backend Engineer in 12 months"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="grid grid-cols-[160px_1fr] gap-3 border-b border-border py-3 last:border-b-0"
                >
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-semibold text-foreground">{value}</span>
                </div>
              ))}
            </div>
          </PageCard>
        </section>
      </div>
    </AppShell>
  );
}
