import { Link, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CircleAlert,
  FileSearch,
  FileText,
  ListChecks,
  Map,
  MousePointerClick,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  UploadCloud,
  WandSparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState, type ComponentType } from "react";
import { BRAND } from "@/shared/config/brand";
import {
  SCORE_RING_TRACK_COLOR,
  clampScore,
  getScoreColor,
  getScoreLabel,
} from "@/shared/lib/score";
import { useSession } from "@/features/auth/session/session.model";

type SectionNavItem = {
  id: "features" | "how-it-works" | "pricing";
  label: string;
  href: "#features" | "#how-it-works" | "#pricing";
};

type FeatureItem = {
  id: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
};

type StepItem = {
  id: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
};

type PricingItem = {
  id: string;
  name: string;
  badge?: string;
  price: string;
  period?: string;
  description: string;
  cta: string;
  highlighted?: boolean;
  features: string[];
};

const sectionNavItems: SectionNavItem[] = [
  { id: "how-it-works", label: "Cách hoạt động", href: "#how-it-works" },
  { id: "features", label: "Tính năng", href: "#features" },
  { id: "pricing", label: "Bảng giá", href: "#pricing" },
];

const heroHighlights = [
  "So khớp CV với JD",
  "Tìm kỹ năng còn thiếu",
  "Gợi ý lộ trình cải thiện",
];

const features: FeatureItem[] = [
  {
    id: "feature-1",
    icon: FileSearch,
    title: "Phân tích CV theo ngữ cảnh",
    description:
      "Không chỉ đếm từ khóa. NextStepAI đọc hồ sơ, hiểu kinh nghiệm, kỹ năng và cách bạn đang thể hiện năng lực.",
  },
  {
    id: "feature-2",
    icon: Target,
    title: "So khớp với JD mục tiêu",
    description:
      "Đối chiếu CV với mô tả công việc cụ thể để biết phần nào đã khớp, phần nào còn yếu và phần nào nên viết rõ hơn.",
  },
  {
    id: "feature-3",
    icon: ListChecks,
    title: "Tách rõ kỹ năng khớp và thiếu",
    description:
      "Hiển thị nhóm kỹ năng đã có bằng chứng trong CV, kỹ năng còn thiếu và kỹ năng cần bổ sung ví dụ thuyết phục hơn.",
  },
  {
    id: "feature-4",
    icon: WandSparkles,
    title: "Gợi ý cải thiện dễ làm theo",
    description:
      "Nhận đề xuất viết lại nội dung, bổ sung dự án, làm rõ kết quả công việc và tránh các câu chung chung.",
  },
  {
    id: "feature-5",
    icon: Map,
    title: "Lộ trình cải thiện kỹ năng cá nhân hóa",
    description:
      "Từ khoảng trống kỹ năng, hệ thống gợi ý thứ tự học hợp lý để bạn cải thiện hồ sơ thay vì học lan man.",
  },
  {
    id: "feature-6",
    icon: ShieldCheck,
    title: "Báo cáo gọn, rõ việc cần làm",
    description:
      "Mỗi kết quả đều hướng đến câu hỏi: nên sửa gì, vì sao cần sửa và sửa theo hướng nào để tăng cơ hội phỏng vấn.",
  },
];

const steps: StepItem[] = [
  {
    id: "step-1",
    icon: UploadCloud,
    title: "Tải CV lên",
    description:
      "Bắt đầu bằng CV hiện tại của bạn. Hệ thống sẽ trích xuất kỹ năng, kinh nghiệm và điểm nổi bật trong hồ sơ.",
  },
  {
    id: "step-2",
    icon: FileText,
    title: "Chọn hoặc dán JD",
    description:
      "Dùng việc làm có sẵn trong hệ thống hoặc tự dán mô tả công việc bạn muốn ứng tuyển.",
  },
  {
    id: "step-3",
    icon: BarChart3,
    title: "Nhận báo cáo phù hợp",
    description:
      "Xem mức độ phù hợp, kỹ năng còn thiếu, điểm cần viết lại và lộ trình học để cải thiện hồ sơ.",
  },
];

const pricingPlans: PricingItem[] = [
  {
    id: "free",
    name: "Free",
    price: "0đ",
    period: "/tháng",
    description:
      "Phù hợp cho người mới bắt đầu muốn thử nghiệm tính năng cơ bản.",
    cta: "Bắt đầu miễn phí",
    features: [
      "Phân tích CV cơ bản",
      "So khớp với JD giới hạn",
      "Xem nhóm kỹ năng khớp và thiếu",
      "Gợi ý cải thiện tổng quan",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    badge: "Phù hợp nhất",
    price: "Liên hệ",
    description:
      "Dành cho ứng viên đang ứng tuyển nghiêm túc và muốn tối ưu hồ sơ theo từng vị trí.",
    cta: "Nâng cấp Pro",
    highlighted: true,
    features: [
      "Nhiều lượt phân tích CV và JD",
      "Báo cáo Skill Gap chi tiết",
      "Gợi ý viết lại nội dung theo JD",
      "Lộ trình học cá nhân hóa",
      "Lưu lịch sử phân tích",
    ],
  },
  {
    id: "team",
    name: "Team",
    price: "Tùy chỉnh",
    description:
      "Dành cho lớp học, trung tâm đào tạo hoặc nhóm cần hỗ trợ nhiều ứng viên cùng lúc.",
    cta: "Trao đổi nhu cầu",
    features: [
      "Quản lý nhiều tài khoản",
      "Theo dõi tiến độ cải thiện hồ sơ",
      "Báo cáo tổng quan cho quản trị viên",
      "Hỗ trợ tích hợp theo nhu cầu",
    ],
  },
];

function HeroReportPreview() {
  const score = 67;
  const clampedScore = clampScore(score);
  const scoreColor = getScoreColor(clampedScore);
  const matchedSkills = ["HTML", "CSS", "JavaScript", "REST API"];
  const missingSkills = ["React", "Next.js", "Tailwind"];
  const highlightSkills = ["Dự án frontend", "Vai trò cá nhân", "Kết quả UI"];

  const scoreRingBg = `conic-gradient(${scoreColor} ${clampedScore}%, ${SCORE_RING_TRACK_COLOR} ${clampedScore}% 100%)`;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 pb-4">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
          Báo cáo mức độ phù hợp
        </p>
        <h3 className="text-xl font-extrabold tracking-tight text-foreground">
          Frontend Developer Intern
        </h3>
        <p className="mt-1 text-sm font-semibold text-muted-foreground">
          SKYLAB TECHNOLOGY
        </p>

        {/* ScoreCircle */}
        <div className="mt-4 flex items-center gap-4">
          <div className="relative h-24 w-24 shrink-0">
            <div
              className="h-24 w-24 rounded-full"
              style={{ background: scoreRingBg }}
            />
            <div className="absolute inset-[8px] flex flex-col items-center justify-center rounded-full bg-card">
              <span className="text-2xl font-extrabold text-foreground">
                {clampedScore}%
              </span>
              <span className="text-[10px] font-semibold text-muted-foreground">
                độ phù hợp
              </span>
            </div>
          </div>
          <div>
            <span
              className="inline-flex rounded-full border px-3 py-1 text-xs font-bold"
              style={{
                borderColor: `${scoreColor}40`,
                backgroundColor: `${scoreColor}1a`,
                color: scoreColor,
              }}
            >
              {getScoreLabel(clampedScore)}
            </span>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Có nền tảng cơ bản nhưng chưa thể hiện rõ kỹ năng frontend theo
              yêu cầu JD, đặc biệt là kinh nghiệm React, cách xử lý UI và bằng
              chứng dự án thực tế.
            </p>
          </div>
        </div>
      </div>

      {/* SummaryMetrics — 3 card ngang */}
      <div className="grid grid-cols-3 gap-3 px-5 pb-4">
        {[
          {
            label: "Kỹ năng khớp",
            value: matchedSkills.length,
            toneCls: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
            icon: <CheckCircle2 className="h-3.5 w-3.5" />,
          },
          {
            label: "Kỹ năng thiếu",
            value: missingSkills.length,
            toneCls: "border-rose-500/25 bg-rose-500/10 text-rose-700",
            icon: <AlertTriangle className="h-3.5 w-3.5" />,
          },
          {
            label: "Lộ trình",
            value: "8 tuần",
            toneCls: "border-blue-500/25 bg-blue-500/10 text-blue-700",
            icon: <Rocket className="h-3.5 w-3.5" />,
          },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-xl border border-border bg-card p-3 shadow-sm"
          >
            <div className="mb-2 flex items-center justify-between gap-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {m.label}
              </p>
              <span className={`rounded-lg border p-1 ${m.toneCls}`}>
                {m.icon}
              </span>
            </div>
            <p className="text-lg font-extrabold text-foreground">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="border-y border-border bg-background/90 px-4 py-2">
        <div className="flex gap-1.5">
          {["Tổng quan", "Kỹ năng", "Lộ trình"].map((tab, i) => (
            <span
              key={tab}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${i === 1 ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              {tab}
            </span>
          ))}
        </div>
      </div>

      {/* Skills */}
      <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
        <div>
          <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Đã thể hiện
            tốt
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {matchedSkills.map((s) => (
              <span
                key={s}
                className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
        <div>
          <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-foreground">
            <CircleAlert className="h-3.5 w-3.5 text-primary" /> Chưa thể hiện
            rõ
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {missingSkills.map((s) => (
              <span
                key={s}
                className="rounded-full border border-rose-500/25 bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-700 dark:text-rose-300"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
        <div>
          <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-foreground">
            <WandSparkles className="h-3.5 w-3.5 text-primary" /> Cần làm nổi
            bật
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {highlightSkills.map((s) => (
              <span
                key={s}
                className="rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div className="mx-5 mb-5 rounded-2xl bg-primary p-4 text-primary-foreground">
        <p className="mb-1.5 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wide">
          <Sparkles className="h-3 w-3" /> Khuyến nghị
        </p>
        <p className="text-sm font-bold leading-snug">
          Ưu tiên bổ sung dự án React, mô tả rõ vai trò cá nhân và thêm số liệu
          kết quả nếu có.
        </p>
      </div>
    </div>
  );
}

export function HomeLandingWidget() {
  const navigate = useNavigate();
  const { isAuthenticated, isSessionLoading } = useSession();
  const [activeSection, setActiveSection] =
    useState<SectionNavItem["id"]>("how-it-works");

  useEffect(() => {
    const updateActiveSectionFromHash = () => {
      const hash = window.location.hash.replace("#", "");
      const matched = sectionNavItems.find((item) => item.id === hash);
      setActiveSection(matched?.id ?? "how-it-works");
    };

    updateActiveSectionFromHash();
    window.addEventListener("hashchange", updateActiveSectionFromHash);

    return () => {
      window.removeEventListener("hashchange", updateActiveSectionFromHash);
    };
  }, []);

  const handleAnalyzeCV = () => {
    navigate({ to: isAuthenticated ? "/resume-optimizer" : "/login" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 h-16 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-8">
            <Link
              to="/"
              onClick={(event) => {
                if (window.location.pathname === "/") {
                  event.preventDefault();
                  window.scrollTo({
                    top: 0,
                    behavior: "smooth",
                  });
                  window.history.replaceState(null, "", "/");
                  setActiveSection("how-it-works");
                }
              }}
              className="text-xl font-extrabold tracking-tight text-primary"
            >
              {BRAND.name}
            </Link>

            <div className="hidden items-center gap-6 md:flex">
              {sectionNavItems.map((item) => {
                const isActive = activeSection === item.id;

                return (
                  <a
                    key={item.id}
                    href={item.href}
                    onClick={() => setActiveSection(item.id)}
                    className={[
                      "relative pb-1 text-sm transition-colors",
                      isActive
                        ? "font-semibold text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    ].join(" ")}
                  >
                    {item.label}
                    {isActive ? (
                      <motion.div
                        layoutId="navbar-underline"
                        className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-primary"
                      />
                    ) : null}
                  </a>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isSessionLoading ? (
              <button
                type="button"
                aria-disabled="true"
                onClick={(event) => event.preventDefault()}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                Đang tải...
              </button>
            ) : isAuthenticated ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Vào dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-md"
                >
                  Bắt đầu miễn phí
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main>
        <section className="relative overflow-hidden">
          <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 px-4 pt-6 pb-10 sm:px-6 md:pt-8 md:pb-16 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                <Sparkles className="h-4 w-4" />
                Nền tảng tìm việc và phát triển sự nghiệp cho ứng viên IT
              </div>

              <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Biết CV của bạn phù hợp đến đâu
                <span className="text-primary"> trước khi ứng tuyển.</span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                {BRAND.name} giúp bạn so khớp CV với mô tả công việc, phát hiện
                kỹ năng còn thiếu và gợi ý lộ trình cải thiện rõ ràng trước khi
                ứng tuyển.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={handleAnalyzeCV}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl"
                >
                  Phân tích CV miễn phí
                  <ArrowRight className="h-4 w-4" />
                </button>
                <Link
                  to="/jobs"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 py-3.5 text-sm font-bold text-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-muted"
                >
                  <Search className="h-4 w-4" />
                  Xem việc làm phù hợp
                </Link>
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                {heroHighlights.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <HeroReportPreview />
          </div>
        </section>

        <section
          id="how-it-works"
          className="border-y border-border/70 bg-muted/40 py-20"
        >
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
            <div className="mb-12 max-w-2xl">
              <p className="mb-3 text-sm font-bold uppercase tracking-wider text-primary">
                Cách hoạt động
              </p>
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                3 bước để có báo cáo phân tích CV
              </h2>
              <p className="mt-4 text-muted-foreground">
                Từ tải CV, chọn công việc mục tiêu đến nhận báo cáo chi tiết —
                bạn biết chính xác nên sửa gì trước khi ứng tuyển.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {steps.map((step, index) => {
                const Icon = step.icon;

                return (
                  <article
                    key={step.id}
                    className="relative rounded-lg border border-border bg-card p-7 shadow-sm"
                  >
                    <div className="mb-6 flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <span className="text-5xl font-extrabold text-muted">
                        0{index + 1}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold">{step.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                      {step.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="features" className="py-20">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
            <div className="mb-12 max-w-2xl">
              <p className="mb-3 text-sm font-bold uppercase tracking-wider text-primary">
                Tính năng nổi bật
              </p>
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Hiểu hồ sơ để ứng tuyển tốt hơn
              </h2>
              <p className="mt-4 text-muted-foreground">
                Mỗi tính năng đều hướng đến mục tiêu giúp ứng viên biết nên sửa
                gì, vì sao cần sửa và sửa theo hướng nào để tăng cơ hội phỏng
                vấn.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;

                return (
                  <article
                    key={feature.id}
                    className="group rounded-lg border border-border bg-card p-7 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl"
                  >
                    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary">
                      <Icon className="h-6 w-6 text-primary transition-colors group-hover:text-primary-foreground" />
                    </div>
                    <h3 className="text-lg font-bold">{feature.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                      {feature.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-primary px-4 py-16 text-primary-foreground sm:px-6">
          <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div>
              <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">
                Phân tích CV không chỉ là biết điểm số, mà là biết nên sửa gì để
                tăng cơ hội phỏng vấn
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-primary-foreground/80">
                Bạn không chỉ cần biết CV được bao nhiêu điểm. Bạn cần biết nên
                sửa phần nào, thiếu kỹ năng gì và phải làm gì để gần hơn với
                công việc mong muốn.
              </p>
            </div>

            <button
              onClick={handleAnalyzeCV}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary-foreground px-6 py-3.5 text-sm font-bold text-primary shadow-lg transition-all hover:-translate-y-0.5 hover:bg-primary-foreground/90"
            >
              Thử phân tích ngay
              <MousePointerClick className="h-4 w-4" />
            </button>
          </div>
        </section>

        <section id="pricing" className="bg-muted/40 py-20">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
            <div className="mb-12 max-w-2xl">
              <p className="mb-3 text-sm font-bold uppercase tracking-wider text-primary">
                Bảng giá
              </p>
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Lựa chọn gói phù hợp
              </h2>
              <p className="mt-4 text-muted-foreground">
                Dù muốn thử miễn phí, tối ưu theo từng vị trí hay hỗ trợ nhiều
                ứng viên cùng lúc — chúng tôi đều có gói phù hợp.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {pricingPlans.map((plan) => (
                <article
                  key={plan.id}
                  className={[
                    "relative flex flex-col rounded-lg border p-8 shadow-sm",
                    plan.highlighted
                      ? "border-primary bg-card shadow-2xl shadow-primary/10"
                      : "border-border bg-card",
                  ].join(" ")}
                >
                  {plan.badge ? (
                    <span className="absolute -top-4 left-8 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground">
                      {plan.badge}
                    </span>
                  ) : null}

                  <h3 className="text-xl font-extrabold">{plan.name}</h3>
                  <p className="mt-3 min-h-14 text-sm leading-6 text-muted-foreground">
                    {plan.description}
                  </p>

                  <div className="mt-7">
                    <span className="text-4xl font-extrabold">
                      {plan.price}
                    </span>
                    {plan.period ? (
                      <span className="ml-1 text-sm text-muted-foreground">
                        {plan.period}
                      </span>
                    ) : null}
                  </div>

                  <ul className="mt-8 flex-1 space-y-4 text-sm">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-3">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={handleAnalyzeCV}
                    className={[
                      "mt-8 rounded-xl px-5 py-3 text-sm font-bold transition-all",
                      plan.highlighted
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "border border-border bg-background hover:border-primary/40 hover:bg-muted",
                    ].join(" ")}
                  >
                    {plan.cta}
                  </button>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-24 text-center sm:px-6">
          <div className="mx-auto max-w-3xl">
            <FileText className="mx-auto mb-6 h-12 w-12 text-primary" />
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
              Biến mỗi lần phân tích CV thành một bước tiến trong hành trình tìm
              việc.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-muted-foreground">
              Tải CV lên, chọn công việc mục tiêu và xem ngay những điểm cần cải
              thiện để ứng tuyển tự tin hơn.
            </p>
            <button
              onClick={handleAnalyzeCV}
              className="mt-9 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl"
            >
              Phân tích CV miễn phí
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-foreground px-4 py-14 text-background sm:px-6">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <span className="block text-xl font-extrabold">{BRAND.name}</span>
            <p className="mt-4 max-w-sm text-sm leading-7 text-background/70">
              Nền tảng AI giúp ứng viên IT hiểu hồ sơ của mình, so khớp với công
              việc mục tiêu và xây dựng lộ trình cải thiện kỹ năng.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-background/50">
              Sản phẩm
            </h4>
            <ul className="space-y-3 text-sm text-background/70">
              <li>
                <a href="#features" className="hover:text-background">
                  Tính năng
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-background">
                  Cách hoạt động
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-background">
                  Bảng giá
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-background/50">
              Tài khoản
            </h4>
            <ul className="space-y-3 text-sm text-background/70">
              <li>
                <Link to="/login" className="hover:text-background">
                  Đăng nhập
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-background">
                  Đăng ký
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-background">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-background/50">
              Pháp lý
            </h4>
            <ul className="space-y-3 text-sm text-background/70">
              <li>
                <a href="#" className="hover:text-background">
                  Chính sách bảo mật
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-background">
                  Điều khoản sử dụng
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mx-auto mt-10 flex w-full max-w-7xl flex-col justify-between gap-4 border-t border-background/15 pt-6 text-xs text-background/50 sm:flex-row">
          <span>© 2026 {BRAND.name}. Mọi quyền được bảo lưu.</span>
        </div>
      </footer>
    </div>
  );
}
