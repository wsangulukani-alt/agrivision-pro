import { FarmsPage } from "@/pages/FarmsPage";
import { createMockActor, sampleFarm } from "@/test/mocks";
import { mockUseActor, renderWithClient } from "@/test/render";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

describe("FarmsPage", () => {
  it("renders the farms data table with farm records", async () => {
    const actor = createMockActor();
    actor.listFarms.mockResolvedValue([sampleFarm()]);
    mockUseActor(actor);
    renderWithClient(<FarmsPage />);

    expect(screen.getByText("Farms")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Add New Farm/ }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Lilongwe Central Estate")).toBeInTheDocument();
    });
    expect(screen.getByText("Grace Banda")).toBeInTheDocument();
    expect(screen.getByText("Lilongwe, Central Region")).toBeInTheDocument();
  });

  it("adds a farm through the form and persists it via the actor", async () => {
    const user = userEvent.setup();
    const actor = createMockActor();
    actor.listFarms.mockResolvedValue([]);
    actor.addFarm.mockResolvedValue(2n);
    mockUseActor(actor);
    renderWithClient(<FarmsPage />);

    await user.click(screen.getByRole("button", { name: /Add New Farm/ }));

    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText("Farm Name"), "Mzuzu Estate");
    await user.type(
      within(dialog).getByLabelText("Location"),
      "Mzuzu, Northern Region",
    );
    await user.type(within(dialog).getByLabelText("Total Area (Ha)"), "85");
    await user.type(within(dialog).getByLabelText("Manager"), "John Phiri");
    await user.type(within(dialog).getByLabelText("Key Crops"), "Maize, Rice");

    await user.click(within(dialog).getByRole("button", { name: "Add Farm" }));

    await waitFor(() => {
      expect(actor.addFarm).toHaveBeenCalledTimes(1);
    });
    expect(actor.addFarm).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Mzuzu Estate",
        location: "Mzuzu, Northern Region",
        totalAreaHa: 85,
        manager: "John Phiri",
        keyCrops: ["Maize", "Rice"],
      }),
    );
  });
});
