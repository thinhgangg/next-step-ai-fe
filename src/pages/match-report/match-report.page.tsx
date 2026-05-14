import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  BookOpen,
  BriefcaseBusiness,
  CheckCircle2,
  ExternalLink,
  FileText,
  Gauge,
  GraduationCap,
  Loader2,
  MapPin,
  Sparkles,
  Target,
} from "lucide-react";
import { AppShell } from "@/shared/ui/app-shell";
import { getLatestAnalysisId } from "@/shared/config/latest-analysis";
import {
  type CvAnalysisResult,
  useCvAnalysisResult,
} from "@/features/cv/model/cv.model";

type Status = "ok" | "warn" | "fail";
type Tab = "overview" | "resume" | "job" | "gaps" | "roadmap" | "response";

const tabs: Array<{ id: Tab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "resume", label: "CV Profile" },
  { id: "job", label: "Job Context" },
  { id: "gaps", label: "Gaps" },
  { id: "roadmap", label: "Roadmap" },
  { id: "response", label: "Full Response" },
];

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value || 0)));
}

function asPercent(value: number) {
  return `${Math.round((value || 0) * 100)}%`;
}

function scoreStatus(score: number): Status {
  if (score >= 70) return "ok";
  if (score >= 45) return "warn";
  return "fail";
}

function statusClasses(status: Status) {
  if (status === "ok") return "border-success/30 bg-success/10 text-success";
  if (status === "warn") return "border-amber-300 bg-amber-50 text-amber-700";
  return "border-destructive/30 bg-destructive/10 text-destructive";
}

function barColor(score: number) {
  if (score >= 70) return "bg-success";
  if (score >= 45) return "bg-amber-500";
  return "bg-destructive";
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  icon?: typeof Gauge;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/50 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          {Icon ? <Icon className="h-4 w-4 shrink-0 text-primary" /> : null}
          <h2 className="truncate text-sm font-semibold text-foreground">{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Metric({
  label,
  value,
  note,
}: {
  label: string;
  value: string | number;
  note?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-background px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold text-foreground">{value}</p>
      {note ? <p className="mt-1 text-xs text-muted-foreground">{note}</p> : null}
    </div>
  );
}

function ProgressMetric({
  label,
  score,
  note,
}: {
  label: string;
  score: number;
  note?: string;
}) {
  const clamped = clampScore(score);

  return (
    <div className="rounded-lg border border-border bg-background px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <span
          className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${statusClasses(
            scoreStatus(clamped),
          )}`}
        >
          {clamped}
        </span>
      </div>
      <div className="mt-3 h-2 rounded-full bg-border">
        <div
          className={`h-2 rounded-full ${barColor(clamped)}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {note ? <p className="mt-2 text-xs text-muted-foreground">{note}</p> : null}
    </div>
  );
}

function DataRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="grid gap-1 border-t border-border px-4 py-3 first:border-t-0 sm:grid-cols-[190px_1fr] sm:gap-4">
      <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
      <div className="min-w-0 text-sm text-foreground">{value}</div>
    </div>
  );
}

function TagList({
  items,
  empty,
  tone = "neutral",
}: {
  items: string[];
  empty: string;
  tone?: "neutral" | "ok" | "warn" | "fail";
}) {
  if (!items.length) return <span className="text-muted-foreground">{empty}</span>;

  const classes =
    tone === "ok"
      ? "border-success/30 bg-success/10 text-success"
      : tone === "warn"
        ? "border-amber-300 bg-amber-50 text-amber-700"
        : tone === "fail"
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-border bg-muted text-foreground";

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className={`rounded-full border px-2.5 py-1 text-xs ${classes}`}>
          {item}
        </span>
      ))}
    </div>
  );
}

function AdviceList({
  title,
  items,
  status,
}: {
  title: string;
  items: string[];
  status: Status;
}) {
  if (!items.length) return null;

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{title}</p>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item} className="flex gap-2 rounded-lg border border-border bg-background p-3 text-sm">
            {status === "ok" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            ) : (
              <AlertTriangle
                className={`mt-0.5 h-4 w-4 shrink-0 ${
                  status === "warn" ? "text-amber-500" : "text-destructive"
                }`}
              />
            )}
            <span className="text-foreground">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalysisShell({
  analysis,
  tab,
  setTab,
}: {
  analysis: CvAnalysisResult;
  tab: Tab;
  setTab: (tab: Tab) => void;
}) {
  const breakdown = analysis.jobMatch.scoreBreakdown;
  const resumeSkillNames = new Set(
    analysis.extractedProfile.cvSkills.map((skill) => skill.name.toLowerCase()),
  );

  const scoreItems = [
    ["Skill match", breakdown.skillMatch],
    ["Experience", breakdown.experienceMatch],
    ["Level", breakdown.levelMatch],
    ["Salary", breakdown.salaryMatch],
    ["Location", breakdown.locationMatch],
    ["Keyword", breakdown.keywordMatch ?? 0],
    ["Title", breakdown.titleMatch ?? 0],
    ["ATS readability", breakdown.atsReadability ?? 0],
  ] as const;

  const allRoadmapResources = useMemo(
    () =>
      analysis.roadmap.phases.flatMap((phase) =>
        phase.skills.flatMap((skill) =>
          skill.recommendedResources.map((resource) => ({
            ...resource,
            skillName: skill.skillName,
            phase: phase.phase,
          })),
        ),
      ),
    [analysis],
  );

  const responseJson = useMemo(
    () => JSON.stringify(analysis, null, 2),
    [analysis],
  );

  return (
    <div className="space-y-4 pb-12">
      <header className="rounded-lg border border-border bg-card px-4 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Resume match report
            </p>
            <h1 className="mt-1 truncate text-2xl font-bold text-foreground">
              {analysis.jobContext.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>Analysis #{analysis.analysisResultId ?? "-"}</span>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span>{analysis.extractedProfile.cvLevel || "unknown"} CV</span>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span>{analysis.jobContext.jobLevel || "unknown"} job</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative h-24 w-24 shrink-0 rounded-full bg-border">
              <div
                className="h-24 w-24 rounded-full"
                style={{
                  background: `conic-gradient(var(--primary) ${clampScore(
                    analysis.jobMatch.score,
                  )}%, var(--border) 0)`,
                }}
              />
              <div className="absolute inset-2 flex items-center justify-center rounded-full bg-card">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">
                    {clampScore(analysis.jobMatch.score)}
                  </p>
                  <p className="text-[10px] uppercase text-muted-foreground">score</p>
                </div>
              </div>
            </div>
            <div className="min-w-[150px]">
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses(
                  scoreStatus(analysis.jobMatch.score),
                )}`}
              >
                {analysis.aiReview?.verdict ?? "analysis_ready"}
              </span>
              <p className="mt-2 text-sm text-muted-foreground">
                {analysis.aiReview?.source
                  ? `Review source: ${analysis.aiReview.source}`
                  : "AI review is not available."}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="overflow-x-auto border-b border-border">
        <div className="flex min-w-max gap-1">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`h-11 px-4 text-sm font-semibold ${
                tab === item.id
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "overview" ? (
        <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <Panel title="AI review" icon={Sparkles}>
              {analysis.aiReview ? (
                <div className="space-y-5">
                  <p className="rounded-lg bg-muted p-4 text-sm leading-6 text-foreground">
                    {analysis.aiReview.summary}
                  </p>
                  <div className="grid gap-4 lg:grid-cols-3">
                    <AdviceList title="Strengths" items={analysis.aiReview.strengths} status="ok" />
                    <AdviceList title="Concerns" items={analysis.aiReview.concerns} status="fail" />
                    <AdviceList
                      title="Recommendations"
                      items={analysis.aiReview.recommendations}
                      status="warn"
                    />
                  </div>
                </div>
              ) : (
                <EmptyState text="No AI review was returned for this analysis." />
              )}
            </Panel>

            <Panel title="Score breakdown" icon={Gauge}>
              <div className="grid gap-3 md:grid-cols-2">
                {scoreItems.map(([label, score]) => (
                  <ProgressMetric key={label} label={label} score={score} />
                ))}
              </div>
            </Panel>
          </div>

          <div className="space-y-4">
            <Panel title="Quick facts" icon={Target}>
              <div className="grid gap-3">
                <Metric
                  label="Matched skills"
                  value={analysis.jobMatch.matchedSkills.length}
                  note={analysis.jobMatch.matchedSkills.join(", ") || "No matched skill"}
                />
                <Metric
                  label="Missing skills"
                  value={analysis.jobMatch.missingSkills.length}
                  note="Skills required by the job but absent from CV"
                />
                <Metric
                  label="Roadmap"
                  value={`${analysis.roadmap.totalWeeks} weeks`}
                  note={`${analysis.roadmap.difficultyLevel} difficulty`}
                />
                <Metric
                  label="Experience gap"
                  value={`${analysis.gapAnalysis.experienceGap.gapWeeks} weeks`}
                  note={`${analysis.gapAnalysis.experienceGap.currentYears}/${analysis.gapAnalysis.experienceGap.requiredYears} years`}
                />
              </div>
            </Panel>
          </div>
        </div>
      ) : null}

      {tab === "resume" ? (
        <div className="space-y-4">
          <Panel title="Extracted CV profile" icon={FileText}>
            <div className="overflow-hidden rounded-lg border border-border">
              <DataRow label="CV level" value={analysis.extractedProfile.cvLevel || "-"} />
              <DataRow
                label="Years experience"
                value={`${analysis.extractedProfile.cvYearsExperience} years`}
              />
              <DataRow
                label="Preferred locations"
                value={
                  <TagList
                    items={analysis.extractedProfile.preferredLocations}
                    empty="No preferred location detected"
                  />
                }
              />
              <DataRow
                label="Certifications"
                value={
                  <TagList
                    items={analysis.extractedProfile.cvCertifications}
                    empty="No certification detected"
                    tone="ok"
                  />
                }
              />
            </div>
          </Panel>

          <Panel title="CV skills" icon={GraduationCap}>
            {analysis.extractedProfile.cvSkills.length ? (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[620px] table-fixed">
                  <thead className="bg-muted text-left text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Skill</th>
                      <th className="w-[180px] px-4 py-3">Proficiency</th>
                      <th className="w-[180px] px-4 py-3">Experience</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.extractedProfile.cvSkills.map((skill) => (
                      <tr key={skill.name} className="border-t border-border text-sm">
                        <td className="px-4 py-3 font-medium text-foreground">{skill.name}</td>
                        <td className="px-4 py-3 text-foreground">{asPercent(skill.proficiency)}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {skill.yearsOfExperience} years
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState text="No CV skill was extracted." />
            )}
          </Panel>
        </div>
      ) : null}

      {tab === "job" ? (
        <div className="space-y-4">
          <Panel
            title="Job context"
            icon={BriefcaseBusiness}
            action={
              analysis.jobContext.sourceUrl ? (
                <a
                  href={analysis.jobContext.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  Source <ExternalLink className="h-3 w-3" />
                </a>
              ) : null
            }
          >
            <div className="overflow-hidden rounded-lg border border-border">
              <DataRow label="Job ID" value={analysis.jobContext.jobId} />
              <DataRow label="Title" value={analysis.jobContext.title || "-"} />
              <DataRow label="Level" value={analysis.jobContext.jobLevel || "-"} />
              <DataRow
                label="Required experience"
                value={`${analysis.jobContext.jobYearsRequired} years`}
              />
              <DataRow
                label="Location"
                value={
                  <span className="inline-flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    {analysis.jobContext.jobLocation ?? "-"}
                  </span>
                }
              />
              <DataRow label="Remote" value={analysis.jobContext.jobIsRemote ? "Yes" : "No"} />
            </div>
          </Panel>

          <Panel title="Required job skills" icon={Target}>
            {analysis.jobContext.jobSkills.length ? (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[760px] table-fixed">
                  <thead className="bg-muted text-left text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Skill</th>
                      <th className="w-[150px] px-4 py-3">Importance</th>
                      <th className="w-[170px] px-4 py-3">Required level</th>
                      <th className="w-[130px] px-4 py-3">In CV</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.jobContext.jobSkills.map((skill) => {
                      const found = resumeSkillNames.has(skill.name.toLowerCase());
                      return (
                        <tr key={skill.name} className="border-t border-border text-sm">
                          <td className="px-4 py-3 font-medium text-foreground">{skill.name}</td>
                          <td className="px-4 py-3 text-foreground">{asPercent(skill.importance)}</td>
                          <td className="px-4 py-3 text-foreground">
                            {asPercent(skill.requiredProficiency)}
                          </td>
                          <td className={found ? "px-4 py-3 text-success" : "px-4 py-3 text-destructive"}>
                            {found ? "Found" : "Missing"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState text="No required job skill was returned." />
            )}
          </Panel>
        </div>
      ) : null}

      {tab === "gaps" ? (
        <div className="space-y-4">
          <Panel title="Skill gap" icon={AlertTriangle}>
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                  Missing skills
                </p>
                {analysis.gapAnalysis.skillGap.missing.length ? (
                  <div className="space-y-2">
                    {analysis.gapAnalysis.skillGap.missing.map((item) => (
                      <div key={`${item.skill}-${item.reason}`} className="rounded-lg border border-border bg-background p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold text-foreground">{item.skill}</p>
                          <span className="rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
                            {item.importance}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{item.reason}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState text="No missing skill." />
                )}
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                  Weak skills
                </p>
                {analysis.gapAnalysis.skillGap.weak.length ? (
                  <div className="space-y-2">
                    {analysis.gapAnalysis.skillGap.weak.map((item) => (
                      <div key={`${item.skill}-${item.gap}`} className="rounded-lg border border-border bg-background p-3">
                        <p className="font-semibold text-foreground">{item.skill}</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Current {asPercent(item.currentProficiency)}, required{" "}
                          {asPercent(item.requiredProficiency)}, gap {asPercent(item.gap)}.
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState text="No weak skill." />
                )}
              </div>
            </div>
          </Panel>

          <Panel title="Other gaps and recommendations" icon={Target}>
            <div className="overflow-hidden rounded-lg border border-border">
              <DataRow
                label="Recommended skills"
                value={
                  <TagList
                    items={analysis.gapAnalysis.recommendedSkills}
                    empty="No recommended skill"
                    tone="warn"
                  />
                }
              />
              <DataRow
                label="Experience gap"
                value={`${analysis.gapAnalysis.experienceGap.currentYears}/${analysis.gapAnalysis.experienceGap.requiredYears} years, ${analysis.gapAnalysis.experienceGap.gapWeeks} weeks gap`}
              />
              <DataRow
                label="Level gap"
                value={`${analysis.gapAnalysis.levelGap.cvLevel} CV vs ${analysis.gapAnalysis.levelGap.jobLevel} job, ${analysis.gapAnalysis.levelGap.gapLevels} level gap`}
              />
              <DataRow
                label="Required certs"
                value={
                  <TagList
                    items={analysis.gapAnalysis.certificationGap.required}
                    empty="No required certification"
                  />
                }
              />
              <DataRow
                label="Have certs"
                value={
                  <TagList
                    items={analysis.gapAnalysis.certificationGap.have}
                    empty="No detected certification"
                    tone="ok"
                  />
                }
              />
              <DataRow
                label="Missing certs"
                value={
                  <TagList
                    items={analysis.gapAnalysis.certificationGap.missing}
                    empty="No missing certification"
                    tone="fail"
                  />
                }
              />
            </div>
          </Panel>

          <Panel title="Matched and missing keywords" icon={CheckCircle2}>
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                  Matched
                </p>
                <TagList items={analysis.jobMatch.matchedSkills} empty="No matched keyword" tone="ok" />
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                  Missing
                </p>
                <TagList items={analysis.jobMatch.missingSkills} empty="No missing keyword" tone="fail" />
              </div>
            </div>
          </Panel>
        </div>
      ) : null}

      {tab === "roadmap" ? (
        <div className="space-y-4">
          <Panel title="Roadmap summary" icon={BookOpen}>
            <div className="grid gap-3 md:grid-cols-3">
              <Metric label="Total weeks" value={analysis.roadmap.totalWeeks} />
              <Metric label="Estimated completion" value={analysis.roadmap.estimatedCompletion} />
              <Metric label="Difficulty" value={analysis.roadmap.difficultyLevel} />
            </div>
          </Panel>

          {analysis.roadmap.phases.length ? (
            analysis.roadmap.phases.map((phase) => (
              <Panel
                key={phase.phase}
                title={`Phase ${phase.phase}: ${phase.title}`}
                icon={BookOpen}
                action={
                  <span className="text-xs font-semibold text-muted-foreground">
                    {phase.durationWeeks} weeks
                  </span>
                }
              >
                <div className="grid gap-3">
                  {phase.skills.map((skill) => (
                    <div key={`${phase.phase}-${skill.skillName}`} className="rounded-lg border border-border bg-background p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground">{skill.skillName}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {skill.estimatedWeeks} weeks, priority {skill.priority}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full border border-border bg-muted px-2 py-1">
                            baseline {skill.baselineHours ?? "-"}h
                          </span>
                          <span className="rounded-full border border-border bg-muted px-2 py-1">
                            adjusted {skill.adjustedHours ?? "-"}h
                          </span>
                          <span className="rounded-full border border-border bg-muted px-2 py-1">
                            transfer {asPercent(skill.transferBonus)}
                          </span>
                          <span className="rounded-full border border-border bg-muted px-2 py-1">
                            effective {skill.effectiveTransferBonus != null ? asPercent(skill.effectiveTransferBonus) : "-"}
                          </span>
                          <span className="rounded-full border border-border bg-muted px-2 py-1">
                            direction {skill.transferDirectionFactor ?? "-"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3">
                        <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                          Recommended resources
                        </p>
                        {skill.recommendedResources.length ? (
                          <div className="grid gap-2 md:grid-cols-2">
                            {skill.recommendedResources.map((resource) => (
                              <a
                                key={`${skill.skillName}-${resource.title}-${resource.url ?? ""}`}
                                href={resource.url ?? undefined}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-lg border border-border bg-card p-3 text-sm hover:bg-muted"
                              >
                                <p className="font-medium text-foreground">{resource.title}</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {resource.provider ?? "Unknown provider"} ·{" "}
                                  {resource.durationHours ?? "-"}h
                                </p>
                              </a>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No resource returned for this skill.
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            ))
          ) : (
            <EmptyState text="No roadmap phase was returned." />
          )}

          <Panel title="All recommended resources" icon={ExternalLink}>
            {allRoadmapResources.length ? (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[760px] table-fixed">
                  <thead className="bg-muted text-left text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="w-[90px] px-4 py-3">Phase</th>
                      <th className="px-4 py-3">Skill</th>
                      <th className="px-4 py-3">Resource</th>
                      <th className="w-[150px] px-4 py-3">Provider</th>
                      <th className="w-[110px] px-4 py-3">Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allRoadmapResources.map((resource) => (
                      <tr
                        key={`${resource.phase}-${resource.skillName}-${resource.title}`}
                        className="border-t border-border text-sm"
                      >
                        <td className="px-4 py-3 text-muted-foreground">{resource.phase}</td>
                        <td className="px-4 py-3 font-medium text-foreground">{resource.skillName}</td>
                        <td className="px-4 py-3">
                          {resource.url ? (
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:underline"
                            >
                              {resource.title}
                            </a>
                          ) : (
                            <span className="text-foreground">{resource.title}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {resource.provider ?? "-"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {resource.durationHours ?? "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState text="No recommended resource was returned." />
            )}
          </Panel>
        </div>
      ) : null}

      {tab === "response" ? (
        <Panel title="Full response payload" icon={FileText}>
          <pre className="max-h-[680px] overflow-auto rounded-lg bg-foreground p-4 font-mono text-xs leading-5 text-background">
            {responseJson}
          </pre>
        </Panel>
      ) : null}
    </div>
  );
}

export function MatchReportPage() {
  const [tab, setTab] = useState<Tab>("overview");
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
      <AnalysisShell analysis={analysis} tab={tab} setTab={setTab} />
    </AppShell>
  );
}
