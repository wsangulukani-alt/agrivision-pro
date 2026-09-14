import { NewsPage } from "@/pages/NewsPage";
import { createMockActor, sampleArticle } from "@/test/mocks";
import { mockUseActor, renderWithClient } from "@/test/render";
import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("NewsPage", () => {
  it("renders local and global headlines from published articles", async () => {
    const actor = createMockActor();
    actor.listNewsArticles.mockResolvedValue([
      sampleArticle({
        headline: "Malawi maize harvest rises",
        regionalFocus: "malawi" as never,
      }),
      sampleArticle({
        id: 2n,
        headline: "Global fertilizer prices fall",
        regionalFocus: "global" as never,
      }),
    ]);
    mockUseActor(actor);
    renderWithClient(<NewsPage />);

    expect(screen.getByText("News")).toBeInTheDocument();
    expect(screen.getByText("Local & Regional Headlines")).toBeInTheDocument();
    expect(
      screen.getByText("Global Market & Tech Updates"),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText("Malawi maize harvest rises"),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText("Global fertilizer prices fall"),
    ).toBeInTheDocument();
  });

  it("does not show draft articles as headlines", async () => {
    const actor = createMockActor();
    actor.listNewsArticles.mockResolvedValue([
      sampleArticle({ headline: "Draft article", status: "draft" as never }),
    ]);
    mockUseActor(actor);
    renderWithClient(<NewsPage />);

    await waitFor(() => {
      expect(screen.getByText("No local headlines found")).toBeInTheDocument();
    });
    expect(screen.queryByText("Draft article")).not.toBeInTheDocument();
  });

  it("renders the banner image of a published article", async () => {
    const actor = createMockActor();
    actor.listNewsArticles.mockResolvedValue([
      sampleArticle({
        headline: "Maize prices steady",
        bannerImage: "https://cdn.example.com/banner-maize.jpg",
      }),
    ]);
    mockUseActor(actor);
    renderWithClient(<NewsPage />);

    await waitFor(() => {
      expect(screen.getByText("Maize prices steady")).toBeInTheDocument();
    });
    const banner = screen.getByAltText("Maize prices steady");
    expect(banner).toHaveAttribute(
      "src",
      "https://cdn.example.com/banner-maize.jpg",
    );
  });
});
