import { useMemo, useState } from "react";
import {
  Bell,
  Bot,
  CheckCircle2,
  Database,
  Download,
  KeyRound,
  RotateCcw,
  Save,
  ServerCog,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { AdminShell } from "@/shared/ui/admin/admin-shell";
import { BRAND } from "@/shared/config/brand";

type SettingsTab = "general" | "crawler" | "matching" | "data";

type AdminSettingsState = {
  appName: string;
  timezone: string;
  defaultPageSize: number;
  crawlerEnabled: boolean;
  crawlerSource: string;
  crawlerIntervalHours: number;
  crawlerJobLimit: number;
  aiMatchingEnabled: boolean;
  minimumMatchScore: number;
  skillWeight: number;
  experienceWeight: number;
  locationWeight: number;
  emailAlerts: boolean;
  googleLogin: boolean;
  tokenTtlHours: number;
  autoBackup: boolean;
};

const settingsTabs: Array<{
  id: SettingsTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "general", label: "Tổng quan", icon: ServerCog },
  { id: "crawler", label: "Crawler", icon: RotateCcw },
  { id: "matching", label: "AI Matching", icon: Bot },
  { id: "data", label: "Dữ liệu", icon: Database },
];

const initialSettings: AdminSettingsState = {
  appName: BRAND.name,
  timezone: "Asia/Bangkok",
  defaultPageSize: 10,
  crawlerEnabled: true,
  crawlerSource: "TopDev",
  crawlerIntervalHours: 12,
  crawlerJobLimit: 100,
  aiMatchingEnabled: true,
  minimumMatchScore: 60,
  skillWeight: 45,
  experienceWeight: 25,
  locationWeight: 15,
  emailAlerts: true,
  googleLogin: true,
  tokenTtlHours: 24,
  autoBackup: true,
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

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border-b border-border px-5 py-4">
      <h2 className="text-base font-extrabold text-foreground">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-3 border-b border-border px-5 py-4 last:border-b-0 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-center">
      <div className="min-w-0">
        <p className="font-bold text-foreground">{title}</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      className={`flex h-10 w-full items-center justify-between rounded-lg border px-3 text-sm font-bold transition ${
        checked
          ? "border-primary/30 bg-primary/10 text-primary"
          : "border-border bg-background text-muted-foreground hover:text-foreground"
      }`}
    >
      <span className="truncate">{label}</span>
      <span
        className={`relative h-5 w-9 rounded-full transition ${
          checked ? "bg-primary" : "bg-muted-foreground/30"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${
            checked ? "left-4" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

function NumberInput({
  value,
  min,
  max,
  suffix,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex h-10 items-center rounded-lg border border-border bg-background px-3">
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => {
          const nextValue = Number(event.target.value);
          if (Number.isNaN(nextValue)) return;
          onChange(Math.min(max, Math.max(min, nextValue)));
        }}
        className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-foreground outline-none"
      />
      {suffix ? (
        <span className="ml-2 text-xs font-bold text-muted-foreground">
          {suffix}
        </span>
      ) : null}
    </div>
  );
}

function TextInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none focus:border-primary/40"
    />
  );
}

function SelectInput({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm font-semibold text-foreground outline-none"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

export function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [settings, setSettings] =
    useState<AdminSettingsState>(initialSettings);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const matchingWeightTotal = useMemo(() => {
    return (
      settings.skillWeight +
      settings.experienceWeight +
      settings.locationWeight
    );
  }, [settings.experienceWeight, settings.locationWeight, settings.skillWeight]);

  const updateSetting = <K extends keyof AdminSettingsState>(
    key: K,
    value: AdminSettingsState[K],
  ) => {
    setSavedMessage(null);
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const saveSettings = () => {
    setSavedMessage("Cài đặt đã được lưu trong phiên làm việc hiện tại.");
  };

  return (
    <AdminShell
      fullWidth
      title="Cài đặt"
      description="Điều chỉnh cấu hình vận hành, crawler, AI matching và bảo mật hệ thống."
      actions={
        <button
          type="button"
          onClick={saveSettings}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90"
        >
          <Save className="h-4 w-4" />
          Lưu cài đặt
        </button>
      }
    >
      <div className="mx-auto grid max-w-[1480px] gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
        <AdminCard className="h-fit overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Nhóm cài đặt
            </p>
          </div>
          <div className="p-2">
            {settingsTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm transition ${
                    isActive
                      ? "bg-accent font-bold text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : ""}`}
                  />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </AdminCard>

        <div className="space-y-5">
          {savedMessage ? (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              {savedMessage}
            </div>
          ) : null}

          {activeTab === "general" ? (
            <AdminCard className="overflow-hidden">
              <SectionHeader
                title="Tổng quan"
                description="Các cài đặt hiển thị và hành vi mặc định trong admin console."
              />
              <SettingRow
                title="Tên hệ thống"
                description="Tên hiển thị ở sidebar và các khu vực nhận diện nội bộ."
              >
                <TextInput
                  value={settings.appName}
                  onChange={(value) => updateSetting("appName", value)}
                />
              </SettingRow>
              <SettingRow
                title="Timezone"
                description="Dùng để hiển thị thời gian crawler, báo cáo và audit log."
              >
                <SelectInput
                  value={settings.timezone}
                  options={["Asia/Bangkok", "Asia/Ho_Chi_Minh", "UTC"]}
                  onChange={(value) => updateSetting("timezone", value)}
                />
              </SettingRow>
              <SettingRow
                title="Số dòng mặc định"
                description="Số bản ghi hiển thị mỗi trang trong các bảng admin."
              >
                <NumberInput
                  value={settings.defaultPageSize}
                  min={5}
                  max={100}
                  onChange={(value) => updateSetting("defaultPageSize", value)}
                />
              </SettingRow>
              <SettingRow
                title="Thông báo email"
                description="Gửi email khi crawler lỗi hoặc có sự kiện cần admin xử lý."
              >
                <Toggle
                  checked={settings.emailAlerts}
                  onChange={(value) => updateSetting("emailAlerts", value)}
                  label={settings.emailAlerts ? "Đang bật" : "Đang tắt"}
                />
              </SettingRow>
            </AdminCard>
          ) : null}

          {activeTab === "crawler" ? (
            <AdminCard className="overflow-hidden">
              <SectionHeader
                title="Crawler"
                description="Kiểm soát nguồn crawl, tần suất và giới hạn dữ liệu tuyển dụng."
              />
              <SettingRow
                title="Trạng thái crawler"
                description="Bật crawler để đồng bộ việc làm mới theo lịch."
              >
                <Toggle
                  checked={settings.crawlerEnabled}
                  onChange={(value) => updateSetting("crawlerEnabled", value)}
                  label={settings.crawlerEnabled ? "Đang bật" : "Đang tắt"}
                />
              </SettingRow>
              <SettingRow
                title="Nguồn crawl chính"
                description="Nguồn dữ liệu ưu tiên khi chạy lịch tự động."
              >
                <SelectInput
                  value={settings.crawlerSource}
                  options={["TopDev", "VietnamWorks", "LinkedIn", "All"]}
                  onChange={(value) => updateSetting("crawlerSource", value)}
                />
              </SettingRow>
              <SettingRow
                title="Chu kỳ crawl"
                description="Khoảng thời gian giữa hai lần crawl tự động."
              >
                <NumberInput
                  value={settings.crawlerIntervalHours}
                  min={1}
                  max={168}
                  suffix="giờ"
                  onChange={(value) =>
                    updateSetting("crawlerIntervalHours", value)
                  }
                />
              </SettingRow>
              <SettingRow
                title="Giới hạn job mỗi lần"
                description="Giúp kiểm soát tải backend và tránh tạo quá nhiều dữ liệu trùng."
              >
                <NumberInput
                  value={settings.crawlerJobLimit}
                  min={10}
                  max={1000}
                  onChange={(value) => updateSetting("crawlerJobLimit", value)}
                />
              </SettingRow>
            </AdminCard>
          ) : null}

          {activeTab === "matching" ? (
            <AdminCard className="overflow-hidden">
              <SectionHeader
                title="AI Matching"
                description="Điều chỉnh cách hệ thống đánh giá CV, job và lộ trình học tập."
              />
              <SettingRow
                title="Phân tích bằng AI"
                description="Cho phép dùng AI để phân tích CV, skill gap và roadmap."
              >
                <Toggle
                  checked={settings.aiMatchingEnabled}
                  onChange={(value) =>
                    updateSetting("aiMatchingEnabled", value)
                  }
                  label={settings.aiMatchingEnabled ? "Đang bật" : "Đang tắt"}
                />
              </SettingRow>
              <SettingRow
                title="Điểm match tối thiểu"
                description="Ngưỡng điểm để đánh dấu một việc làm là phù hợp."
              >
                <NumberInput
                  value={settings.minimumMatchScore}
                  min={0}
                  max={100}
                  suffix="%"
                  onChange={(value) =>
                    updateSetting("minimumMatchScore", value)
                  }
                />
              </SettingRow>
              <SettingRow
                title="Trọng số kỹ năng"
                description="Tỷ trọng skill match trong điểm tổng."
              >
                <NumberInput
                  value={settings.skillWeight}
                  min={0}
                  max={100}
                  suffix="%"
                  onChange={(value) => updateSetting("skillWeight", value)}
                />
              </SettingRow>
              <SettingRow
                title="Trọng số kinh nghiệm"
                description="Tỷ trọng năm kinh nghiệm và level trong điểm tổng."
              >
                <NumberInput
                  value={settings.experienceWeight}
                  min={0}
                  max={100}
                  suffix="%"
                  onChange={(value) =>
                    updateSetting("experienceWeight", value)
                  }
                />
              </SettingRow>
              <SettingRow
                title="Trọng số địa điểm"
                description={`Tổng ba trọng số hiện tại: ${matchingWeightTotal}%.`}
              >
                <NumberInput
                  value={settings.locationWeight}
                  min={0}
                  max={100}
                  suffix="%"
                  onChange={(value) => updateSetting("locationWeight", value)}
                />
              </SettingRow>
            </AdminCard>
          ) : null}

          {activeTab === "data" ? (
            <AdminCard className="overflow-hidden">
              <SectionHeader
                title="Dữ liệu và bảo mật"
                description="Thiết lập đăng nhập, token, backup và thao tác dữ liệu vận hành."
              />
              <SettingRow
                title="Đăng nhập Google"
                description="Cho phép người dùng đăng nhập bằng Google OAuth."
              >
                <Toggle
                  checked={settings.googleLogin}
                  onChange={(value) => updateSetting("googleLogin", value)}
                  label={settings.googleLogin ? "Đang bật" : "Đang tắt"}
                />
              </SettingRow>
              <SettingRow
                title="Thời hạn token"
                description="Thời gian hiệu lực của phiên đăng nhập trước khi cần refresh."
              >
                <NumberInput
                  value={settings.tokenTtlHours}
                  min={1}
                  max={720}
                  suffix="giờ"
                  onChange={(value) => updateSetting("tokenTtlHours", value)}
                />
              </SettingRow>
              <SettingRow
                title="Backup tự động"
                description="Tự động tạo bản sao lưu dữ liệu theo lịch hệ thống."
              >
                <Toggle
                  checked={settings.autoBackup}
                  onChange={(value) => updateSetting("autoBackup", value)}
                  label={settings.autoBackup ? "Đang bật" : "Đang tắt"}
                />
              </SettingRow>
              <div className="grid gap-3 px-5 py-4 md:grid-cols-3">
                <button
                  type="button"
                  onClick={() =>
                    window.alert("Export dữ liệu sẽ được nối vào API backup/export.")
                  }
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border px-3 text-sm font-bold text-foreground hover:bg-muted"
                >
                  <Download className="h-4 w-4" />
                  Export dữ liệu
                </button>
                <button
                  type="button"
                  onClick={() => window.alert("Cache giao diện đã được làm mới.")}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border px-3 text-sm font-bold text-foreground hover:bg-muted"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Xóa cache
                </button>
                <button
                  type="button"
                  onClick={() =>
                    window.alert("Audit log sẽ hiển thị khi backend có endpoint log.")
                  }
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border px-3 text-sm font-bold text-foreground hover:bg-muted"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Audit log
                </button>
              </div>
              <div className="grid gap-3 border-t border-border px-5 py-4 md:grid-cols-2">
                <div className="rounded-lg border border-border bg-background/60 p-4">
                  <p className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <KeyRound className="h-4 w-4 text-primary" />
                    Token policy
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Refresh token và access token nên được quản lý từ backend
                    env khi triển khai production.
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-background/60 p-4">
                  <p className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <Bell className="h-4 w-4 text-primary" />
                    Cảnh báo hệ thống
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Bật email alert ở tab Tổng quan để nhận thông báo crawler và
                    AI service lỗi.
                  </p>
                </div>
              </div>
            </AdminCard>
          ) : null}
        </div>
      </div>
    </AdminShell>
  );
}
