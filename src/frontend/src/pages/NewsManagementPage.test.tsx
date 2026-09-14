import { NewsManagementPage } from "@/pages/NewsManagementPage";
import { createMockActor, sampleArticle } from "@/test/mocks";
import { mockUseActor, renderWithClient } from "@/test/render";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const storage = vi.hoisted(() => ({
  putFile: vi.fn(async () => ({ hash: "mock-hash" })),
}));

vi.mock("@caffeineai/object-storage", () => ({
  StorageClient: vi.fn().mockImplementation(() => ({
    putFile: storage.putFile,
    getDirectURL: vi.fn(async () => "https://cdn.example.com/new-banner.jpg"),
  })),
}));

vi.mock("@icp-sdk/core/agent", () => ({
  HttpAgent: vi.fn().mockImplementation(() => ({
    fetchRootKey: vi.fn(async () => undefined),
  })),
}));

describe("NewsManagementPage", () => {
  it("renders the create article form", () => {
    const actor = createMockActor();
    mockUseActor(actor);
    renderWithClient(<NewsManagementPage />);

    expect(screen.getByText("Create New Article")).toBeInTheDocument();
    expect(screen.getByLabelText("Headline")).toBeInTheDocument();
    expect(screen.getByLabelText("Sub-headline")).toBeInTheDocument();
    expect(screen.getByLabelText("Article Body")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create Article" }),
    ).toBeInTheDocument();
  });

  it("creates a news article when the form is submitted", async () => {
    const user = userEvent.setup();
    const actor = createMockActor();
    actor.createNewsArticle.mockResolvedValue(1n);
    mockUseActor(actor);
    renderWithClient(<NewsManagementPage />);

    await user.type(
      screen.getByLabelText("Headline"),
      "Malawi maize harvest rises",
    );
    await user.type(
      screen.getByLabelText("Article Body"),
      "Farmers report strong yields this season.",
    );

    await user.click(screen.getByRole("button", { name: "Create Article" }));

    await waitFor(() => {
      expect(actor.createNewsArticle).toHaveBeenCalledTimes(1);
    });
    expect(actor.createNewsArticle).toHaveBeenCalledWith(
      expect.objectContaining({
        headline: "Malawi maize harvest rises",
        body: "Farmers report strong yields this season.",
      }),
    );
  });

  it("opens an existing article from the management list into the edit form", async () => {
    const user = userEvent.setup();
    const actor = createMockActor();
    actor.listNewsArticles.mockResolvedValue([
      sampleArticle({
        headline: "Existing headline",
        subHeadline: "Existing sub",
        body: "Existing body text.",
        regionalFocus: "sadc" as never,
        tags: ["maize", "weather"],
        relatedCrops: ["Maize"],
        status: "published" as never,
        bannerImage: "https://cdn.example.com/banner.jpg",
      }),
    ]);
    mockUseActor(actor);
    renderWithClient(<NewsManagementPage />);

    await waitFor(() => {
      expect(screen.getByText("Existing headline")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /Edit/ }));

    expect(screen.getByText("Edit Article")).toBeInTheDocument();
    expect(screen.getByLabelText("Headline")).toHaveValue("Existing headline");
    expect(screen.getByLabelText("Sub-headline")).toHaveValue("Existing sub");
    expect(screen.getByLabelText("Article Body")).toHaveValue(
      "Existing body text.",
    );
    expect(screen.getByLabelText("Tags")).toHaveValue("maize, weather");
    expect(
      screen.getByRole("button", { name: "Save Changes" }),
    ).toBeInTheDocument();
  });

  it("updates an existing article via updateNewsArticle when edited", async () => {
    const user = userEvent.setup();
    const actor = createMockActor();
    actor.listNewsArticles.mockResolvedValue([
      sampleArticle({
        headline: "Old headline",
        body: "Old body.",
        status: "draft" as never,
      }),
    ]);
    actor.updateNewsArticle.mockResolvedValue(
      sampleArticle({ headline: "New headline" }),
    );
    mockUseActor(actor);
    renderWithClient(<NewsManagementPage />);

    await waitFor(() => {
      expect(screen.getByText("Old headline")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /Edit/ }));

    const headline = screen.getByLabelText("Headline");
    await user.clear(headline);
    await user.type(headline, "New headline");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(actor.updateNewsArticle).toHaveBeenCalledTimes(1);
    });
    expect(actor.updateNewsArticle).toHaveBeenCalledWith(
      1n,
      "New headline",
      expect.any(String),
      "Old body.",
      expect.anything(),
      expect.any(Array),
      expect.any(Array),
      expect.anything(),
      null,
      "",
    );
  });

  it("uploads a replacement banner image and saves it with the article", async () => {
    const user = userEvent.setup();
    const actor = createMockActor();
    actor.listNewsArticles.mockResolvedValue([
      sampleArticle({
        headline: "Old headline",
        body: "Old body.",
        status: "draft" as never,
        bannerImage: "https://cdn.example.com/old-banner.jpg",
      }),
    ]);
    actor.updateNewsArticle.mockResolvedValue(
      sampleArticle({ headline: "Old headline" }),
    );
    mockUseActor(actor);
    renderWithClient(<NewsManagementPage />);

    await waitFor(() => {
      expect(screen.getByText("Old headline")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /Edit/ }));

    // Simulate a valid banner image (>= 1600x600) so the dimension
    // validation passes and the upload proceeds.
    const originalImage = globalThis.Image;
    globalThis.Image = class {
      naturalWidth = 1920;
      naturalHeight = 1080;
      onload: (() => void) | null = null;
      set src(_value: string) {
        this.onload?.();
      }
    } as unknown as typeof Image;

    try {
      const file = new File(["data"], "new-banner.png", { type: "image/png" });
      const input = screen.getByTestId("news.banner_input");
      await user.upload(input, file);

      // The upload resolves and sets the new banner URL; the preview shows it.
      await waitFor(() => {
        expect(storage.putFile).toHaveBeenCalledTimes(1);
      });
      await waitFor(() => {
        const preview = document.querySelector(
          'img[src="https://cdn.example.com/new-banner.jpg"]',
        );
        expect(preview).not.toBeNull();
      });

      await user.click(screen.getByRole("button", { name: "Save Changes" }));

      await waitFor(() => {
        expect(actor.updateNewsArticle).toHaveBeenCalledTimes(1);
      });
      expect(actor.updateNewsArticle).toHaveBeenCalledWith(
        1n,
        "Old headline",
        expect.any(String),
        "Old body.",
        expect.anything(),
        expect.any(Array),
        expect.any(Array),
        expect.anything(),
        null,
        "https://cdn.example.com/new-banner.jpg",
      );
    } finally {
      globalThis.Image = originalImage;
    }
  });
});
