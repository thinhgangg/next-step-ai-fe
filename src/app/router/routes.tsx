// src/app/router/routes.tsx
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./root";
import { LoginPage } from "@/pages/login/login.page";
import { RegisterPage } from "@/pages/register/register.page";
import { HomePage } from "@/pages/home/home.page";
import { ForgotPasswordPage } from "@/pages/forgot-password/forgot-password.page";
import { DashboardPage } from "@/pages/dashboard/dashboard.page";
import { ResumeOptimizerPage } from "@/pages/resume-optimizer/resume-optimizer.page";
import { ResumeManagerPage } from "@/pages/resume-manager/resume-manager.page";
import { JobsPage } from "@/pages/jobs/jobs.page";
import { ScanHistoryPage } from "@/pages/scan-history/scan-history.page";
import { MatchReportPage } from "@/pages/match-report/match-report.page";
import { SampleReportPage } from "@/pages/sample-report/sample-report.page";
import { GoogleCallbackPage } from "@/pages/google-callback/google-callback.page";
import { Protected } from "./protected";

export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

export const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: RegisterPage,
});

export const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/forgot-password",
  component: ForgotPasswordPage,
});

export const googleCallbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auth/callback",
  component: GoogleCallbackPage,
});

export const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

export const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: () => (
    <Protected>
      <DashboardPage />
    </Protected>
  ),
});

export const resumeOptimizerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/resume-optimizer",
  component: () => (
    <Protected>
      <ResumeOptimizerPage />
    </Protected>
  ),
});

export const resumeManagerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/resume-manager",
  component: () => (
    <Protected>
      <ResumeManagerPage />
    </Protected>
  ),
});

export const jobsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/jobs",
  component: () => (
    <Protected>
      <JobsPage />
    </Protected>
  ),
});

export const scanHistoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/scan-history",
  component: () => (
    <Protected>
      <ScanHistoryPage />
    </Protected>
  ),
});

export const matchReportRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/match-report",
  component: () => (
    <Protected>
      <MatchReportPage />
    </Protected>
  ),
});

export const sampleReportRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sample-report",
  component: () => (
    <Protected>
      <SampleReportPage />
    </Protected>
  ),
});
