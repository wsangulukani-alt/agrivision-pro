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

// A deferred putFile lets the test observe the in-flight upload state before
// the upload resolves and the crop is saved.
const upload = vi.hoisted(() => ({
  resolve: null as null | ((value: { hash: string }) => void),
}));

vi.mock("@caffeineai/object-storage", () => ({
  StorageClient: vi.fn().mockImplementation(() => ({
    putFile: vi.fn(
      () =>
        new Promise<{ hash: string }>((resolve) => {
          upload.resolve = resolve;
        }),
    ),
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

describe("CropsPage upload progress", () => {
  it("shows upload progress feedback while replacing a crop image", async () => {
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

    // While the upload is in flight, the page shows progress feedback.
    await waitFor(() => {
      expect(screen.getByText(/Uploading image/)).toBeInTheDocument();
    });

    upload.resolve?.({ hash: "mock-hash" });

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
