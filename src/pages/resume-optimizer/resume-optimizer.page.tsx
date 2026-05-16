import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileSearch,
  FileText,
  Gauge,
  Lightbulb,
  Loader2,
  Sparkles,
  Target,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AppShell } from "@/shared/ui/app-shell";
import { NewScanSection } from "@/shared/ui/new-scan-section";
import {
  useCvAnalysisHistory,
  useCvAnalysisResult,
  useUserCvs,
  type CvAnalysisHistoryItem,
} from "@/features/cv/model/cv.model";
import { setLatestAnalysisId } from "@/shared/config/latest-analysis";

type Tone = "primary" | "emerald" | "amber" | "blue" | "rose";

function clampScore(value?: number | null) {
  return Math.max(0, Math.min(100, Math.round(value ?? 0)));
}

function scoreLabel(score: number) {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Strong";
  if (score >= 50) return "Improving";
  return "Needs work";
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

function toneClass(tone: Tone) {
  const map: Record<Tone, string> = {
    primary: "bg-primary/10 text-primary border-primary/20",
    emerald: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-700 border-amber-500/25",
    blue: "bg-blue-500/10 text-blue-700 border-blue-500/20",
    rose: "bg-rose-500/10 text-rose-700 border-rose-500/20",
  };

  return map[tone];
}

function scoreColor(score: number) {
  if (score >= 85) return "#4f46e5";
  if (score >= 70) return "#2563eb";
  if (score >= 50) return "#f59e0b";
  return "#f97316";
}

function PageCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
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
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-base font-bold text-foreground">{title}</h2>
      {action}
    </div>
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
    <PageCard className="p-5">
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
    </PageCard>
  );
}

function ScoreRing({ score }: { score: number }) {
  const clamped = clampScore(score);

  return (
    <div
      className="relative h-32 w-32 shrink-0 rounded-full"
      style={{
        background: `conic-gradient(${scoreColor(
          clamped,
        )} ${clamped}%, #e9e7ff ${clamped}% 100%)`,
      }}
    >
      <div className="absolute inset-[9px] flex flex-col items-center justify-center rounded-full bg-card">
        <span className="text-4xl font-black text-foreground">{clamped}%</span>
        <span className="text-xs font-semibold text-muted-foreground">
          match score
        </span>
      </div>
    </div>
  );
}

function LatestAnalysisPanel({
  latestAnalysis,
  onOpen,
}: {
  latestAnalysis?: CvAnalysisHistoryItem;
  onOpen: (analysisId: number) => void;
}) {
  const score = clampScore(latestAnalysis?.jobMatchScore);

  return (
    <PageCard className="p-5">
      <SectionTitle title="Latest Resume Report" />
      {latestAnalysis ? (
        <div className="grid gap-5 sm:grid-cols-[auto_1fr] sm:items-center">
          <ScoreRing score={score} />
          <div className="min-w-0">
            <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              {scoreLabel(score)}
            </span>
            <h3 className="mt-3 line-clamp-2 text-xl font-bold text-foreground">
              {latestAnalysis.jobTitle || "Untitled role"}
            </h3>
            <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
              {latestAnalysis.cvFilename ?? "Uploaded CV"} -{" "}
              {formatRelativeDate(latestAnalysis.createdAt)}
            </p>
            <button
              type="button"
              onClick={() => onOpen(latestAnalysis.analysisId)}
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              View report
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
            Upload a CV and choose a target job to create your first report.
          </p>
        </div>
      )}
    </PageCard>
  );
}

function InsightList({
  title,
  icon: Icon,
  tone,
  items,
  emptyText,
}: {
  title: string;
  icon: LucideIcon;
  tone: Tone;
  items: string[];
  emptyText: string;
}) {
  return (
    <PageCard className="p-5">
      <SectionTitle title={title} />
      <div className="space-y-3">
        {items.length ? (
          items.slice(0, 4).map((item) => (
            <div
              key={item}
              className="flex gap-3 rounded-xl border border-border bg-background/50 p-3 text-sm text-foreground"
            >
              <span
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${toneClass(
                  tone,
                )}`}
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="leading-6">{item}</span>
            </div>
          ))
        ) : (
          <p className="rounded-xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            {emptyText}
          </p>
        )}
      </div>
    </PageCard>
  );
}

function RecentReportList({
  items,
  onOpen,
}: {
  items: CvAnalysisHistoryItem[];
  onOpen: (analysisId: number) => void;
}) {
  return (
    <PageCard className="p-5">
      <SectionTitle title="Recent Reports" />
      {items.length ? (
        <div className="space-y-3">
          {items.slice(0, 5).map((item) => (
            <button
              key={item.analysisId}
              type="button"
              onClick={() => onOpen(item.analysisId)}
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
        <p className="rounded-xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          Reports from completed scans will appear here.
        </p>
      )}
    </PageCard>
  );
}

function OptimizationTips() {
  const tips = [
    "Use a PDF or DOCX file with clear headings and consistent spacing.",
    "Pick a specific target job so your report can compare skills, keywords, and experience.",
    "Add measurable project outcomes before rescanning your CV.",
    "Keep one base CV in Resume Manager for faster job matching.",
  ];

  return (
    <PageCard className="p-5">
      <SectionTitle title="How to Improve Your Match" />
      <div className="space-y-3">
        {tips.map((tip) => (
          <div
            key={tip}
            className="flex gap-3 rounded-xl border border-border bg-background/50 p-3 text-sm text-foreground"
          >
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-amber-500/25 bg-amber-500/10 text-amber-700">
              <Lightbulb className="h-3.5 w-3.5" />
            </span>
            <span className="leading-6">{tip}</span>
          </div>
        ))}
      </div>
    </PageCard>
  );
}

export function ResumeOptimizerPage() {
  const navigate = useNavigate();
  const { cvs, loading: cvsLoading } = useUserCvs();
  const { items: historyItems, loading: historyLoading } =
    useCvAnalysisHistory(6);
  const latestAnalysis = historyItems[0];
  const { analysis: latestAnalysisDetail, loading: analysisLoading } =
    useCvAnalysisResult(latestAnalysis?.analysisId);

  const latestScore = clampScore(latestAnalysis?.jobMatchScore);
  const atsScore = latestAnalysisDetail?.jobMatch.scoreBreakdown.atsReadability;
  const recognizedSkills =
    latestAnalysisDetail?.extractedProfile.cvSkills.length ?? 0;
  const missingSkills = latestAnalysisDetail?.jobMatch.missingSkills ?? [];
  const strengths = latestAnalysisDetail?.aiReview?.strengths ?? [];
  const recommendations =
    latestAnalysisDetail?.aiReview?.recommendations ??
    latestAnalysisDetail?.aiReview?.concerns ??
    [];

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
              Resume optimization
            </p>
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              Analyze and improve your CV
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Compare your resume with a target job, discover missing skills,
              and turn the report into focused next steps.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate({ to: "/resume-manager" })}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground hover:bg-muted"
            >
              <FileText className="h-4 w-4" />
              Resume library
            </button>
            <button
              type="button"
              onClick={() => navigate({ to: "/scan-history" })}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground hover:bg-muted"
            >
              <Clock3 className="h-4 w-4" />
              Scan history
            </button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Latest match"
            value={
              historyLoading ? "..." : latestScore ? `${latestScore}%` : "--"
            }
            note={
              latestAnalysis
                ? `${scoreLabel(latestScore)} fit for the latest target job.`
                : "Run a scan to calculate a match score."
            }
            icon={Target}
            tone="primary"
          />
          <MetricCard
            label="ATS readiness"
            value={
              analysisLoading
                ? "..."
                : atsScore != null
                  ? `${clampScore(atsScore)}%`
                  : "--"
            }
            note="Based on your latest resume scan."
            icon={Gauge}
            tone="blue"
          />
          <MetricCard
            label="Recognized skills"
            value={analysisLoading ? "..." : recognizedSkills}
            note="Skills found in your latest resume scan."
            icon={CheckCircle2}
            tone="emerald"
          />
          <MetricCard
            label="Saved resumes"
            value={cvsLoading ? "..." : cvs.length}
            note="CV files available in your resume library."
            icon={FileCheck2}
            tone="amber"
          />
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-5">
            <NewScanSection />
            <div className="grid gap-5 lg:grid-cols-2">
              <InsightList
                title="What Looks Strong"
                icon={CheckCircle2}
                tone="emerald"
                items={strengths}
                emptyText="Strengths will appear after your next scan."
              />
              <InsightList
                title="What to Improve"
                icon={Lightbulb}
                tone="amber"
                items={recommendations}
                emptyText="Suggestions will appear after your next scan."
              />
            </div>
          </div>

          <aside className="space-y-5">
            <LatestAnalysisPanel
              latestAnalysis={latestAnalysis}
              onOpen={openAnalysis}
            />

            <PageCard className="p-5">
              <SectionTitle title="Missing Keywords" />
              {analysisLoading ? (
                <div className="flex min-h-[120px] items-center justify-center gap-3 text-sm text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  Loading keywords...
                </div>
              ) : missingSkills.length ? (
                <div className="flex flex-wrap gap-2">
                  {missingSkills.slice(0, 12).map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-sm font-medium text-rose-700"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                  Missing keywords will appear after matching a CV with a target
                  job.
                </p>
              )}
            </PageCard>

            <OptimizationTips />
            <RecentReportList items={historyItems} onOpen={openAnalysis} />
          </aside>
        </section>
      </div>
    </AppShell>
  );
}
