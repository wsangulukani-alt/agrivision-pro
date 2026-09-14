import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import type { MockActor } from "./mocks";
import { mockState } from "./setup";

/**
 * Mocks the `useActor` hook from @caffeineai/core-infrastructure so pages
 * receive a typed mock actor instead of a real backend connection.
 */
export function mockUseActor(actor: MockActor) {
  mockState.actor = actor;
}

/**
 * Mocks the `useInternetIdentity` hook so the app shell renders as an
 * authenticated Super Admin session by default.
 */
export function mockUseInternetIdentity(
  overrides: Partial<Record<string, unknown>> = {},
) {
  mockState.identity = overrides;
}

/** Renders a component inside a fresh QueryClientProvider. */
export function renderWithClient(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

/**
 * Renders a component inside a fresh QueryClientProvider and a minimal
 * TanStack Router so components that call `useLocation`, `useNavigate`, or
 * render `<Link>`/`<Navigate>` have a router context. The router is loaded
 * before rendering so the component is present on the first paint.
 */
export async function renderWithRouter(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const rootRoute = createRootRoute({
    component: () => <>{ui}</>,
  });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => <>{ui}</>,
  });
  const routeTree = rootRoute.addChildren([indexRoute]);
  const router = createRouter({ routeTree });
  await router.load();

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}
