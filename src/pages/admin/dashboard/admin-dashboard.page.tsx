import { useMemo } from "react";
import { useQuery } from "@apollo/client/react";
import {
  Activity,
  BadgeCheck,
  BookOpenCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChevronRight,
  FileSearch,
  GraduationCap,
  Loader2,
  Shield,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import { AdminShell } from "@/shared/ui/admin/admin-shell";
import { useAdminUsers } from "@/features/admin/users/admin-users.model";
import { useAdminCompanies } from "@/features/admin/companies/admin-companies.model";
import { useAdminCourses } from "@/features/admin/courses/admin-courses.model";
import { useJobsCatalog, type JobItem } from "@/features/jobs/model/jobs.model";
import { GET_ALL_SKILLS_QUERY } from "@/features/profile/skills.query";
import { formatJobLevel } from "@/shared/lib/job-format";

type SkillItem = {
  skillId: string;
  name: string;
  category?: string | null;
  isActive: boolean;
};

type GetAllSkillsResponse = {
  getAllSkills: SkillItem[];
};

type AdminJobStatus = "active" | "draft" | "expired";

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

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
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

function normalizeRole(role?: string | null) {
  return role?.toLowerCase() === "admin" ? "admin" : "user";
}

function normalizeCourseStatus(status?: string | null) {
  const normalized = status?.trim().toLowerCase();

  if (normalized === "draft" || normalized === "archived") {
    return normalized;
  }

  return "published";
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

function UserAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-extrabold text-primary">
      {initials || "U"}
    </span>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  note,
  href,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  note: string;
  href?: string;
}) {
  const content = (
    <AdminCard className="h-full p-5 transition hover:border-primary/30 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-extrabold text-foreground">
            {value}
          </p>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-sm leading-6 text-muted-foreground">{note}</p>
        {href ? (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : null}
      </div>
    </AdminCard>
  );

  if (!href) return content;

  return (
    <a href={href} className="block h-full">
      {content}
    </a>
  );
}

function SectionHeader({
  title,
  description,
  href,
}: {
  title: string;
  description?: string;
  href?: string;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-5">
      <div>
        <h2 className="text-base font-extrabold text-foreground">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>

      {href ? (
        <a
          href={href}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm font-bold text-foreground transition hover:bg-muted"
        >
          Xem tất cả
          <ChevronRight className="h-4 w-4" />
        </a>
      ) : null}
    </div>
  );
}

function LoadingBlock({ label }: { label: string }) {
  return (
    <div className="flex min-h-[220px] items-center justify-center gap-3 text-sm text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
      {label}
    </div>
  );
}

function ErrorBlock() {
  return (
    <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
      Không thể tải đầy đủ dữ liệu tổng quan. Vui lòng kiểm tra backend hoặc thử
      lại.
    </div>
  );
}

export function AdminDashboardPage() {
  const { users, loading: usersLoading, error: usersError } = useAdminUsers();

  const {
    companies,
    loading: companiesLoading,
    error: companiesError,
  } = useAdminCompanies();

  const {
    courses,
    loading: coursesLoading,
    error: coursesError,
  } = useAdminCourses();

  const {
    jobs,
    totalCount,
    loading: jobsLoading,
    error: jobsError,
  } = useJobsCatalog({
    search: "",
    limit: 200,
    offset: 0,
    sortBy: "DATE",
    dateRange: "ANY",
    employmentType: "ALL",
    experienceRange: "ALL",
  });

  const {
    data: skillsData,
    loading: skillsLoading,
    error: skillsError,
  } = useQuery<GetAllSkillsResponse>(GET_ALL_SKILLS_QUERY);

  const skills = useMemo(() => skillsData?.getAllSkills ?? [], [skillsData]);

  const loading =
    usersLoading ||
    companiesLoading ||
    jobsLoading ||
    coursesLoading ||
    skillsLoading;

  const error =
    usersError || companiesError || jobsError || coursesError || skillsError;

  const stats = useMemo(() => {
    const adminCount = users.filter(
      (user) => normalizeRole(user.role) === "admin",
    ).length;
    const userCount = users.length - adminCount;
    const totalCv = users.reduce((sum, user) => sum + (user.cvCount ?? 0), 0);
    const totalScans = users.reduce(
      (sum, user) => sum + (user.scanCount ?? 0),
      0,
    );

    const activeJobs = jobs.filter(
      (job) => getJobStatus(job) === "active",
    ).length;
    const draftJobs = jobs.filter(
      (job) => getJobStatus(job) === "draft",
    ).length;
    const expiredJobs = jobs.filter(
      (job) => getJobStatus(job) === "expired",
    ).length;

    const activeSkills = skills.filter((skill) => skill.isActive).length;
    const inactiveSkills = skills.length - activeSkills;

    const companiesWithJobs = new Set(
      jobs.map((job) => job.company?.companyId).filter(Boolean),
    ).size;

    const publishedCourses = courses.filter(
      (course) => normalizeCourseStatus(course.status) === "published",
    ).length;
    const totalCourseHours = courses.reduce(
      (sum, course) => sum + (course.durationHours ?? 0),
      0,
    );

    return {
      adminCount,
      userCount,
      totalCv,
      totalScans,
      activeJobs,
      draftJobs,
      expiredJobs,
      activeSkills,
      inactiveSkills,
      companiesWithJobs,
      publishedCourses,
      totalCourseHours,
    };
  }, [courses, jobs, skills, users]);

  const recentUsers = useMemo(() => {
    return [...users]
      .sort((first, second) => {
        const firstDate = new Date(first.createdAt || 0).getTime();
        const secondDate = new Date(second.createdAt || 0).getTime();

        return secondDate - firstDate;
      })
      .slice(0, 5);
  }, [users]);

  const recentJobs = useMemo(() => {
    return [...jobs]
      .sort((first, second) => {
        const firstDate = new Date(
          first.scrapedAt || first.postedAt || 0,
        ).getTime();
        const secondDate = new Date(
          second.scrapedAt || second.postedAt || 0,
        ).getTime();

        return secondDate - firstDate;
      })
      .slice(0, 6);
  }, [jobs]);

  const topCompanies = useMemo(() => {
    const companyById = new Map(
      companies.map((company) => [
        String(company.companyId),
        {
          name: company.name,
          location: company.location,
        },
      ]),
    );

    const jobCountByCompany = new Map<
      string,
      { name: string; location?: string | null; count: number }
    >();

    jobs.forEach((job) => {
      const companyId = String(job.company?.companyId ?? "");
      if (!companyId) return;

      const companyInfo = companyById.get(companyId);
      const current = jobCountByCompany.get(companyId);

      jobCountByCompany.set(companyId, {
        name: companyInfo?.name || job.company?.name || "Chưa cập nhật",
        location: companyInfo?.location,
        count: (current?.count ?? 0) + 1,
      });
    });

    return Array.from(jobCountByCompany.entries())
      .map(([companyId, company]) => ({
        companyId,
        ...company,
      }))
      .sort((first, second) => second.count - first.count)
      .slice(0, 5);
  }, [companies, jobs]);

  const topSkills = useMemo(() => {
    const skillCount = new Map<string, { name: string; count: number }>();

    jobs.forEach((job) => {
      job.skills.forEach((skill) => {
        const key = String(skill.skillId);
        const current = skillCount.get(key);

        skillCount.set(key, {
          name: skill.name,
          count: (current?.count ?? 0) + 1,
        });
      });
    });

    return Array.from(skillCount.values())
      .sort((first, second) => second.count - first.count)
      .slice(0, 10);
  }, [jobs]);

  return (
    <AdminShell
      fullWidth
      title="Tổng quan quản trị"
      description="Theo dõi nhanh người dùng, công ty, việc làm, kỹ năng và khóa học trong hệ thống NextStep AI."
    >
      <div className="mx-auto max-w-[1480px] space-y-5">
        {error ? <ErrorBlock /> : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Người dùng"
            value={loading ? "..." : formatNumber(users.length)}
            icon={Users}
            note={`${formatNumber(stats.adminCount)} admin · ${formatNumber(
              stats.userCount,
            )} user`}
            href="/admin/users"
          />
          <KpiCard
            label="Việc làm"
            value={loading ? "..." : formatNumber(totalCount || jobs.length)}
            icon={BriefcaseBusiness}
            note={`${formatNumber(stats.activeJobs)} đang mở · ${formatNumber(
              stats.expiredJobs,
            )} hết hạn`}
            href="/admin/jobs"
          />
          <KpiCard
            label="Công ty"
            value={loading ? "..." : formatNumber(companies.length)}
            icon={Building2}
            note={`${formatNumber(stats.companiesWithJobs)} công ty có job`}
            href="/admin/companies"
          />
          <KpiCard
            label="Kỹ năng"
            value={loading ? "..." : formatNumber(skills.length)}
            icon={BadgeCheck}
            note={`${formatNumber(stats.activeSkills)} đang dùng · ${formatNumber(
              stats.inactiveSkills,
            )} tạm ẩn`}
            href="/admin/skills"
          />
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="CV đã lưu"
            value={loading ? "..." : formatNumber(stats.totalCv)}
            icon={FileSearch}
            note="Tổng số CV người dùng đã lưu trong hệ thống."
          />
          <KpiCard
            label="Lượt phân tích"
            value={loading ? "..." : formatNumber(stats.totalScans)}
            icon={Activity}
            note="Tổng lượt scan/phân tích CV của người dùng."
          />
          <KpiCard
            label="Khóa học"
            value={loading ? "..." : formatNumber(courses.length)}
            icon={GraduationCap}
            note={`${formatNumber(stats.publishedCourses)} đang xuất bản`}
            href="/admin/courses"
          />
          <KpiCard
            label="Thời lượng học"
            value={loading ? "..." : `${formatNumber(stats.totalCourseHours)}h`}
            icon={BookOpenCheck}
            note="Tổng số giờ học ước tính trong danh mục."
          />
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.55fr)]">
          <AdminCard className="overflow-hidden">
            <SectionHeader
              title="Việc làm mới cập nhật"
              description="Danh sách job gần đây nhất đang có trong hệ thống."
              href="/admin/jobs"
            />

            {loading ? (
              <LoadingBlock label="Đang tải việc làm..." />
            ) : recentJobs.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] table-fixed text-left">
                  <colgroup>
                    <col className="w-[34%]" />
                    <col className="w-[26%]" />
                    <col className="w-[14%]" />
                    <col className="w-[12%]" />
                    <col className="w-[14%]" />
                  </colgroup>

                  <thead className="border-b border-border bg-muted/50 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3">Việc làm</th>
                      <th className="px-5 py-3">Công ty</th>
                      <th className="px-5 py-3">Level</th>
                      <th className="px-5 py-3">Trạng thái</th>
                      <th className="px-5 py-3">Cập nhật</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border">
                    {recentJobs.map((job) => {
                      const status = getJobStatus(job);

                      return (
                        <tr
                          key={job.jobId}
                          className="transition hover:bg-muted/40"
                        >
                          <td className="px-5 py-4">
                            <p className="truncate font-bold text-foreground">
                              {job.title}
                            </p>
                            <p className="mt-1 truncate text-sm text-muted-foreground">
                              {job.location || "Chưa cập nhật địa điểm"}
                            </p>
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
                          <td className="whitespace-nowrap px-5 py-4 text-sm text-muted-foreground">
                            {formatDate(job.scrapedAt || job.postedAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Chưa có việc làm nào.
              </div>
            )}
          </AdminCard>

          <div className="space-y-5">
            <AdminCard className="overflow-hidden">
              <SectionHeader
                title="Tình trạng job"
                description="Tỷ lệ trạng thái của danh sách job hiện tại."
              />

              <div className="space-y-4 p-5">
                {[
                  {
                    label: "Đang mở",
                    value: stats.activeJobs,
                    icon: TrendingUp,
                    className: "bg-emerald-500",
                  },
                  {
                    label: "Bản nháp",
                    value: stats.draftJobs,
                    icon: Sparkles,
                    className: "bg-amber-500",
                  },
                  {
                    label: "Hết hạn",
                    value: stats.expiredJobs,
                    icon: CalendarDays,
                    className: "bg-slate-500",
                  },
                ].map((item) => {
                  const total = Math.max(jobs.length, 1);
                  const percent = Math.round((item.value / total) * 100);
                  const Icon = item.icon;

                  return (
                    <div key={item.label}>
                      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                        <span className="inline-flex items-center gap-2 font-bold text-foreground">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          {item.label}
                        </span>
                        <span className="font-bold text-muted-foreground">
                          {formatNumber(item.value)} · {percent}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${item.className}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </AdminCard>

            <AdminCard className="overflow-hidden">
              <SectionHeader
                title="Vai trò người dùng"
                description="Tổng quan phân quyền tài khoản."
              />

              <div className="grid grid-cols-2 gap-3 p-5">
                <div className="rounded-lg border border-border bg-background/60 p-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    Admin
                  </div>
                  <p className="mt-3 text-2xl font-extrabold text-foreground">
                    {formatNumber(stats.adminCount)}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-background/60 p-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                    <UserCheck className="h-4 w-4" />
                    User
                  </div>
                  <p className="mt-3 text-2xl font-extrabold text-foreground">
                    {formatNumber(stats.userCount)}
                  </p>
                </div>
              </div>
            </AdminCard>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-3">
          <AdminCard className="overflow-hidden">
            <SectionHeader
              title="Người dùng mới"
              description="Các tài khoản được tạo gần đây."
              href="/admin/users"
            />

            <div className="divide-y divide-border">
              {loading ? (
                <LoadingBlock label="Đang tải người dùng..." />
              ) : recentUsers.length ? (
                recentUsers.map((user) => (
                  <div
                    key={user.userId}
                    className="flex items-center gap-3 px-5 py-4 transition hover:bg-muted/40"
                  >
                    <UserAvatar name={user.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-foreground">
                        {user.name}
                      </p>
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-md border px-2 py-1 text-xs font-bold ${
                        normalizeRole(user.role) === "admin"
                          ? "border-primary/20 bg-primary/10 text-primary"
                          : "border-slate-500/20 bg-slate-500/10 text-slate-700"
                      }`}
                    >
                      {normalizeRole(user.role) === "admin" ? "Admin" : "User"}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Chưa có người dùng nào.
                </div>
              )}
            </div>
          </AdminCard>

          <AdminCard className="overflow-hidden">
            <SectionHeader
              title="Công ty có nhiều job"
              description="Top công ty theo số lượng việc làm."
              href="/admin/companies"
            />

            <div className="divide-y divide-border">
              {loading ? (
                <LoadingBlock label="Đang tải công ty..." />
              ) : topCompanies.length ? (
                topCompanies.map((company, index) => (
                  <div
                    key={company.companyId}
                    className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-muted/40"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-extrabold text-muted-foreground">
                        #{index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-foreground">
                          {company.name}
                        </p>
                        <p className="mt-1 truncate text-sm text-muted-foreground">
                          {company.location || "Chưa cập nhật địa điểm"}
                        </p>
                      </div>
                    </div>

                    <span className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-bold text-muted-foreground">
                      {formatNumber(company.count)} job
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Chưa có công ty nào.
                </div>
              )}
            </div>
          </AdminCard>

          <AdminCard className="overflow-hidden">
            <SectionHeader
              title="Kỹ năng xuất hiện nhiều"
              description="Top kỹ năng được gắn trong các job."
              href="/admin/skills"
            />

            <div className="p-5">
              {loading ? (
                <LoadingBlock label="Đang tải kỹ năng..." />
              ) : topSkills.length ? (
                <div className="flex flex-wrap gap-2">
                  {topSkills.map((skill) => (
                    <span
                      key={skill.name}
                      className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-bold text-foreground"
                    >
                      {skill.name}
                      <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {formatNumber(skill.count)}
                      </span>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border bg-muted/40 p-8 text-center text-sm text-muted-foreground">
                  Chưa có kỹ năng nào được gắn vào job.
                </div>
              )}
            </div>
          </AdminCard>
        </section>
      </div>
    </AdminShell>
  );
}
