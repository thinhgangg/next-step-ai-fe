import { type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  BriefcaseBusiness,
  Clock3,
  FileSearch,
  FileText,
  History,
  Loader2,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  UploadCloud,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AppShell } from "@/shared/ui/app-shell";
import {
  useCvAnalysisHistory,
  useCvAnalysisResult,
  useUserCvs,
  type CvAnalysisResult,
  type CvAnalysisHistoryItem,
} from "@/features/cv/model/cv.model";
import { useJobsCatalog, type JobItem } from "@/features/jobs/model/jobs.model";
import { useSession } from "@/features/auth/session/session.model";
import { setLatestAnalysisId } from "@/shared/config/latest-analysis";

type Tone = "primary" | "emerald" | "amber" | "orange" | "blue";

function clampScore(value?: number | null) {
  return Math.max(0, Math.min(100, Math.round(value ?? 0)));
}

function formatRelativeDate(value?: string | null) {
  if (!value) return "No date";

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "No date";

  const diffDays = Math.max(
    0,
    Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24)),
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

function scoreLabel(score: number) {
  if (score >= 85) return "Excellent fit";
  if (score >= 70) return "Strong fit";
  if (score >= 50) return "Good start";
  return "Needs work";
}

function toneClass(tone: Tone) {
  const map: Record<Tone, string> = {
    primary: "bg-primary/10 text-primary border-primary/20",
    emerald: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-700 border-amber-500/25",
    orange: "bg-orange-500/10 text-orange-700 border-orange-500/25",
    blue: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  };

  return map[tone];
}

function scoreColor(score: number) {
  if (score >= 85) return "#4f46e5";
  if (score >= 70) return "#2563eb";
  if (score >= 50) return "#f59e0b";
  return "#f97316";
}

function DashboardCard({
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

function SectionTitle({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-base font-bold text-foreground">{title}</h2>
      {action}
    </div>
  );
}

function ActionLink({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80"
    >
      {label}
      <ArrowRight className="h-3.5 w-3.5" />
    </button>
  );
}

function MetricCard({
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
    <DashboardCard className="p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
            {value}
          </p>
        </div>
        <span
          className={`inline-flex h-12 w-12 items-center justify-center rounded-full border ${toneClass(
            tone,
          )}`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="text-sm text-muted-foreground">{note}</p>
    </DashboardCard>
  );
}

function ScoreRing({
  score,
  size = "large",
}: {
  score: number;
  size?: "small" | "large";
}) {
  const clamped = clampScore(score);
  const ringSize = size === "large" ? "h-36 w-36" : "h-16 w-16";
  const innerInset = size === "large" ? "inset-[10px]" : "inset-[5px]";
  const textSize = size === "large" ? "text-4xl" : "text-base";

  return (
    <div
      className={`relative shrink-0 rounded-full ${ringSize}`}
      style={{
        background: `conic-gradient(${scoreColor(
          clamped,
        )} ${clamped}%, #e9e7ff ${clamped}% 100%)`,
      }}
    >
      <div
        className={`absolute ${innerInset} flex flex-col items-center justify-center rounded-full bg-card`}
      >
        <span className={`${textSize} font-black text-foreground`}>
          {clamped}%
        </span>
        {size === "large" ? (
          <span className="text-xs font-semibold text-muted-foreground">
            match score
          </span>
        ) : null}
      </div>
    </div>
  );
}

function RecentAnalysisCard({
  latestAnalysis,
  analysis,
  onOpen,
}: {
  latestAnalysis?: CvAnalysisHistoryItem;
  analysis?: CvAnalysisResult | null;
  onOpen: (analysisId: number) => void;
}) {
  const score = clampScore(latestAnalysis?.jobMatchScore);
  const breakdown = analysis?.jobMatch.scoreBreakdown;
  const matchedSkills = analysis?.jobMatch.matchedSkills.length ?? 0;
  const missingSkills = analysis?.jobMatch.missingSkills.length ?? 0;

  return (
    <DashboardCard className="p-5">
      <SectionTitle title="Latest Match Report" />

      {latestAnalysis ? (
        <div className="grid gap-5 xl:grid-cols-[auto_minmax(0,1fr)_280px] xl:items-center">
          <div className="flex justify-center xl:justify-start">
            <ScoreRing score={score} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                {scoreLabel(score)}
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {formatRelativeDate(latestAnalysis.createdAt)}
              </span>
            </div>
            <h3 className="mt-3 line-clamp-2 text-2xl font-black text-foreground">
              {latestAnalysis.jobTitle || "Untitled role"}
            </h3>
            <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
              Resume: {latestAnalysis.cvFilename ?? "Uploaded CV"}
            </p>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-background/50 px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Skill match
                </p>
                <p className="mt-1 text-sm font-bold text-foreground">
                  {breakdown ? `${clampScore(breakdown.skillMatch)}%` : "--"}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-background/50 px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Matched skills
                </p>
                <p className="mt-1 text-sm font-bold text-foreground">
                  {matchedSkills || "--"}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-background/50 px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Missing skills
                </p>
                <p className="mt-1 text-sm font-bold text-foreground">
                  {missingSkills || "--"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Next step
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Open the full report to review AI feedback, missing keywords, and
              the job-specific roadmap.
            </p>
            <button
              type="button"
              onClick={() => onOpen(latestAnalysis.analysisId)}
              className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              View detailed report
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-muted/40 p-6 text-center">
          <FileSearch className="mx-auto h-9 w-9 text-muted-foreground" />
          <h3 className="mt-3 text-base font-bold text-foreground">
            No report yet
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Run your first scan to unlock CV insights and job matching.
          </p>
        </div>
      )}
    </DashboardCard>
  );
}

function normalizeProficiency(value: number) {
  const normalized = value <= 1 ? value * 100 : value;
  return clampScore(normalized);
}

function HighlightedSkillsCard({
  analysis,
  loading,
}: {
  analysis?: CvAnalysisResult | null;
  loading: boolean;
}) {
  const skills = (analysis?.extractedProfile.cvSkills ?? [])
    .map((skill) => ({
      label: skill.name,
      value: normalizeProficiency(skill.proficiency),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return (
    <DashboardCard className="p-5">
      <SectionTitle
        title="Highlighted Skills"
        action={
          analysis ? (
            <span className="text-xs font-medium text-muted-foreground">
              From your latest scan
            </span>
          ) : null
        }
      />
      {loading ? (
        <div className="flex min-h-[180px] items-center justify-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          Loading skills...
        </div>
      ) : skills.length ? (
        <div className="space-y-4">
          {skills.map((skill) => (
            <div key={skill.label}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-semibold text-foreground">
                  {skill.label}
                </span>
                <span className="text-muted-foreground">{skill.value}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${skill.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
          Run a scan to highlight skills found in your resume.
        </div>
      )}
    </DashboardCard>
  );
}

function JobRecommendationCard({
  job,
  onScan,
}: {
  job: JobItem;
  onScan: () => void;
}) {
  const topSkills = job.skills.slice(0, 4);

  return (
    <div className="flex items-center gap-4 border-b border-border py-4 last:border-b-0">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-sm font-black text-primary">
        {job.company.name.slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-1 text-sm font-bold text-foreground">
          {job.title}
        </h3>
        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
          {job.company.name}
          {job.location ? ` - ${job.location}` : ""}
        </p>
        {topSkills.length ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {topSkills.map((skill) => (
              <span
                key={skill.skillId}
                className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
              >
                {skill.name}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onScan}
          className="hidden h-9 items-center rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 sm:inline-flex"
        >
          Scan
        </button>
        <a
          href={job.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="hidden h-9 items-center rounded-lg border border-border px-3 text-sm font-semibold text-primary hover:bg-muted sm:inline-flex"
        >
          Apply
        </a>
      </div>
    </div>
  );
}

function RoadmapPreview({
  analysis,
  loading,
}: {
  analysis?: CvAnalysisResult | null;
  loading: boolean;
}) {
  const phases = analysis?.roadmap.phases.slice(0, 3) ?? [];

  return (
    <DashboardCard className="p-5">
      <SectionTitle
        title="Skill Roadmap"
        action={
          analysis ? (
            <span className="line-clamp-1 max-w-[260px] text-right text-xs font-medium text-muted-foreground">
              Based on {analysis.jobContext.title}
            </span>
          ) : null
        }
      />

      {loading ? (
        <div className="flex min-h-[220px] items-center justify-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          Loading roadmap...
        </div>
      ) : phases.length ? (
        <div className="relative space-y-5 pl-8">
          <div className="absolute bottom-4 left-[15px] top-4 w-px bg-border" />
          {phases.map((phase) => (
            <div key={phase.phase} className="relative">
              <div className="absolute -left-8 top-5 flex h-8 w-8 items-center justify-center rounded-full border border-primary/25 bg-card text-xs font-black text-primary shadow-sm">
                {phase.phase}
              </div>
              <div className="rounded-xl border border-border bg-background/50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                      Phase {phase.phase}
                    </p>
                    <h3 className="mt-1 font-bold text-foreground">
                      {phase.title}
                    </h3>
                  </div>
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                    {phase.durationWeeks} weeks
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {phase.skills.slice(0, 4).map((skill) => (
                    <span
                      key={skill.skillName}
                      className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                    >
                      {skill.skillName}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
          Run a scan to create a skill roadmap for your target role.
        </div>
      )}
    </DashboardCard>
  );
}

function CareerGoalSummary({
  analysis,
  latestScore,
}: {
  analysis?: CvAnalysisResult | null;
  latestScore: number;
}) {
  return (
    <DashboardCard className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center">
      <div className="flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
          <TrendingUp className="h-6 w-6" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-foreground">Career Goal</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {analysis
              ? `Current target: ${analysis.jobContext.title}`
              : "Run a scan to connect your resume with a target role."}
          </p>
        </div>
      </div>

      <div className="grid gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 md:min-w-[360px] md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Latest match
          </p>
          <p className="mt-1 text-2xl font-black text-primary">
            {latestScore ? `${latestScore}%` : "--"}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Roadmap length
          </p>
          <p className="mt-1 text-2xl font-black text-foreground">
            {analysis ? `${analysis.roadmap.totalWeeks}w` : "--"}
          </p>
        </div>
      </div>
    </DashboardCard>
  );
}

function QuickAction({
  label,
  description,
  icon: Icon,
  onClick,
}: {
  label: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[88px] items-center gap-3 rounded-xl border border-border bg-background/60 p-4 text-left transition hover:border-primary/40 hover:bg-primary/5"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block font-bold text-foreground">{label}</span>
        <span className="mt-1 block text-sm text-muted-foreground">
          {description}
        </span>
      </span>
    </button>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useSession();
  const { items: historyItems } = useCvAnalysisHistory(6);
  const { cvs } = useUserCvs();
  const latestAnalysis = historyItems[0];
  const { analysis: latestAnalysisDetail, loading: analysisLoading } =
    useCvAnalysisResult(latestAnalysis?.analysisId);
  const { jobs, totalCount, loading: jobsLoading } = useJobsCatalog({
    limit: 4,
    offset: 0,
    sortBy: "RELEVANCE",
    dateRange: "ANY",
    employmentType: "ALL",
    experienceRange: "ALL",
    cvId: user?.baseCvId ?? undefined,
    skip: false,
  });

  const displayName = user?.name?.trim() || "there";
  const latestScore = clampScore(latestAnalysis?.jobMatchScore);
  const newJobsLabel = totalCount > 0 ? totalCount : jobs.length;

  const openAnalysis = (analysisId: number) => {
    setLatestAnalysisId(analysisId);
    navigate({ to: "/match-report" });
  };

  return (
    <AppShell fullWidth>
      <div className="mx-auto max-w-[1480px] space-y-5">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Career command center
            </p>
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              Welcome back, {displayName}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Track your CV performance, monitor job matches, and keep your next
              career moves organized in one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate({ to: "/resume-optimizer" })}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <UploadCloud className="h-4 w-4" />
              Upload CV
            </button>
            <button
              type="button"
              onClick={() => navigate({ to: "/jobs" })}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground hover:bg-muted"
            >
              <Search className="h-4 w-4" />
              Find jobs
            </button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Overall match"
            value={latestScore ? `${latestScore}%` : "--"}
            note={
              latestAnalysis
                ? scoreLabel(latestScore)
                : "Run a scan to calculate your fit."
            }
            icon={Target}
            tone="primary"
          />
          <MetricCard
            label={user?.baseCvId ? "Job matches" : "Open jobs"}
            value={jobsLoading ? "..." : newJobsLabel}
            note={
              user?.baseCvId
                ? "Ranked with your base CV."
                : "Upload a base CV to turn these into ranked matches."
            }
            icon={BriefcaseBusiness}
            tone="emerald"
          />
          <MetricCard
            label="Saved resumes"
            value={cvs.length}
            note="Resume files available for scans and job matching."
            icon={FileText}
            tone="blue"
          />
          <MetricCard
            label="Roadmap length"
            value={
              analysisLoading
                ? "..."
                : latestAnalysisDetail
                  ? `${latestAnalysisDetail.roadmap.totalWeeks}w`
                  : "--"
            }
            note={
              latestAnalysisDetail
                ? `Generated for ${latestAnalysisDetail.jobContext.title}.`
                : "Run a scan to create a job-specific roadmap."
            }
            icon={BookOpenCheck}
            tone="orange"
          />
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <RecentAnalysisCard
            latestAnalysis={latestAnalysis}
            analysis={latestAnalysisDetail}
            onOpen={openAnalysis}
          />
          <HighlightedSkillsCard
            analysis={latestAnalysisDetail}
            loading={analysisLoading}
          />
        </section>

        <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <DashboardCard className="p-5">
            <SectionTitle
              title="Recommended Jobs"
              action={
                <ActionLink
                  label="View all jobs"
                  onClick={() => navigate({ to: "/jobs" })}
                />
              }
            />

            {jobsLoading ? (
              <div className="flex min-h-[220px] items-center justify-center gap-3 text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                Loading job matches...
              </div>
            ) : jobs.length ? (
              <div>
                {jobs.map((job) => (
                  <JobRecommendationCard
                    key={job.jobId}
                    job={job}
                    onScan={() => navigate({ to: "/resume-optimizer" })}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                No job recommendations yet. Upload a CV or adjust your search
                filters to discover roles.
              </div>
            )}
          </DashboardCard>

          <DashboardCard className="p-5">
            <SectionTitle title="Quick Actions" />
            <div className="grid gap-3">
              <QuickAction
                label="Analyze CV"
              description="Upload or paste a CV and compare it with a job description."
                icon={FileSearch}
                onClick={() => navigate({ to: "/resume-optimizer" })}
              />
              <QuickAction
                label="Review latest match"
                description="Review your latest score and skill gaps."
                icon={BarChart3}
                onClick={() =>
                  latestAnalysis
                    ? openAnalysis(latestAnalysis.analysisId)
                    : navigate({ to: "/resume-optimizer" })
                }
              />
              <QuickAction
                label="Manage resumes"
                description={`${cvs.length} saved resume${
                  cvs.length === 1 ? "" : "s"
                } available.`}
                icon={FileText}
                onClick={() => navigate({ to: "/resume-manager" })}
              />
              <QuickAction
                label="View scan history"
                description="Compare past reports and reopen your next steps."
                icon={History}
                onClick={() => navigate({ to: "/scan-history" })}
              />
            </div>
          </DashboardCard>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <RoadmapPreview
            analysis={latestAnalysisDetail}
            loading={analysisLoading}
          />

          <DashboardCard className="p-5">
              <SectionTitle title="Recent Activity" />
              {historyItems.length ? (
                <div className="space-y-3">
                  {historyItems.slice(0, 5).map((item) => (
                    <button
                      key={item.analysisId}
                      type="button"
                      onClick={() => openAnalysis(item.analysisId)}
                      className="flex w-full items-start gap-3 rounded-xl border border-border bg-background/50 p-3 text-left hover:border-primary/30 hover:bg-primary/5"
                    >
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Clock3 className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-1 text-sm font-bold text-foreground">
                          {item.jobTitle || "Untitled role"}
                        </span>
                        <span className="mt-1 block line-clamp-1 text-xs text-muted-foreground">
                          {item.cvFilename ?? "Uploaded CV"} -{" "}
                          {formatRelativeDate(item.createdAt)}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm font-black text-primary">
                        {clampScore(item.jobMatchScore)}%
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-muted/40 p-5 text-sm text-muted-foreground">
                  Your scan activity will appear here after your first report.
                </div>
              )}
          </DashboardCard>
        </section>

        <CareerGoalSummary
          analysis={latestAnalysisDetail}
          latestScore={latestScore}
        />
      </div>
    </AppShell>
  );
}
