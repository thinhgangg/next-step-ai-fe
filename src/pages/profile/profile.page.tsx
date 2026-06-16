import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import {
  BriefcaseBusiness,
  ExternalLink,
  Github,
  Linkedin,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Target,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/shared/ui/app-shell";
import { useSession } from "@/features/auth/session/session.model";
import { useAvatarFile } from "@/features/profile/avatar.model";
import {
  type ProfilePreferences,
  formatSalaryRange,
  useProfilePreferences,
} from "@/features/profile/profile-preferences.model";
import { formatExperienceType, formatWorkStyle } from "@/shared/lib/job-format";

function PageCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`flex flex-col rounded-xl border border-border bg-card shadow-sm ${className}`}
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
    <div className="grid grid-cols-1 sm:grid-cols-[24px_180px_1fr] items-start sm:items-center gap-1.5 sm:gap-3 border-b border-border py-3 last:border-b-0">
      <div className="flex items-center gap-2 text-muted-foreground sm:contents">
        <Icon className="h-4 w-4 shrink-0" />
        <span className="text-sm font-medium sm:font-normal">{label}</span>
      </div>
      <span className="min-w-0 sm:truncate text-sm font-semibold text-foreground pl-6 sm:pl-0">
        {value || "Chưa cập nhật"}
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
    return <InfoRow icon={Icon} label={label} value="Chưa cập nhật" />;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="grid grid-cols-1 sm:grid-cols-[24px_180px_1fr_auto] items-start sm:items-center gap-1.5 sm:gap-3 border-b border-border py-3 text-sm last:border-b-0 hover:text-primary"
    >
      <div className="flex items-center gap-2 text-muted-foreground sm:contents">
        <Icon className="h-4 w-4 shrink-0" />
        <span className="font-medium sm:font-normal">{label}</span>
      </div>
      <span className="min-w-0 truncate font-semibold pl-6 sm:pl-0">{url}</span>
      <ExternalLink className="h-4 w-4 shrink-0 self-center hidden sm:block" />
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

  return date.toLocaleString("vi-VN", {
    month: "numeric",
    year: "numeric",
  });
}

function getMonthDuration(
  startDate?: string | null,
  endDate?: string | null,
  isCurrent?: boolean | null,
) {
  const start = parseYearMonth(startDate);
  const end = isCurrent
    ? {
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
      }
    : parseYearMonth(endDate);

  if (!start || !end) return null;

  const months = (end.year - start.year) * 12 + (end.month - start.month) + 1;

  if (months <= 0) return null;

  if (months < 12) {
    return `${months} tháng`;
  }

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (remainingMonths === 0) {
    return `${years} năm`;
  }

  return `${years} năm ${remainingMonths} tháng`;
}

function formatExperienceDate(
  startDate?: string | null,
  endDate?: string | null,
  isCurrent?: boolean | null,
) {
  if (!startDate && !endDate && !isCurrent) return "Chưa cập nhật thời gian";

  const start = startDate
    ? formatYearMonth(startDate)
    : "Bắt đầu không xác định";

  if (!endDate && !isCurrent) {
    return start;
  }

  const end = isCurrent ? "Hiện tại" : formatYearMonth(endDate);
  const duration = getMonthDuration(startDate, endDate, isCurrent);

  return duration ? `${start} - ${end} - ${duration}` : `${start} - ${end}`;
}

function getExperienceSortValue(
  experience: ProfilePreferences["experiences"][number],
) {
  if (experience.isCurrent) return Number.MAX_SAFE_INTEGER;

  const parsed = parseYearMonth(experience.endDate || experience.startDate);

  if (!parsed) return 0;

  return parsed.year * 12 + parsed.month;
}

export function ProfilePage() {
  const { user } = useSession();
  const { profile } = useProfilePreferences(user);
  const { avatarSrc } = useAvatarFile(user?.avatar);
  const [hasAvatarLoadError, setHasAvatarLoadError] = useState(false);
  const navigate = useNavigate();
  const displayName = profile.fullName || "Người dùng chưa cập nhật tên";
  const avatarFallback = displayName.charAt(0).toUpperCase() || "U";
  const visibleAvatarSrc = hasAvatarLoadError ? null : avatarSrc;

  useEffect(() => {
    setHasAvatarLoadError(false);
  }, [avatarSrc]);
  const headline =
    profile.currentRole ||
    profile.careerGoals.targetRole ||
    "Chưa cập nhật vị trí công việc";
  const sortedExperiences = [...profile.experiences].sort(
    (a, b) => getExperienceSortValue(b) - getExperienceSortValue(a),
  );

  return (
    <AppShell
      fullWidth
      headerTitle="Hồ sơ cá nhân"
      headerDescription="Cập nhật thông tin cá nhân, kỹ năng và định hướng nghề nghiệp để hệ thống gợi ý phù hợp hơn."
    >
      <div className="mx-auto max-w-[1480px] space-y-5">
        {/* Avatar Card — full width */}
        <PageCard className="p-5">
          <div className="grid gap-5 md:grid-cols-[120px_1fr_auto] md:items-center">
            <div className="mx-auto flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-primary/20 bg-primary/10 text-4xl font-extrabold text-primary md:mx-0">
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

            <div className="min-w-0 text-center md:text-left">
              <h2 className="truncate text-2xl font-extrabold text-foreground">
                {displayName}
              </h2>

              <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground md:justify-start">
                <span className="inline-flex items-center gap-2">
                  <BriefcaseBusiness className="h-4 w-4" />
                  {headline}
                </span>

                <span className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {profile.location || "Chưa cập nhật địa điểm"}
                </span>
              </div>
            </div>

            <div className="flex justify-center md:justify-end">
              <button
                onClick={() => navigate({ to: "/settings" })}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <Pencil className="h-4 w-4" />
                Chỉnh sửa hồ sơ
              </button>
            </div>
          </div>
        </PageCard>

        {/* Main layout */}
        <div className="grid gap-5 xl:grid-cols-[2fr_2fr] xl:items-start">
          {/* Main column */}
          <div className="flex flex-col gap-5">
            {/* Profile Overview */}
            <PageCard className="p-5">
              <h2 className="mb-4 text-base font-bold text-foreground">
                Tổng quan hồ sơ
              </h2>
              <div className="mb-3 border-b border-border pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Thông tin cá nhân
              </div>
              <InfoRow icon={Mail} label="Email" value={profile.email} />
              <InfoRow
                icon={Phone}
                label="Số điện thoại"
                value={profile.phone}
              />
              <InfoRow
                icon={MapPin}
                label="Địa điểm"
                value={profile.location}
              />

              <div className="mb-3 mt-5 border-b border-border pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Tóm tắt nghề nghiệp
              </div>
              <InfoRow
                icon={BriefcaseBusiness}
                label="Vị trí hiện tại"
                value={profile.currentRole}
              />
              <InfoRow
                icon={Target}
                label="Kinh nghiệm"
                value={
                  profile.experienceYears !== null
                    ? `${profile.experienceYears} năm`
                    : null
                }
              />
            </PageCard>

            {/* Experience */}
            <PageCard className="p-5">
              <h2 className="mb-4 text-base font-bold text-foreground">
                Kinh nghiệm
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
                        {/* Header */}
                        <div className="grid grid-cols-[auto_1fr] gap-3">
                          {/* Icon */}
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background">
                            <BriefcaseBusiness className="h-5 w-5 text-muted-foreground" />
                          </div>

                          {/* Info */}
                          <div className="flex flex-col sm:grid sm:grid-cols-[1fr_auto] items-start gap-2 w-full min-w-0">
                            <div className="min-w-0">
                              <h3 className="text-sm font-bold text-foreground break-words">
                                {experience.title ||
                                  "Kinh nghiệm không có tiêu đề"}
                              </h3>
                              <p className="mt-0.5 text-sm text-muted-foreground break-words">
                                {experience.organization ||
                                  "Chưa cập nhật tổ chức"}
                              </p>
                            </div>
                            <div className="flex flex-row flex-wrap items-center gap-1.5 sm:flex-col sm:items-end sm:text-right mt-1 sm:mt-0">
                              {experience.type ? (
                                <span className="inline-block rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                                  {formatExperienceType(experience.type)}
                                </span>
                              ) : null}
                              <p className="text-xs text-muted-foreground">
                                {formatExperienceDate(
                                  experience.startDate,
                                  experience.endDate,
                                  experience.isCurrent,
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        {experience.description ? (
                          <p className="mt-4 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                            {experience.description}
                          </p>
                        ) : null}

                        {/* Tech tags */}
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
                <EmptyState label="Chưa có kinh nghiệm nào được lưu." />
              )}
            </PageCard>
          </div>

          {/* Side column */}
          <div className="flex flex-col gap-5">
            {/* Skills */}
            <PageCard className="p-5">
              <h2 className="mb-4 text-base font-bold text-foreground">
                Kỹ năng
              </h2>
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
                <EmptyState label="Chưa có kỹ năng nào được lưu." />
              )}
            </PageCard>

            {/* Online Profiles */}
            <PageCard className="p-5">
              <h2 className="mb-4 text-base font-bold text-foreground">
                Liên kết cá nhân
              </h2>
              <LinkRow
                icon={Linkedin}
                label="LinkedIn"
                url={profile.linkedinUrl}
              />
              <LinkRow icon={Github} label="GitHub" url={profile.githubUrl} />
              <LinkRow
                icon={ExternalLink}
                label="Portfolio"
                url={profile.portfolioUrl}
              />
            </PageCard>

            {/* Career Goals */}
            <PageCard className="p-5">
              <h2 className="mb-4 text-base font-bold text-foreground">
                Mục tiêu nghề nghiệp
              </h2>
              <InfoRow
                icon={Target}
                label="Vị trí mục tiêu"
                value={profile.careerGoals.targetRole}
              />
              <InfoRow
                icon={MapPin}
                label="Địa điểm mong muốn"
                value={profile.careerGoals.preferredLocation}
              />
              <InfoRow
                icon={BriefcaseBusiness}
                label="Hình thức làm việc"
                value={formatWorkStyle(profile.careerGoals.workStyle)}
              />
              <InfoRow
                icon={Target}
                label="Mức lương mong muốn"
                value={formatSalaryRange(profile)}
              />
              <InfoRow
                icon={Target}
                label="Mục tiêu"
                value={profile.careerGoals.goal}
              />
            </PageCard>

            {/* Suggested Improvements */}
            <PageCard className="p-5">
              <h2 className="mb-4 text-base font-bold text-foreground">
                Đề xuất cải thiện
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
                <EmptyState label="Chưa có đề xuất cải thiện nào được lưu." />
              )}
            </PageCard>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
