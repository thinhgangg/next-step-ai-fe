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
  Target,
  TrendingUp,
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
import {
  SCORE_RING_TRACK_COLOR,
  clampScore,
  getScoreColor,
  getScoreLabel,
} from "@/shared/lib/score";
import { formatRelativeDate } from "@/shared/lib/date";

type Tone = "primary" | "emerald" | "amber" | "orange" | "blue";


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
          <p className="mt-2 text-xl font-bold tracking-tight text-foreground">
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
        background: `conic-gradient(${getScoreColor(
          clamped,
        )} ${clamped}%, ${SCORE_RING_TRACK_COLOR} ${clamped}% 100%)`,
      }}
    >
      <div
        className={`absolute ${innerInset} flex flex-col items-center justify-center rounded-full bg-card`}
      >
        <span className={`${textSize} font-extrabold text-foreground`}>
          {clamped}%
        </span>
        {size === "large" ? (
          <span className="text-xs font-semibold text-muted-foreground">
            độ phù hợp
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
  const scoreColor = getScoreColor(score);
  const breakdown = analysis?.jobMatch.scoreBreakdown;
  const matchedSkills = analysis?.jobMatch.matchedSkills.length ?? 0;
  const missingSkills = analysis?.jobMatch.missingSkills.length ?? 0;

  return (
    <DashboardCard className="p-5">
      <SectionTitle title="Báo cáo gần nhất" />

      {latestAnalysis ? (
        <div className="grid gap-5 xl:grid-cols-[auto_minmax(0,1fr)_280px] xl:items-center">
          <div className="flex justify-center xl:justify-start">
            <ScoreRing score={score} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div
                className="inline-flex rounded-full border px-3 py-1 text-xs font-bold"
                style={{
                  borderColor: `${scoreColor}40`,
                  backgroundColor: `${scoreColor}1a`,
                  color: scoreColor,
                }}
              >
                {getScoreLabel(score)}
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {formatRelativeDate(latestAnalysis.createdAt, {
                  fallback: "Không rõ ngày",
                  yesterdayLabel: "Hôm qua",
                })}
              </span>
            </div>
            <h3 className="mt-3 line-clamp-2 text-2xl font-extrabold text-foreground">
              {latestAnalysis.jobTitle || "Không rõ vị trí"}
            </h3>
            <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
              CV: {latestAnalysis.cvFilename ?? "CV đã tải lên"}
            </p>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-background/50 px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Mức độ phù hợp
                </p>
                <p className="mt-1 text-sm font-bold text-foreground">
                  {breakdown ? `${clampScore(breakdown.skillMatch)}%` : "--"}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-background/50 px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Kỹ năng phù hợp
                </p>
                <p className="mt-1 text-sm font-bold text-foreground">
                  {matchedSkills || "--"}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-background/50 px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Kỹ năng còn thiếu
                </p>
                <p className="mt-1 text-sm font-bold text-foreground">
                  {missingSkills || "--"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Chi tiết báo cáo
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Mở báo cáo đầy đủ để xem phản hồi từ AI, các từ khóa còn thiếu và
              lộ trình cải thiện theo vị trí mục tiêu.
            </p>
            <button
              type="button"
              onClick={() => onOpen(latestAnalysis.analysisId)}
              className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Xem báo cáo chi tiết
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-muted/40 p-6 text-center">
          <FileSearch className="mx-auto h-9 w-9 text-muted-foreground" />
          <h3 className="mt-3 text-base font-bold text-foreground">
            Chưa có báo cáo nào được tạo
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Hãy phân tích CV đầu tiên để xem điểm mạnh, điểm thiếu và mức độ phù
            hợp với công việc.
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
      <div className="mb-4">
        <h2 className="text-base font-bold text-foreground">Kỹ năng nổi bật</h2>

        {analysis ? (
          <p className="mt-1 line-clamp-1 text-xs font-medium text-muted-foreground">
            Dựa trên {analysis.jobContext.title}
          </p>
        ) : null}
      </div>
      {loading ? (
        <div className="flex min-h-[180px] items-center justify-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          Đang trích xuất kỹ năng...
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
          Hãy phân tích CV để xem các kỹ năng nổi bật trong hồ sơ của bạn.
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
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-sm font-extrabold text-primary">
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
          Phân tích
        </button>
        <a
          href={job.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="hidden h-9 items-center rounded-lg border border-border px-3 text-sm font-semibold text-primary hover:bg-muted sm:inline-flex"
        >
          Ứng tuyển
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
        title="Lộ trình cải thiện kỹ năng"
        action={
          analysis ? (
            <span className="line-clamp-1 max-w-[260px] text-right text-xs font-medium text-muted-foreground">
              Dựa trên {analysis.jobContext.title}
            </span>
          ) : null
        }
      />

      {loading ? (
        <div className="flex min-h-[220px] items-center justify-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          Đang tải lộ trình...
        </div>
      ) : phases.length ? (
        <div className="relative space-y-5 pl-8">
          <div className="absolute bottom-4 left-[15px] top-4 w-px bg-border" />
          {phases.map((phase) => (
            <div key={phase.phase} className="relative">
              <div className="absolute -left-8 top-5 flex h-8 w-8 items-center justify-center rounded-full border border-primary/25 bg-card text-xs font-extrabold text-primary shadow-sm">
                {phase.phase}
              </div>
              <div className="rounded-xl border border-border bg-background/50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                      Giai đoạn {phase.phase}
                    </p>
                    <h3 className="mt-1 font-bold text-foreground">
                      {phase.title}
                    </h3>
                  </div>
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                    {phase.durationWeeks} tuần
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
          Hãy phân tích CV để tạo lộ trình kỹ năng cho vị trí mục tiêu.
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
          <h2 className="text-lg font-bold text-foreground">
            Mục tiêu nghề nghiệp
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {analysis
              ? `Vị trí mục tiêu: ${analysis.jobContext.title}`
              : "Hãy phân tích CV để kết nối hồ sơ của bạn với một vị trí mục tiêu."}
          </p>
        </div>
      </div>

      <div className="grid gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 md:min-w-[360px] md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Độ phù hợp gần nhất
          </p>
          <p className="mt-1 text-2xl font-extrabold text-primary">
            {latestScore ? `${latestScore}%` : "--"}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Lộ trình cải thiện
          </p>
          <p className="mt-1 text-2xl font-extrabold text-foreground">
            {analysis ? `${analysis.roadmap.totalWeeks} tuần` : "--"}
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
  const {
    jobs,
    totalCount,
    loading: jobsLoading,
  } = useJobsCatalog({
    limit: 4,
    offset: 0,
    sortBy: "RELEVANCE",
    dateRange: "ANY",
    employmentType: "ALL",
    experienceRange: "ALL",
    cvId: user?.baseCvId ?? undefined,
    skip: false,
  });

  const displayName = user?.name?.trim() || "bạn";
  const latestScore = clampScore(latestAnalysis?.jobMatchScore);
  const newJobsLabel = totalCount > 0 ? totalCount : jobs.length;

  const openAnalysis = (analysisId: number) => {
    setLatestAnalysisId(analysisId);
    navigate({ to: "/match-report" });
  };

  return (
    <AppShell
      fullWidth
      headerTitle={`Xin chào, ${displayName}!`}
      headerDescription="Xem nhanh mức độ phù hợp của CV, kỹ năng nổi bật và các công việc được đề xuất cho bạn."
    >
      <div className="mx-auto max-w-[1480px] space-y-5">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Độ phù hợp tổng quan"
            value={latestScore ? `${latestScore}%` : "--"}
            note={
              latestAnalysis
                ? getScoreLabel(latestScore)
                : "Hãy phân tích CV để tính mức độ phù hợp."
            }
            icon={Target}
            tone="primary"
          />
          <MetricCard
            label={user?.baseCvId ? "Việc làm phù hợp" : "Việc đang mở"}
            value={jobsLoading ? "..." : newJobsLabel}
            note={
              user?.baseCvId
                ? "Các công việc phù hợp nhất dựa trên CV chính của bạn."
                : "Tải CV chính lên để hệ thống xếp hạng mức độ phù hợp."
            }
            icon={BriefcaseBusiness}
            tone="emerald"
          />
          <MetricCard
            label="CV đã lưu"
            value={cvs.length}
            note="Các CV bạn đã tải lên sẵn sàng để phân tích và so sánh."
            icon={FileText}
            tone="blue"
          />
          <MetricCard
            label="Lộ trình cải thiện"
            value={
              analysisLoading
                ? "..."
                : latestAnalysisDetail
                  ? `${latestAnalysisDetail.roadmap.totalWeeks} tuần`
                  : "--"
            }
            note={
              latestAnalysisDetail
                ? `Được tạo cho ${latestAnalysisDetail.jobContext.title}.`
                : "Hãy phân tích CV để tạo lộ trình theo vị trí mục tiêu."
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
              title="Việc làm gợi ý"
              action={
                <ActionLink
                  label="Xem tất cả"
                  onClick={() => navigate({ to: "/jobs" })}
                />
              }
            />

            {jobsLoading ? (
              <div className="flex min-h-[220px] items-center justify-center gap-3 text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                Đang tải các công việc phù hợp...
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
                Chưa có công việc nào được đề xuất. Tải lên một CV hoặc điều
                chỉnh bộ lọc tìm kiếm để khám phá các vị trí.
              </div>
            )}
          </DashboardCard>

          <DashboardCard className="p-5">
            <SectionTitle title="Thao tác nhanh" />
            <div className="grid gap-3">
              <QuickAction
                label="Phân tích CV"
                description="Tải lên CV mới để nhận báo cáo phù hợp và lộ trình cải thiện."
                icon={FileSearch}
                onClick={() => navigate({ to: "/resume-optimizer" })}
              />
              <QuickAction
                label="Xem báo cáo gần nhất"
                description="Xem báo cáo phân tích CV gần nhất của bạn."
                icon={BarChart3}
                onClick={() =>
                  latestAnalysis
                    ? openAnalysis(latestAnalysis.analysisId)
                    : navigate({ to: "/resume-optimizer" })
                }
              />
              <QuickAction
                label="Quản lý CV"
                description={
                  cvs.length
                    ? `Bạn có ${cvs.length} CV đã lưu.`
                    : "Bạn chưa có CV nào được lưu."
                }
                icon={FileText}
                onClick={() => navigate({ to: "/resume-manager" })}
              />
              <QuickAction
                label="Lịch sử phân tích"
                description="Xem lại các phân tích CV trước đây."
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
            <SectionTitle title="Hoạt động gần đây" />
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
                        {item.jobTitle || "Chưa có tên vị trí"}
                      </span>
                      <span className="mt-1 block line-clamp-1 text-xs text-muted-foreground">
                        {item.cvFilename ?? "CV đã tải lên"} -{" "}
                        {formatRelativeDate(item.createdAt, {
                          fallback: "Không rõ ngày",
                          yesterdayLabel: "Hôm qua",
                        })}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-extrabold text-primary">
                      {clampScore(item.jobMatchScore)}%
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-muted/40 p-5 text-sm text-muted-foreground">
                Lịch sử phân tích sẽ xuất hiện tại đây sau khi bạn có báo cáo
                đầu tiên.
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
