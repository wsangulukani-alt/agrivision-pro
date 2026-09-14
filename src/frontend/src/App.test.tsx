import App from "@/App";
import { createMockActor } from "@/test/mocks";
import {
  mockUseActor,
  mockUseInternetIdentity,
  renderWithClient,
} from "@/test/render";
import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("App shell (full router)", () => {
  it("loads the dashboard on the default route without a blank screen", async () => {
    const actor = createMockActor();
    mockUseActor(actor);
    mockUseInternetIdentity();
    renderWithClient(<App />);

    // The dashboard renders for an authenticated user on the default route.
    await waitFor(() => {
      expect(screen.getByText("Welcome back, Arthur!")).toBeInTheDocument();
    });
  });

  it("shows the AgriVision Pro footer with the exact required copyright line", async () => {
    const actor = createMockActor();
    mockUseActor(actor);
    mockUseInternetIdentity();
    renderWithClient(<App />);

    await waitFor(() => {
      expect(screen.getByText("Welcome back, Arthur!")).toBeInTheDocument();
    });

    expect(
      screen.getByText("Developed by AS developers network @ 2026"),
    ).toBeInTheDocument();
  });
});
