import { SalesPage } from "@/pages/SalesPage";
import { createMockActor, sampleSale } from "@/test/mocks";
import { mockUseActor, renderWithClient } from "@/test/render";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

describe("SalesPage", () => {
  it("displays monetary values in MWK", async () => {
    const actor = createMockActor();
    actor.listSales.mockResolvedValue([
      sampleSale({ totalAmount: 45000, unitPrice: 450 }),
    ]);
    mockUseActor(actor);
    renderWithClient(<SalesPage />);

    await waitFor(() => {
      // The total appears in both the Total Revenue KPI card and the table.
      expect(screen.getAllByText("MWK 45,000").length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText("MWK 450").length).toBeGreaterThan(0);
  });

  it("records a sale and persists it via the actor", async () => {
    const user = userEvent.setup();
    const actor = createMockActor();
    actor.listSales.mockResolvedValue([]);
    actor.addSale.mockResolvedValue(1n);
    mockUseActor(actor);
    renderWithClient(<SalesPage />);

    await user.type(screen.getByLabelText("Crop"), "Maize");
    await user.type(screen.getByLabelText("Farm"), "Lilongwe Farm");
    await user.type(screen.getByLabelText("Quantity (kg)"), "100");
    await user.type(screen.getByLabelText("Unit Price (MWK)"), "450");
    await user.type(screen.getByLabelText("Buyer"), "GreenFields Co-op");

    await user.click(screen.getByRole("button", { name: "Record Sale" }));

    await waitFor(() => {
      expect(actor.addSale).toHaveBeenCalledTimes(1);
    });
    expect(actor.addSale).toHaveBeenCalledWith(
      expect.objectContaining({
        crop: "Maize",
        farm: "Lilongwe Farm",
        quantity: 100,
        unitPrice: 450,
        totalAmount: 45000,
        buyer: "GreenFields Co-op",
      }),
    );
  });
});
