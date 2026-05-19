import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { ActivityDetailPage } from "./pages/ActivityDetailPage";
import { AdminActivitiesPage } from "./pages/AdminActivitiesPage";
import { AdminActivityDetailPage } from "./pages/AdminActivityDetailPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { AdminEnrollmentsPage } from "./pages/AdminEnrollmentsPage";
import { AdminReportsPage } from "./pages/AdminReportsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ExperimentsPage } from "./pages/ExperimentsPage";
import { LogActivityPage } from "./pages/LogActivityPage";
import { LoginPage } from "./pages/LoginPage";
import { ProgramsPage } from "./pages/ProgramsPage";
import { ReportsPage } from "./pages/ReportsPage";
import { RetroCaptureePage } from "./pages/RetroCaptureePage";

const rootRoute = createRootRoute({
  component: Outlet,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: DashboardPage,
});

const logActivityRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/activities/new",
  component: LogActivityPage,
});

const activityDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/activities/$id",
  component: ActivityDetailPage,
});

const retroRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/retro",
  component: RetroCaptureePage,
});

const programsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/programs",
  component: ProgramsPage,
});

const experimentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/experiments",
  component: ExperimentsPage,
});

const reportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reports",
  component: ReportsPage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminDashboardPage,
});

const adminActivitiesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/activities",
  component: AdminActivitiesPage,
});

const adminActivityDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/activities/$id",
  component: AdminActivityDetailPage,
});

const adminEnrollmentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/enrollments",
  component: AdminEnrollmentsPage,
});

const adminReportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/reports",
  component: AdminReportsPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  dashboardRoute,
  logActivityRoute,
  activityDetailRoute,
  retroRoute,
  programsRoute,
  experimentsRoute,
  reportsRoute,
  adminRoute,
  adminActivitiesRoute,
  adminActivityDetailRoute,
  adminEnrollmentsRoute,
  adminReportsRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
