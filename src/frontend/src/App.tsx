import { Layout } from "@/components/Layout";
import { CropProductionsPage } from "@/pages/CropProductionsPage";
import { CropsPage } from "@/pages/CropsPage";
import { DashboardPage } from "@/pages/Dashboard";
import { FarmsPage } from "@/pages/FarmsPage";
import { HelpSupportPage } from "@/pages/HelpSupportPage";
import { InventoryPage } from "@/pages/InventoryPage";
import { LoginPage } from "@/pages/Login";
import { NewsManagementPage } from "@/pages/NewsManagementPage";
import { NewsPage } from "@/pages/NewsPage";
import { PaymentsPage } from "@/pages/PaymentsPage";
import { ReportsPage } from "@/pages/ReportsPage";
import { SalesPage } from "@/pages/SalesPage";
import { SalesReportsPage } from "@/pages/SalesReportsPage";
import { UsersPage } from "@/pages/UsersPage";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "layout",
  component: Layout,
});

const indexRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/",
  component: DashboardPage,
});

const farmsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/farms",
  component: FarmsPage,
});

const cropsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/crops",
  component: CropsPage,
});

const cropProductionsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/crop-productions",
  component: CropProductionsPage,
});

const newsManagementRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/news-management",
  component: NewsManagementPage,
});

const newsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/news",
  component: NewsPage,
});

const salesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/sales",
  component: SalesPage,
});

const paymentsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/payments",
  component: PaymentsPage,
});

const reportsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/reports",
  component: ReportsPage,
});

const salesReportsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/sales-reports",
  component: SalesReportsPage,
});

const usersRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/users",
  component: UsersPage,
});

const inventoryRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/inventory",
  component: InventoryPage,
});

const helpRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/help",
  component: HelpSupportPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  layoutRoute.addChildren([
    indexRoute,
    farmsRoute,
    cropsRoute,
    cropProductionsRoute,
    newsManagementRoute,
    newsRoute,
    salesRoute,
    paymentsRoute,
    reportsRoute,
    salesReportsRoute,
    usersRoute,
    inventoryRoute,
    helpRoute,
  ]),
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
