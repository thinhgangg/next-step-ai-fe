import { useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
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
  UploadCloud,
  XCircle,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AppShell } from "@/shared/ui/app-shell";
import { getLatestAnalysisId } from "@/shared/config/latest-analysis";
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

function clampScore(value?: number | null) {
  return Math.max(0, Math.min(100, Math.round(value || 0)));
}

function formatVerdict(value?: string | null) {
  if (!value) return "AI Analysis";

  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatWeeks(value?: number | null) {
  if (!value) return "Not estimated";
  if (value < 4) return `${value} week${value > 1 ? "s" : ""}`;

  const months = Math.round((value / 4) * 10) / 10;
  return `${value} weeks · about ${months} months`;
}

function toneByScore(score: number): Tone {
  if (score >= 75) return "success";
  if (score >= 45) return "warning";
  return "danger";
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
  if (score >= 75) return "bg-emerald-500";
  if (score >= 45) return "bg-amber-500";
  return "bg-rose-500";
}

function scoreRingColor(score: number) {
  if (score >= 75) return "#10b981";
  if (score >= 45) return "#f59e0b";
  return "#f43f5e";
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

function SkillPill({
  skill,
  tone = "neutral",
}: {
  skill: string;
  tone?: Tone;
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1.5 text-sm font-medium ${toneClasses(tone)}`}
    >
      {skill}
    </span>
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
  const tone = toneByScore(clamped);

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:text-left">
      <div className="relative h-36 w-36 shrink-0">
        <div
          className="h-36 w-36 rounded-full"
          style={{
            background: `conic-gradient(${scoreRingColor(clamped)} ${clamped}%, hsl(var(--border)) 0)`,
          }}
        />
        <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full border border-border bg-card">
          <span className="text-4xl font-black text-foreground">{clamped}</span>
          <span className="text-xs font-bold uppercase text-muted-foreground">
            / 100
          </span>
        </div>
      </div>

      <div>
        <span
          className={`inline-flex rounded-full border px-3 py-1 text-sm font-bold ${toneClasses(tone)}`}
        >
          {formatVerdict(verdict)}
        </span>
        <h2 className="mt-3 text-2xl font-black tracking-tight text-foreground">
          {clamped >= 75
            ? "Strong match for this role"
            : clamped >= 45
              ? "Potential match, but needs improvement"
              : "Weak match for now"}
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          The score summarizes skill alignment, role fit, experience, location,
          keywords, and CV readability. Use the roadmap to close the most
          important gaps first.
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
      <p className="text-2xl font-black text-foreground">{value}</p>
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
          className={`rounded-full border px-2 py-0.5 text-xs font-bold ${toneClasses(toneByScore(score))}`}
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
        <EmptyState>No notes returned.</EmptyState>
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
  limit = 10,
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
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-bold text-foreground">
            <Icon className="h-4 w-4 text-primary" />
            {title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <span
          className={`rounded-full border px-2.5 py-1 text-xs font-bold ${toneClasses(tone)}`}
        >
          {skills.length}
        </span>
      </div>

      {visible.length ? (
        <div className="flex flex-wrap gap-2">
          {visible.map((skill) => (
            <SkillPill key={skill} skill={skill} tone={tone} />
          ))}
        </div>
      ) : (
        <EmptyState>No skills found.</EmptyState>
      )}

      {hiddenCount > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          {expanded ? "Show less" : `Show ${hiddenCount} more`}
          <ChevronDown
            className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      ) : null}
    </Card>
  );
}

function WeakSkillCard({
  skill,
}: {
  skill: CvAnalysisResult["gapAnalysis"]["skillGap"]["weak"][number];
}) {
  const gap = Math.round((skill.gap || 0) * 100);

  return (
    <div className="rounded-xl border border-border bg-muted/40 p-4">
      <div className="flex items-center justify-between gap-3">
        <h4 className="font-bold text-foreground">{skill.skill}</h4>
        <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
          {gap <= 5 ? "Small gap" : gap <= 15 ? "Medium gap" : "Large gap"}
        </span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Add clearer project proof, metrics, responsibilities, or tools used for
        this skill.
      </p>
    </div>
  );
}

function GapPriorityCard({
  gap,
  index,
}: {
  gap: CvAnalysisResult["gapAnalysis"]["skillGap"]["missing"][number];
  index: number;
}) {
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Priority #{index + 1}
        </p>
        <span
          className={`rounded-full border px-2.5 py-1 text-xs font-bold ${toneClasses(gap.importance === "high" ? "danger" : "warning")}`}
        >
          {gap.importance}
        </span>
      </div>
      <h3 className="text-lg font-bold text-foreground">{gap.skill}</h3>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
        {gap.reason ||
          "This skill appears in the job description but was not found clearly in the CV."}
      </p>
    </Card>
  );
}

function RoadmapPhase({
  phase,
}: {
  phase: CvAnalysisResult["roadmap"]["phases"][number];
}) {
  const [expanded, setExpanded] = useState(false);
  const visibleSkills = expanded ? phase.skills : phase.skills.slice(0, 4);
  const hiddenCount = Math.max(0, phase.skills.length - 4);

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-muted/40"
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-primary">
            Phase {phase.phase}
          </p>
          <h3 className="mt-1 text-lg font-bold text-foreground">
            {phase.title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {phase.durationWeeks} weeks · {phase.skills.length} focus skills
          </p>
        </div>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

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
                      {skill.estimatedWeeks} weeks · priority {skill.priority}
                    </p>
                  </div>
                  <span className="rounded-full bg-background px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                    {skill.adjustedHours ?? skill.baselineHours ?? "-"}h
                  </span>
                </div>

                <div className="mt-3 rounded-lg bg-background p-3">
                  <p className="line-clamp-1 text-sm font-semibold text-foreground">
                    {firstResource?.title ?? "Resource pending"}
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
            onClick={() => setExpanded((value) => !value)}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            {expanded ? "Show fewer skills" : `Show ${hiddenCount} more skills`}
          </button>
        ) : null}
      </div>
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
          {course.provider ?? "Course"}
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
          Phase {course.phase}
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

function OverviewTab({ analysis }: { analysis: CvAnalysisResult }) {
  const breakdown = analysis.jobMatch.scoreBreakdown;
  const metrics: ScoreMetricItem[] = [
    {
      label: "Skill Match",
      value: breakdown.skillMatch,
      icon: Target,
      note: "How many required skills are covered.",
    },
    {
      label: "ATS Readiness",
      value: breakdown.atsReadability ?? 0,
      icon: ShieldCheck,
      note: "How cleanly the CV can be parsed.",
    },
    {
      label: "Location",
      value: breakdown.locationMatch,
      icon: MapPin,
      note: "Fit between preferred and job location.",
    },
    {
      label: "Experience",
      value: breakdown.experienceMatch,
      icon: TrendingUp,
      note: "Fit between required and current experience.",
    },
    {
      label: "Keywords",
      value: breakdown.keywordMatch ?? 0,
      icon: Zap,
      note: "Overlap between CV and job language.",
    },
  ];

  return (
    <div className="space-y-6">
      <section>
        <SectionHeader
          icon={Sparkles}
          title="AI Review"
          description="A recruiter-style summary of why this CV does or does not fit the job."
        />
        <div className="grid gap-5 lg:grid-cols-3">
          <AdviceColumn
            title="Strengths"
            items={analysis.aiReview?.strengths}
            icon={CheckCircle2}
            tone="success"
          />
          <AdviceColumn
            title="Concerns"
            items={analysis.aiReview?.concerns}
            icon={AlertTriangle}
            tone="danger"
          />
          <AdviceColumn
            title="Recommendations"
            items={analysis.aiReview?.recommendations}
            icon={Lightbulb}
            tone="info"
          />
        </div>
      </section>

      <section>
        <SectionHeader
          icon={Gauge}
          title="Score Breakdown"
          description="Keep this section simple. Avoid showing raw AI calculation fields unless the user opens advanced details."
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
          title="Job Match Analysis"
          description="See matched skills, missing skills, and skills that need stronger CV evidence."
        />

        <div className="grid gap-5 lg:grid-cols-3">
          <SkillGroup
            title="Matched Skills"
            description="Skills found in both the CV and job description."
            skills={analysis.jobMatch.matchedSkills}
            tone="success"
            icon={CheckCircle2}
          />

          <SkillGroup
            title="Missing Skills"
            description="Skills required by the job but not clearly found in the CV."
            skills={analysis.jobMatch.missingSkills}
            tone="danger"
            icon={XCircle}
          />

          <Card className="p-5">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-foreground">
              <Gauge className="h-4 w-4 text-primary" />
              Skills to Strengthen
            </h3>

            <p className="mb-4 text-sm leading-6 text-muted-foreground">
              Skills found in the CV, but not shown strongly enough for this
              job.
            </p>

            {weakSkills.length ? (
              <div className="space-y-3">
                {weakSkills.slice(0, 5).map((skill) => (
                  <WeakSkillCard
                    key={`${skill.skill}-${skill.gap}`}
                    skill={skill}
                  />
                ))}
              </div>
            ) : (
              <EmptyState>No weak skills found.</EmptyState>
            )}
          </Card>
        </div>
      </section>

      <section>
        <SectionHeader
          icon={Lightbulb}
          title="Top Skill Gaps"
          description="Focus on these priority gaps before trying to improve every missing keyword."
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
          <EmptyState>No major gaps found.</EmptyState>
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
          title="Learning Roadmap"
          description="A compact phase-by-phase plan. Expand each phase only when you need the details."
        />
        {analysis.roadmap.phases.length ? (
          <div className="space-y-4">
            {analysis.roadmap.phases.map((phase) => (
              <RoadmapPhase key={phase.phase} phase={phase} />
            ))}
          </div>
        ) : (
          <EmptyState>No learning roadmap returned.</EmptyState>
        )}
      </section>

      <section>
        <SectionHeader
          icon={GraduationCap}
          title="Recommended Courses"
          description="Only the most useful resources are shown here to keep the page readable."
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
          <EmptyState>No course recommendations returned.</EmptyState>
        )}
      </section>
    </div>
  );
}

function FinalRecommendation({ analysis }: { analysis: CvAnalysisResult }) {
  const score = clampScore(analysis.jobMatch.score);
  const missingCount = analysis.gapAnalysis.skillGap.missing.length;
  const weakCount = analysis.gapAnalysis.skillGap.weak.length;

  const recommendation =
    score >= 75
      ? "This is a strong fit. Apply soon, but polish the CV with measurable project results."
      : score >= 45
        ? `This role is possible, but improve ${weakCount || missingCount} key areas before applying.`
        : `This is a weak match for now. Close the top ${Math.min(missingCount, 5)} skill gaps or target a closer role first.`;

  return (
    <Card className="overflow-hidden bg-primary text-primary-foreground">
      <div className="grid gap-5 p-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide">
            <Sparkles className="h-3.5 w-3.5" />
            Final Recommendation
          </p>
          <h2 className="text-2xl font-black tracking-tight">
            {recommendation}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-primary-foreground/80">
            Use the skills tab to understand the gap, then follow the roadmap
            tab to close it step by step.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 lg:justify-end">
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-4 py-2 text-sm font-bold hover:bg-white/20"
          >
            <UploadCloud className="h-4 w-4" />
            Upload New CV
          </a>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-4 py-2 text-sm font-bold hover:bg-white/20"
          >
            <Save className="h-4 w-4" />
            Save Roadmap
          </button>
          <a
            href="/jobs"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-bold text-primary hover:bg-white/90"
          >
            Explore Jobs
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </Card>
  );
}

function MatchReportDashboard({ analysis }: { analysis: CvAnalysisResult }) {
  const [activeTab, setActiveTab] = useState<ReportTab>("overview");
  const score = clampScore(analysis.jobMatch.score);
  const { visible: visibleMissingSkills } = compactList(
    analysis.jobMatch.missingSkills,
    8,
  );

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Card className="overflow-hidden p-6 md:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Match Report
              </p>
              <h1 className="text-3xl font-black tracking-tight text-foreground md:text-5xl">
                {analysis.jobContext.title}
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground md:text-base md:leading-7">
                {analysis.aiReview?.summary ??
                  "NextStepAI analyzed this CV against the selected job and prepared a focused improvement plan."}
              </p>

              <div className="mt-6">
                <ScoreCircle
                  score={score}
                  verdict={analysis.aiReview?.verdict}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <SummaryMetric
                label="Matched Skills"
                value={analysis.jobMatch.matchedSkills.length}
                note="Skills found in CV and JD"
                icon={CheckCircle2}
                tone="success"
              />
              <SummaryMetric
                label="Missing Skills"
                value={analysis.jobMatch.missingSkills.length}
                note={
                  visibleMissingSkills.length
                    ? visibleMissingSkills.slice(0, 3).join(", ")
                    : "No major missing skills"
                }
                icon={AlertTriangle}
                tone={
                  analysis.jobMatch.missingSkills.length ? "danger" : "success"
                }
              />
              <SummaryMetric
                label="Roadmap"
                value={formatWeeks(analysis.roadmap.totalWeeks)}
                note={analysis.roadmap.difficultyLevel || "Personalized plan"}
                icon={BookOpen}
                tone="info"
              />
              <SummaryMetric
                label="Location"
                value={analysis.jobContext.jobLocation || "Not specified"}
                note={
                  analysis.jobContext.jobIsRemote
                    ? "Remote available"
                    : "On-site or hybrid"
                }
                icon={MapPin}
                tone="neutral"
              />
            </div>
          </div>
        </Card>

        <div className="sticky top-0 z-10 -mx-4 border-y border-border bg-background/90 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
          <div className="flex flex-wrap gap-2">
            <TabButton
              active={activeTab === "overview"}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </TabButton>
            <TabButton
              active={activeTab === "skills"}
              onClick={() => setActiveTab("skills")}
            >
              Skills & Gaps
            </TabButton>
            <TabButton
              active={activeTab === "roadmap"}
              onClick={() => setActiveTab("roadmap")}
            >
              Roadmap
            </TabButton>
          </div>
        </div>

        {activeTab === "overview" ? <OverviewTab analysis={analysis} /> : null}
        {activeTab === "skills" ? <SkillsTab analysis={analysis} /> : null}
        {activeTab === "roadmap" ? <RoadmapTab analysis={analysis} /> : null}

        <FinalRecommendation analysis={analysis} />

        <Card className="p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-bold text-foreground">
                <BriefcaseBusiness className="h-4 w-4 text-primary" />
                Source job
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                CV level: {analysis.extractedProfile.cvLevel || "Unknown"} ·
                Target level: {analysis.jobContext.jobLevel || "Unknown"}
              </p>
            </div>
            {analysis.jobContext.sourceUrl ? (
              <a
                href={analysis.jobContext.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-fit items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-bold text-primary hover:bg-primary/15"
              >
                View Job Description
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : null}
          </div>
        </Card>
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
              <Sparkles className="h-5 w-5" />
            )}
          </div>
          <h1 className="text-2xl font-black text-foreground">{title}</h1>
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
        title="No match report yet"
        message="Run a CV scan from the dashboard first, then come back here to view the result."
      />
    );
  }

  if (loading) {
    return (
      <ReportState
        title="Loading match report"
        message="NextStepAI is loading your latest CV analysis."
        tone="info"
        loading
      />
    );
  }

  if (error || !analysis) {
    return (
      <ReportState
        title="Could not load report"
        message="We could not load this analysis right now. Please try again or run a new scan."
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
