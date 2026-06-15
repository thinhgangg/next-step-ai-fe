import { useMemo, useState } from "react";
import { useMutation } from "@apollo/client/react";
import {
  BookOpenCheck,
  Clock3,
  ExternalLink,
  GraduationCap,
  Loader2,
  Plus,
  Search,
  Tag,
  X,
} from "lucide-react";
import {
  useAdminCourses,
  type AdminCourseItem,
} from "@/features/admin/courses/admin-courses.model";
import {
  CREATE_COURSE,
  DELETE_COURSE,
  UPDATE_COURSE,
} from "@/features/admin/courses/admin-courses.mutation";
import { GET_ADMIN_COURSES } from "@/features/admin/courses/admin-courses.query";
import { AdminActionMenu } from "@/shared/ui/admin/admin-action-menu";
import { AdminShell } from "@/shared/ui/admin/admin-shell";

type CourseLevel = "beginner" | "intermediate" | "advanced" | "unknown";
type CourseStatus = "published" | "draft" | "archived";
type CourseStatusFilter = "all" | CourseStatus;
type CourseLevelFilter = "all" | CourseLevel;
type ProviderFilter = "all" | string;

type CourseViewItem = AdminCourseItem & {
  providerName: string;
  skillLabel: string;
  levelType: CourseLevel;
  durationValue: number;
  statusType: CourseStatus;
};

const COURSES_PAGE_SIZE = 10;

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

function normalizeLevel(level?: string | null): CourseLevel {
  const normalized = level?.trim().toLowerCase() ?? "";

  if (["beginner", "basic", "intro", "cơ bản"].includes(normalized)) {
    return "beginner";
  }
  if (["intermediate", "medium", "mid", "trung cấp"].includes(normalized)) {
    return "intermediate";
  }
  if (["advanced", "expert", "nâng cao"].includes(normalized)) {
    return "advanced";
  }

  return "unknown";
}

function normalizeStatus(status?: string | null): CourseStatus {
  const normalized = status?.trim().toLowerCase();

  if (normalized === "draft" || normalized === "archived") {
    return normalized;
  }

  return "published";
}

function levelLabel(level: CourseLevel) {
  const labels: Record<CourseLevel, string> = {
    beginner: "Cơ bản",
    intermediate: "Trung cấp",
    advanced: "Nâng cao",
    unknown: "Chưa cập nhật",
  };

  return labels[level];
}

function statusLabel(status: CourseStatus) {
  const labels: Record<CourseStatus, string> = {
    published: "Đang xuất bản",
    draft: "Bản nháp",
    archived: "Đã lưu trữ",
  };

  return labels[status];
}

function statusClass(status: CourseStatus) {
  const classes: Record<CourseStatus, string> = {
    published: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
    draft: "border-amber-500/25 bg-amber-500/10 text-amber-700",
    archived: "border-slate-500/20 bg-slate-500/10 text-slate-700",
  };

  return classes[status];
}

function formatHours(hours?: number | null) {
  if (!hours) return "Chưa cập nhật";
  return `${new Intl.NumberFormat("vi-VN").format(hours)}h`;
}

function getCourseInitials(title: string) {
  return title
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function mapCourse(course: AdminCourseItem): CourseViewItem {
  return {
    ...course,
    providerName: course.provider?.trim() || "Chưa cập nhật",
    skillLabel: course.skillName?.trim() || "Chưa gắn kỹ năng",
    levelType: normalizeLevel(course.level),
    durationValue: course.durationHours ?? 0,
    statusType: normalizeStatus(course.status),
  };
}

export function AdminCoursesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [providerFilter, setProviderFilter] = useState<ProviderFilter>("all");
  const [levelFilter, setLevelFilter] = useState<CourseLevelFilter>("all");
  const [statusFilter, setStatusFilter] = useState<CourseStatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const { courses: dbCourses, loading, error } = useAdminCourses();
  const [createCourse] = useMutation(CREATE_COURSE, {
    refetchQueries: [{ query: GET_ADMIN_COURSES }],
  });
  const [updateCourse] = useMutation(UPDATE_COURSE, {
    refetchQueries: [{ query: GET_ADMIN_COURSES }],
  });
  const [deleteCourse] = useMutation(DELETE_COURSE, {
    refetchQueries: [{ query: GET_ADMIN_COURSES }],
  });

  const courses = useMemo(() => {
    return dbCourses
      .map(mapCourse)
      .sort((first, second) => first.title.localeCompare(second.title, "vi"));
  }, [dbCourses]);

  const providers = useMemo(() => {
    return Array.from(
      new Set(courses.map((course) => course.providerName)),
    ).sort((first, second) => first.localeCompare(second, "vi"));
  }, [courses]);

  const filteredCourses = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return courses.filter((course) => {
      const matchesSearch =
        !normalizedSearch ||
        course.title.toLowerCase().includes(normalizedSearch) ||
        course.providerName.toLowerCase().includes(normalizedSearch) ||
        course.skillLabel.toLowerCase().includes(normalizedSearch);
      const matchesProvider =
        providerFilter === "all" || course.providerName === providerFilter;
      const matchesLevel =
        levelFilter === "all" || course.levelType === levelFilter;
      const matchesStatus =
        statusFilter === "all" || course.statusType === statusFilter;

      return matchesSearch && matchesProvider && matchesLevel && matchesStatus;
    });
  }, [courses, levelFilter, providerFilter, searchTerm, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCourses.length / COURSES_PAGE_SIZE),
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedCourses = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * COURSES_PAGE_SIZE;

    return filteredCourses.slice(startIndex, startIndex + COURSES_PAGE_SIZE);
  }, [filteredCourses, safeCurrentPage]);
  const fromCourse =
    filteredCourses.length === 0
      ? 0
      : (safeCurrentPage - 1) * COURSES_PAGE_SIZE + 1;
  const toCourse =
    filteredCourses.length === 0
      ? 0
      : Math.min(filteredCourses.length, safeCurrentPage * COURSES_PAGE_SIZE);

  const selectedCourse =
    filteredCourses.find((course) => course.courseId === selectedCourseId) ??
    null;
  const publishedCourses = courses.filter(
    (course) => course.statusType === "published",
  ).length;
  const totalHours = courses.reduce(
    (sum, course) => sum + course.durationValue,
    0,
  );
  const linkedSkills = new Set(
    courses
      .map((course) => course.skillName)
      .filter((skillName): skillName is string => Boolean(skillName)),
  ).size;

  const handleCreateCourse = async () => {
    const title = window.prompt("Tên khóa học mới:");
    if (!title?.trim()) return;
    const skillId = Number(window.prompt("ID kỹ năng liên kết:") || 0);
    if (!skillId) {
      window.alert("Cần nhập ID kỹ năng hợp lệ.");
      return;
    }
    const provider = window.prompt("Provider:", "Coursera")?.trim();
    const url = window.prompt("URL khóa học:")?.trim();
    const level = window.prompt("Cấp độ:", "beginner")?.trim();
    const durationHours = Number(window.prompt("Thời lượng giờ:", "0") || 0);

    await createCourse({
      variables: {
        input: {
          title: title.trim(),
          skillId,
          provider: provider || undefined,
          url: url || undefined,
          level: level || undefined,
          durationHours: durationHours || undefined,
        },
      },
    });
  };

  const handleEditCourse = async (course: CourseViewItem) => {
    const title = window.prompt("Tên khóa học:", course.title);
    if (!title?.trim()) return;
    const provider = window.prompt("Provider:", course.providerName)?.trim();
    const url = window.prompt("URL khóa học:", course.url ?? "")?.trim();
    const level = window.prompt("Cấp độ:", course.level ?? "")?.trim();
    const durationHours = Number(
      window.prompt("Thời lượng giờ:", String(course.durationHours ?? 0)) || 0,
    );

    await updateCourse({
      variables: {
        input: {
          courseId: Number(course.courseId),
          title: title.trim(),
          provider:
            provider === "Chưa cập nhật" || !provider ? undefined : provider,
          url: url || undefined,
          level: level || undefined,
          durationHours: durationHours || undefined,
        },
      },
    });
  };

  const handleDeleteCourse = async (course: CourseViewItem) => {
    if (!window.confirm(`Xóa khóa học "${course.title}"?`)) return;
    await deleteCourse({ variables: { courseId: Number(course.courseId) } });
    if (selectedCourseId === course.courseId) {
      setSelectedCourseId(null);
    }
  };

  return (
    <AdminShell
      fullWidth
      title="Quản lý khóa học"
      description="Theo dõi tài nguyên học tập được gắn với kỹ năng, skill gap và roadmap."
      actions={
        <button
          type="button"
          onClick={handleCreateCourse}
          className="hidden h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90 md:inline-flex"
        >
          <Plus className="h-4 w-4" />
          Thêm khóa học
        </button>
      }
    >
      <div className="mx-auto max-w-[1480px] space-y-5">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Tổng khóa học"
            value={loading ? "..." : courses.length}
            icon={GraduationCap}
            note="Dữ liệu lấy từ bảng khóa học trong hệ thống."
          />
          <KpiCard
            label="Đang xuất bản"
            value={loading ? "..." : publishedCourses}
            icon={BookOpenCheck}
            note="Khóa học có thể xuất hiện trong lộ trình gợi ý."
          />
          <KpiCard
            label="Thời lượng"
            value={loading ? "..." : formatHours(totalHours)}
            icon={Clock3}
            note="Tổng số giờ học ước tính trong danh mục."
          />
          <KpiCard
            label="Kỹ năng"
            value={loading ? "..." : linkedSkills}
            icon={Tag}
            note="Số kỹ năng đang có khóa học liên kết."
          />
        </section>

        <section
          className={`grid gap-5 ${
            selectedCourse ? "xl:grid-cols-[minmax(0,1fr)_380px]" : ""
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
                    placeholder="Tìm tên khóa học, nhà cung cấp, kỹ năng..."
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={providerFilter}
                    onChange={(event) => {
                      setProviderFilter(event.target.value);
                      setCurrentPage(1);
                    }}
                    className="h-10 rounded-lg border border-border bg-card px-3 text-sm font-semibold text-foreground outline-none"
                  >
                    <option value="all">Tất cả provider</option>
                    {providers.map((provider) => (
                      <option key={provider} value={provider}>
                        {provider}
                      </option>
                    ))}
                  </select>

                  <select
                    value={levelFilter}
                    onChange={(event) => {
                      setLevelFilter(event.target.value as CourseLevelFilter);
                      setCurrentPage(1);
                    }}
                    className="h-10 rounded-lg border border-border bg-card px-3 text-sm font-semibold text-foreground outline-none"
                  >
                    <option value="all">Tất cả cấp độ</option>
                    <option value="beginner">Cơ bản</option>
                    <option value="intermediate">Trung cấp</option>
                    <option value="advanced">Nâng cao</option>
                    <option value="unknown">Chưa cập nhật</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(event) => {
                      setStatusFilter(event.target.value as CourseStatusFilter);
                      setCurrentPage(1);
                    }}
                    className="h-10 rounded-lg border border-border bg-card px-3 text-sm font-semibold text-foreground outline-none"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="published">Đang xuất bản</option>
                    <option value="draft">Bản nháp</option>
                    <option value="archived">Đã lưu trữ</option>
                  </select>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-[340px] items-center justify-center gap-3 text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                Đang tải danh sách khóa học...
              </div>
            ) : error ? (
              <div className="m-5 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                Không thể tải danh sách khóa học. Vui lòng kiểm tra backend hoặc
                thử lại.
              </div>
            ) : filteredCourses.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] table-fixed text-left">
                  <colgroup>
                    <col className="w-[30%]" />
                    <col className="w-[17%]" />
                    <col className="w-[16%]" />
                    <col className="w-[12%]" />
                    <col className="w-[15%]" />
                    <col className="w-[10%]" />
                  </colgroup>

                  <thead className="border-b border-border bg-muted/50 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3">Khóa học</th>
                      <th className="px-5 py-3">Provider</th>
                      <th className="px-5 py-3">Kỹ năng</th>
                      <th className="px-5 py-3">Thời lượng</th>
                      <th className="px-5 py-3">Trạng thái</th>
                      <th className="px-5 py-3 text-center">Thao tác</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border">
                    {paginatedCourses.map((course) => {
                      const isSelected =
                        selectedCourse?.courseId === course.courseId;

                      return (
                        <tr
                          key={course.courseId}
                          className={`cursor-pointer transition hover:bg-muted/40 ${
                            isSelected ? "bg-primary/5" : ""
                          }`}
                          onClick={() => setSelectedCourseId(course.courseId)}
                        >
                          <td className="px-5 py-4">
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-extrabold text-primary">
                                {getCourseInitials(course.title)}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate font-bold text-foreground">
                                  {course.title}
                                </p>
                                <p className="mt-1 truncate text-xs text-muted-foreground">
                                  {levelLabel(course.levelType)}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4 text-sm font-semibold text-foreground">
                            <span className="block truncate">
                              {course.providerName}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span className="inline-flex max-w-full rounded-md border border-border bg-background px-2.5 py-1 text-xs font-bold text-muted-foreground">
                              <span className="truncate">
                                {course.skillLabel}
                              </span>
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-sm text-muted-foreground">
                            {formatHours(course.durationHours)}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex whitespace-nowrap rounded-md border px-2.5 py-1 text-xs font-bold ${statusClass(
                                course.statusType,
                              )}`}
                            >
                              {statusLabel(course.statusType)}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <AdminActionMenu
                              items={[
                                {
                                  label: "Xem chi tiết",
                                  onClick: () =>
                                    setSelectedCourseId(course.courseId),
                                },
                                {
                                  label: "Chỉnh sửa",
                                  onClick: () => void handleEditCourse(course),
                                },
                                {
                                  label: "Xóa",
                                  tone: "danger",
                                  onClick: () => void handleDeleteCourse(course),
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
                Không có khóa học nào khớp với bộ lọc hiện tại.
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4 text-sm text-muted-foreground">
              <span>
                Hiển thị {fromCourse}-{toCourse} / {filteredCourses.length} khóa
                học{" "}
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

          <AdminCard className={selectedCourse ? "p-5 relative" : "hidden"}>
            <button
              type="button"
              onClick={() => setSelectedCourseId(null)}
              className="absolute right-5 top-5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
              title="Đóng chi tiết"
            >
              <X className="h-4 w-4" />
            </button>
            <h2 className="text-base font-extrabold text-foreground">
              Chi tiết khóa học
            </h2>

            {selectedCourse ? (
              <div className="mt-5 space-y-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-base font-extrabold text-primary">
                    {getCourseInitials(selectedCourse.title)}
                  </span>
                  <div className="min-w-0 pr-10">
                    <p className="truncate font-bold text-foreground">
                      {selectedCourse.title}
                    </p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {selectedCourse.providerName}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 text-sm">
                  <div className="rounded-lg border border-border bg-background/60 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Kỹ năng liên kết
                    </p>
                    <p className="mt-2 flex items-center gap-2 font-bold text-foreground">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      {selectedCourse.skillLabel}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-border bg-background/60 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        Cấp độ
                      </p>
                      <p className="mt-2 font-bold text-foreground">
                        {levelLabel(selectedCourse.levelType)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border bg-background/60 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        Thời lượng
                      </p>
                      <p className="mt-2 font-bold text-foreground">
                        {formatHours(selectedCourse.durationHours)}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-background/60 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Trạng thái
                    </p>
                    <span
                      className={`mt-2 inline-flex whitespace-nowrap rounded-md border px-2.5 py-1 text-xs font-bold ${statusClass(
                        selectedCourse.statusType,
                      )}`}
                    >
                      {statusLabel(selectedCourse.statusType)}
                    </span>
                  </div>
                </div>

                <div className="grid gap-2">
                  <button
                    type="button"
                    onClick={() => void handleEditCourse(selectedCourse)}
                    className="h-10 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90"
                  >
                    Chỉnh sửa khóa học
                  </button>
                  {selectedCourse.url ? (
                    <a
                      href={selectedCourse.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-bold text-foreground hover:bg-muted"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Mở khóa học
                    </a>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Chọn một khóa học để xem chi tiết.
              </p>
            )}
          </AdminCard>
        </section>
      </div>
    </AdminShell>
  );
}
