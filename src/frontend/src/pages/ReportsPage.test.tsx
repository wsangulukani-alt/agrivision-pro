import { ReportsPage } from "@/pages/ReportsPage";
import { createMockActor, sampleReport } from "@/test/mocks";
import { mockUseActor, renderWithClient } from "@/test/render";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

describe("ReportsPage", () => {
  it("renders the report generation form and inventory table", async () => {
    const actor = createMockActor();
    actor.listReports.mockResolvedValue([sampleReport()]);
    mockUseActor(actor);
    renderWithClient(<ReportsPage />);

    expect(screen.getByText("Reports")).toBeInTheDocument();
    // "Generate Report" appears both as a card title and as the submit button.
    expect(screen.getAllByText("Generate Report").length).toBeGreaterThan(0);
    expect(screen.getByText("Report Inventory")).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText("Yield Report — Lilongwe Central Farm"),
      ).toBeInTheDocument();
    });
  });

  it("generates a report and persists it via the actor", async () => {
    const user = userEvent.setup();
    const actor = createMockActor();
    actor.listReports.mockResolvedValue([]);
    actor.addReport.mockResolvedValue(1n);
    mockUseActor(actor);
    renderWithClient(<ReportsPage />);

    await user.type(
      screen.getByLabelText("Location / Farm"),
      "Lilongwe Central Farm",
    );
    await user.click(screen.getByRole("button", { name: "Generate Report" }));

    await waitFor(() => {
      expect(actor.addReport).toHaveBeenCalledTimes(1);
    });
    expect(actor.addReport).toHaveBeenCalledWith(
      expect.objectContaining({
        locationFarm: "Lilongwe Central Farm",
        name: "Yield Report — Lilongwe Central Farm",
      }),
    );
  });
});
