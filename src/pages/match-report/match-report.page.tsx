import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  ExternalLink,
  Gauge,
  GraduationCap,
  Layers3,
  Lightbulb,
  Loader2,
  MapPin,
  Plus,
  Rocket,
  Save,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UploadCloud,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AppShell } from "@/shared/ui/app-shell";
import { getLatestAnalysisId } from "@/shared/config/latest-analysis";
import {
  type CvAnalysisResult,
  useCvAnalysisResult,
} from "@/features/cv/model/cv.model";

type Tone = "emerald" | "amber" | "rose" | "blue" | "violet" | "neutral";

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value || 0)));
}

function percent(value: number) {
  return `${Math.round((value || 0) * 100)}%`;
}

function scoreTone(score: number): Tone {
  if (score >= 75) return "emerald";
  if (score >= 45) return "amber";
  return "rose";
}

function verdictLabel(value?: string | null) {
  if (!value) return "AI Analysis";
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function toneClasses(tone: Tone) {
  const map: Record<Tone, string> = {
    emerald:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    amber:
      "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    rose: "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300",
    blue: "border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-300",
    violet:
      "border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300",
    neutral: "border-white/10 bg-white/5 text-foreground",
  };

  return map[tone];
}

function scoreGradient(tone: Tone) {
  if (tone === "emerald") return "#10b981";
  if (tone === "amber") return "#f59e0b";
  if (tone === "rose") return "#f43f5e";
  return "#3b82f6";
}

function metricBarClass(score: number) {
  if (score >= 75) return "from-emerald-400 to-teal-500";
  if (score >= 45) return "from-amber-400 to-orange-500";
  return "from-rose-400 to-red-500";
}

function difficultyFromPriority(priority: number) {
  if (priority >= 5) return "Advanced";
  if (priority >= 4) return "Focused";
  if (priority >= 3) return "Moderate";
  return "Light";
}

function GlassCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-white/10 bg-card/80 shadow-xl shadow-primary/5 backdrop-blur transition duration-300 hover:border-primary/20 hover:shadow-primary/10 ${className}`}
    >
      {children}
    </section>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  icon: LucideIcon;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </span>
          {title}
        </h2>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/40 px-5 py-7 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function StatCard({
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
    <div className="rounded-2xl border border-white/10 bg-white/55 p-4 shadow-sm backdrop-blur dark:bg-white/5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className={`rounded-xl border p-2 ${toneClasses(tone)}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{note}</p>
    </div>
  );
}

function ScoreRing({
  score,
  verdict,
}: {
  score: number;
  verdict?: string | null;
}) {
  const clamped = clampScore(score);
  const tone = scoreTone(clamped);
  const color = scoreGradient(tone);

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <div className="relative h-40 w-40 shrink-0">
        <div
          className="h-40 w-40 rounded-full shadow-2xl shadow-primary/20"
          style={{
            background: `conic-gradient(${color} ${clamped}%, rgba(148, 163, 184, 0.22) 0)`,
          }}
        />
        <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full border border-white/20 bg-card/90 backdrop-blur">
          <span className="text-5xl font-black tracking-tight text-foreground">
            {clamped}
          </span>
          <span className="text-xs font-semibold uppercase text-muted-foreground">
            Match
          </span>
        </div>
      </div>

      <div>
        <span className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${toneClasses(tone)}`}>
          {verdictLabel(verdict)}
        </span>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          AI-powered fit score based on skills, ATS readiness, experience,
          location and role alignment.
        </p>
      </div>
    </div>
  );
}

function AdviceCard({
  title,
  items,
  icon: Icon,
  tone,
}: {
  title: string;
  items: string[];
  icon: LucideIcon;
  tone: Tone;
}) {
  return (
    <GlassCard className="p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className={`rounded-2xl border p-3 ${toneClasses(tone)}`}>
          <Icon className="h-5 w-5" />
        </span>
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
      </div>

      {items.length ? (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-white/10 bg-white/50 p-3 text-sm leading-6 text-foreground transition hover:-translate-y-0.5 hover:bg-white/70 dark:bg-white/5 dark:hover:bg-white/10"
            >
              {item}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No AI note returned.</p>
      )}
    </GlassCard>
  );
}

function SkillPill({
  skill,
  tone,
  icon: Icon,
}: {
  skill: string;
  tone: Tone;
  icon?: LucideIcon;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium ${toneClasses(tone)}`}>
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      {skill}
    </span>
  );
}

function SkillStrengtheningCard({
  skill,
}: {
  skill: CvAnalysisResult["gapAnalysis"]["skillGap"]["weak"][number];
}) {
  const priorityTone: Tone = skill.gap >= 0.25 ? "amber" : "blue";
  const priorityLabel = skill.gap >= 0.25 ? "Stronger proof" : "Clearer evidence";

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/50 px-4 py-3 dark:bg-white/5">
      <div className="min-w-0">
        <h4 className="truncate font-bold text-foreground">{skill.skill}</h4>
        <p className="text-xs text-muted-foreground">Add stronger CV evidence.</p>
      </div>
      <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClasses(priorityTone)}`}>
        {priorityLabel}
      </span>
    </div>
  );
}

function StrengtheningTip() {
  return (
    <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm leading-6 text-blue-800 dark:text-blue-200">
      Add project proof, metrics, tools used, and ownership for these skills.
    </div>
  );
}

function ScoreMetric({
  label,
  score,
  icon: Icon,
}: {
  label: string;
  score: number;
  icon: LucideIcon;
}) {
  const clamped = clampScore(score);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/50 p-4 transition hover:-translate-y-1 hover:shadow-lg dark:bg-white/5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Icon className="h-4 w-4 text-primary" />
          {label}
        </span>
        <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${toneClasses(scoreTone(clamped))}`}>
          {clamped}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-border">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${metricBarClass(clamped)} transition-all duration-700`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        {clamped < 45 ? "Priority improvement area" : clamped < 75 ? "Moderate signal" : "Strong signal"}
      </p>
    </div>
  );
}

function GapCard({
  gap,
  index,
}: {
  gap: CvAnalysisResult["gapAnalysis"]["skillGap"]["missing"][number];
  index: number;
}) {
  const priorityTone: Tone = gap.importance === "high" ? "rose" : "amber";
  const estimatedDifficulty = gap.importance === "high" ? "Focused" : "Moderate";

  return (
    <GlassCard className="p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
            <Layers3 className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Gap #{index + 1}
            </p>
            <h3 className="text-lg font-bold text-foreground">{gap.skill}</h3>
          </div>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClasses(priorityTone)}`}>
          {gap.importance}
        </span>
      </div>

      <p className="min-h-12 text-sm leading-6 text-muted-foreground">{gap.reason}</p>

      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="rounded-full border border-white/10 bg-white/50 px-3 py-1.5 text-xs text-muted-foreground dark:bg-white/5">
          {estimatedDifficulty} difficulty
        </span>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-cta px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:shadow-primary/30"
        >
          <Plus className="h-3.5 w-3.5" />
          Add to Roadmap
        </button>
      </div>
    </GlassCard>
  );
}

function RoadmapTimeline({
  phases,
}: {
  phases: CvAnalysisResult["roadmap"]["phases"];
}) {
  if (!phases.length) return <EmptyState text="No learning roadmap was returned." />;

  return (
    <div className="relative space-y-6">
      <div className="absolute left-5 top-7 hidden h-[calc(100%-3rem)] w-px bg-gradient-to-b from-primary via-cta to-transparent md:block" />
      {phases.map((phase) => (
        <div key={phase.phase} className="relative grid gap-4 md:grid-cols-[44px_1fr]">
          <div className="hidden md:flex">
            <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-card shadow-lg shadow-primary/20">
              <span className="h-3 w-3 rounded-full bg-primary shadow-lg shadow-primary" />
            </span>
          </div>

          <GlassCard className="p-5">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  Phase {phase.phase}
                </p>
                <h3 className="mt-1 text-xl font-bold text-foreground">{phase.title}</h3>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-sm font-semibold text-blue-700 dark:text-blue-300">
                <Clock3 className="h-4 w-4" />
                {phase.durationWeeks} weeks
              </span>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              {phase.skills.map((skill) => {
                const firstCourse = skill.recommendedResources[0];
                return (
                  <div
                    key={`${phase.phase}-${skill.skillName}`}
                    className="rounded-2xl border border-white/10 bg-white/50 p-4 transition hover:-translate-y-1 hover:bg-white/70 dark:bg-white/5 dark:hover:bg-white/10"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-foreground">{skill.skillName}</h4>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {skill.estimatedWeeks} weeks · priority {skill.priority}
                        </p>
                      </div>
                      <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-1 text-xs font-semibold text-violet-700 dark:text-violet-300">
                        {difficultyFromPriority(skill.priority)}
                      </span>
                    </div>

                    <div className="mb-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <span className="rounded-xl bg-muted/70 px-3 py-2">
                        Study {skill.adjustedHours ?? skill.baselineHours ?? "-"}h
                      </span>
                      <span className="rounded-xl bg-muted/70 px-3 py-2">
                        Transfer {percent(skill.effectiveTransferBonus ?? skill.transferBonus)}
                      </span>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-card/70 p-3">
                      <p className="line-clamp-1 text-sm font-semibold text-foreground">
                        {firstCourse?.title ?? "Course recommendation pending"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {firstCourse?.provider ?? "NextStepAI"} · {firstCourse?.durationHours ?? "-"}h
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>
      ))}
    </div>
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
  return (
    <a
      href={course.url ?? undefined}
      target="_blank"
      rel="noreferrer"
      className="group rounded-2xl border border-white/10 bg-white/55 p-5 shadow-lg shadow-primary/5 backdrop-blur transition hover:-translate-y-1 hover:border-primary/25 hover:bg-white/75 hover:shadow-primary/15 dark:bg-white/5 dark:hover:bg-white/10"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-700 dark:text-blue-300">
          {course.provider ?? "Course"}
        </span>
        <ExternalLink className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
      </div>
      <h3 className="line-clamp-2 min-h-12 text-base font-bold text-foreground">
        {course.title}
      </h3>
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="rounded-full bg-muted px-3 py-1">Phase {course.phase}</span>
        <span className="rounded-full bg-muted px-3 py-1">{course.skillName}</span>
        <span className="rounded-full bg-muted px-3 py-1">
          {course.durationHours ?? "-"}h
        </span>
      </div>
    </a>
  );
}

function FinalRecommendation({
  analysis,
}: {
  analysis: CvAnalysisResult;
}) {
  const score = clampScore(analysis.jobMatch.score);
  const weakCount = analysis.gapAnalysis.skillGap.weak.length;
  const missingCount = analysis.gapAnalysis.skillGap.missing.length;
  const ats = analysis.jobMatch.scoreBreakdown.atsReadability ?? 0;

  const recommendation =
    score < 45
      ? `You should target roles closer to your current ${analysis.extractedProfile.cvLevel || "current"} profile first, then close the top ${Math.min(missingCount, 5)} skill gaps before applying to this role.`
      : score < 75
        ? `You are close enough to explore this role, but improving ${weakCount || missingCount} key skill areas will make your application much stronger.`
        : `This is a strong fit. Polish the CV narrative, add measurable project proof, and apply while continuing the roadmap.`;

  const atsNote =
    ats >= 70
      ? "Your ATS readiness is solid, but career fit still depends on skill alignment."
      : "Your ATS readiness needs cleanup before this CV is competitive.";

  return (
    <GlassCard className="overflow-hidden p-0">
      <div className="relative p-6 md:p-8">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-cta/20 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Final AI Recommendation
            </p>
            <h2 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">
              {recommendation}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
              {atsNote}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 lg:justify-end">
            <a
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/70 px-4 py-2 text-sm font-bold text-foreground shadow-sm transition hover:-translate-y-0.5 hover:bg-white dark:bg-white/10 dark:hover:bg-white/15"
            >
              <UploadCloud className="h-4 w-4" />
              Upload New CV
            </a>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/70 px-4 py-2 text-sm font-bold text-foreground shadow-sm transition hover:-translate-y-0.5 hover:bg-white dark:bg-white/10 dark:hover:bg-white/15"
            >
              <Save className="h-4 w-4" />
              Save Roadmap
            </button>
            <a
              href="/jobs"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-cta px-4 py-2 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition hover:-translate-y-0.5 hover:shadow-primary/35"
            >
              Explore Similar Jobs
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function ResumeMatchDashboard({ analysis }: { analysis: CvAnalysisResult }) {
  const [showAllMissing, setShowAllMissing] = useState(false);
  const breakdown = analysis.jobMatch.scoreBreakdown;
  const matchedSkills = analysis.jobMatch.matchedSkills;
  const missingSkills = analysis.jobMatch.missingSkills;
  const weakSkills = analysis.gapAnalysis.skillGap.weak;
  const missingGapDetails = analysis.gapAnalysis.skillGap.missing;
  const visibleMissingSkills = showAllMissing ? missingSkills : missingSkills.slice(0, 12);
  const topGaps = missingGapDetails.slice(0, 5);

  const scoreMetrics = [
    { label: "Skill Match", score: breakdown.skillMatch, icon: Target },
    { label: "ATS Readiness", score: breakdown.atsReadability ?? 0, icon: ShieldCheck },
    { label: "Location Match", score: breakdown.locationMatch, icon: MapPin },
    { label: "Experience Match", score: breakdown.experienceMatch, icon: TrendingUp },
    { label: "Keyword Match", score: breakdown.keywordMatch ?? 0, icon: Zap },
  ];

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
        .slice(0, 9),
    [analysis],
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.12),transparent_32%),radial-gradient(circle_at_top_right,rgba(124,58,237,0.10),transparent_28%)] pb-14">
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-6 sm:px-6 lg:px-8">
        <GlassCard className="relative overflow-hidden p-6 md:p-8">
          <div className="absolute -left-12 top-0 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -right-10 bottom-0 h-56 w-56 rounded-full bg-cta/20 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="space-y-6">
              <div>
                <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  NextStepAI Match Intelligence
                </p>
                <h1 className="max-w-3xl text-3xl font-black tracking-tight text-foreground md:text-5xl">
                  {analysis.jobContext.title}
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
                  {analysis.aiReview?.summary ??
                    "NextStepAI analyzed your resume against this role and prepared a personalized improvement plan."}
                </p>
              </div>

              <ScoreRing
                score={analysis.jobMatch.score}
                verdict={analysis.aiReview?.verdict}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <StatCard
                label="ATS score"
                value={breakdown.atsReadability ?? 0}
                note="Resume parsing and screening readiness"
                icon={ShieldCheck}
                tone={scoreTone(breakdown.atsReadability ?? 0)}
              />
              <StatCard
                label="Matched skills"
                value={matchedSkills.length}
                note="Skills already aligned with the JD"
                icon={CheckCircle2}
                tone="emerald"
              />
              <StatCard
                label="Missing skills"
                value={missingSkills.length}
                note="Skills to close before applying"
                icon={AlertTriangle}
                tone={missingSkills.length ? "rose" : "emerald"}
              />
              <StatCard
                label="Roadmap"
                value={`${analysis.roadmap.totalWeeks}w`}
                note={`${analysis.roadmap.difficultyLevel} plan until ${analysis.roadmap.estimatedCompletion}`}
                icon={BookOpen}
                tone="blue"
              />
            </div>
          </div>
        </GlassCard>

        <section>
          <SectionHeader
            eyebrow="AI career coach"
            title="AI Review"
            description="A recruiter-style readout that turns the analysis into practical next steps."
            icon={Sparkles}
          />
          <div className="grid gap-6 lg:grid-cols-3">
            <AdviceCard
              title="Strengths"
              items={analysis.aiReview?.strengths ?? []}
              icon={CheckCircle2}
              tone="emerald"
            />
            <AdviceCard
              title="Concerns"
              items={analysis.aiReview?.concerns ?? []}
              icon={AlertTriangle}
              tone="rose"
            />
            <AdviceCard
              title="Recommendations"
              items={analysis.aiReview?.recommendations ?? []}
              icon={Sparkles}
              tone="blue"
            />
          </div>
        </section>

        <section>
          <SectionHeader
            eyebrow="Skill intelligence"
            title="Skills Match"
            description="See what already works, what needs sharpening, and what is missing from the CV."
            icon={Target}
          />
          <div className="grid gap-6 xl:grid-cols-[0.85fr_1fr_0.85fr]">
            <GlassCard className="p-5">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                Matched Skills
              </h3>
              {matchedSkills.length ? (
                <div className="flex flex-wrap gap-2">
                  {matchedSkills.map((skill) => (
                    <SkillPill key={skill} skill={skill} tone="emerald" icon={CheckCircle2} />
                  ))}
                </div>
              ) : (
                <EmptyState text="No matched skills found yet." />
              )}
            </GlassCard>

            <GlassCard className="p-5">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
                <Gauge className="h-5 w-5 text-amber-500" />
                Skills to Strengthen
              </h3>
              {weakSkills.length ? (
                <div className="space-y-3">
                  <div className="grid gap-3">
                    {weakSkills.slice(0, 4).map((skill) => (
                      <SkillStrengtheningCard
                        key={`${skill.skill}-${skill.gap}`}
                        skill={skill}
                      />
                    ))}
                  </div>
                  <StrengtheningTip />
                </div>
              ) : (
                <EmptyState text="No skills need extra evidence for this role." />
              )}
            </GlassCard>

            <GlassCard className="p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
                  <AlertTriangle className="h-5 w-5 text-rose-500" />
                  Missing Skills
                </h3>
                {missingSkills.length > 12 ? (
                  <button
                    type="button"
                    onClick={() => setShowAllMissing((value) => !value)}
                    className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/50 px-3 py-1 text-xs font-bold text-foreground transition hover:bg-white dark:bg-white/5 dark:hover:bg-white/10"
                  >
                    {showAllMissing ? "Show less" : "Show more"}
                    {showAllMissing ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                ) : null}
              </div>
              {visibleMissingSkills.length ? (
                <div className="flex flex-wrap gap-2">
                  {visibleMissingSkills.map((skill) => (
                    <SkillPill key={skill} skill={skill} tone="rose" />
                  ))}
                </div>
              ) : (
                <EmptyState text="No missing skills. Nice fit." />
              )}
            </GlassCard>
          </div>
        </section>

        <section>
          <SectionHeader
            eyebrow="Analytics"
            title="Score Breakdown"
            description="Modern match analytics across the signals most recruiters and ATS systems care about."
            icon={Gauge}
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {scoreMetrics.map((metric) => (
              <ScoreMetric
                key={metric.label}
                label={metric.label}
                score={metric.score}
                icon={metric.icon}
              />
            ))}
          </div>
        </section>

        <section>
          <SectionHeader
            eyebrow="Priority gaps"
            title="Top Skill Gaps"
            description="The five most important skills to add or strengthen before targeting this job."
            icon={Lightbulb}
          />
          {topGaps.length ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {topGaps.map((gap, index) => (
                <GapCard key={`${gap.skill}-${gap.reason}`} gap={gap} index={index} />
              ))}
            </div>
          ) : (
            <EmptyState text="No major missing skill gaps were returned." />
          )}
        </section>

        <section>
          <SectionHeader
            eyebrow="Personalized growth plan"
            title="Learning Roadmap"
            description="A phase-by-phase plan designed to move this CV closer to the target job."
            icon={Rocket}
          />
          <RoadmapTimeline phases={analysis.roadmap.phases} />
        </section>

        <section>
          <SectionHeader
            eyebrow="Learning resources"
            title="Recommended Courses"
            description="Course cards pulled from the roadmap, grouped into a clean learning marketplace view."
            icon={GraduationCap}
          />
          {courses.length ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {courses.map((course) => (
                <CourseCard
                  key={`${course.phase}-${course.skillName}-${course.title}`}
                  course={course}
                />
              ))}
            </div>
          ) : (
            <EmptyState text="No course recommendations were returned for this roadmap." />
          )}
        </section>

        <FinalRecommendation analysis={analysis} />

        <div className="grid gap-4 md:grid-cols-3">
          <GlassCard className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              CV profile
            </p>
            <p className="mt-2 text-xl font-bold text-foreground">
              {analysis.extractedProfile.cvLevel || "Unknown"} ·{" "}
              {analysis.extractedProfile.cvYearsExperience} years
            </p>
          </GlassCard>
          <GlassCard className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Target role
            </p>
            <p className="mt-2 text-xl font-bold text-foreground">
              {analysis.jobContext.jobLevel || "Unknown"} ·{" "}
              {analysis.jobContext.jobYearsRequired} years
            </p>
          </GlassCard>
          <GlassCard className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Career fit
            </p>
            <p className="mt-2 text-xl font-bold text-foreground">
              {analysis.gapAnalysis.experienceGap.gapWeeks} weeks experience gap
            </p>
          </GlassCard>
        </div>

        <GlassCard className="p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-bold text-foreground">
                <BriefcaseBusiness className="h-4 w-4 text-primary" />
                Source job
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {analysis.jobContext.jobLocation ?? "Location not specified"} ·{" "}
                {analysis.jobContext.jobIsRemote ? "Remote available" : "On-site or hybrid"}
              </p>
            </div>
            {analysis.jobContext.sourceUrl ? (
              <a
                href={analysis.jobContext.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-bold text-primary transition hover:-translate-y-0.5 hover:bg-primary/15"
              >
                View JD
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : null}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

export function MatchReportPage() {
  const analysisId = getLatestAnalysisId();
  const { analysis, loading, error } = useCvAnalysisResult(analysisId);

  if (!analysisId) {
    return (
      <AppShell fullWidth>
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground">Match Report</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              No scan result found yet. Run a new scan from the dashboard first.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (loading) {
    return (
      <AppShell fullWidth>
        <div className="flex min-h-[70vh] items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading your latest analysis...
        </div>
      </AppShell>
    );
  }

  if (error || !analysis) {
    return (
      <AppShell fullWidth>
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground">Match Report</h1>
            <p className="mt-3 text-sm text-destructive">
              We could not load this analysis right now.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell fullWidth>
      <ResumeMatchDashboard analysis={analysis} />
    </AppShell>
  );
}
