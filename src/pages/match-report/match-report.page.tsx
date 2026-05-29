import { useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  ExternalLink,
  FileText,
  Gauge,
  GraduationCap,
  Lightbulb,
  Loader2,
  MapPin,
  Rocket,
  Save,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AppShell } from "@/shared/ui/app-shell";
import { getLatestAnalysisId } from "@/shared/config/latest-analysis";
import { formatRelativeDate } from "@/shared/lib/date";
import { formatEmploymentType, formatJobLevel } from "@/shared/lib/job-format";
import {
  SCORE_RING_TRACK_COLOR,
  clampScore,
  getScoreBand,
  getScoreColor,
  getScoreTone,
} from "@/shared/lib/score";
import {
  type CvAnalysisResult,
  useCvAnalysisResult,
} from "@/features/cv/model/cv.model";

type Tone = "success" | "warning" | "danger" | "info" | "neutral";
type ReportTab = "overview" | "skills" | "roadmap";

type ScoreMetricItem = {
  label: string;
  value: number;
  icon: LucideIcon;
  note: string;
};

type JobContextWithOptionalDetails = CvAnalysisResult["jobContext"] &
  Partial<{
    company: { name?: string | null } | null;
    companyName: string | null;
    employmentType: string | null;
    salaryMin: number | null;
    salaryMax: number | null;
    currency: string | null;
    postedAt: string | null;
    scrapedAt: string | null;
    applicationDeadline: string | null;
    roleResponsibilities: string | string[] | null;
    skillsQualifications: string | string[] | null;
    benefits: string | string[] | null;
    experience: string | null;
  }>;

function formatSalary(job: JobContextWithOptionalDetails) {
  const { salaryMin, salaryMax, currency = "" } = job;

  if (salaryMin == null && salaryMax == null) return "Chưa cập nhật.";

  const format = (value: number) => new Intl.NumberFormat().format(value);
  const prefix = currency ? `${currency} ` : "";

  if (salaryMin != null && salaryMax != null) {
    return `${prefix}${format(salaryMin)} - ${format(salaryMax)}`;
  }

  if (salaryMin != null) return `${prefix}${format(salaryMin)}+`;
  return `${prefix}Tối đa ${format(salaryMax!)}`;
}

function formatApplicationDeadline(value?: string | null) {
  if (!value) return null;

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return null;

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(timestamp));
}

function splitTextBlock(value?: string | string[] | null) {
  if (Array.isArray(value)) {
    return value.map((line) => line.trim()).filter(Boolean);
  }

  return (
    value
      ?.split(/\r?\n+/)
      .map((line) => line.replace(/\s+$/g, ""))
      .filter(Boolean) ?? []
  );
}

function formatVerdict(value?: string | null) {
  const labels: Record<string, string> = {
    strong_match: "Rất phù hợp",
    potential_match: "Có tiềm năng, cần cải thiện thêm",
    weak_match: "Chưa phù hợp",
  };

  return labels[value ?? ""] ?? "Đánh giá từ AI";
}

function formatWeeks(value?: number | null) {
  if (!value) return "Chưa ước tính";
  if (value < 4) return `${value} tuần`;

  const months = Math.round((value / 4) * 10) / 10;
  return `${value} tuần · khoảng ${months} tháng`;
}

function formatDifficulty(value?: string | null) {
  const labels: Record<string, string> = {
    LOW: "Dễ",
    MEDIUM: "Trung bình",
    HIGH: "Khó",
  };

  return labels[(value ?? "").trim().toUpperCase()] ?? "Chưa xác định";
}

function formatPriority(value?: string | number | null) {
  const labels: Record<string, string> = {
    low: "Thấp",
    medium: "Trung bình",
    high: "Cao",
  };
  const numericLabels: Record<number, string> = {
    1: "Thấp",
    2: "Trung bình",
    3: "Cao",
  };

  if (typeof value === "number") return numericLabels[value] ?? String(value);

  return labels[(value ?? "").trim().toLowerCase()] ?? "Trung bình";
}

function formatGapSize(gap: number) {
  if (gap <= 5) return "Thiếu nhẹ";
  if (gap <= 15) return "Cần cải thiện";
  return "Thiếu đáng kể";
}

function isInternalGapReason(reason?: string | null) {
  if (!reason?.trim()) return true;

  return /JobSkill|importance\s+\d|required in/i.test(reason);
}

function formatGapReason(
  gap: CvAnalysisResult["gapAnalysis"]["skillGap"]["missing"][number],
) {
  if (isInternalGapReason(gap.reason)) return null;

  return gap.reason;
}

function toneClasses(tone: Tone) {
  const map: Record<Tone, string> = {
    success:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    warning:
      "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    danger:
      "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300",
    info: "border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-300",
    neutral: "border-border bg-muted/40 text-muted-foreground",
  };

  return map[tone];
}

function scoreBarClass(score: number) {
  const band = getScoreBand(score);

  if (band === "excellent") return "bg-green-600";
  if (band === "good") return "bg-blue-600";
  if (band === "average") return "bg-amber-500";
  if (band === "low") return "bg-orange-500";
  return "bg-red-500";
}

function compactList<T>(items: T[], limit: number) {
  return {
    visible: items.slice(0, limit),
    hiddenCount: Math.max(0, items.length - limit),
  };
}

function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-border bg-card shadow-sm ${className}`}
    >
      {children}
    </section>
  );
}

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

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/40 p-5 text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function ScoreCircle({
  score,
  verdict,
}: {
  score: number;
  verdict?: string | null;
}) {
  const clamped = clampScore(score);
  const tone = getScoreTone(clamped);

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:text-left">
      <div className="relative h-36 w-36 shrink-0">
        <div
          className="h-36 w-36 rounded-full"
          style={{
            background: `conic-gradient(${getScoreColor(
              clamped,
            )} ${clamped}%, ${SCORE_RING_TRACK_COLOR} ${clamped}% 100%)`,
          }}
        />
        <div className="absolute inset-[10px] flex flex-col items-center justify-center rounded-full bg-card">
          <span className="text-4xl font-extrabold text-foreground">
            {clamped}%
          </span>
          <span className="text-xs font-semibold text-muted-foreground">
            độ phù hợp
          </span>
        </div>
      </div>

      <div>
        <span
          className={`inline-flex rounded-full border px-3 py-1 text-sm font-bold ${toneClasses(tone)}`}
        >
          {formatVerdict(verdict)}
        </span>
        <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-foreground">
          {clamped >= 75
            ? "CV của bạn khá phù hợp với vị trí này"
            : clamped >= 45
              ? "Có tiềm năng nhưng cần cải thiện thêm"
              : "Chưa thật sự phù hợp với vị trí này"}
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          Kết quả này được tổng hợp từ kỹ năng, kinh nghiệm, địa điểm, từ khóa
          trong JD và độ rõ ràng của CV. Hãy ưu tiên cải thiện những điểm ảnh
          hưởng nhiều nhất đến cơ hội ứng tuyển.
        </p>
      </div>
    </div>
  );
}

function SummaryMetric({
  label,
  value,
  note,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  note: string;
  icon: LucideIcon;
  tone: Tone;
}) {
  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <span className={`rounded-xl border p-2 ${toneClasses(tone)}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="text-2xl font-extrabold text-foreground">{value}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{note}</p>
    </Card>
  );
}

function ScoreMetric({ metric }: { metric: ScoreMetricItem }) {
  const score = clampScore(metric.value);

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <metric.icon className="h-4 w-4 text-primary" />
          {metric.label}
        </span>
        <span
          className={`rounded-full border px-2 py-0.5 text-xs font-bold ${toneClasses(getScoreTone(score))}`}
        >
          {score}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${scoreBarClass(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{metric.note}</p>
    </Card>
  );
}

function AdviceColumn({
  title,
  items,
  icon: Icon,
  tone,
}: {
  title: string;
  items?: string[];
  icon: LucideIcon;
  tone: Tone;
}) {
  const visibleItems = (items ?? []).slice(0, 4);

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className={`rounded-xl border p-2 ${toneClasses(tone)}`}>
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="font-bold text-foreground">{title}</h3>
      </div>

      {visibleItems.length ? (
        <ul className="space-y-3">
          {visibleItems.map((item) => (
            <li
              key={item}
              className="rounded-xl bg-muted/50 p-3 text-sm leading-6 text-foreground"
            >
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState>Chưa có ghi chú.</EmptyState>
      )}
    </Card>
  );
}

function SkillGroup({
  title,
  description,
  skills,
  tone,
  icon: Icon,
  limit = 12,
}: {
  title: string;
  description: string;
  skills: string[];
  tone: Tone;
  icon: LucideIcon;
  limit?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? skills : skills.slice(0, limit);
  const hiddenCount = Math.max(0, skills.length - limit);

  return (
    <Card className="p-5">
      <h3 className="mb-4 flex items-center gap-2 font-bold text-foreground">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </h3>

      <p className="mb-4 text-sm leading-6 text-muted-foreground">
        {description}
      </p>

      {visible.length ? (
        <div
          className={`flex flex-wrap gap-2 ${expanded ? "max-h-[220px] overflow-y-auto pr-1" : ""}`}
        >
          {visible.map((skill) => (
            <SkillBadge key={skill} skill={skill} tone={tone} />
          ))}
        </div>
      ) : (
        <EmptyState>Chưa tìm thấy kỹ năng.</EmptyState>
      )}

      {hiddenCount > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          {expanded ? "Thu gọn" : `Xem thêm ${hiddenCount}`}
          <ChevronDown
            className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      ) : null}
    </Card>
  );
}

function SkillBadge({ skill, tone }: { skill: string; tone: Tone }) {
  return (
    <span
      className={`inline-flex max-w-full rounded-full border px-3 py-1.5 text-sm font-semibold ${toneClasses(tone)}`}
      title={skill}
    >
      <span className="truncate">{skill}</span>
    </span>
  );
}

function WeakSkillGroup({
  title,
  description,
  skills,
  icon: Icon,
  limit = 12,
}: {
  title: string;
  description: string;
  skills: CvAnalysisResult["gapAnalysis"]["skillGap"]["weak"];
  icon: LucideIcon;
  limit?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? skills : skills.slice(0, limit);
  const hiddenCount = Math.max(0, skills.length - limit);

  return (
    <Card className="p-5">
      <h3 className="mb-4 flex items-center gap-2 font-bold text-foreground">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </h3>

      <p className="mb-4 text-sm leading-6 text-muted-foreground">
        {description}
      </p>

      {visible.length ? (
        <div
          className={`flex flex-wrap gap-2 ${expanded ? "max-h-[220px] overflow-y-auto pr-1" : ""}`}
        >
          {visible.map((skill) => (
            <WeakSkillBadge key={`${skill.skill}-${skill.gap}`} skill={skill} />
          ))}
        </div>
      ) : (
        <EmptyState>
            Chưa phát hiện kỹ năng nào cần làm nổi bật thêm.
        </EmptyState>
      )}

      {hiddenCount > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          {expanded ? "Thu gọn" : `Xem thêm ${hiddenCount}`}
          <ChevronDown
            className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      ) : null}
    </Card>
  );
}

function WeakSkillBadge({
  skill,
}: {
  skill: CvAnalysisResult["gapAnalysis"]["skillGap"]["weak"][number];
}) {
  const gap = Math.round((skill.gap || 0) * 100);
  const tooltip = `${skill.skill} - ${formatGapSize(
    gap,
  )}. B\u1ed5 sung minh ch\u1ee9ng d\u1ef1 \u00e1n, s\u1ed1 li\u1ec7u, tr\u00e1ch nhi\u1ec7m ho\u1eb7c c\u00f4ng c\u1ee5 \u0111\u00e3 d\u00f9ng cho k\u1ef9 n\u0103ng n\u00e0y.`;

  return (
    <span
      className="inline-flex max-w-full rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-sm font-semibold text-amber-700 dark:text-amber-300"
      title={tooltip}
    >
      <span className="truncate">{skill.skill}</span>
    </span>
  );
}

function GapPriorityCard({
  gap,
  index,
}: {
  gap: CvAnalysisResult["gapAnalysis"]["skillGap"]["missing"][number];
  index: number;
}) {
  const reason = formatGapReason(gap);

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Ưu tiên {index + 1}
        </p>
        <span
          className={`rounded-full border px-2.5 py-1 text-xs font-bold ${toneClasses(gap.importance === "high" ? "danger" : "warning")}`}
        >
          {formatPriority(gap.importance)}
        </span>
      </div>
      <h3 className="text-lg font-bold text-foreground">{gap.skill}</h3>
      {reason ? (
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
          {reason}
        </p>
      ) : null}
    </Card>
  );
}

function RoadmapPhase({
  phase,
}: {
  phase: CvAnalysisResult["roadmap"]["phases"][number];
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [showAllSkills, setShowAllSkills] = useState(false);
  const visibleSkills = showAllSkills ? phase.skills : phase.skills.slice(0, 4);
  const hiddenCount = Math.max(0, phase.skills.length - 4);

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-muted/40"
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-primary">
            Giai đoạn {phase.phase}
          </p>
          <h3 className="mt-1 text-lg font-bold text-foreground">
            {phase.title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {phase.durationWeeks} tuần · {phase.skills.length} kỹ năng trọng tâm
          </p>
        </div>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen ? (
        <div className="border-t border-border p-5">
          <div className="grid gap-3 md:grid-cols-2">
            {visibleSkills.map((skill) => {
              const firstResource = skill.recommendedResources[0];

              return (
                <div
                  key={`${phase.phase}-${skill.skillName}`}
                  className="rounded-xl border border-border bg-muted/40 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-foreground">
                        {skill.skillName}
                      </h4>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {skill.estimatedWeeks} tuần · ưu tiên{" "}
                        {formatPriority(skill.priority)}
                      </p>
                    </div>
                    <span className="rounded-full bg-background px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                      {skill.adjustedHours ?? skill.baselineHours ?? "-"}h
                    </span>
                  </div>

                  <div className="mt-3 rounded-lg bg-background p-3">
                    <p className="line-clamp-1 text-sm font-semibold text-foreground">
                      {firstResource?.title ?? "Đang chờ tài nguyên"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {firstResource?.provider ?? "NextStepAI"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {hiddenCount > 0 ? (
            <button
              type="button"
              onClick={() => setShowAllSkills((value) => !value)}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              {showAllSkills
                ? "Thu gọn kỹ năng"
                : `Xem thêm ${hiddenCount} kỹ năng`}
            </button>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}

function CourseCard({
  course,
}: {
  course: {
    phase: number;
    skillName: string;
    title: string;
    provider?: string | null;
    url?: string | null;
    durationHours?: number | null;
  };
}) {
  const content = (
    <Card className="h-full p-4 transition hover:border-primary/30 hover:shadow-md">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-xs font-bold text-blue-700 dark:text-blue-300">
          {course.provider ?? "Khóa học"}
        </span>
        {course.url ? (
          <ExternalLink className="h-4 w-4 text-muted-foreground" />
        ) : null}
      </div>
      <h3 className="line-clamp-2 text-sm font-bold leading-6 text-foreground">
        {course.title}
      </h3>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="rounded-full bg-muted px-2.5 py-1">
          Giai đoạn {course.phase}
        </span>
        <span className="rounded-full bg-muted px-2.5 py-1">
          {course.skillName}
        </span>
        <span className="rounded-full bg-muted px-2.5 py-1">
          {course.durationHours ?? "-"}h
        </span>
      </div>
    </Card>
  );

  if (!course.url) return content;

  return (
    <a
      href={course.url}
      target="_blank"
      rel="noreferrer"
      className="block h-full"
    >
      {content}
    </a>
  );
}

function InfoCell({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-background/50 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm text-foreground">
        {value || "Chưa cập nhật."}
      </p>
    </div>
  );
}

function JobDescriptionPanel({ analysis }: { analysis: CvAnalysisResult }) {
  const job = analysis.jobContext as JobContextWithOptionalDetails;
  const companyName = job.company?.name ?? job.companyName ?? "Chưa cập nhật.";
  const location =
    job.jobLocation ?? (job.jobIsRemote ? "Remote" : "Chưa cập nhật.");
  const employmentType = formatEmploymentType(job.employmentType);
  const experienceText =
    job.experience?.trim() ||
    (job.jobYearsRequired
      ? `${job.jobYearsRequired} year${job.jobYearsRequired > 1 ? "s" : ""} required`
      : "Chưa cập nhật.");
  const applicationDeadlineText = formatApplicationDeadline(
    job.applicationDeadline,
  );
  const responsibilities = splitTextBlock(job.roleResponsibilities);
  const qualifications = splitTextBlock(job.skillsQualifications);
  const benefits = splitTextBlock(job.benefits);
  const skills = job.jobSkills ?? [];
  const postedDateText =
    job.postedAt || job.scrapedAt
      ? formatRelativeDate(job.postedAt ?? job.scrapedAt)
      : "Chưa cập nhật.";

  /*
   * API/model note: persisted catalog jobs are enriched with the fields below.
   * Uploaded JD scans may still return Not provided until the AI job context
   * extracts company, salary, dates, responsibilities, qualifications,
   * benefits, employmentType, and experience from raw JD text.
   */
  return (
    <aside className="space-y-4 lg:sticky lg:top-24">
      <PageCard className="p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="mb-2 inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              {postedDateText}
            </p>
            <h2 className="text-xl font-extrabold text-foreground">
              {job.title}
            </h2>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">
              {companyName}
            </p>
          </div>
        </div>

        <div className="grid gap-2 text-sm md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <InfoCell label="Địa điểm" value={location} />
          <InfoCell label="Cấp bậc" value={formatJobLevel(job.jobLevel)} />
          <InfoCell label="Hình thức" value={employmentType} />
          <InfoCell label="Mức lương" value={formatSalary(job)} />
          <InfoCell label="Kinh nghiệm" value={experienceText} />
          <InfoCell
            label="Hạn ứng tuyển"
            value={applicationDeadlineText ?? "Chưa cập nhật."}
          />
        </div>

        {job.sourceUrl ? (
          <a
            href={job.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <ExternalLink className="h-4 w-4" />
            Xem JD gốc
          </a>
        ) : null}
      </PageCard>

      <PageCard className="p-5">
        <h3 className="mb-3 text-base font-bold text-foreground">Kỹ năng</h3>
        {skills.length ? (
          <div className="flex flex-wrap gap-2">
            {skills.slice(0, 14).map((skill, index) => (
              <span
                key={`${skill.name}-${index}`}
                className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground"
              >
                {skill.name}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Chưa có kỹ năng nào.</p>
        )}
      </PageCard>

      <PageCard className="p-5">
        <h3 className="mb-3 text-base font-bold text-foreground">Tóm tắt JD</h3>
        <div className="space-y-4 text-sm leading-6 text-foreground">
          {[
            { title: "Trách nhiệm", items: responsibilities },
            { title: "Yêu cầu", items: qualifications },
            { title: "Quyền lợi", items: benefits },
          ].map((section) => (
            <div key={section.title}>
              <h4 className="font-semibold text-primary">{section.title}</h4>
              {section.items.length ? (
                <ul className="mt-1 space-y-1 text-muted-foreground">
                  {section.items.slice(0, 5).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-muted-foreground">Chưa cập nhật.</p>
              )}
            </div>
          ))}
        </div>
      </PageCard>
    </aside>
  );
}

function OverviewTab({ analysis }: { analysis: CvAnalysisResult }) {
  const breakdown = analysis.jobMatch.scoreBreakdown;
  const metrics: ScoreMetricItem[] = [
    {
      label: "Mức khớp kỹ năng",
      value: breakdown.skillMatch,
      icon: Target,
      note: "Số kỹ năng yêu cầu đã được đáp ứng.",
    },
    {
      label: "Điểm ATS",
      value: breakdown.atsReadability ?? 0,
      icon: ShieldCheck,
      note: "Mức độ CV có thể được hệ thống đọc rõ.",
    },
    {
      label: "Địa điểm",
      value: breakdown.locationMatch,
      icon: MapPin,
      note: "Mức khớp giữa địa điểm mong muốn và vị trí tuyển dụng.",
    },
    {
      label: "Kinh nghiệm",
      value: breakdown.experienceMatch,
      icon: TrendingUp,
      note: "Mức khớp giữa kinh nghiệm yêu cầu và hiện tại.",
    },
    {
      label: "Từ khóa",
      value: breakdown.keywordMatch ?? 0,
      icon: Zap,
      note: "Mức trùng khớp giữa ngôn ngữ trong CV và JD.",
    },
  ];

  return (
    <div className="space-y-6">
      <section>
        <SectionHeader
          icon={Sparkles}
          title="Đánh giá từ AI"
          description="Tóm tắt theo góc nhìn nhà tuyển dụng về mức độ phù hợp của CV với JD."
        />
        <div className="grid gap-5 lg:grid-cols-3">
          <AdviceColumn
            title="Điểm mạnh"
            items={analysis.aiReview?.strengths}
            icon={CheckCircle2}
            tone="success"
          />
          <AdviceColumn
            title="Điểm cần lưu ý"
            items={analysis.aiReview?.concerns}
            icon={AlertTriangle}
            tone="danger"
          />
          <AdviceColumn
            title="Khuyến nghị"
            items={analysis.aiReview?.recommendations}
            icon={Lightbulb}
            tone="info"
          />
        </div>
      </section>

      <section>
        <SectionHeader
          icon={Gauge}
          title="Chi tiết điểm số"
          description="Tóm tắt các yếu tố chính tạo nên điểm phù hợp."
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {metrics.map((metric) => (
            <ScoreMetric key={metric.label} metric={metric} />
          ))}
        </div>
      </section>
    </div>
  );
}

function SkillsTab({ analysis }: { analysis: CvAnalysisResult }) {
  const weakSkills = analysis.gapAnalysis.skillGap.weak;
  const topGaps = analysis.gapAnalysis.skillGap.missing.slice(0, 6);

  return (
    <div className="space-y-8">
      <section>
        <SectionHeader
          icon={BriefcaseBusiness}
          title="Phân tích độ phù hợp với JD"
          description="Xem kỹ năng đã thể hiện tốt, kỹ năng còn thiếu và kỹ năng cần làm rõ hơn trong CV."
        />

        <div className="grid gap-5 lg:grid-cols-3">
          <SkillGroup
            title="Kỹ năng đã thể hiện tốt"
            description="Những kỹ năng xuất hiện rõ trong CV và phù hợp với JD."
            skills={analysis.jobMatch.matchedSkills}
            tone="success"
            icon={CheckCircle2}
          />

          <SkillGroup
            title="Kỹ năng chưa thể hiện rõ"
            description="JD có yêu cầu, nhưng CV hiện chưa cho thấy đủ thông tin."
            skills={analysis.jobMatch.missingSkills}
            tone="danger"
            icon={CircleAlert}
          />

          <WeakSkillGroup
            title="Kỹ năng nên làm nổi bật hơn"
            description="CV đã nhắc đến, nhưng cần thêm dự án, số liệu hoặc ví dụ cụ thể."
            skills={weakSkills}
            icon={TrendingUp}
          />
        </div>
      </section>

      <section>
        <SectionHeader
          icon={Lightbulb}
          title="Những kỹ năng nên ưu tiên cải thiện"
          description="Hãy ưu tiên những kỹ năng ảnh hưởng nhiều nhất đến kết quả ứng tuyển, thay vì cố gắng cải thiện tất cả cùng lúc."
        />

        {topGaps.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {topGaps.map((gap, index) => (
              <GapPriorityCard
                key={`${gap.skill}-${gap.reason}`}
                gap={gap}
                index={index}
              />
            ))}
          </div>
        ) : (
          <EmptyState>Chưa có khoảng trống lớn.</EmptyState>
        )}
      </section>
    </div>
  );
}

function RoadmapTab({ analysis }: { analysis: CvAnalysisResult }) {
  const courses = useMemo(
    () =>
      analysis.roadmap.phases
        .flatMap((phase) =>
          phase.skills.flatMap((skill) =>
            skill.recommendedResources.map((resource) => ({
              phase: phase.phase,
              skillName: skill.skillName,
              title: resource.title,
              provider: resource.provider,
              url: resource.url,
              durationHours: resource.durationHours,
            })),
          ),
        )
        .slice(0, 6),
    [analysis.roadmap.phases],
  );

  return (
    <div className="space-y-6">
      <section>
        <SectionHeader
          icon={Rocket}
          title="Lộ trình cải thiện CV và kỹ năng"
          description="Kế hoạch ngắn gọn theo từng giai đoạn. Mở từng giai đoạn khi cần xem chi tiết."
        />
        {analysis.roadmap.phases.length ? (
          <div className="space-y-4">
            {analysis.roadmap.phases.map((phase) => (
              <RoadmapPhase key={phase.phase} phase={phase} />
            ))}
          </div>
        ) : (
          <EmptyState>Chưa có lộ trình cải thiện kỹ năng.</EmptyState>
        )}
      </section>

      <section>
        <SectionHeader
          icon={GraduationCap}
          title="Tài nguyên học tập gợi ý"
          description="Một vài tài nguyên phù hợp để bạn bắt đầu cải thiện ngay."
        />
        {courses.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <CourseCard
                key={`${course.phase}-${course.skillName}-${course.title}`}
                course={course}
              />
            ))}
          </div>
        ) : (
          <EmptyState>Chưa có khóa học đề xuất.</EmptyState>
        )}
      </section>
    </div>
  );
}

function FinalRecommendation({
  analysis,
  compact = false,
}: {
  analysis: CvAnalysisResult;
  compact?: boolean;
}) {
  const score = clampScore(analysis.jobMatch.score);
  const missingCount = analysis.gapAnalysis.skillGap.missing.length;
  const weakCount = analysis.gapAnalysis.skillGap.weak.length;

  const recommendation =
    score >= 75
      ? "Đây là mức phù hợp cao. Bạn nên ứng tuyển sớm, đồng thời bổ sung kết quả dự án có số liệu trong CV."
      : score >= 45
        ? `Vị trí này có tiềm năng, nhưng nên cải thiện ${weakCount || missingCount} điểm chính trước khi ứng tuyển.`
        : `Hiện mức phù hợp còn thấp. Hãy xử lý ${Math.min(missingCount, 5)} khoảng trống kỹ năng quan trọng nhất hoặc chọn vị trí gần hơn trước.`;

  return (
    <Card className="overflow-hidden bg-primary text-primary-foreground">
      <div
        className={
          compact
            ? "flex flex-col gap-5 p-6"
            : "grid gap-5 p-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center"
        }
      >
        <div className="min-w-0">
          <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide">
            <Sparkles className="h-3.5 w-3.5" />
            Khuyến nghị
          </p>
          <h2 className="max-w-4xl text-2xl font-extrabold tracking-tight">
            {recommendation}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-primary-foreground/80">
            Vào mục Kỹ năng để biết cần cải thiện điểm nào trước, sau đó theo lộ
            trình gợi ý để từng bước nâng chất lượng CV.
          </p>
        </div>

        <div
          className={
            compact
              ? "flex flex-wrap gap-3"
              : "flex flex-wrap gap-3 xl:justify-end"
          }
        >
          <a
            href="/resume-optimizer"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-white/15 px-4 py-2 text-sm font-bold hover:bg-white/20"
          >
            <Sparkles className="h-4 w-4" />
            Phân tích CV khác
          </a>
          <button
            type="button"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-white/15 px-4 py-2 text-sm font-bold hover:bg-white/20"
          >
            <Save className="h-4 w-4" />
            Lưu lộ trình
          </button>
          <a
            href="/jobs"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-bold text-primary hover:bg-white/90"
          >
            Xem thêm việc làm
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </Card>
  );
}

function MatchReportDashboard({ analysis }: { analysis: CvAnalysisResult }) {
  const [activeTab, setActiveTab] = useState<ReportTab>("overview");
  const [showJobDescription, setShowJobDescription] = useState(false);
  const score = clampScore(analysis.jobMatch.score);
  const { visible: visibleMissingSkills } = compactList(
    analysis.jobMatch.missingSkills,
    8,
  );

  return (
    <div className="mx-auto max-w-[1480px] space-y-5">
      <Card className="overflow-hidden p-6 md:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Báo cáo mức độ phù hợp
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-5xl">
              {analysis.jobContext.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-muted-foreground">
              <span className="inline-flex items-center gap-2 text-foreground">
                {analysis.jobContext.companyName ?? "Công ty chưa xác định"}
              </span>
              <span className="hidden h-1 w-1 rounded-full bg-muted-foreground/40 sm:inline-flex" />
              <span>
                CV: {formatJobLevel(analysis.extractedProfile.cvLevel)}
              </span>
              <span className="hidden h-1 w-1 rounded-full bg-muted-foreground/40 sm:inline-flex" />
              <span>JD: {formatJobLevel(analysis.jobContext.jobLevel)}</span>
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground md:text-base md:leading-7">
              {analysis.aiReview?.summary ??
                "NextStepAI đã phân tích CV theo JD đã chọn và chuẩn bị kế hoạch cải thiện trọng tâm."}
            </p>

            <div className="mt-6">
              <ScoreCircle score={score} verdict={analysis.aiReview?.verdict} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <SummaryMetric
              label="Kỹ năng đã khớp"
              value={analysis.jobMatch.matchedSkills.length}
              note="Kỹ năng có trong CV và JD"
              icon={CheckCircle2}
              tone="success"
            />
            <SummaryMetric
              label="Kỹ năng còn thiếu"
              value={analysis.jobMatch.missingSkills.length}
              note={
                visibleMissingSkills.length
                  ? visibleMissingSkills.slice(0, 3).join(", ")
                  : "Không thiếu kỹ năng quan trọng"
              }
              icon={AlertTriangle}
              tone={
                analysis.jobMatch.missingSkills.length ? "danger" : "success"
              }
            />
            <SummaryMetric
              label="Lộ trình cải thiện"
              value={formatWeeks(analysis.roadmap.totalWeeks)}
              note={formatDifficulty(analysis.roadmap.difficultyLevel)}
              icon={Rocket}
              tone="info"
            />
            <SummaryMetric
              label="Địa điểm"
              value={analysis.jobContext.jobLocation || "Chưa xác định"}
              note={
                analysis.jobContext.jobIsRemote ? "Remote" : "On-site or Hybrid"
              }
              icon={MapPin}
              tone="warning"
            />
          </div>
        </div>
      </Card>

      <div className="sticky top-0 z-10 -mx-4 border-y border-border bg-background/90 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <TabButton
              active={activeTab === "overview"}
              onClick={() => setActiveTab("overview")}
            >
              Tổng quan
            </TabButton>
            <TabButton
              active={activeTab === "skills"}
              onClick={() => setActiveTab("skills")}
            >
              Kỹ năng cần cải thiện
            </TabButton>
            <TabButton
              active={activeTab === "roadmap"}
              onClick={() => setActiveTab("roadmap")}
            >
              Lộ trình cải thiện
            </TabButton>
          </div>

          <button
            type="button"
            onClick={() => setShowJobDescription((value) => !value)}
            className={`inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-bold transition ${
              showJobDescription
                ? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/15"
                : "border-border bg-card text-foreground hover:border-primary/30 hover:text-primary"
            }`}
          >
            <FileText className="h-4 w-4" />
            {showJobDescription ? "Ẩn JD" : "Xem JD để đối chiếu"}
          </button>
        </div>
      </div>

      <div
        className={
          showJobDescription
            ? "grid gap-5 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-start xl:grid-cols-[minmax(0,1fr)_430px]"
            : ""
        }
      >
        <main className="min-w-0 space-y-5">
          {activeTab === "overview" ? (
            <OverviewTab analysis={analysis} />
          ) : null}
          {activeTab === "skills" ? <SkillsTab analysis={analysis} /> : null}
          {activeTab === "roadmap" ? <RoadmapTab analysis={analysis} /> : null}

          <FinalRecommendation
            analysis={analysis}
            compact={showJobDescription}
          />
        </main>

        {showJobDescription ? (
          <JobDescriptionPanel analysis={analysis} />
        ) : null}
      </div>
    </div>
  );
}

function ReportState({
  title,
  message,
  tone = "neutral",
  loading = false,
}: {
  title: string;
  message: string;
  tone?: Tone;
  loading?: boolean;
}) {
  return (
    <AppShell fullWidth>
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <Card className="max-w-md p-6 text-center">
          <div
            className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border ${toneClasses(tone)}`}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <AlertTriangle className="h-5 w-5" />
            )}
          </div>
          <h1 className="text-2xl font-extrabold text-foreground">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {message}
          </p>
        </Card>
      </div>
    </AppShell>
  );
}

export function MatchReportPage() {
  const analysisId = getLatestAnalysisId();
  const { analysis, loading, error } = useCvAnalysisResult(analysisId);

  if (!analysisId) {
    return (
      <ReportState
        title="Chưa có báo cáo phù hợp"
        message="Hãy phân tích CV từ bảng điều khiển trước, sau đó quay lại đây để xem kết quả."
      />
    );
  }

  if (loading) {
    return (
      <ReportState
        title="Đang tải báo cáo"
        message="NextStepAI đang tải phân tích CV của bạn."
        tone="info"
        loading
      />
    );
  }

  if (error || !analysis) {
    return (
      <ReportState
        title="Không thể tải báo cáo"
        message="Hiện chưa thể tải phân tích này. Vui lòng thử lại hoặc bắt đầu một phân tích mới."
        tone="danger"
      />
    );
  }

  return (
    <AppShell fullWidth>
      <MatchReportDashboard analysis={analysis} />
    </AppShell>
  );
}
