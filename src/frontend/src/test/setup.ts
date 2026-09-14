import "@testing-library/jest-dom/vitest";
import { configure } from "@testing-library/react";
import { beforeEach, vi } from "vitest";
import type { MockActor } from "./mocks";

// Generated components use `data-ocid` as their test id attribute.
configure({ testIdAttribute: "data-ocid" });

// Mutable state read by the hoisted mock factory. `vi.hoisted` runs before the
// factory is invoked, so the factory can safely close over these. The mock is
// registered here (in the setup file) so it is applied before any test file
// imports a page component that pulls in @caffeineai/core-infrastructure.
const mockState = vi.hoisted(() => ({
  actor: null as MockActor | null,
  identity: {} as Record<string, unknown>,
}));

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: () => ({ actor: mockState.actor, isFetching: false }),
  useInternetIdentity: () => ({
    isAuthenticated: true,
    isInitializing: false,
    isLoggingIn: false,
    login: vi.fn(),
    clear: vi.fn(),
    identity: { getPrincipal: () => ({ toText: () => "aaaaa-aa" }) },
    ...mockState.identity,
  }),
  loadConfig: vi.fn(async () => ({})),
  InternetIdentityProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}));

export { mockState };

// The mock state is module-level and shared across every test file (the suite
// runs in a single fork), so reset it before each test to prevent one file's
// `mockUseActor`/`mockUseInternetIdentity` overrides from leaking into the next.
beforeEach(() => {
  mockState.actor = null;
  mockState.identity = {};
});

// The WeatherWidget (and pages that embed it) fetch live weather from
// open-meteo.com. Tests must never hit the network, so stub fetch to resolve
// a fixed Lilongwe forecast. Individual tests may override this.
vi.stubGlobal(
  "fetch",
  vi.fn(async () => {
    return {
      ok: true,
      json: async () => ({
        current: {
          temperature_2m: 24,
          relative_humidity_2m: 55,
          wind_speed_10m: 12,
          weather_code: 2,
        },
      }),
    } as unknown as Response;
  }),
);

// `URL.createObjectURL` is used by the news banner upload validation. jsdom
// does not implement it, so provide a no-op that keeps the Image path from
// throwing when a test exercises the form.
if (typeof URL.createObjectURL === "undefined") {
  URL.createObjectURL = vi.fn(() => "blob:mock");
  URL.revokeObjectURL = vi.fn();
}

// The crop and news image upload flows read the selected file's bytes via
// `file.arrayBuffer()`. jsdom's Blob/File does not implement it, so provide a
// polyfill that resolves the file's contents so upload tests can run.
if (typeof File.prototype.arrayBuffer !== "function") {
  File.prototype.arrayBuffer = function arrayBuffer() {
    return new Promise<ArrayBuffer>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.readAsArrayBuffer(this);
    });
  };
}

// recharts' ResponsiveContainer observes its parent with ResizeObserver, which
// jsdom does not implement. Provide a no-op so chart pages render in tests.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

// Radix Select calls `hasPointerCapture` on pointer events; jsdom's synthetic
// elements lack it. Provide a no-op so Radix select interactions do not throw.
if (typeof Element.prototype.hasPointerCapture === "undefined") {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
}

// Radix Select scrolls the highlighted option into view; jsdom does not
// implement `scrollIntoView`. Provide a no-op so select interactions complete.
if (typeof Element.prototype.scrollIntoView === "undefined") {
  Element.prototype.scrollIntoView = () => {};
}
