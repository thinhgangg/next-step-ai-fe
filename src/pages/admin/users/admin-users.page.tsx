import { useMemo, useState } from "react";
import { useMutation } from "@apollo/client/react";
import {
  CalendarDays,
  FileSearch,
  Filter,
  Loader2,
  Mail,
  Search,
  Shield,
  UserCheck,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { AdminShell } from "@/shared/ui/admin/admin-shell";
import {
  useAdminUsers,
  type AdminUserItem,
} from "@/features/admin/users/admin-users.model";
import {
  ADMIN_CREATE_USER,
  ADMIN_DELETE_USER,
  ADMIN_UPDATE_USER_ROLE,
} from "@/features/admin/users/admin-users.mutation";
import { ADMIN_USERS_QUERY } from "@/features/admin/users/admin-users.query";
import { AdminActionMenu } from "@/shared/ui/admin/admin-action-menu";

type UserRole = "admin" | "user";
const USERS_PAGE_SIZE = 10;

type AdminUser = AdminUserItem & {
  id: number;
  roleType: UserRole;
  joinedAt: string;
  targetRole: string;
};

function roleLabel(role: UserRole) {
  return role === "admin" ? "Admin" : "User";
}

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

function UserAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
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

function normalizeRole(role?: string | null): UserRole {
  return role?.toLowerCase() === "admin" ? "admin" : "user";
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

function mapAdminUser(user: AdminUserItem): AdminUser {
  const roleType = normalizeRole(user.role);

  return {
    ...user,
    id: Number(user.userId),
    roleType,
    joinedAt: formatDate(user.createdAt),
    targetRole:
      user.currentRole ||
      user.location ||
      (roleType === "admin" ? "System Admin" : "Chưa cập nhật"),
  };
}

export function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const {
    users: realUsers,
    loading: usersLoading,
    error: usersError,
  } = useAdminUsers();
  const [updateUserRole] = useMutation(ADMIN_UPDATE_USER_ROLE, {
    refetchQueries: [{ query: ADMIN_USERS_QUERY }],
  });
  const [createUser] = useMutation(ADMIN_CREATE_USER, {
    refetchQueries: [{ query: ADMIN_USERS_QUERY }],
  });
  const [deleteUser] = useMutation(ADMIN_DELETE_USER, {
    refetchQueries: [{ query: ADMIN_USERS_QUERY }],
  });

  const users = useMemo(
    () => realUsers.map((user) => mapAdminUser(user)),
    [realUsers],
  );

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !normalizedSearch ||
        user.name.toLowerCase().includes(normalizedSearch) ||
        user.email.toLowerCase().includes(normalizedSearch) ||
        user.targetRole.toLowerCase().includes(normalizedSearch);
      const matchesRole = roleFilter === "all" || user.roleType === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [roleFilter, searchTerm, users]);

  const selectedUser =
    filteredUsers.find((user) => user.id === selectedUserId) ?? null;

  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / USERS_PAGE_SIZE),
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedUsers = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * USERS_PAGE_SIZE;

    return filteredUsers.slice(startIndex, startIndex + USERS_PAGE_SIZE);
  }, [filteredUsers, safeCurrentPage]);
  const fromUser =
    filteredUsers.length === 0
      ? 0
      : (safeCurrentPage - 1) * USERS_PAGE_SIZE + 1;
  const toUser =
    filteredUsers.length === 0
      ? 0
      : Math.min(filteredUsers.length, safeCurrentPage * USERS_PAGE_SIZE);

  const totalScans = users.reduce((sum, user) => sum + user.scanCount, 0);

  const handleToggleRole = async (user: AdminUser) => {
    const nextRole = user.roleType === "admin" ? "user" : "admin";
    if (
      !window.confirm(`Đổi vai trò ${user.name} thành ${roleLabel(nextRole)}?`)
    ) {
      return;
    }

    await updateUserRole({
      variables: {
        userId: user.id,
        role: nextRole.toUpperCase(),
      },
    });
  };

  const handleCreateAdmin = async () => {
    const name = window.prompt("Tên admin:");
    if (!name?.trim()) return;
    const email = window.prompt("Email admin:");
    if (!email?.trim()) return;
    const password = window.prompt("Mật khẩu tạm:");
    if (!password?.trim()) return;

    await createUser({
      variables: {
        name: name.trim(),
        email: email.trim(),
        password,
        role: "ADMIN",
      },
    });
  };

  const handleDeleteUser = async (user: AdminUser) => {
    if (!window.confirm(`Xóa người dùng "${user.name}"?`)) return;
    await deleteUser({ variables: { userId: user.id } });
    if (selectedUserId === user.id) {
      setSelectedUserId(null);
    }
  };

  return (
    <AdminShell
      fullWidth
      title="Quản lý người dùng"
      description="Theo dõi tài khoản, vai trò, CV và hoạt động phân tích của người dùng."
      actions={
        <button
          type="button"
          onClick={handleCreateAdmin}
          className="hidden h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90 md:inline-flex"
        >
          <UserCog className="h-4 w-4" />
          Thêm admin
        </button>
      }
    >
      <div className="mx-auto max-w-[1480px] space-y-5">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <AdminCard className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-muted-foreground">
                  Tổng người dùng
                </p>
                <p className="mt-2 text-2xl font-extrabold text-foreground">
                  {users.length}
                </p>
              </div>
              <Users className="h-6 w-6 text-primary" />
            </div>
          </AdminCard>
          <AdminCard className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-muted-foreground">
                  Admin
                </p>
                <p className="mt-2 text-2xl font-extrabold text-foreground">
                  {users.filter((user) => user.roleType === "admin").length}
                </p>
              </div>
              <Shield className="h-6 w-6 text-primary" />
            </div>
          </AdminCard>
          <AdminCard className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-muted-foreground">
                  CV đã lưu
                </p>
                <p className="mt-2 text-2xl font-extrabold text-foreground">
                  {users.reduce((sum, user) => sum + user.cvCount, 0)}
                </p>
              </div>
              <FileSearch className="h-6 w-6 text-primary" />
            </div>
          </AdminCard>
          <AdminCard className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-muted-foreground">
                  Lượt phân tích
                </p>
                <p className="mt-2 text-2xl font-extrabold text-foreground">
                  {totalScans}
                </p>
              </div>
              <UserCheck className="h-6 w-6 text-primary" />
            </div>
          </AdminCard>
        </section>

        <section
          className={`grid gap-5 ${
            selectedUser ? "xl:grid-cols-[minmax(0,1fr)_360px]" : ""
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
                    placeholder="Tìm tên, email hoặc vị trí mục tiêu..."
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-semibold text-muted-foreground">
                    <Filter className="h-4 w-4" />
                    Bộ lọc
                  </span>
                  <select
                    value={roleFilter}
                    onChange={(event) => {
                      setRoleFilter(event.target.value as "all" | UserRole);
                      setCurrentPage(1);
                    }}
                    className="h-10 rounded-lg border border-border bg-card px-3 text-sm font-semibold text-foreground outline-none"
                  >
                    <option value="all">Tất cả vai trò</option>
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                  </select>
                </div>
              </div>
            </div>

            {usersLoading ? (
              <div className="flex min-h-[320px] items-center justify-center gap-3 text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                Đang tải danh sách người dùng...
              </div>
            ) : usersError ? (
              <div className="m-5 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                Không thể tải danh sách người dùng. Vui lòng kiểm tra backend
                hoặc thử lại.
              </div>
            ) : filteredUsers.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] table-fixed text-left">
                  <colgroup>
                    <col className="w-[36%]" />
                    <col className="w-[12%]" />
                    <col className="w-[10%]" />
                    <col className="w-[14%]" />
                    <col className="w-[16%]" />
                    <col className="w-[12%]" />
                  </colgroup>

                  <thead className="border-b border-border bg-muted/50 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3">Người dùng</th>
                      <th className="px-5 py-3">Vai trò</th>
                      <th className="px-5 py-3 text-center">CV</th>
                      <th className="px-5 py-3 text-center">Phân tích</th>
                      <th className="px-5 py-3">Ngày tham gia</th>
                      <th className="px-5 py-3 text-center">Thao tác</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border">
                    {paginatedUsers.map((user) => (
                      <tr
                        key={user.id}
                        className={`cursor-pointer transition hover:bg-muted/40 ${
                          selectedUser?.id === user.id ? "bg-primary/5" : ""
                        }`}
                        onClick={() => setSelectedUserId(user.id)}
                      >
                        <td className="px-5 py-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <UserAvatar name={user.name} />
                            <div className="min-w-0">
                              <p className="truncate font-bold text-foreground">
                                {user.name}
                              </p>
                              <p className="mt-1 truncate text-sm text-muted-foreground">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-md border px-2.5 py-1 text-xs font-bold ${
                              user.roleType === "admin"
                                ? "border-primary/20 bg-primary/10 text-primary"
                                : "border-slate-500/20 bg-slate-500/10 text-slate-700"
                            }`}
                          >
                            {roleLabel(user.roleType)}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-center text-sm font-semibold text-foreground">
                          {user.cvCount}
                        </td>

                        <td className="px-5 py-4 text-center text-sm font-semibold text-foreground">
                          {user.scanCount}
                        </td>

                        <td className="px-5 py-4 text-sm text-muted-foreground">
                          {user.joinedAt}
                        </td>

                        <td className="px-5 py-4">
                          <AdminActionMenu
                            items={[
                              {
                                label: "Xem chi tiết",
                                onClick: () => setSelectedUserId(user.id),
                              },
                              {
                                label:
                                  user.roleType === "admin"
                                    ? "Hạ xuống User"
                                    : "Nâng thành Admin",
                                onClick: () => void handleToggleRole(user),
                              },
                              {
                                label: "Xóa người dùng",
                                tone: "danger",
                                onClick: () => void handleDeleteUser(user),
                              },
                            ]}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="m-5 rounded-lg border border-dashed border-border bg-muted/40 p-8 text-center text-sm text-muted-foreground">
                Không có người dùng nào khớp với bộ lọc hiện tại.
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4 text-sm text-muted-foreground">
              <span>
                Hiển thị {fromUser}-{toUser} / {filteredUsers.length} người dùng
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

          <AdminCard className={selectedUser ? "p-5 relative" : "hidden"}>
            <button
              type="button"
              onClick={() => setSelectedUserId(null)}
              className="absolute right-5 top-5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
              title="Đóng chi tiết"
            >
              <X className="h-4 w-4" />
            </button>
            <h2 className="text-base font-extrabold text-foreground">
              Chi tiết người dùng
            </h2>

            {selectedUser ? (
              <div className="mt-5 space-y-5">
                <div className="flex items-center gap-3">
                  <UserAvatar name={selectedUser.name} />
                  <div className="min-w-0">
                    <p className="truncate font-bold text-foreground">
                      {selectedUser.name}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {selectedUser.email}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {selectedUser.email}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    Tham gia {selectedUser.joinedAt}
                  </div>
                  <div className="rounded-lg border border-border bg-background/60 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Vị trí mục tiêu
                    </p>
                    <p className="mt-2 font-bold text-foreground">
                      {selectedUser.targetRole}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border bg-background/60 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      CV
                    </p>
                    <p className="mt-2 text-xl font-extrabold text-foreground">
                      {selectedUser.cvCount}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-background/60 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Scan
                    </p>
                    <p className="mt-2 text-xl font-extrabold text-foreground">
                      {selectedUser.scanCount}
                    </p>
                  </div>
                </div>

                <div className="grid gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      window.alert(
                        `Người dùng: ${selectedUser.name}\nEmail: ${selectedUser.email}`,
                      )
                    }
                    className="h-10 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90"
                  >
                    Xem hồ sơ
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleToggleRole(selectedUser)}
                    className="h-10 rounded-lg border border-border px-4 text-sm font-bold text-foreground hover:bg-muted"
                  >
                    Đổi vai trò
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Chọn một người dùng để xem chi tiết.
              </p>
            )}
          </AdminCard>
        </section>
      </div>
    </AdminShell>
  );
}
