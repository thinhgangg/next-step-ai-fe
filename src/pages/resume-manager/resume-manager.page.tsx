import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  BriefcaseBusiness,
  CheckCircle2,
  CloudUpload,
  Eye,
  FileText,
  Loader2,
  RefreshCcw,
  Search,
  Star,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { AppShell } from "@/shared/ui/app-shell";
import { useToast } from "@/shared/ui/toast";
import {
  useCvAnalysisHistory,
  useCvFile,
  useDeleteCv,
  useRenameCv,
  useSetBaseCv,
  useUserCvs,
  type UploadedCv,
} from "@/features/cv/model/cv.model";
import { getUserFacingErrorMessage } from "@/shared/api/graphql/error-message";
import { useSession } from "@/features/auth/session/session.model";

function formatUploadDate(value?: string | null) {
  if (!value) return "Không rõ ngày";

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "Không rõ ngày";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(timestamp));
}

const PAGE_SIZE = 10;

function base64ToBlob(base64: string, contentType: string) {
  const byteCharacters = atob(base64);
  const byteArrays: ArrayBuffer[] = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
    const slice = byteCharacters.slice(offset, offset + 1024);
    const byteNumbers = new Array(slice.length);

    for (let index = 0; index < slice.length; index += 1) {
      byteNumbers[index] = slice.charCodeAt(index);
    }

    const bytes = new Uint8Array(byteNumbers);
    byteArrays.push(bytes.buffer.slice(0));
  }

  return new Blob(byteArrays, {
    type: contentType || "application/octet-stream",
  });
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
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <PageCard className="p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p
            className="mt-2 text-xl font-bold tracking-tight text-foreground"
            title={String(value)}
          >
            {value}
          </p>
        </div>
        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="line-clamp-2 text-sm text-muted-foreground">{note}</p>
    </PageCard>
  );
}

export function ResumeManagerPage() {
  const navigate = useNavigate();
  const { cvs, loading, error, refetch } = useUserCvs();
  const { items: analysisHistory } = useCvAnalysisHistory();
  const { getCvFile, isGettingCvFile } = useCvFile();
  const { deleteCv, isDeleting } = useDeleteCv();
  const { renameCv, isRenaming } = useRenameCv();
  const { setBaseCv, isSettingBaseCv } = useSetBaseCv();
  const { user } = useSession();
  const { showToast } = useToast();
  const [searchValue, setSearchValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<UploadedCv | null>(null);
  const [optimisticBaseCvId, setOptimisticBaseCvId] = useState<
    string | null | undefined
  >(undefined);
  const [editingCvId, setEditingCvId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredCvs = useMemo(() => {
    const normalizedQuery = searchValue.trim().toLowerCase();
    if (!normalizedQuery) return cvs;

    return cvs.filter((cv) =>
      cv.fileName.toLowerCase().includes(normalizedQuery),
    );
  }, [cvs, searchValue]);
  const totalItems = filteredCvs.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pagedCvs = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE;
    return filteredCvs.slice(start, start + PAGE_SIZE);
  }, [filteredCvs, safeCurrentPage]);
  const fromItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * PAGE_SIZE + 1;
  const toItem =
    totalItems === 0 ? 0 : Math.min(totalItems, safeCurrentPage * PAGE_SIZE);
  const latestUploadDate = useMemo(() => {
    const latestTimestamp = cvs.reduce((latest, cv) => {
      const timestamp = new Date(cv.uploadedAt ?? "").getTime();
      return Number.isNaN(timestamp) ? latest : Math.max(latest, timestamp);
    }, 0);

    return latestTimestamp
      ? formatUploadDate(new Date(latestTimestamp).toISOString())
      : "--";
  }, [cvs]);
  const latestJobByFilename = useMemo(() => {
    const jobMap = new Map<string, string>();

    analysisHistory.forEach((item) => {
      if (!item.cvFilename || jobMap.has(item.cvFilename)) return;
      jobMap.set(item.cvFilename, item.jobTitle || "-");
    });

    return jobMap;
  }, [analysisHistory]);
  const isInitialLoading = loading && cvs.length === 0;

  const baseCvId =
    optimisticBaseCvId !== undefined
      ? optimisticBaseCvId
      : user?.baseCvId
        ? String(user.baseCvId)
        : null;
  const baseResume = useMemo(
    () => cvs.find((cv) => String(cv.cvId) === baseCvId) ?? null,
    [baseCvId, cvs],
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      const deleted = await deleteCv(Number(deleteTarget.cvId));
      if (deleted) {
        showToast("Đã xóa CV", {
          description: "CV này đã được xóa khỏi thư viện của bạn.",
        });
      }
      setDeleteTarget(null);
    } catch {
      showToast("Không thể xóa CV", {
        description: "Vui lòng thử lại sau ít phút.",
        variant: "error",
      });
    }
  };

  const handleMatchJobs = (cv: UploadedCv) => {
    navigate({
      to: "/jobs",
      search: {
        mode: "resume",
        cvId: Number(cv.cvId),
      },
    });
  };

  const handleViewCv = async (cv: UploadedCv) => {
    const viewWindow = window.open("about:blank", "_blank");
    if (viewWindow) {
      viewWindow.opener = null;
    }

    try {
      const file = await getCvFile(Number(cv.cvId));
      const blob = base64ToBlob(file.base64, file.contentType);
      const viewUrl = URL.createObjectURL(blob);

      if (viewWindow) {
        viewWindow.document.title = file.fileName;
        viewWindow.location.href = viewUrl;
      } else {
        window.location.href = viewUrl;
      }

      window.setTimeout(() => URL.revokeObjectURL(viewUrl), 60_000);
    } catch {
      viewWindow?.close();
      showToast("Không thể mở CV", {
        description: "Vui lòng thử lại sau ít phút.",
        variant: "error",
      });
    }
  };

  const handleSetBase = async (
    cv: UploadedCv,
    options: { allowUnset?: boolean } = {},
  ) => {
    const isCurrentBase = baseCvId === String(cv.cvId);
    const shouldUnset = Boolean(options.allowUnset ?? true) && isCurrentBase;

    try {
      const nextBaseCvId = await setBaseCv(
        shouldUnset ? null : Number(cv.cvId),
      );
      setOptimisticBaseCvId(nextBaseCvId ? String(nextBaseCvId) : null);
      showToast(shouldUnset ? "Đã xóa CV chính" : "Đã cập nhật CV chính");
    } catch {
      showToast("Không thể cập nhật CV chính", {
        description: "Vui lòng thử lại sau ít phút.",
        variant: "error",
      });
    }
  };

  const startRename = (cv: UploadedCv) => {
    setEditingCvId(String(cv.cvId));
    setEditingName(cv.fileName);
  };

  const cancelRename = () => {
    setEditingCvId(null);
    setEditingName("");
  };

  const submitRename = async (cv: UploadedCv) => {
    const nextName = editingName.trim();
    if (!nextName || nextName === cv.fileName) {
      cancelRename();
      return;
    }

    try {
      await renameCv(Number(cv.cvId), nextName);
      showToast("Đã đổi tên CV", {
        description: "Thay đổi của bạn đã được lưu.",
      });
      cancelRename();
    } catch {
      showToast("Không thể đổi tên CV", {
        description: "Vui lòng thử lại sau ít phút.",
        variant: "error",
      });
    }
  };

  return (
    <AppShell
      fullWidth
      headerTitle="Quản lý CV"
      headerDescription="Lưu trữ các CV đã tải lên, chọn CV chính và sử dụng phiên bản phù hợp cho từng lần ứng tuyển."
    >
      <div className="mx-auto max-w-[1480px] space-y-5">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="CV đã tải lên"
            value={cvs.length}
            note="Các file CV sẵn sàng để phân tích và so khớp công việc."
            icon={FileText}
          />
          <MetricCard
            label="CV chính"
            value={baseResume?.fileName ?? "--"}
            note={
              baseResume
                ? "Được sử dụng mặc định cho việc khớp công việc."
                : "Chọn CV bạn muốn sử dụng để khớp công việc."
            }
            icon={Star}
          />
          <MetricCard
            label="Ngày tải lên gần nhất"
            value={latestUploadDate}
            note="CV được tải lên gần đây nhất."
            icon={CloudUpload}
          />
          <MetricCard
            label="Định dạng hỗ trợ"
            value="PDF, DOC, DOCX và TXT"
            note="Hỗ trợ PDF, DOC, DOCX và TXT."
            icon={CheckCircle2}
          />
        </section>

        <PageCard className="p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-foreground">
                Danh sách CV
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Đổi tên, xem trước, chọn CV chính, hoặc tìm việc làm phù hợp.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-[300px] max-w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={searchValue}
                  onChange={(event) => {
                    setSearchValue(event.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Tìm kiếm CV"
                  className="h-10 w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
                />
              </div>
              <button
                type="button"
                onClick={() => void refetch()}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-semibold text-foreground hover:bg-muted"
              >
                <RefreshCcw className="h-4 w-4" />
                Làm mới
              </button>
            </div>
          </div>
          {isInitialLoading ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-dashed border-border bg-card">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                Đang tải danh sách CV...
              </div>
            </div>
          ) : error ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-10 text-center">
              <h3 className="text-base font-bold text-foreground">
                Không thể tải danh sách CV
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {getUserFacingErrorMessage(error)}
              </p>
            </div>
          ) : filteredCvs.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-10 text-center">
              <div className="mx-auto mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Search className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                Không tìm thấy CV nào
              </h3>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                Tải lên một CV để bắt đầu so khớp việc làm.
              </p>
            </div>
          ) : (
            <div className="min-h-[320px] space-y-4">
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[960px] table-fixed">
                    <thead>
                      <tr className="border-b border-border bg-background/50 text-left text-sm font-semibold text-foreground">
                        <th className="w-[110px] px-5 py-3">CV chính</th>
                        <th className="w-[280px] px-4 py-3">Tên CV</th>
                        <th className="px-4 py-3">Vị trí</th>
                        <th className="w-[150px] px-4 py-3">Ngày tải lên</th>
                        <th className="w-[150px] px-4 py-3">
                          Sửa đổi lần cuối
                        </th>
                        <th className="w-[150px] px-4 py-3 text-right">
                          Hành động
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedCvs.map((cv) => (
                        <tr
                          key={cv.cvId}
                          className="border-b border-border last:border-b-0 hover:bg-muted/40"
                        >
                          <td className="px-5 py-4 align-top">
                            <button
                              type="button"
                              onClick={() => void handleSetBase(cv)}
                              disabled={isSettingBaseCv}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                              title={
                                baseCvId === String(cv.cvId)
                                  ? "Xóa CV chính"
                                  : "Đặt làm CV chính"
                              }
                            >
                              <Star
                                className={`h-4 w-4 ${
                                  baseCvId === String(cv.cvId)
                                    ? "fill-primary text-primary"
                                    : ""
                                }`}
                              />
                            </button>
                          </td>
                          <td className="px-4 py-4">
                            <div className="min-w-0">
                              {editingCvId === String(cv.cvId) ? (
                                <input
                                  value={editingName}
                                  autoFocus
                                  disabled={isRenaming}
                                  onChange={(event) =>
                                    setEditingName(event.target.value)
                                  }
                                  onBlur={() => void submitRename(cv)}
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                      void submitRename(cv);
                                    }
                                    if (event.key === "Escape") {
                                      cancelRename();
                                    }
                                  }}
                                  className="h-9 w-full rounded-md border border-primary bg-card px-3 text-sm text-foreground outline-none"
                                />
                              ) : (
                                <button
                                  type="button"
                                  title="Đổi tên"
                                  onClick={() => startRename(cv)}
                                  className="block max-w-full truncate text-left text-sm font-semibold text-foreground hover:text-primary"
                                >
                                  {cv.fileName}
                                </button>
                              )}
                              {baseCvId === String(cv.cvId) ? (
                                <p className="mt-1 truncate text-xs text-primary">
                                  CV chính
                                </p>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm">
                            <p className="line-clamp-2 text-foreground">
                              {latestJobByFilename.get(cv.fileName) ?? "-"}
                            </p>
                          </td>
                          <td className="px-4 py-4 text-sm text-muted-foreground">
                            {formatUploadDate(cv.uploadedAt)}
                          </td>
                          <td className="px-4 py-4 text-sm text-muted-foreground">
                            {formatUploadDate(cv.uploadedAt)}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => void handleViewCv(cv)}
                                disabled={isGettingCvFile}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                                title="Mở CV"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMatchJobs(cv)}
                                disabled={isSettingBaseCv}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                                title="So khớp với việc làm"
                              >
                                <BriefcaseBusiness className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(cv)}
                                disabled={isDeleting}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                                title="Xóa"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
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
            </div>
          )}
        </PageCard>
      </div>

      {deleteTarget ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl">
            <h3 className="text-lg font-bold text-foreground">Xóa CV?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Điều này sẽ xóa {deleteTarget.fileName} khỏi thư viện của bạn.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="h-9 rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground hover:bg-background"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={isDeleting}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-destructive px-4 text-sm font-semibold text-destructive-foreground disabled:opacity-60"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Xóa
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
