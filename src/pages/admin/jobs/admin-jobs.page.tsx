import { useMemo, useState } from "react";
import { useMutation } from "@apollo/client/react";
import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ExternalLink,
  Filter,
  Loader2,
  MapPin,
  Plus,
  Search,
  X,
} from "lucide-react";
import { AdminShell } from "@/shared/ui/admin/admin-shell";
import { useJobsCatalog, type JobItem } from "@/features/jobs/model/jobs.model";
import { formatEmploymentType, formatJobLevel } from "@/shared/lib/job-format";
import {
  CREATE_JOB,
  DELETE_JOB,
  UPDATE_JOB,
} from "@/features/admin/jobs/admin-jobs.mutation";
import { AdminActionMenu } from "@/shared/ui/admin/admin-action-menu";

type AdminJobStatus = "active" | "draft" | "expired";
type LevelFilter = "all" | "junior" | "mid" | "senior" | "lead";
type TypeFilter = "all" | "full_time" | "part_time" | "contract" | "internship";
const JOBS_PAGE_SIZE = 10;

function AdminCard({
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

function normalizeText(value?: string | null) {
  return (
    value
      ?.trim()
      .toLowerCase()
      .replace(/[\s-]+/g, "_") ?? ""
  );
}

function getJobStatus(job: JobItem): AdminJobStatus {
  if (job.applicationDeadline) {
    const deadline = new Date(job.applicationDeadline);
    if (!Number.isNaN(deadline.getTime()) && deadline < new Date()) {
      return "expired";
    }
  }

  if (!job.descriptionClean && !job.descriptionRaw) {
    return "draft";
  }

  return "active";
}

function statusLabel(status: AdminJobStatus) {
  const labels: Record<AdminJobStatus, string> = {
    active: "Đang mở",
    draft: "Bản nháp",
    expired: "Hết hạn",
  };

  return labels[status];
}

function statusClass(status: AdminJobStatus) {
  const classes: Record<AdminJobStatus, string> = {
    active: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
    draft: "border-amber-500/25 bg-amber-500/10 text-amber-700",
    expired: "border-slate-500/20 bg-slate-500/10 text-slate-700",
  };

  return classes[status];
}

function formatMoney(value?: number | null, currency?: string | null) {
  if (!value) return null;
  return `${new Intl.NumberFormat("vi-VN").format(value)} ${currency ?? ""}`.trim();
}

function formatSalary(job: JobItem) {
  const min = formatMoney(job.salaryMin, job.currency);
  const max = formatMoney(job.salaryMax, job.currency);

  if (min && max) return `${min} - ${max}`;
  return min ?? max ?? "Chưa cập nhật";
}

function formatDate(value?: string | null) {
  if (!value) return "Chưa cập nhật";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa cập nhật";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function getCompanyInitials(name?: string | null) {
  if (!name) return "CO";
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function KpiCard({
  label,
  value,
  icon: Icon,
  note,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  note: string;
}) {
  return (
    <AdminCard className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-extrabold text-foreground">
            {value}
          </p>
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{note}</p>
    </AdminCard>
  );
}

export function AdminJobsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
  const [typeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | AdminJobStatus>(
    "all",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  const { jobs, totalCount, loading, error, refetch } = useJobsCatalog({
    search: searchTerm,
    limit: JOBS_PAGE_SIZE,
    offset: (currentPage - 1) * JOBS_PAGE_SIZE,
    sortBy: "DATE",
    dateRange: "ANY",
    employmentType: "ALL",
    experienceRange: "ALL",
  });
  const [createJob] = useMutation(CREATE_JOB);
  const [updateJob] = useMutation(UPDATE_JOB);
  const [deleteJob] = useMutation(DELETE_JOB);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const status = getJobStatus(job);
      const level = normalizeText(job.level);
      const type = normalizeText(job.employmentType);
      const matchesLevel = levelFilter === "all" || level.includes(levelFilter);
      const matchesType =
        typeFilter === "all" ||
        type.includes(typeFilter) ||
        type.replace("_", "").includes(typeFilter.replace("_", ""));
      const matchesStatus = statusFilter === "all" || status === statusFilter;

      return matchesLevel && matchesType && matchesStatus;
    });
  }, [jobs, levelFilter, statusFilter, typeFilter]);

  const selectedJob =
    filteredJobs.find((job) => job.jobId === selectedJobId) ?? null;

  const totalPages = Math.max(
    1,
    Math.ceil((totalCount || jobs.length) / JOBS_PAGE_SIZE),
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const activeCount = jobs.filter(
    (job) => getJobStatus(job) === "active",
  ).length;
  const companyCount = new Set(jobs.map((job) => job.company?.companyId)).size;
  const skillCount = new Set(
    jobs.flatMap((job) => job.skills.map((skill) => skill.skillId)),
  ).size;

  const handleEditJob = async (job: JobItem) => {
    const title = window.prompt("Tiêu đề việc làm:", job.title);
    if (!title?.trim()) return;

    await updateJob({
      variables: { input: { jobId: job.jobId, title: title.trim() } },
    });
    await refetch();
  };

  const handleCreateJob = async () => {
    const title = window.prompt("Tiêu đề việc làm:");
    if (!title?.trim()) return;
    const companyId = Number(window.prompt("ID công ty:") || 0);
    if (!companyId) {
      window.alert("Cần nhập ID công ty hợp lệ.");
      return;
    }
    const sourceUrl =
      window.prompt("URL nguồn:", "https://example.com")?.trim() ||
      "https://example.com";
    const descriptionRaw =
      window.prompt("Mô tả ngắn:", "Chưa cập nhật mô tả.")?.trim() ||
      "Chưa cập nhật mô tả.";

    await createJob({
      variables: {
        input: {
          companyId,
          title: title.trim(),
          descriptionRaw,
          sourceUrl,
          sourceSite: "Admin",
        },
      },
    });
    await refetch();
  };

  const handleCloseJob = async (job: JobItem) => {
    if (!window.confirm(`Đóng việc làm "${job.title}"?`)) return;
    await updateJob({
      variables: { input: { jobId: job.jobId, status: "CLOSED" } },
    });
    await refetch();
  };

  const handleDeleteJob = async (job: JobItem) => {
    if (!window.confirm(`Xóa việc làm "${job.title}"?`)) return;
    await deleteJob({ variables: { jobId: job.jobId } });
    if (selectedJobId === job.jobId) setSelectedJobId(null);
    await refetch();
  };

  return (
    <AdminShell
      fullWidth
      title="Quản lý việc làm"
      description="Theo dõi, lọc, kiểm duyệt và chỉnh sửa dữ liệu tuyển dụng trong hệ thống."
      actions={
        <button
          type="button"
          onClick={handleCreateJob}
          className="hidden h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90 md:inline-flex"
        >
          <Plus className="h-4 w-4" />
          Tạo việc làm
        </button>
      }
    >
      <div className="mx-auto max-w-[1480px] space-y-5">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Tổng việc làm"
            value={loading ? "..." : totalCount || jobs.length}
            icon={BriefcaseBusiness}
            note="Tất cả job đang có trong hệ thống."
          />
          <KpiCard
            label="Đang mở"
            value={loading ? "..." : activeCount}
            icon={CalendarDays}
            note="Job còn hiệu lực và có thể matching."
          />
          <KpiCard
            label="Công ty"
            value={loading ? "..." : companyCount}
            icon={Building2}
            note="Công ty xuất hiện trong danh sách hiện tại."
          />
          <KpiCard
            label="Kỹ năng"
            value={loading ? "..." : skillCount}
            icon={Filter}
            note="Skill được gắn vào các job đang hiển thị."
          />
        </section>

        <section
          className={`grid gap-5 ${
            selectedJob ? "xl:grid-cols-[minmax(0,1fr)_380px]" : ""
          }`}
        >
          <AdminCard className="overflow-hidden">
            <div className="border-b border-border p-5">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <input
                    value={searchTerm}
                    onChange={(event) => {
                      setSearchTerm(event.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Tìm tiêu đề, công ty, địa điểm..."
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={levelFilter}
                    onChange={(event) => {
                      setLevelFilter(event.target.value as LevelFilter);
                      setCurrentPage(1);
                    }}
                    className="h-10 rounded-lg border border-border bg-card px-3 text-sm font-semibold text-foreground outline-none"
                  >
                    <option value="all">Táº¥t cáº£ level</option>
                    <option value="junior">Junior</option>
                    <option value="mid">Middle</option>
                    <option value="senior">Senior</option>
                    <option value="lead">Lead</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(event) => {
                      setStatusFilter(
                        event.target.value as "all" | AdminJobStatus,
                      );
                      setCurrentPage(1);
                    }}
                    className="h-10 rounded-lg border border-border bg-card px-3 text-sm font-semibold text-foreground outline-none"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="active">Đang mở</option>
                    <option value="draft">Bản nháp</option>
                    <option value="expired">Háº¿t háº¡n</option>
                  </select>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-[360px] items-center justify-center gap-3 text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                Đang tải danh sách việc làm...
              </div>
            ) : error ? (
              <div className="m-5 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                Không thể tải danh sách việc làm. Vui lòng kiểm tra backend hoặc
                thử lại.
              </div>
            ) : filteredJobs.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] table-fixed text-left">
                  <colgroup>
                    <col className="w-[25%]" />
                    <col className="w-[23%]" />
                    <col className="w-[15%]" />
                    <col className="w-[12%]" />
                    <col className="w-[15%]" />
                    <col className="w-[10%]" />
                  </colgroup>

                  <thead className="border-b border-border bg-muted/50 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3">Việc làm</th>
                      <th className="px-5 py-3">Công ty</th>
                      <th className="px-5 py-3">Level</th>
                      <th className="px-5 py-3">Trạng thái</th>
                      <th className="px-5 py-3">Ngày cập nhật</th>
                      <th className="px-5 py-3">Thao tác</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border">
                    {filteredJobs.map((job) => {
                      const status = getJobStatus(job);
                      const isSelected = selectedJob?.jobId === job.jobId;

                      return (
                        <tr
                          key={job.jobId}
                          className={`cursor-pointer transition hover:bg-muted/40 ${
                            isSelected ? "bg-primary/5" : ""
                          }`}
                          onClick={() => setSelectedJobId(job.jobId)}
                        >
                          <td className="px-5 py-4">
                            <div className="min-w-0">
                              <p className="truncate font-bold text-foreground">
                                {job.title}
                              </p>

                              <p className="mt-1 flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
                                <MapPin className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">
                                  {job.location || "Chưa cập nhật"}
                                </span>
                              </p>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-extrabold text-primary">
                                {getCompanyInitials(job.company?.name)}
                              </span>

                              <span className="truncate text-sm font-semibold text-foreground">
                                {job.company?.name || "Chưa cập nhật"}
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-4 text-sm font-semibold text-foreground">
                            <span className="block truncate">
                              {formatJobLevel(job.level)}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex whitespace-nowrap rounded-md border px-2.5 py-1 text-xs font-bold ${statusClass(
                                status,
                              )}`}
                            >
                              {statusLabel(status)}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-sm whitespace-nowrap text-muted-foreground">
                            {formatDate(job.scrapedAt || job.postedAt)}
                          </td>

                          <td className="px-5 py-4">
                            <AdminActionMenu
                              items={[
                                {
                                  label: "Xem chi tiết",
                                  onClick: () => setSelectedJobId(job.jobId),
                                },
                                {
                                  label: "Chỉnh sửa",
                                  onClick: () => void handleEditJob(job),
                                },
                                {
                                  label: "Đóng việc làm",
                                  onClick: () => void handleCloseJob(job),
                                },
                                {
                                  label: "Xóa",
                                  tone: "danger",
                                  onClick: () => void handleDeleteJob(job),
                                },
                              ]}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="m-5 rounded-lg border border-dashed border-border bg-muted/40 p-8 text-center text-sm text-muted-foreground">
                Không có việc làm nào khớp với bộ lọc hiện tại.
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4 text-sm text-muted-foreground">
              <span>
                Hiển thị {filteredJobs.length} / {totalCount || jobs.length}{" "}
                việc làm
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={safeCurrentPage <= 1}
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                  className="h-9 rounded-lg border border-border px-3 font-semibold hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-muted-foreground"
                >
                  Trước
                </button>
                <button
                  type="button"
                  disabled={safeCurrentPage >= totalPages}
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                  className="h-9 rounded-lg border border-border px-3 font-semibold hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-muted-foreground"
                >
                  Sau
                </button>
              </div>
            </div>
          </AdminCard>

          <AdminCard className={selectedJob ? "p-5 relative" : "hidden"}>
            <button
              type="button"
              onClick={() => setSelectedJobId(null)}
              className="absolute right-5 top-5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
              title="Đóng chi tiết"
            >
              <X className="h-4 w-4" />
            </button>
            <h2 className="text-base font-extrabold text-foreground">
              Chi tiết việc làm
            </h2>

            {selectedJob ? (
              <div className="mt-5 space-y-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    {selectedJob.company?.name || "Chưa cập nhật công ty"}
                  </p>
                  <h3 className="mt-2 text-lg font-extrabold leading-7 text-foreground">
                    {selectedJob.title}
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span
                      className={`rounded-md border px-2 py-1 text-xs font-bold ${statusClass(
                        getJobStatus(selectedJob),
                      )}`}
                    >
                      {statusLabel(getJobStatus(selectedJob))}
                    </span>
                    <span className="rounded-md border border-border bg-background px-2 py-1 text-xs font-bold text-muted-foreground">
                      {formatJobLevel(selectedJob.level)}
                    </span>
                    <span className="rounded-md border border-border bg-background px-2 py-1 text-xs font-bold text-muted-foreground">
                      {formatEmploymentType(selectedJob.employmentType)}
                    </span>
                  </div>
                </div>

                <div className="grid gap-3 text-sm">
                  <div className="rounded-lg border border-border bg-background/60 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Địa điểm
                    </p>
                    <p className="mt-2 font-bold text-foreground">
                      {selectedJob.location || "Chưa cập nhật"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-background/60 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Lương
                    </p>
                    <p className="mt-2 font-bold text-foreground">
                      {formatSalary(selectedJob)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-background/60 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Deadline
                    </p>
                    <p className="mt-2 font-bold text-foreground">
                      {formatDate(selectedJob.applicationDeadline)}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Kỹ năng
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.skills.length ? (
                      selectedJob.skills.slice(0, 12).map((skill) => (
                        <span
                          key={skill.skillId}
                          className="rounded-md bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground"
                        >
                          {skill.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Chưa gắn kỹ năng.
                      </span>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-background/60 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Mô tả ngắn
                  </p>
                  <p className="mt-2 line-clamp-5 text-sm leading-6 text-muted-foreground">
                    {selectedJob.descriptionClean ||
                      selectedJob.descriptionRaw ||
                      "Chưa có mô tả."}
                  </p>
                </div>

                <div className="grid gap-2">
                  <button
                    type="button"
                    onClick={() => void handleEditJob(selectedJob)}
                    className="h-10 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90"
                  >
                    Chỉnh sửa việc làm
                  </button>
                  <a
                    href={selectedJob.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-bold text-foreground hover:bg-muted"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Má»Ÿ nguá»“n tuyá»ƒn dá»¥ng
                  </a>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Chọn một việc làm để xem chi tiết.
              </p>
            )}
          </AdminCard>
        </section>
      </div>
    </AdminShell>
  );
}
