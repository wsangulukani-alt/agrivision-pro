import { CropProductionsPage } from "@/pages/CropProductionsPage";
import { createMockActor, sampleCycle } from "@/test/mocks";
import { mockUseActor, renderWithClient } from "@/test/render";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

describe("CropProductionsPage", () => {
  it("renders the Gantt timeline and production table", async () => {
    const actor = createMockActor();
    actor.listProductionCycles.mockResolvedValue([sampleCycle()]);
    mockUseActor(actor);
    renderWithClient(<CropProductionsPage />);

    expect(screen.getByText("Crop Productions")).toBeInTheDocument();
    expect(screen.getByText("Production Cycle Timeline")).toBeInTheDocument();
    expect(screen.getByText("Crop Production Records")).toBeInTheDocument();

    // "Maize" also appears in the static market prices panel, so wait for the
    // cycle's farm field, which only renders once the production data loads.
    await waitFor(() => {
      expect(screen.getByText("Central Region - Field A")).toBeInTheDocument();
    });
    expect(screen.getAllByText("Maize").length).toBeGreaterThan(0);
  });

  it("adds a production cycle through the form and persists it", async () => {
    const user = userEvent.setup();
    const actor = createMockActor();
    actor.listProductionCycles.mockResolvedValue([]);
    actor.addProductionCycle.mockResolvedValue(2n);
    mockUseActor(actor);
    renderWithClient(<CropProductionsPage />);

    await user.click(
      screen.getByRole("button", { name: /Add Production Cycle/ }),
    );

    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText("Crop"), "Soybeans");
    await user.type(
      within(dialog).getByLabelText("Farm / Field"),
      "Central Region - Field B",
    );
    await user.type(within(dialog).getByLabelText("Area (Ha)"), "20");
    await user.type(within(dialog).getByLabelText("Expected Yield (t)"), "30");
    await user.type(within(dialog).getByLabelText("Start Date"), "2026-01-01");

    await user.click(within(dialog).getByRole("button", { name: "Add Cycle" }));

    await waitFor(() => {
      expect(actor.addProductionCycle).toHaveBeenCalledTimes(1);
    });
    expect(actor.addProductionCycle).toHaveBeenCalledWith(
      expect.objectContaining({
        crop: "Soybeans",
        farmField: "Central Region - Field B",
        areaHa: 20,
        expectedYield: 30,
      }),
    );
  });
});
