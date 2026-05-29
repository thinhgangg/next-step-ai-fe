import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileSearch,
  Gauge,
  Lightbulb,
  Loader2,
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
import {
  SCORE_RING_TRACK_COLOR,
  clampScore,
  getScoreColor,
  getScoreLabel,
} from "@/shared/lib/score";
import { formatRelativeDate } from "@/shared/lib/date";

type Tone = "primary" | "emerald" | "amber" | "blue" | "rose";


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
    </PageCard>
  );
}

function ScoreRing({ score }: { score: number }) {
  const clamped = clampScore(score);

  return (
    <div
      className="relative h-32 w-32 shrink-0 rounded-full"
      style={{
        background: `conic-gradient(${getScoreColor(
          clamped,
        )} ${clamped}%, ${SCORE_RING_TRACK_COLOR} ${clamped}% 100%)`,
      }}
    >
      <div className="absolute inset-[9px] flex flex-col items-center justify-center rounded-full bg-card">
        <span className="text-4xl font-extrabold text-foreground">
          {clamped}%
        </span>
        <span className="text-xs font-semibold text-muted-foreground">
          độ phù hợp
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
      <SectionTitle title="Báo cáo gần nhất" />
      {latestAnalysis ? (
        <div className="grid gap-5 sm:grid-cols-[auto_1fr] sm:items-center">
          <ScoreRing score={score} />
          <div className="min-w-0">
            <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              {getScoreLabel(score)}
            </span>
            <h3 className="mt-3 line-clamp-2 text-xl font-bold text-foreground">
              {latestAnalysis.jobTitle || "Không rõ vị trí"}
            </h3>
            <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
              {latestAnalysis.cvFilename ?? "CV đã tải lên"} -{" "}
              {formatRelativeDate(latestAnalysis.createdAt, {
                fallback: "Không rõ ngày",
                yesterdayLabel: "Hôm qua",
              })}
            </p>
            <button
              type="button"
              onClick={() => onOpen(latestAnalysis.analysisId)}
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Xem báo cáo
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
      <SectionTitle title="Báo cáo gần đây" />
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
        <p className="rounded-xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          Lịch sử phân tích sẽ xuất hiện tại đây sau khi bạn có báo cáo đầu
          tiên.
        </p>
      )}
    </PageCard>
  );
}

function OptimizationTips() {
  const tips = [
    "Sử dụng file PDF hoặc DOCX với tiêu đề rõ ràng và khoảng cách đồng nhất.",
    "Chọn một vị trí ứng tuyển cụ thể để hệ thống có thể so sánh kỹ năng, từ khóa và kinh nghiệm của bạn.",
    "Bổ sung kết quả dự án có con số cụ thể trước khi quét lại CV.",
    "Lưu một CV gốc trong Resume Manager để tìm việc phù hợp nhanh hơn.",
  ];

  return (
    <PageCard className="p-5">
      <SectionTitle title="Cách cải thiện độ phù hợp" />
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
    <AppShell
      fullWidth
      headerTitle="Phân tích CV"
      headerDescription="So khớp CV với JD, phát hiện kỹ năng còn thiếu và nhận gợi ý cải thiện hồ sơ."
    >
      <div className="mx-auto max-w-[1480px] space-y-5">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Phân tích gần nhất"
            value={
              historyLoading ? "..." : latestScore ? `${latestScore}%` : "--"
            }
            note={
              latestAnalysis
                ? `${getScoreLabel(latestScore)}`
                : "Chưa có phân tích nào được thực hiện"
            }
            icon={Target}
            tone="primary"
          />
          <MetricCard
            label="Điểm ATS"
            value={
              analysisLoading
                ? "..."
                : atsScore != null
                  ? `${clampScore(atsScore)}%`
                  : "--"
            }
            note="Dựa trên lần phân tích CV gần nhất."
            icon={Gauge}
            tone="blue"
          />
          <MetricCard
            label="Kỹ năng được nhận diện"
            value={analysisLoading ? "..." : recognizedSkills}
            note="Các kỹ năng được tìm thấy trong lần phân tích CV gần nhất."
            icon={CheckCircle2}
            tone="emerald"
          />
          <MetricCard
            label="CV đã lưu"
            value={cvsLoading ? "..." : cvs.length}
            note="Các file CV có sẵn trong thư viện CV của bạn."
            icon={FileCheck2}
            tone="amber"
          />
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-5">
            <NewScanSection />
            <div className="grid gap-5 lg:grid-cols-2">
              <InsightList
                title="Điểm mạnh của CV"
                icon={CheckCircle2}
                tone="emerald"
                items={strengths}
                emptyText="Điểm mạnh sẽ xuất hiện sau lần phân tích tiếp theo."
              />
              <InsightList
                title="Điểm cần cải thiện"
                icon={Lightbulb}
                tone="amber"
                items={recommendations}
                emptyText="Gợi ý sẽ xuất hiện sau lần phân tích tiếp theo."
              />
            </div>
          </div>

          <aside className="space-y-5">
            <LatestAnalysisPanel
              latestAnalysis={latestAnalysis}
              onOpen={openAnalysis}
            />

            <PageCard className="p-5">
              <SectionTitle title="Từ khóa còn thiếu" />
              {analysisLoading ? (
                <div className="flex min-h-[120px] items-center justify-center gap-3 text-sm text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  Đang tải...
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
                  Các từ khóa còn thiếu sẽ xuất hiện sau khi bạn so khớp CV với
                  công việc mục tiêu.
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
