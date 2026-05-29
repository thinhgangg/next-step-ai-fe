import { useMemo, useState } from "react";
import {
  ArrowUpDown,
  BarChart3,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  Loader2,
  Search,
  Target,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCvAnalysisHistory } from "@/features/cv/model/cv.model";
import { getUserFacingErrorMessage } from "@/shared/api/graphql/error-message";
import { setLatestAnalysisId } from "@/shared/config/latest-analysis";
import {
  SCORE_RING_TRACK_COLOR,
  clampScore,
  getScoreColor,
  getScoreLabel,
} from "@/shared/lib/score";
import { useNavigate } from "@tanstack/react-router";

export type ScanHistoryItem = {
  id: string;
  analysisId: number;
  score: number;
  cvFilename: string;
  jobTitle: string;
  jobDescription: string;
  scanDate: string;
  scanTimestamp: number;
};

type SortBy = "scanDate" | "score";
type SortOrder = "desc" | "asc";

function ScoreRing({ score }: { score: number }) {
  const clamped = clampScore(score);

  return (
    <div className="flex items-center justify-center gap-3">
      <div
        className="relative h-11 w-11 shrink-0 rounded-full"
        title={`${clamped}% - ${getScoreLabel(clamped)}`}
        style={{
          background: `conic-gradient(${getScoreColor(
            clamped,
          )} ${clamped}%, ${SCORE_RING_TRACK_COLOR} ${clamped}% 100%)`,
        }}
      >
        <div className="absolute inset-[4px] flex items-center justify-center rounded-full bg-card text-sm font-bold text-foreground">
          {clamped}
        </div>
      </div>
    </div>
  );
}

function parseScanDate(scanDate: string) {
  const parsed = new Date(scanDate).getTime();
  if (Number.isNaN(parsed)) return 0;
  return parsed;
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

function MetricCard({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  note: string;
  icon: LucideIcon;
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
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="line-clamp-2 text-sm text-muted-foreground">{note}</p>
    </PageCard>
  );
}

export function ScanHistorySection() {
  const navigate = useNavigate();
  const { items: historyItems, loading, error } = useCvAnalysisHistory();
  const [searchValue, setSearchValue] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("scanDate");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 10;
  const items = useMemo<ScanHistoryItem[]>(
    () =>
      historyItems.map((item) => {
        const timestamp = new Date(item.createdAt).getTime();
        const scanTimestamp = Number.isNaN(timestamp) ? 0 : timestamp;
        const scanDate = scanTimestamp
          ? new Intl.DateTimeFormat("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }).format(new Date(timestamp))
          : "Không rõ ngày";

        return {
          id: String(item.analysisId),
          analysisId: item.analysisId,
          score: item.jobMatchScore ?? 0,
          cvFilename: item.cvFilename ?? "CV không xác định",
          jobTitle: item.jobTitle || "Không xác định",
          jobDescription:
            item.roadmapTotalWeeks && item.roadmapTotalWeeks > 0
              ? `Lộ trình dự kiến trong ${item.roadmapTotalWeeks} tuần.`
              : "Báo cáo phân tích đã hoàn tất.",
          scanDate,
          scanTimestamp,
        };
      }),
    [historyItems],
  );
  const hasHistory = items.length > 0;
  const isInitialLoading = loading && historyItems.length === 0;
  const bestScore = items.reduce((best, item) => Math.max(best, item.score), 0);
  const latestItem = items.reduce<ScanHistoryItem | null>((latest, item) => {
    if (!latest) return item;
    return item.scanTimestamp > latest.scanTimestamp ? item : latest;
  }, null);
  const averageScore = items.length
    ? Math.round(
        items.reduce((sum, item) => sum + item.score, 0) / items.length,
      )
    : 0;

  const filteredAndSortedItems = useMemo(() => {
    const normalizedQuery = searchValue.trim().toLowerCase();

    let nextItems = items.filter((item) => {
      if (!normalizedQuery) return true;

      return (
        item.cvFilename.toLowerCase().includes(normalizedQuery) ||
        item.jobTitle.toLowerCase().includes(normalizedQuery) ||
        item.jobDescription.toLowerCase().includes(normalizedQuery)
      );
    });

    nextItems = [...nextItems].sort((a, b) => {
      if (sortBy === "score") {
        return sortOrder === "desc" ? b.score - a.score : a.score - b.score;
      }

      const aDate = a.scanTimestamp || parseScanDate(a.scanDate);
      const bDate = b.scanTimestamp || parseScanDate(b.scanDate);
      return sortOrder === "desc" ? bDate - aDate : aDate - bDate;
    });

    return nextItems;
  }, [items, searchValue, sortBy, sortOrder]);

  const totalItems = filteredAndSortedItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const pagedItems = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredAndSortedItems.slice(start, start + pageSize);
  }, [filteredAndSortedItems, safeCurrentPage]);

  const fromItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const toItem =
    totalItems === 0 ? 0 : Math.min(totalItems, safeCurrentPage * pageSize);

  const orderPrimaryLabel = sortBy === "scanDate" ? "Mới nhất" : "Cao nhất";
  const orderSecondaryLabel = sortBy === "scanDate" ? "Cũ nhất" : "Thấp nhất";

  const openAnalysis = (analysisId: number) => {
    setLatestAnalysisId(analysisId);
    navigate({ to: "/match-report" });
  };

  return (
    <div className="mx-auto max-w-[1480px] space-y-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Tổng số lần phân tích"
          value={items.length}
          note="Các báo cáo đã hoàn tất sẽ được lưu tại đây."
          icon={FileText}
        />
        <MetricCard
          label="Điểm phù hợp cao nhất"
          value={bestScore ? `${bestScore}%` : "--"}
          note="Điểm phù hợp cao nhất trong lịch sử phân tích."
          icon={Target}
        />
        <MetricCard
          label="Điểm phù hợp trung bình"
          value={averageScore ? `${averageScore}%` : "--"}
          note="Điểm phù hợp trung bình trong lịch sử phân tích."
          icon={BarChart3}
        />
        <MetricCard
          label="Lần phân tích gần nhất"
          value={latestItem ? latestItem.scanDate : "--"}
          note={
            latestItem?.jobTitle ?? "Hãy phân tích CV để bắt đầu lưu lịch sử."
          }
          icon={Clock3}
        />
      </section>

      <PageCard className="p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-foreground">
              Báo cáo phân tích
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Chọn bất kỳ báo cáo nào để xem chi tiết phân tích và lộ trình phát
              triển cá nhân được đề xuất.
            </p>
          </div>

          <div className="flex w-full items-center gap-2 sm:w-auto">
            <div className="relative min-w-0 flex-1 sm:w-[280px] sm:flex-none">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchValue}
                onChange={(e) => {
                  setSearchValue(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Tìm kiếm..."
                className="h-10 w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
              />
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSortMenuOpen((prev) => !prev)}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-muted"
              >
                <ArrowUpDown className="h-4 w-4" />
                Sắp xếp
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>

              {isSortMenuOpen && (
                <div className="absolute right-0 top-11 z-20 w-56 overflow-hidden rounded-lg border border-border bg-card shadow-lg">
                  <div className="px-4 py-2 text-sm text-muted-foreground">
                    Sắp xếp theo
                  </div>

                  {(
                    [
                      { value: "score", label: "Điểm phù hợp" },
                      { value: "scanDate", label: "Ngày phân tích" },
                    ] as const
                  ).map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setSortBy(option.value);
                        setCurrentPage(1);
                        setIsSortMenuOpen(false);
                      }}
                      className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-muted ${
                        sortBy === option.value
                          ? "bg-accent text-accent-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {option.label}
                      {sortBy === option.value ? (
                        <Check className="h-4 w-4" />
                      ) : null}
                    </button>
                  ))}

                  <div className="border-t border-border px-4 py-2 text-sm text-muted-foreground">
                    Thứ tự
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSortOrder("desc");
                      setCurrentPage(1);
                      setIsSortMenuOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-muted ${
                      sortOrder === "desc"
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground"
                    }`}
                  >
                    {orderPrimaryLabel}
                    {sortOrder === "desc" ? (
                      <Check className="h-4 w-4" />
                    ) : null}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSortOrder("asc");
                      setCurrentPage(1);
                      setIsSortMenuOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-muted ${
                      sortOrder === "asc"
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground"
                    }`}
                  >
                    {orderSecondaryLabel}
                    {sortOrder === "asc" ? <Check className="h-4 w-4" /> : null}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="min-h-[320px] space-y-4">
          {isInitialLoading ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-dashed border-border bg-card">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                Đang tải lịch sử phân tích...
              </div>
            </div>
          ) : error ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-8 text-center">
              <h3 className="mb-1 text-base font-bold text-foreground">
                Không thể tải lịch sử phân tích
              </h3>
              <p className="text-sm text-muted-foreground">
                {getUserFacingErrorMessage(error)}
              </p>
            </div>
          ) : !hasHistory ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-10 text-center">
              <div className="mx-auto mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Search className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                Không tìm thấy lịch sử phân tích nào
              </h3>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                Tải lên một CV để bắt đầu so khớp việc làm.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] table-fixed">
                    <thead>
                      <tr className="border-b border-border bg-background/50 text-left text-sm font-semibold text-foreground">
                        <th className="w-[140px] px-5 py-3 text-center">
                          Điểm phù hợp
                        </th>
                        <th className="w-[280px] px-4 py-3">CV</th>
                        <th className="px-4 py-3">Vị trí</th>
                        <th className="w-[160px] px-4 py-3">Ngày phân tích</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedItems.length > 0 ? (
                        pagedItems.map((item) => (
                          <tr
                            key={item.id}
                            tabIndex={0}
                            role="button"
                            onClick={() => openAnalysis(item.analysisId)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                openAnalysis(item.analysisId);
                              }
                            }}
                            className="cursor-pointer border-b border-border last:border-b-0 hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none"
                          >
                            <td className="px-5 py-4 align-middle">
                              <ScoreRing score={item.score} />
                            </td>
                            <td className="px-4 py-4 align-middle">
                              <p className="line-clamp-1 text-sm font-semibold text-foreground">
                                {item.cvFilename}
                              </p>
                            </td>
                            <td className="px-4 py-4 align-middle">
                              <p className="line-clamp-2 text-sm font-semibold text-primary">
                                {item.jobTitle}
                              </p>
                            </td>
                            <td className="px-4 py-4 align-middle text-sm text-muted-foreground">
                              {item.scanDate}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-4 py-10 text-center">
                            <div className="mx-auto max-w-sm">
                              <div className="mx-auto mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                <Search className="h-5 w-5" />
                              </div>
                              <p className="text-base font-semibold text-foreground">
                                Không tìm thấy lịch sử phân tích
                              </p>
                              <p className="mt-1 text-sm text-muted-foreground">
                                Thử từ khóa khác hoặc xóa tìm kiếm để xem tất cả
                                báo cáo.
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  setSearchValue("");
                                  setCurrentPage(1);
                                }}
                                className="mt-4 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
                              >
                                Xóa tìm kiếm
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <p className="text-muted-foreground">
                  Hiển thị {fromItem}-{toItem} trong số {totalItems}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={safeCurrentPage === 1}
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Trang trước"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-muted-foreground">
                    {safeCurrentPage}/{totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={safeCurrentPage === totalPages}
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Trang tiếp theo"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </PageCard>

      {isSortMenuOpen && (
        <button
          type="button"
          aria-label="Đóng menu sắp xếp"
          onClick={() => setIsSortMenuOpen(false)}
          className="fixed inset-0 z-10 cursor-default"
        />
      )}
    </div>
  );
}
