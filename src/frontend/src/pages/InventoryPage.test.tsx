import { InventoryPage } from "@/pages/InventoryPage";
import { createMockActor, sampleInventoryItem } from "@/test/mocks";
import { mockUseActor, renderWithClient } from "@/test/render";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

describe("InventoryPage", () => {
  it("renders inventory items with their status", async () => {
    const actor = createMockActor();
    actor.listInventoryItems.mockResolvedValue([
      sampleInventoryItem({
        name: "Fertilizer (NPK)",
        quantity: 120,
        status: "inStock" as never,
      }),
      sampleInventoryItem({
        id: 2n,
        name: "Maize Seed",
        quantity: 45,
        status: "lowStock" as never,
      }),
    ]);
    mockUseActor(actor);
    renderWithClient(<InventoryPage />);

    expect(screen.getByText("Inventory")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Fertilizer (NPK)")).toBeInTheDocument();
    });
    expect(screen.getByText("Maize Seed")).toBeInTheDocument();
    // "In Stock" appears both as a KPI card label and as a status badge.
    expect(screen.getAllByText("In Stock").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Low Stock").length).toBeGreaterThan(0);
  });

  it("adds an inventory item through the form", async () => {
    const user = userEvent.setup();
    const actor = createMockActor();
    actor.listInventoryItems.mockResolvedValue([]);
    actor.addInventoryItem.mockResolvedValue(1n);
    mockUseActor(actor);
    renderWithClient(<InventoryPage />);

    await user.type(screen.getByLabelText("Item name"), "Pesticide");
    await user.type(screen.getByLabelText("Quantity"), "18");
    await user.type(screen.getByLabelText("Reorder threshold"), "5");

    await user.click(screen.getByRole("button", { name: "Add Item" }));

    await waitFor(() => {
      expect(actor.addInventoryItem).toHaveBeenCalledTimes(1);
    });
    expect(actor.addInventoryItem).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Pesticide",
        quantity: 18,
        threshold: 5,
      }),
    );
  });
});
