import type { Crop } from "@/backend";
import { CropsPage } from "@/pages/CropsPage";
import { createMockActor } from "@/test/mocks";
import { mockUseActor, renderWithClient } from "@/test/render";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@caffeineai/object-storage", () => ({
  StorageClient: vi.fn().mockImplementation(() => ({
    putFile: vi.fn(async () => ({ hash: "mock-hash" })),
    getDirectURL: vi.fn(async () => "https://cdn.example.com/crop-new.jpg"),
  })),
}));

vi.mock("@icp-sdk/core/agent", () => ({
  HttpAgent: vi.fn().mockImplementation(() => ({
    fetchRootKey: vi.fn(async () => undefined),
  })),
}));

function sampleCrop(overrides: Partial<Crop> = {}): Crop {
  return {
    id: 1n,
    name: "Maize",
    description: "The staple food crop of Malawi.",
    cultivationPractices: "Plant at the onset of the rains.",
    pestsDiseases: "Fall armyworm, maize stalk borer.",
    harvestingYields: "Harvest when cobs are dry.",
    farm: 1n,
    areaHa: 12.5,
    lastHarvest: 1714521600000000000n,
    ...overrides,
  };
}

describe("CropsPage", () => {
  it("renders each crop's name and details from the actor", async () => {
    const actor = createMockActor();
    actor.listCrops.mockResolvedValue([
      sampleCrop({ name: "Maize" }),
      sampleCrop({
        id: 2n,
        name: "Tomatoes",
        description: "A high-value horticultural crop.",
        areaHa: 3.2,
      }),
    ]);
    mockUseActor(actor);
    renderWithClient(<CropsPage />);

    await waitFor(() => {
      expect(screen.getByText("Maize")).toBeInTheDocument();
    });
    expect(screen.getByText("Tomatoes")).toBeInTheDocument();
    expect(
      screen.getByText("The staple food crop of Malawi."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("A high-value horticultural crop."),
    ).toBeInTheDocument();
  });

  it("shows each crop's current image thumbnail alongside its name", async () => {
    const actor = createMockActor();
    actor.listCrops.mockResolvedValue([
      sampleCrop({
        name: "Maize",
        image: "https://cdn.example.com/maize.jpg",
      }),
      sampleCrop({
        id: 2n,
        name: "Tomatoes",
        image: "https://cdn.example.com/tomatoes.jpg",
      }),
    ]);
    mockUseActor(actor);
    renderWithClient(<CropsPage />);

    await waitFor(() => {
      expect(screen.getByText("Maize")).toBeInTheDocument();
    });

    const maizeThumb = screen.getByAltText("Maize");
    expect(maizeThumb).toHaveAttribute(
      "src",
      "https://cdn.example.com/maize.jpg",
    );
    const tomatoThumb = screen.getByAltText("Tomatoes");
    expect(tomatoThumb).toHaveAttribute(
      "src",
      "https://cdn.example.com/tomatoes.jpg",
    );
  });

  it("uploads a replacement crop image and persists it via updateCrop", async () => {
    const user = userEvent.setup();
    const actor = createMockActor();
    actor.listCrops.mockResolvedValue([
      sampleCrop({ name: "Maize", image: "https://cdn.example.com/old.jpg" }),
    ]);
    actor.updateCrop.mockResolvedValue(undefined);
    mockUseActor(actor);
    renderWithClient(<CropsPage />);

    await waitFor(() => {
      expect(screen.getByText("Maize")).toBeInTheDocument();
    });

    const file = new File(["data"], "new-crop.png", { type: "image/png" });
    const input = screen.getByTestId("crops.image_input.maize");
    await user.upload(input, file);

    await waitFor(() => {
      expect(actor.updateCrop).toHaveBeenCalledTimes(1);
    });
    expect(actor.updateCrop).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1n,
        name: "Maize",
        image: "https://cdn.example.com/crop-new.jpg",
      }),
    );
  });
});
