import {
  type Crop,
  type Farm,
  FarmStatus,
  type InventoryItem,
  InventoryStatus,
  type Payment,
  PaymentStatus,
  type ProductionCycle,
  type Sale,
  Stage,
} from "@/backend";
import { DashboardPage } from "@/pages/Dashboard";
import { createMockActor } from "@/test/mocks";
import { mockUseActor, renderWithClient } from "@/test/render";
import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("DashboardPage", () => {
  it("renders the welcome header and all five KPI cards", () => {
    renderWithClient(<DashboardPage />);

    expect(screen.getByText("Welcome back, Arthur!")).toBeInTheDocument();

    // Five KPI cards
    expect(screen.getByText("Total Farms")).toBeInTheDocument();
    expect(screen.getByText("Active Crops")).toBeInTheDocument();
    expect(screen.getByText("Monthly Sales")).toBeInTheDocument();
    expect(screen.getByText("Pending Payments")).toBeInTheDocument();
    expect(screen.getByText("Inventory Items")).toBeInTheDocument();
  });

  it("renders Production Overview, Top Crops, Recent Activities and Inventory Status", () => {
    renderWithClient(<DashboardPage />);

    expect(screen.getByText("Production Overview")).toBeInTheDocument();
    expect(screen.getByText("Top Crops")).toBeInTheDocument();
    expect(screen.getByText("Recent Activities")).toBeInTheDocument();
    expect(screen.getByText("Inventory Status")).toBeInTheDocument();
  });

  it("shows empty states when the backend returns no data", async () => {
    // The default mock actor returns empty arrays for every list, so the
    // dashboard must render its empty states rather than hardcoded sample rows.
    renderWithClient(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("No production data yet")).toBeInTheDocument();
    });
    expect(screen.getByText("No crops registered")).toBeInTheDocument();
    expect(screen.getByText("No recent activity")).toBeInTheDocument();
    expect(screen.getByText("No inventory items")).toBeInTheDocument();
  });

  it("derives KPIs, top crops, recent activities and inventory from backend data", async () => {
    const farms: Farm[] = [
      {
        id: 1n,
        name: "Green Valley Farm",
        location: "Lilongwe",
        totalAreaHa: 100,
        manager: "Grace",
        keyCrops: ["Maize"],
        status: FarmStatus.active,
      },
    ];
    const crops: Crop[] = [
      {
        id: 1n,
        name: "Maize",
        farm: 1n,
        areaHa: 50,
        description: "",
        cultivationPractices: "",
        harvestingYields: "",
        pestsDiseases: "",
      },
      {
        id: 2n,
        name: "Soybeans",
        farm: 1n,
        areaHa: 30,
        description: "",
        cultivationPractices: "",
        harvestingYields: "",
        pestsDiseases: "",
      },
    ];
    const sales: Sale[] = [
      {
        id: 1n,
        crop: "Maize",
        farm: "Green Valley Farm",
        buyer: "Co-op",
        quantity: 100,
        unitPrice: 450,
        totalAmount: 45000,
        date: BigInt(Date.now()) * 1_000_000n,
      },
    ];
    const payments: Payment[] = [
      {
        id: 1n,
        amount: 1000,
        status: PaymentStatus.pending,
        date: BigInt(Date.now()) * 1_000_000n,
        description: "Pending",
      },
    ];
    const cycles: ProductionCycle[] = [
      {
        id: 1n,
        crop: "Maize",
        farmField: "Field A",
        stage: Stage.growing,
        status: "active",
        areaHa: 12,
        expectedYield: 45,
        startDate: BigInt(Date.now()) * 1_000_000n,
      },
    ];
    const inventory: InventoryItem[] = [
      {
        id: 1n,
        name: "Fertilizer",
        quantity: 120,
        unit: "bags",
        status: InventoryStatus.inStock,
        threshold: 20,
      },
    ];

    const actor = createMockActor();
    actor.listFarms.mockResolvedValue(farms);
    actor.listCrops.mockResolvedValue(crops);
    actor.listSales.mockResolvedValue(sales);
    actor.listPayments.mockResolvedValue(payments);
    actor.listProductionCycles.mockResolvedValue(cycles);
    actor.listInventoryItems.mockResolvedValue(inventory);
    actor.listNewsArticles.mockResolvedValue([]);
    actor.listSupportRequests.mockResolvedValue([]);
    mockUseActor(actor);

    renderWithClient(<DashboardPage />);

    // KPIs derive from the backend data. "1" appears in three KPI cards
    // (Total Farms, Pending Payments, Inventory Items), "2" in Active Crops.
    await waitFor(() => {
      expect(screen.getAllByText("1").length).toBe(3);
    });
    expect(screen.getByText("MWK 45,000")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();

    // Top crops come from the crops list (Maize has the larger area). The crop
    // names also appear in the Market Prices feed and activity rows, so assert
    // at least one occurrence each.
    expect(screen.getAllByText("Maize").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Soybeans").length).toBeGreaterThan(0);

    // Recent activities derive from sales and production cycles.
    expect(
      screen.getByText("Sale of 100 kg Maize to Co-op"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Production cycle started for Maize (12 ha)"),
    ).toBeInTheDocument();

    // Inventory status derives from the inventory items.
    expect(screen.getByText("Fertilizer")).toBeInTheDocument();
    expect(screen.getByText("120 bags")).toBeInTheDocument();
    expect(screen.getByText("In stock")).toBeInTheDocument();

    // The actor's list methods were actually consulted.
    expect(actor.listFarms).toHaveBeenCalled();
    expect(actor.listCrops).toHaveBeenCalled();
    expect(actor.listSales).toHaveBeenCalled();
    expect(actor.listPayments).toHaveBeenCalled();
    expect(actor.listProductionCycles).toHaveBeenCalled();
    expect(actor.listInventoryItems).toHaveBeenCalled();
  });

  it("shows loading skeletons while the backend data is pending", async () => {
    // Keep the farms query pending so the dashboard stays in its loading state.
    const actor = createMockActor();
    actor.listFarms.mockReturnValue(new Promise<Farm[]>(() => {}));
    mockUseActor(actor);

    renderWithClient(<DashboardPage />);

    await waitFor(() => {
      expect(
        screen.getByTestId("dashboard.production_loading"),
      ).toBeInTheDocument();
    });
    expect(screen.getByTestId("dashboard.crops_loading")).toBeInTheDocument();
    expect(
      screen.getByTestId("dashboard.activities_loading"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("dashboard.inventory_loading"),
    ).toBeInTheDocument();
    expect(actor.listFarms).toHaveBeenCalled();
  });

  it("shows a Weather Update for Lilongwe, Malawi", async () => {
    renderWithClient(<DashboardPage />);

    expect(screen.getByText("Weather Update")).toBeInTheDocument();

    // The mocked fetch resolves a fixed forecast.
    await waitFor(() => {
      expect(screen.getByText("Lilongwe, Malawi")).toBeInTheDocument();
    });
    expect(screen.getByText("24°C")).toBeInTheDocument();
  });

  it("renders the Market Prices feed and the Seasonal Outlook panel", () => {
    renderWithClient(<DashboardPage />);

    // Market prices section title and the Seasonal Outlook panel are structural
    // elements that remain regardless of where the underlying data comes from.
    expect(screen.getByText("Market Prices")).toBeInTheDocument();
    expect(screen.getByText("Seasonal Outlook")).toBeInTheDocument();
    expect(screen.getByText("Planting season underway")).toBeInTheDocument();
    expect(screen.getByText("Irrigation advisory")).toBeInTheDocument();
  });

  it("renders the AgriVision Pro hero banner", () => {
    renderWithClient(<DashboardPage />);

    expect(screen.getByText("AgriVision Pro")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Here's what's happening across your farms and operations today.",
      ),
    ).toBeInTheDocument();
  });
});
