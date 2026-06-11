import { useMemo, useState } from "react";
import { useMutation } from "@apollo/client/react";
import { useQuery } from "@apollo/client/react";
import {
  BadgeCheck,
  CheckCircle2,
  Layers3,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Tag,
  X,
  XCircle,
} from "lucide-react";
import { GET_ALL_SKILLS_QUERY } from "@/features/profile/skills.query";
import {
  CREATE_SKILL,
  DELETE_SKILL,
  UPDATE_SKILL,
} from "@/features/admin/skills/admin-skills.mutation";
import { AdminActionMenu } from "@/shared/ui/admin/admin-action-menu";
import { AdminShell } from "@/shared/ui/admin/admin-shell";

type SkillStatusFilter = "all" | "active" | "inactive";

type AdminSkillItem = {
  skillId: string;
  name: string;
  category?: string | null;
  isActive: boolean;
};

type GetAllSkillsResponse = {
  getAllSkills: AdminSkillItem[];
};

const SKILLS_PAGE_SIZE = 10;

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

function statusLabel(isActive: boolean) {
  return isActive ? "Đang dùng" : "Tạm ẩn";
}

function statusClass(isActive: boolean) {
  return isActive
    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700"
    : "border-slate-500/20 bg-slate-500/10 text-slate-700";
}

function getSkillGroup(name: string) {
  const firstLetter = name.trim().charAt(0).toUpperCase();

  return firstLetter || "#";
}

function getSkillCategory(category?: string | null) {
  return category?.trim() || "Chưa phân loại";
}

export function AdminSkillsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<SkillStatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const { data, loading, error } =
    useQuery<GetAllSkillsResponse>(GET_ALL_SKILLS_QUERY);
  const [createSkill] = useMutation(CREATE_SKILL, {
    refetchQueries: [{ query: GET_ALL_SKILLS_QUERY }],
  });
  const [updateSkill] = useMutation(UPDATE_SKILL, {
    refetchQueries: [{ query: GET_ALL_SKILLS_QUERY }],
  });
  const [deleteSkill] = useMutation(DELETE_SKILL, {
    refetchQueries: [{ query: GET_ALL_SKILLS_QUERY }],
  });

  const skills = useMemo(() => {
    return [...(data?.getAllSkills ?? [])].sort((first, second) =>
      first.name.localeCompare(second.name, "vi"),
    );
  }, [data]);

  const filteredSkills = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return skills.filter((skill) => {
      const matchesSearch =
        !normalizedSearch ||
        skill.name.toLowerCase().includes(normalizedSearch) ||
        skill.category?.toLowerCase().includes(normalizedSearch) ||
        skill.skillId.toLowerCase().includes(normalizedSearch);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && skill.isActive) ||
        (statusFilter === "inactive" && !skill.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, skills, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredSkills.length / SKILLS_PAGE_SIZE),
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedSkills = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * SKILLS_PAGE_SIZE;

    return filteredSkills.slice(startIndex, startIndex + SKILLS_PAGE_SIZE);
  }, [filteredSkills, safeCurrentPage]);
  const fromSkill =
    filteredSkills.length === 0
      ? 0
      : (safeCurrentPage - 1) * SKILLS_PAGE_SIZE + 1;
  const toSkill =
    filteredSkills.length === 0
      ? 0
      : Math.min(filteredSkills.length, safeCurrentPage * SKILLS_PAGE_SIZE);

  const selectedSkill =
    filteredSkills.find((skill) => skill.skillId === selectedSkillId) ?? null;
  const activeSkills = skills.filter((skill) => skill.isActive).length;
  const inactiveSkills = skills.length - activeSkills;
  const skillGroups = new Set(skills.map((skill) => getSkillGroup(skill.name)))
    .size;

  const handleCreateSkill = async () => {
    const name = window.prompt("Tên kỹ năng mới:");
    if (!name?.trim()) return;
    const category = window.prompt("Phân loại:", "technical")?.trim();

    await createSkill({
      variables: {
        input: {
          name: name.trim(),
          category: category || undefined,
        },
      },
    });
  };

  const handleEditSkill = async (skill: AdminSkillItem) => {
    const name = window.prompt("Tên kỹ năng:", skill.name);
    if (!name?.trim()) return;
    const category = window
      .prompt("Phân loại:", getSkillCategory(skill.category))
      ?.trim();

    await updateSkill({
      variables: {
        skillId: Number(skill.skillId),
        input: {
          name: name.trim(),
          category: category === "Chưa phân loại" ? undefined : category,
        },
      },
    });
  };

  const handleToggleSkill = async (skill: AdminSkillItem) => {
    await updateSkill({
      variables: {
        skillId: Number(skill.skillId),
        input: { isActive: !skill.isActive },
      },
    });
  };

  const handleDeleteSkill = async (skill: AdminSkillItem) => {
    if (!window.confirm(`Xóa kỹ năng "${skill.name}"?`)) return;
    await deleteSkill({ variables: { skillId: Number(skill.skillId) } });
    if (selectedSkillId === skill.skillId) {
      setSelectedSkillId(null);
    }
  };

  return (
    <AdminShell
      fullWidth
      title="Quản lý kỹ năng"
      description="Theo dõi danh mục kỹ năng dùng cho hồ sơ, matching việc làm và lộ trình học tập."
      actions={
        <button
          type="button"
          onClick={handleCreateSkill}
          className="hidden h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90 md:inline-flex"
        >
          <Plus className="h-4 w-4" />
          Thêm kỹ năng
        </button>
      }
    >
      <div className="mx-auto max-w-[1480px] space-y-5">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Tổng kỹ năng"
            value={loading ? "..." : skills.length}
            icon={BadgeCheck}
            note="Tất cả kỹ năng đang có trong danh mục hệ thống."
          />
          <KpiCard
            label="Đang dùng"
            value={loading ? "..." : activeSkills}
            icon={CheckCircle2}
            note="Kỹ năng đang hiển thị để người dùng chọn."
          />
          <KpiCard
            label="Tạm ẩn"
            value={loading ? "..." : inactiveSkills}
            icon={XCircle}
            note="Kỹ năng chưa được đưa vào luồng gợi ý."
          />
          <KpiCard
            label="Nhóm chữ cái"
            value={loading ? "..." : skillGroups}
            icon={Layers3}
            note="Số nhóm theo ký tự đầu, hỗ trợ rà soát trùng tên."
          />
        </section>

        <section
          className={`grid gap-5 ${
            selectedSkill ? "xl:grid-cols-[minmax(0,1fr)_360px]" : ""
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
                    placeholder="Tìm tên kỹ năng, phân loại hoặc mã kỹ năng..."
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value as SkillStatusFilter);
                    setCurrentPage(1);
                  }}
                  className="h-10 rounded-lg border border-border bg-card px-3 text-sm font-semibold text-foreground outline-none"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="active">Đang dùng</option>
                  <option value="inactive">Tạm ẩn</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-[340px] items-center justify-center gap-3 text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                Đang tải danh sách kỹ năng...
              </div>
            ) : error ? (
              <div className="m-5 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                Không thể tải danh sách kỹ năng. Vui lòng kiểm tra backend hoặc
                thử lại.
              </div>
            ) : filteredSkills.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] table-fixed text-left">
                  <colgroup>
                    <col className="w-[34%]" />
                    <col className="w-[22%]" />
                    <col className="w-[14%]" />
                    <col className="w-[18%]" />
                    <col className="w-[12%]" />
                  </colgroup>

                  <thead className="border-b border-border bg-muted/50 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3">Kỹ năng</th>
                      <th className="px-5 py-3">Phân loại</th>
                      <th className="px-5 py-3">Nhóm</th>
                      <th className="px-5 py-3">Trạng thái</th>
                      <th className="px-5 py-3 text-center">Thao tác</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border">
                    {paginatedSkills.map((skill) => {
                      const isSelected =
                        selectedSkill?.skillId === skill.skillId;

                      return (
                        <tr
                          key={skill.skillId}
                          className={`cursor-pointer transition hover:bg-muted/40 ${
                            isSelected ? "bg-primary/5" : ""
                          }`}
                          onClick={() => setSelectedSkillId(skill.skillId)}
                        >
                          <td className="px-5 py-4">
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-extrabold text-primary">
                                {getSkillGroup(skill.name)}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate font-bold text-foreground">
                                  {skill.name}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className="block truncate text-sm font-semibold text-foreground"
                              title={getSkillCategory(skill.category)}
                            >
                              {getSkillCategory(skill.category)}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span className="inline-flex rounded-md border border-border bg-background px-2.5 py-1 text-xs font-bold text-muted-foreground">
                              Nhóm {getSkillGroup(skill.name)}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex whitespace-nowrap rounded-md border px-2.5 py-1 text-xs font-bold ${statusClass(
                                skill.isActive,
                              )}`}
                            >
                              {statusLabel(skill.isActive)}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <AdminActionMenu
                              items={[
                                {
                                  label: "Xem chi tiết",
                                  onClick: () =>
                                    setSelectedSkillId(skill.skillId),
                                },
                                {
                                  label: "Chỉnh sửa",
                                  onClick: () => void handleEditSkill(skill),
                                },
                                {
                                  label: skill.isActive
                                    ? "Tạm ẩn"
                                    : "Kích hoạt",
                                  onClick: () => void handleToggleSkill(skill),
                                },
                                {
                                  label: "Xóa",
                                  tone: "danger",
                                  onClick: () => void handleDeleteSkill(skill),
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
                Không có kỹ năng nào khớp với bộ lọc hiện tại.
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4 text-sm text-muted-foreground">
              <span>
                Hiển thị {fromSkill}-{toSkill} / {filteredSkills.length} kỹ
                năng{" "}
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

          <AdminCard className={selectedSkill ? "p-5 relative" : "hidden"}>
            <button
              type="button"
              onClick={() => setSelectedSkillId(null)}
              className="absolute right-5 top-5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
              title="Đóng chi tiết"
            >
              <X className="h-4 w-4" />
            </button>
            <h2 className="text-base font-extrabold text-foreground">
              Chi tiết kỹ năng
            </h2>

            {selectedSkill ? (
              <div className="mt-5 space-y-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-base font-extrabold text-primary">
                    {getSkillGroup(selectedSkill.name)}
                  </span>
                  <div className="min-w-0 pr-10">
                    <p className="truncate font-bold text-foreground">
                      {selectedSkill.name}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 text-sm">
                  <div className="rounded-lg border border-border bg-background/60 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Phân loại
                    </p>
                    <p className="mt-2 flex items-center gap-2 font-bold text-foreground">
                      <Layers3 className="h-4 w-4 text-muted-foreground" />
                      {getSkillCategory(selectedSkill.category)}
                    </p>
                  </div>

                  <div className="rounded-lg border border-border bg-background/60 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Trạng thái
                    </p>
                    <p className="mt-2 flex items-center gap-2 font-bold text-foreground">
                      {selectedSkill.isActive ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                      {statusLabel(selectedSkill.isActive)}
                    </p>
                  </div>

                  <div className="rounded-lg border border-border bg-background/60 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Nhóm rà soát
                    </p>
                    <p className="mt-2 flex items-center gap-2 font-bold text-foreground">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      Nhóm {getSkillGroup(selectedSkill.name)}
                    </p>
                  </div>

                  <div className="rounded-lg border border-border bg-background/60 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Gợi ý quản trị
                    </p>
                    <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-muted-foreground">
                      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      Kiểm tra kỹ năng cùng phân loại và nhóm chữ cái để chuẩn
                      hóa tên, tránh trùng lặp sau khi crawl dữ liệu.
                    </p>
                  </div>
                </div>

                <div className="grid gap-2">
                  <button
                    type="button"
                    onClick={() => void handleEditSkill(selectedSkill)}
                    className="h-10 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90"
                  >
                    Chỉnh sửa kỹ năng
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleToggleSkill(selectedSkill)}
                    className="h-10 rounded-lg border border-border px-4 text-sm font-bold text-foreground hover:bg-muted"
                  >
                    {selectedSkill.isActive ? "Tạm ẩn kỹ năng" : "Kích hoạt"}
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Chọn một kỹ năng để xem chi tiết.
              </p>
            )}
          </AdminCard>
        </section>
      </div>
    </AdminShell>
  );
}
