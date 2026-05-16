import type { ComponentType, ReactNode } from "react";
import {
  BriefcaseBusiness,
  ExternalLink,
  Github,
  Linkedin,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Sparkles,
  Target,
  User,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/shared/ui/app-shell";
import { useSession } from "@/features/auth/session/session.model";
import {
  type ProfilePreferences,
  formatSalaryRange,
  formatWorkStyle,
  useProfilePreferences,
} from "@/features/profile/profile-preferences.model";

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

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-background/50 p-5 text-sm text-muted-foreground">
      {label}
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
  value?: string | number | null;
}) {
  return (
    <div className="grid grid-cols-[24px_150px_1fr] items-center gap-3 border-b border-border py-3 last:border-b-0">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-sm font-semibold text-foreground">
        {value || "Not provided"}
      </span>
    </div>
  );
}

function LinkRow({
  icon: Icon,
  label,
  url,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  url?: string | null;
}) {
  if (!url) {
    return <InfoRow icon={Icon} label={label} value="Not provided" />;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="grid grid-cols-[24px_150px_1fr_auto] items-center gap-3 border-b border-border py-3 text-sm last:border-b-0 hover:text-primary"
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate font-semibold">{url}</span>
      <ExternalLink className="h-4 w-4" />
    </a>
  );
}

function parseYearMonth(value?: string | null) {
  if (!value) return null;

  const match = value.match(/^(\d{4})-(\d{1,2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);

  if (!year || month < 1 || month > 12) return null;

  return { year, month };
}

function formatYearMonth(value?: string | null) {
  const parsed = parseYearMonth(value);
  if (!parsed) return value || "";

  const date = new Date(parsed.year, parsed.month - 1);

  return date.toLocaleString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function getMonthDuration(
  startDate?: string | null,
  endDate?: string | null,
  isCurrent?: boolean | null,
) {
  const start = parseYearMonth(startDate);
  const now = new Date();

  const end = isCurrent
    ? {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
      }
    : parseYearMonth(endDate);

  if (!start || !end) return null;

  const months = (end.year - start.year) * 12 + (end.month - start.month) + 1;

  if (months <= 0) return null;

  if (months < 12) {
    return `${months} month${months > 1 ? "s" : ""}`;
  }

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (remainingMonths === 0) {
    return `${years} year${years > 1 ? "s" : ""}`;
  }

  return `${years} year${years > 1 ? "s" : ""} ${remainingMonths} month${
    remainingMonths > 1 ? "s" : ""
  }`;
}

function formatExperienceDate(
  startDate?: string | null,
  endDate?: string | null,
  isCurrent?: boolean | null,
) {
  if (!startDate && !endDate && !isCurrent) return "Date not provided";

  const start = startDate ? formatYearMonth(startDate) : "Start";

  if (!endDate && !isCurrent) {
    return start;
  }

  const end = isCurrent ? "Present" : formatYearMonth(endDate);
  const duration = getMonthDuration(startDate, endDate, isCurrent);

  return duration ? `${start} - ${end} · ${duration}` : `${start} - ${end}`;
}

function getExperienceSortValue(
  experience: ProfilePreferences["experiences"][number],
) {
  if (experience.isCurrent) return Number.MAX_SAFE_INTEGER;

  const parsed = parseYearMonth(experience.endDate || experience.startDate);

  if (!parsed) return 0;

  return parsed.year * 12 + parsed.month;
}

function formatExperienceType(type?: string | null) {
  if (!type) return null;

  const map: Record<string, string> = {
    WORK: "Full-time",
    FULL_TIME: "Full-time",
    PART_TIME: "Part-time",
    INTERNSHIP: "Internship",
    FREELANCE: "Freelance",
    PROJECT: "Project",
    CONTRACT: "Contract",
  };

  return map[type] || type;
}

export function ProfilePage() {
  const { user } = useSession();
  const { profile } = useProfilePreferences(user);
  const navigate = useNavigate();
  const displayName = profile.fullName || "Unnamed user";
  const avatarFallback = displayName.charAt(0).toUpperCase() || "U";
  const sortedExperiences = [...profile.experiences].sort(
    (a, b) => getExperienceSortValue(b) - getExperienceSortValue(a),
  );

  return (
    <AppShell fullWidth>
      <div className="mx-auto max-w-[1480px] space-y-5">
        <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Candidate profile
            </p>
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              Profile
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Information saved on your account and used for matching,
              recommendations, and profile review.
            </p>
          </div>
          <button
            onClick={() => navigate({ to: "/settings" })}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Pencil className="h-4 w-4" />
            Edit profile
          </button>
        </section>

        <PageCard className="p-5">
          <div className="grid gap-5 md:grid-cols-[120px_1fr] md:items-center">
            <div className="mx-auto flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-primary/20 bg-primary/10 text-4xl font-black text-primary md:mx-0">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                avatarFallback
              )}
            </div>
            <div className="min-w-0 text-center md:text-left">
              <h2 className="text-2xl font-black text-foreground">
                {displayName}
              </h2>
              <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
                <span className="inline-flex items-center gap-2">
                  <BriefcaseBusiness className="h-4 w-4" />
                  {profile.currentRole || "Role not provided"}
                </span>
                <span className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {profile.location || "Location not provided"}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  {profile.experienceYears !== null
                    ? `${profile.experienceYears} years`
                    : "Experience not provided"}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {profile.email || "Email not provided"}
                </span>
              </div>
            </div>
          </div>
        </PageCard>

        <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
          <PageCard className="p-5">
            <h2 className="mb-4 text-base font-bold text-foreground">
              Account information
            </h2>
            <InfoRow icon={User} label="Full name" value={profile.fullName} />
            <InfoRow icon={Mail} label="Email" value={profile.email} />
            <InfoRow icon={Phone} label="Phone" value={profile.phone} />
            <InfoRow icon={MapPin} label="Location" value={profile.location} />
          </PageCard>

          <PageCard className="p-5">
            <h2 className="mb-4 text-base font-bold text-foreground">
              Career information
            </h2>
            <InfoRow
              icon={BriefcaseBusiness}
              label="Current role"
              value={profile.currentRole}
            />
            <InfoRow
              icon={Target}
              label="Experience"
              value={
                profile.experienceYears !== null
                  ? `${profile.experienceYears} years`
                  : null
              }
            />
            <InfoRow
              icon={Target}
              label="Target salary"
              value={formatSalaryRange(profile)}
            />
            <InfoRow
              icon={BriefcaseBusiness}
              label="Work style"
              value={formatWorkStyle(profile.workStyle)}
            />
          </PageCard>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
          <PageCard className="p-5">
            <h2 className="mb-4 text-base font-bold text-foreground">Links</h2>
            <LinkRow icon={Github} label="GitHub" url={profile.githubUrl} />
            <LinkRow
              icon={Linkedin}
              label="LinkedIn"
              url={profile.linkedinUrl}
            />
            <LinkRow
              icon={ExternalLink}
              label="Portfolio"
              url={profile.portfolioUrl}
            />
          </PageCard>

          <PageCard className="p-5">
            <h2 className="mb-4 text-base font-bold text-foreground">Skills</h2>
            {profile.skills.length ? (
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-primary/10 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <EmptyState label="No skills saved yet." />
            )}
          </PageCard>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
          <PageCard className="p-5">
            <h2 className="mb-4 text-base font-bold text-foreground">
              Experience
            </h2>
            {sortedExperiences.length ? (
              <div>
                {sortedExperiences.map((experience, index) => (
                  <div
                    key={experience.id}
                    className="relative grid grid-cols-[22px_1fr] gap-4 pb-5 last:pb-0"
                  >
                    {index < sortedExperiences.length - 1 ? (
                      <span className="absolute left-[10px] top-6 h-[calc(100%-24px)] w-px bg-border" />
                    ) : null}
                    <span className="relative z-10 mt-1 h-5 w-5 rounded-full border-4 border-primary/15 bg-primary" />
                    <div className="rounded-xl border border-border bg-background/50 p-4">
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-foreground">
                          {experience.title || "Untitled experience"}
                        </h3>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {[
                            experience.organization,
                            formatExperienceType(experience.type),
                          ]
                            .filter(Boolean)
                            .join(" · ") || "Organization not provided"}
                        </p>

                        <p className="mt-1 text-xs font-medium text-muted-foreground">
                          {formatExperienceDate(
                            experience.startDate,
                            experience.endDate,
                            experience.isCurrent,
                          )}
                        </p>
                      </div>

                      {experience.description ? (
                        <p className="mt-4 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                          {experience.description}
                        </p>
                      ) : null}

                      {experience.technologies?.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {experience.technologies.map((technology) => (
                            <span
                              key={technology}
                              className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                            >
                              {technology}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState label="No experience saved yet." />
            )}
          </PageCard>

          <div className="space-y-5">
            <PageCard className="p-5">
              <h2 className="mb-4 text-base font-bold text-foreground">
                Career goals
              </h2>
              <InfoRow
                icon={Target}
                label="Target role"
                value={profile.careerGoals.targetRole}
              />
              <InfoRow
                icon={MapPin}
                label="Preferred location"
                value={profile.careerGoals.preferredLocation}
              />
              <InfoRow
                icon={BriefcaseBusiness}
                label="Work style"
                value={formatWorkStyle(profile.careerGoals.workStyle)}
              />
              <InfoRow
                icon={Target}
                label="Goal"
                value={profile.careerGoals.goal}
              />
            </PageCard>

            <PageCard className="p-5">
              <h2 className="mb-4 text-base font-bold text-foreground">
                Suggested improvements
              </h2>
              {profile.suggestedImprovements.length ? (
                <div className="space-y-3">
                  {profile.suggestedImprovements.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/50 p-3"
                    >
                      <span className="text-sm font-medium text-foreground">
                        {item.title}
                      </span>
                      <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold uppercase text-muted-foreground">
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState label="No improvement suggestions saved yet." />
              )}
            </PageCard>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
