import { AppSidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { mockUseInternetIdentity } from "@/test/render";
import { renderWithRouter } from "@/test/render";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("App shell", () => {
  it("groups sidebar navigation by module", async () => {
    mockUseInternetIdentity();
    await renderWithRouter(
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>,
    );

    // Module group labels. Several groups share their label with a nav item
    // (Dashboard, Users, Inventory, Help & Support), so those appear twice and
    // need getAllByText. Agriculture and Sales & Finance are group-only labels.
    expect(screen.getAllByText("Dashboard").length).toBeGreaterThan(0);
    expect(screen.getByText("Agriculture")).toBeInTheDocument();
    expect(screen.getByText("Sales & Finance")).toBeInTheDocument();
    expect(screen.getAllByText("Users").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Inventory").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Help & Support").length).toBeGreaterThan(0);

    // Agriculture module items
    expect(screen.getByText("Farms")).toBeInTheDocument();
    expect(screen.getByText("Crops")).toBeInTheDocument();
    expect(screen.getByText("Crop Productions")).toBeInTheDocument();
    expect(screen.getByText("News Management")).toBeInTheDocument();

    // Sales & Finance module items
    expect(screen.getByText("Sales")).toBeInTheDocument();
    expect(screen.getByText("Payments")).toBeInTheDocument();
    expect(screen.getByText("Reports")).toBeInTheDocument();
    expect(screen.getByText("Sales Reports")).toBeInTheDocument();
  });

  it("shows the Arthur Super Admin profile in the top bar", async () => {
    mockUseInternetIdentity();
    await renderWithRouter(
      <SidebarProvider>
        <TopBar />
      </SidebarProvider>,
    );

    expect(screen.getByText("Arthur")).toBeInTheDocument();
    expect(screen.getByText("Super Admin")).toBeInTheDocument();
    expect(screen.getByText("AgriVision Pro")).toBeInTheDocument();
  });
});
