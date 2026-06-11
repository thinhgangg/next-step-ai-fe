import { useMemo, useState } from "react";
import { useMutation } from "@apollo/client/react";
import {
  BriefcaseBusiness,
  Building2,
  ExternalLink,
  Factory,
  Loader2,
  MapPin,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react";
import { AdminShell } from "@/shared/ui/admin/admin-shell";
import {
  useAdminCompanies,
  type AdminCompanyItem,
} from "@/features/admin/companies/admin-companies.model";
import {
  CREATE_COMPANY,
  DELETE_COMPANY,
  UPDATE_COMPANY,
} from "@/features/admin/companies/admin-companies.mutation";
import { GET_ADMIN_COMPANIES } from "@/features/admin/companies/admin-companies.query";
import { useJobsCatalog, type JobItem } from "@/features/jobs/model/jobs.model";
import { formatJobLevel } from "@/shared/lib/job-format";
import { AdminActionMenu } from "@/shared/ui/admin/admin-action-menu";

type WebsiteFilter = "all" | "withWebsite" | "withoutWebsite";
const COMPANIES_PAGE_SIZE = 10;

type CompanyWithStats = AdminCompanyItem & {
  jobs: JobItem[];
  jobCount: number;
  activeJobCount: number;
  latestJobDate?: string | null;
};

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
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function hasActiveJob(job: JobItem) {
  if (!job.applicationDeadline) return true;
  const deadline = new Date(job.applicationDeadline);

  return Number.isNaN(deadline.getTime()) || deadline >= new Date();
}

function getLatestDate(jobs: JobItem[]) {
  return jobs
    .map((job) => job.scrapedAt || job.postedAt)
    .filter((date): date is string => Boolean(date))
    .sort((first, second) => {
      return new Date(second).getTime() - new Date(first).getTime();
    })[0];
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

export function AdminCompaniesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [websiteFilter] = useState<WebsiteFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    null,
  );
  const {
    companies,
    loading: companiesLoading,
    error: companiesError,
  } = useAdminCompanies();
  const [createCompany] = useMutation(CREATE_COMPANY, {
    refetchQueries: [{ query: GET_ADMIN_COMPANIES }],
  });
  const [updateCompany] = useMutation(UPDATE_COMPANY, {
    refetchQueries: [{ query: GET_ADMIN_COMPANIES }],
  });
  const [deleteCompany] = useMutation(DELETE_COMPANY, {
    refetchQueries: [{ query: GET_ADMIN_COMPANIES }],
  });
  const {
    jobs,
    loading: jobsLoading,
    error: jobsError,
  } = useJobsCatalog({
    limit: 200,
    offset: 0,
    sortBy: "DATE",
    dateRange: "ANY",
    employmentType: "ALL",
    experienceRange: "ALL",
  });

  const companiesWithStats = useMemo<CompanyWithStats[]>(() => {
    const jobsByCompany = new Map<string, JobItem[]>();

    jobs.forEach((job) => {
      const companyId = String(job.company?.companyId ?? "");
      if (!companyId) return;

      jobsByCompany.set(companyId, [
        ...(jobsByCompany.get(companyId) ?? []),
        job,
      ]);
    });

    return companies.map((company) => {
      const companyJobs = jobsByCompany.get(String(company.companyId)) ?? [];

      return {
        ...company,
        jobs: companyJobs,
        jobCount: companyJobs.length,
        activeJobCount: companyJobs.filter(hasActiveJob).length,
        latestJobDate: getLatestDate(companyJobs),
      };
    });
  }, [companies, jobs]);

  const filteredCompanies = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return companiesWithStats.filter((company) => {
      const matchesSearch =
        !normalizedSearch ||
        company.name.toLowerCase().includes(normalizedSearch) ||
        company.industry?.toLowerCase().includes(normalizedSearch) ||
        company.location?.toLowerCase().includes(normalizedSearch) ||
        company.website?.toLowerCase().includes(normalizedSearch);
      const matchesWebsite =
        websiteFilter === "all" ||
        (websiteFilter === "withWebsite" && Boolean(company.website)) ||
        (websiteFilter === "withoutWebsite" && !company.website);

      return matchesSearch && matchesWebsite;
    });
  }, [companiesWithStats, searchTerm, websiteFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCompanies.length / COMPANIES_PAGE_SIZE),
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedCompanies = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * COMPANIES_PAGE_SIZE;

    return filteredCompanies.slice(
      startIndex,
      startIndex + COMPANIES_PAGE_SIZE,
    );
  }, [filteredCompanies, safeCurrentPage]);
  const fromCompany =
    filteredCompanies.length === 0
      ? 0
      : (safeCurrentPage - 1) * COMPANIES_PAGE_SIZE + 1;
  const toCompany =
    filteredCompanies.length === 0
      ? 0
      : Math.min(
          filteredCompanies.length,
          safeCurrentPage * COMPANIES_PAGE_SIZE,
        );

  const selectedCompany =
    filteredCompanies.find(
      (company) => String(company.companyId) === selectedCompanyId,
    ) ?? null;

  const totalJobs = companiesWithStats.reduce(
    (sum, company) => sum + company.jobCount,
    0,
  );
  const activeJobs = companiesWithStats.reduce(
    (sum, company) => sum + company.activeJobCount,
    0,
  );
  const industries = new Set(
    companiesWithStats
      .map((company) => company.industry)
      .filter((industry): industry is string => Boolean(industry)),
  ).size;
  const loading = companiesLoading || jobsLoading;
  const error = companiesError || jobsError;

  const handleCreateCompany = async () => {
    const name = window.prompt("Tên công ty mới:");
    if (!name?.trim()) return;
    const location = window.prompt("Địa điểm:")?.trim();
    const website = window.prompt("Website:")?.trim();

    await createCompany({
      variables: {
        input: {
          name: name.trim(),
          location: location || undefined,
          website: website || undefined,
        },
      },
    });
  };

  const handleEditCompany = async (company: CompanyWithStats) => {
    const name = window.prompt("Tên công ty:", company.name);
    if (!name?.trim()) return;
    const location = window.prompt("Địa điểm:", company.location ?? "")?.trim();
    const website = window.prompt("Website:", company.website ?? "")?.trim();

    await updateCompany({
      variables: {
        input: {
          companyId: Number(company.companyId),
          name: name.trim(),
          location: location || undefined,
          website: website || undefined,
        },
      },
    });
  };

  const handleDeleteCompany = async (company: CompanyWithStats) => {
    if (!window.confirm(`Xóa công ty "${company.name}"?`)) return;
    await deleteCompany({
      variables: { companyId: Number(company.companyId) },
    });
    if (selectedCompanyId === String(company.companyId)) {
      setSelectedCompanyId(null);
    }
  };

  return (
    <AdminShell
      fullWidth
      title="Quản lý công ty"
      description="Theo dõi hồ sơ công ty, website, ngành nghề và số lượng việc làm đang tuyển."
      actions={
        <button
          type="button"
          onClick={handleCreateCompany}
          className="hidden h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90 md:inline-flex"
        >
          <Plus className="h-4 w-4" />
          Thêm công ty
        </button>
      }
    >
      <div className="mx-auto max-w-[1480px] space-y-5">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Tổng công ty"
            value={loading ? "..." : companiesWithStats.length}
            icon={Building2}
            note="Tất cả công ty đã được lưu trong hệ thống."
          />
          <KpiCard
            label="Việc làm"
            value={loading ? "..." : totalJobs}
            icon={BriefcaseBusiness}
            note="Job liên kết với các công ty hiện có."
          />
          <KpiCard
            label="Đang tuyển"
            value={loading ? "..." : activeJobs}
            icon={Users}
            note="Job còn hạn hoặc chưa khai báo hạn ứng tuyển."
          />
          <KpiCard
            label="Ngành nghề"
            value={loading ? "..." : industries}
            icon={Factory}
            note="Nhóm ngành đã được cập nhật trong hồ sơ."
          />
        </section>

        <section
          className={`grid gap-5 ${
            selectedCompany ? "xl:grid-cols-[minmax(0,1fr)_380px]" : ""
          }`}
        >
          <AdminCard className="overflow-hidden">
            <div className="border-b border-border p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <input
                    value={searchTerm}
                    onChange={(event) => {
                      setSearchTerm(event.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Tìm tên công ty, ngành nghề, địa điểm..."
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-[340px] items-center justify-center gap-3 text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                Đang tải danh sách công ty...
              </div>
            ) : error ? (
              <div className="m-5 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                Không thể tải danh sách công ty. Vui lòng kiểm tra backend hoặc
                thử lại.
              </div>
            ) : filteredCompanies.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] table-fixed text-left">
                  <colgroup>
                    <col className="w-[32%]" />
                    <col className="w-[32%]" />
                    <col className="w-[10%]" />
                    <col className="w-[16%]" />
                    <col className="w-[10%]" />
                  </colgroup>

                  <thead className="border-b border-border bg-muted/50 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3">Công ty</th>
                      <th className="px-5 py-3">Địa điểm</th>
                      <th className="px-5 py-3 text-center">Job</th>
                      <th className="px-5 py-3">Cập nhật</th>
                      <th className="px-5 py-3 text-center">Thao tác</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border">
                    {paginatedCompanies.map((company) => {
                      const isSelected =
                        selectedCompany?.companyId === company.companyId;

                      return (
                        <tr
                          key={company.companyId}
                          className={`cursor-pointer transition hover:bg-muted/40 ${
                            isSelected ? "bg-primary/5" : ""
                          }`}
                          onClick={() =>
                            setSelectedCompanyId(String(company.companyId))
                          }
                        >
                          <td className="px-5 py-4">
                            <div className="flex min-w-0 items-center gap-3">
                              {company.logoUrl ? (
                                <img
                                  src={company.logoUrl}
                                  alt={company.name}
                                  className="h-10 w-10 shrink-0 rounded-lg border border-border object-cover"
                                />
                              ) : (
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-extrabold text-primary">
                                  {getCompanyInitials(company.name)}
                                </span>
                              )}

                              <div className="min-w-0">
                                <p className="truncate font-bold text-foreground">
                                  {company.name}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4 text-sm text-muted-foreground">
                            <span
                              className="block truncate"
                              title={company.location || "Chưa cập nhật"}
                            >
                              {company.location || "Chưa cập nhật"}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-center text-sm font-bold text-foreground">
                            {company.jobCount}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-sm text-muted-foreground">
                            {formatDate(company.latestJobDate)}
                          </td>

                          <td className="px-5 py-4">
                            <AdminActionMenu
                              items={[
                                {
                                  label: "Xem chi tiết",
                                  onClick: () =>
                                    setSelectedCompanyId(
                                      String(company.companyId),
                                    ),
                                },
                                {
                                  label: "Chỉnh sửa",
                                  onClick: () =>
                                    void handleEditCompany(company),
                                },
                                {
                                  label: "Xóa",
                                  tone: "danger",
                                  onClick: () =>
                                    void handleDeleteCompany(company),
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
                Không có công ty nào khớp với bộ lọc hiện tại.
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4 text-sm text-muted-foreground">
              <span>
                Hiển thị {fromCompany}-{toCompany} / {filteredCompanies.length}{" "}
                công ty
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

          <AdminCard className={selectedCompany ? "p-5 relative" : "hidden"}>
            <button
              type="button"
              onClick={() => setSelectedCompanyId(null)}
              className="absolute right-5 top-5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
              title="Đóng chi tiết"
            >
              <X className="h-4 w-4" />
            </button>
            <h2 className="text-base font-extrabold text-foreground">
              Chi tiết công ty
            </h2>

            {selectedCompany ? (
              <div className="mt-5 space-y-5">
                <div className="flex items-center gap-3">
                  {selectedCompany.logoUrl ? (
                    <img
                      src={selectedCompany.logoUrl}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-lg border border-border object-cover"
                    />
                  ) : (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-base font-extrabold text-primary">
                      {getCompanyInitials(selectedCompany.name)}
                    </span>
                  )}
                  <div className="min-w-0 pr-10">
                    <p className="truncate font-bold text-foreground">
                      {selectedCompany.name}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 text-sm">
                  <div className="rounded-lg border border-border bg-background/60 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Địa điểm
                    </p>
                    <p className="mt-2 flex items-center gap-2 font-bold text-foreground">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {selectedCompany.location || "Chưa cập nhật"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border bg-background/60 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Job
                    </p>
                    <p className="mt-2 text-xl font-extrabold text-foreground">
                      {selectedCompany.jobCount}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-background/60 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Đang tuyển
                    </p>
                    <p className="mt-2 text-xl font-extrabold text-foreground">
                      {selectedCompany.activeJobCount}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Việc làm gần đây
                  </p>
                  <div className="space-y-2">
                    {selectedCompany.jobs.length ? (
                      selectedCompany.jobs.slice(0, 5).map((job) => (
                        <div
                          key={job.jobId}
                          className="rounded-lg border border-border bg-background/60 p-3"
                        >
                          <p className="line-clamp-1 text-sm font-bold text-foreground">
                            {job.title}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatJobLevel(job.level)} ·{" "}
                            {job.location || "Chưa cập nhật địa điểm"}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-lg border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                        Chưa có việc làm nào liên kết với công ty này.
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid gap-2">
                  <button
                    type="button"
                    onClick={() => void handleEditCompany(selectedCompany)}
                    className="h-10 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90"
                  >
                    Chỉnh sửa công ty
                  </button>
                  {selectedCompany.website ? (
                    <a
                      href={selectedCompany.website}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-bold text-foreground hover:bg-muted"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Mở website
                    </a>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Chọn một công ty để xem chi tiết.
              </p>
            )}
          </AdminCard>
        </section>
      </div>
    </AdminShell>
  );
}
