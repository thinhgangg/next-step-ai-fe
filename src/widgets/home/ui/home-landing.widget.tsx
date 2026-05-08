import { Link, useNavigate } from "@tanstack/react-router";
import {
  CheckCircle2,
  CircleAlert,
  FileText,
  Lightbulb,
  MousePointerClick,
  Search,
  Star,
  WandSparkles,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState, type ComponentType } from "react";
import { BRAND } from "@/shared/config/brand";
import { useSession } from "@/features/auth/session/session.model";
import { ScanWidget } from "./scan-widget";

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

type TestimonialItem = {
  id: string;
  quote: string;
  name: string;
  role: string;
  avatar: string;
};

const features: FeatureItem[] = [
  {
    id: "feature-1",
    icon: Search,
    title: "ATS Keyword Scanner",
    description:
      "Cross-reference your resume against ATS keyword patterns used by modern recruiters.",
  },
  {
    id: "feature-2",
    icon: Zap,
    title: "Match Score",
    description:
      "Get a real-time score that predicts how likely your resume is to pass AI screening.",
  },
  {
    id: "feature-3",
    icon: CircleAlert,
    title: "Missing Skills",
    description:
      "Identify hard and soft skills requested in job descriptions that are missing from your profile.",
  },
  {
    id: "feature-4",
    icon: WandSparkles,
    title: "CV Formatting",
    description:
      "Keep your resume machine-readable with recommendations on spacing, structure, and clarity.",
  },
  {
    id: "feature-5",
    icon: Lightbulb,
    title: "Job-Specific Suggestions",
    description:
      "Receive tailored bullet point suggestions based on the exact role you are applying for.",
  },
  {
    id: "feature-6",
    icon: MousePointerClick,
    title: "One-click Optimizer",
    description:
      "Refine your existing experience statements to align with role keywords and recruiter language.",
  },
];

const testimonials: TestimonialItem[] = [
  {
    id: "testimonial-1",
    quote:
      "After months of rejection, " +
      BRAND.name +
      " showed me the exact skill gaps in my CV. I updated it and quickly got interviews.",
    name: "Alex Rivera",
    role: "Backend Engineer @ Vercel",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80",
  },
  {
    id: "testimonial-2",
    quote:
      "The match score turned job applications into a clear optimization loop. I landed my next PM role faster than expected.",
    name: "Sarah Chen",
    role: "Product Manager @ Stripe",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80",
  },
  {
    id: "testimonial-3",
    quote:
      "Tailored recommendations were practical and specific. It felt like having a focused career coach on demand.",
    name: "Marcus Thorne",
    role: "Marketing Director @ Figma",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=160&q=80",
  },
];

const logos = ["TECHCORP", "NEXUS", "QUANTUM", "ORBIT", "APEX"];

const sectionNavItems: SectionNavItem[] = [
  { id: "how-it-works", label: "How It Works", href: "#how-it-works" },
  { id: "features", label: "Features", href: "#features" },
  { id: "pricing", label: "Pricing", href: "#pricing" },
];

export function HomeLandingWidget() {
  const navigate = useNavigate();
  const { isAuthenticated, isSessionLoading } = useSession();
  const [activeSection, setActiveSection] =
    useState<SectionNavItem["id"]>("how-it-works");
  const [isScanning, setIsScanning] = useState(false);

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

  useEffect(() => {
    if (!isScanning) return;

    const navTimer = window.setTimeout(() => {
      navigate({ to: isAuthenticated ? "/match-report" : "/login" });
    }, 1350);

    return () => {
      window.clearTimeout(navTimer);
    };
  }, [isAuthenticated, isScanning, navigate]);

  const handleAnalyzeCV = () => {
    const scanSection = document.getElementById("how-it-works");
    if (scanSection) {
      scanSection.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    navigate({ to: "/" });
  };

  return (
    <div className="bg-background text-foreground [font-family:'Instrument_Sans',sans-serif]">
      <nav className="sticky top-0 z-50 h-16 border-b border-border bg-card/90 backdrop-blur-md">
        <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="text-lg font-bold text-primary tracking-tight truncate"
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
                        className="absolute bottom-0 left-0 h-0.5 w-full bg-primary"
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
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Go to Dashboard
              </button>
            ) : isAuthenticated ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <span>Go to Dashboard</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90"
                >
                  <span>Try for Free</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <section className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-16 px-4 py-20 sm:px-6 md:py-28 lg:grid-cols-2">
        <div>
          <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Know Exactly Why You&apos;re Getting Rejected
          </h1>
          <p className="mb-10 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            {BRAND.name} uses advanced AI to analyze your resume against
            specific job descriptions. Get a precise match score and instant
            optimization steps to land more interviews.
          </p>

          <div className="flex items-center gap-4">
            <button
              onClick={handleAnalyzeCV}
              className="rounded-lg bg-primary px-7 py-3.5 text-left text-base font-semibold text-primary-foreground transition-all hover:bg-primary/90 sm:text-lg"
            >
              Analyze My CV - It&apos;s Free
            </button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span>No credit card required</span>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-xl border border-border bg-card p-2 shadow-2xl">
            <div className="rounded-lg border border-border/70 bg-background p-6">
              <div className="mb-8 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">
                      Senior Product Designer
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Resume_V4_Final.pdf
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-bold text-foreground">
                    72%
                  </span>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Match Score
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="h-2 overflow-hidden rounded-full bg-border">
                  <div className="h-full w-[72%] bg-primary" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-border/40 bg-card p-4">
                    <p className="mb-1 text-[10px] font-bold uppercase text-muted-foreground">
                      Keywords
                    </p>
                    <p className="text-sm font-semibold">12/15 Found</p>
                  </div>
                  <div className="rounded-lg border border-border/40 bg-card p-4">
                    <p className="mb-1 text-[10px] font-bold uppercase text-muted-foreground">
                      ATS Check
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      Passed
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-muted p-4">
                  <p className="mb-1 text-xs font-semibold text-destructive">
                    Missing Critical Skills:
                  </p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    System Design, Figma Auto-layout, User Research Synthesis.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -right-12 -top-12 -z-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
        </div>
      </section>

      <section className="border-y border-border/40 py-10">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-8 px-4 sm:px-6 md:flex-row">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-0.5 text-muted-foreground">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Trusted by 50,000+ job seekers
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-8 text-lg font-bold tracking-tight text-muted-foreground sm:gap-12">
            {logos.map((logo) => (
              <span key={logo}>{logo}</span>
            ))}
          </div>
        </div>
      </section>

      <ScanWidget
        onScanComplete={() => {
          if (isScanning) return;
          setIsScanning(true);
        }}
        onViewSampleReport={() => navigate({ to: "/sample-report" })}
      />

      <section id="features" className="bg-muted py-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="mb-12">
            <h2 className="mb-4 text-center text-3xl font-bold tracking-tight">
              Built for Performance
            </h2>
            <p className="text-muted-foreground text-center">
              The most powerful toolset for modern job applications.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.id}
                  className="rounded-xl border border-border bg-card p-8 transition-colors hover:border-foreground"
                >
                  <Icon className="mb-6 h-8 w-8 text-primary" />
                  <h4 className="mb-3 text-lg font-bold">{feature.title}</h4>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6">
        <h2 className="mb-14 text-center text-3xl font-bold tracking-tight">
          Success Stories
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <article
              key={testimonial.id}
              className="relative rounded-xl border border-border bg-card p-8"
            >
              <span className="absolute right-8 top-4 text-6xl font-serif leading-none text-muted-foreground/60">
                &quot;
              </span>
              <p className="relative z-10 mb-8 text-sm italic leading-relaxed text-muted-foreground">
                {testimonial.quote}
              </p>
              <div className="flex items-center gap-4">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="h-12 w-12 rounded-full object-cover grayscale"
                />
                <div>
                  <p className="text-sm font-bold">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="pricing" className="bg-foreground py-20 text-background">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="mb-14 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-background">
              Simple, Professional Pricing
            </h2>
            <p className="text-muted-foreground">
              Invest in your career. Get more offers.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <article className="flex flex-col rounded-xl border border-border bg-card p-8 text-foreground">
              <h3 className="mb-2 text-lg font-bold">Free</h3>
              <p className="mb-6 text-sm text-muted-foreground">
                For the occasional seeker.
              </p>
              <p className="mb-8 text-3xl font-bold">
                $0
                <span className="text-sm font-normal text-muted-foreground">
                  {" "}
                  /mo
                </span>
              </p>
              <ul className="mb-10 flex-grow space-y-4 text-sm">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> 5 Resume
                  Scans / Mo
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> Basic
                  Keyword Analysis
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> ATS Checker
                </li>
                <li className="flex items-center gap-3 text-muted-foreground/60 line-through">
                  <CircleAlert className="h-4 w-4" /> AI Bullet Rewriting
                </li>
              </ul>
              <button className="rounded-lg border border-border py-3 text-sm font-bold transition-colors hover:bg-muted">
                Get Started
              </button>
            </article>

            <article className="relative flex scale-[1.01] flex-col rounded-xl border-2 border-foreground bg-card p-8 shadow-2xl text-foreground">
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-primary-foreground">
                Most Popular
              </span>
              <h3 className="mb-2 text-lg font-bold">Pro</h3>
              <p className="mb-6 text-sm text-muted-foreground">
                For the serious candidate.
              </p>
              <p className="mb-8 text-3xl font-bold">
                $19
                <span className="text-sm font-normal text-muted-foreground">
                  {" "}
                  /mo
                </span>
              </p>
              <ul className="mb-10 flex-grow space-y-4 text-sm">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> Unlimited
                  Scans
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> AI
                  Optimization Suite
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> Cover Letter
                  Generator
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> Interview
                  Prep Insights
                </li>
              </ul>
              <button className="rounded-lg bg-primary py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90">
                Go Pro
              </button>
            </article>

            <article className="flex flex-col rounded-xl border border-border bg-card p-8 text-foreground">
              <h3 className="mb-2 text-lg font-bold">Teams</h3>
              <p className="mb-6 text-sm text-muted-foreground">
                For agencies and bootcamps.
              </p>
              <p className="mb-8 text-3xl font-bold">Custom</p>
              <ul className="mb-10 flex-grow space-y-4 text-sm">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> 50+ Seats
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> Admin
                  Dashboard
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> Bulk CV
                  Processing
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> API Access
                </li>
              </ul>
              <button className="rounded-lg border border-border py-3 text-sm font-bold transition-colors hover:bg-muted">
                Contact Sales
              </button>
            </article>
          </div>
        </div>
      </section>

      <section className="bg-background px-4 py-24 text-center sm:px-6 md:py-28">
        <h2 className="mb-8 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          Stop guessing. Start getting interviews.
        </h2>
        <p className="mx-auto mb-12 max-w-xl text-lg text-muted-foreground">
          Join 50,000+ professionals who have optimized their career paths with
          {BRAND.name}.
        </p>
        <button
          onClick={handleAnalyzeCV}
          className="rounded-lg bg-primary px-10 py-4 text-xl font-bold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl"
        >
          Analyze My Resume Now
        </button>
      </section>

      <footer className="border-t border-border bg-background px-4 py-16 sm:px-6">
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-14 grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <span className="mb-4 block text-xl font-bold text-foreground">
                {BRAND.name}
              </span>
              <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                AI-powered resume and job application platform. Precision
                engineered to help you land your dream role.
              </p>
            </div>

            <div>
              <h5 className="mb-6 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Product
              </h5>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li>
                  <a
                    href="#features"
                    className="transition-colors hover:text-foreground"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#how-it-works"
                    className="transition-colors hover:text-foreground"
                  >
                    How It Works
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="transition-colors hover:text-foreground"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="transition-colors hover:text-foreground"
                  >
                    API
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h5 className="mb-6 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Company
              </h5>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li>
                  <a
                    href="#"
                    className="transition-colors hover:text-foreground"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="transition-colors hover:text-foreground"
                  >
                    Careers
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="transition-colors hover:text-foreground"
                  >
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="transition-colors hover:text-foreground"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h5 className="mb-6 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Social
              </h5>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li>
                  <a
                    href="#"
                    className="transition-colors hover:text-foreground"
                  >
                    Twitter
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="transition-colors hover:text-foreground"
                  >
                    LinkedIn
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="transition-colors hover:text-foreground"
                  >
                    GitHub
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
            <span className="text-xs text-muted-foreground">
              © 2026 {BRAND.name}. All rights reserved.
            </span>
            <div className="flex gap-6">
              <a
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                href="#"
              >
                Privacy Policy
              </a>
              <a
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                href="#"
              >
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
