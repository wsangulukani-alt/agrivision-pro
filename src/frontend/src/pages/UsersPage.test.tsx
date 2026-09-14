import { UsersPage } from "@/pages/UsersPage";
import { createMockActor } from "@/test/mocks";
import {
  mockUseActor,
  mockUseInternetIdentity,
  renderWithClient,
} from "@/test/render";
import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("UsersPage", () => {
  it("shows the platform users table and access management for an admin", async () => {
    const actor = createMockActor();
    actor.isCallerAdmin.mockResolvedValue(true);
    actor.getCallerUserRole.mockResolvedValue("admin" as never);
    mockUseActor(actor);
    mockUseInternetIdentity();
    renderWithClient(<UsersPage />);

    // The page renders a skeleton while the admin/role queries load.
    await waitFor(() => {
      expect(screen.getByText("Users")).toBeInTheDocument();
    });
    expect(screen.getByText("Platform users")).toBeInTheDocument();
    expect(screen.getByText("Access management")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Admin")).toBeInTheDocument();
    });
  });

  it("shows an access-denied state for a non-admin", async () => {
    const actor = createMockActor();
    actor.isCallerAdmin.mockResolvedValue(false);
    mockUseActor(actor);
    mockUseInternetIdentity();
    renderWithClient(<UsersPage />);

    await waitFor(() => {
      expect(
        screen.getByText("Super Admin access required"),
      ).toBeInTheDocument();
    });
  });
});
