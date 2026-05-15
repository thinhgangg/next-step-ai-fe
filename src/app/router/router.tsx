import { createRouter } from "@tanstack/react-router";
import { rootRoute } from "./root";
import {
  loginRoute,
  registerRoute,
  forgotPasswordRoute,
  googleCallbackRoute,
  homeRoute,
  dashboardRoute,
  resumeOptimizerRoute,
  resumeManagerRoute,
  jobsRoute,
  scanHistoryRoute,
  matchReportRoute,
  sampleReportRoute,
  profileRoute,
  settingsRoute,
} from "./routes";

// Add the current app routes to the root route tree.
const routeTree = rootRoute.addChildren([
  homeRoute,
  dashboardRoute,
  resumeOptimizerRoute,
  resumeManagerRoute,
  jobsRoute,
  scanHistoryRoute,
  matchReportRoute,
  sampleReportRoute,
  loginRoute,
  registerRoute,
  forgotPasswordRoute,
  googleCallbackRoute,
  profileRoute,
  settingsRoute,
]);

export const router = createRouter({
  routeTree,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
