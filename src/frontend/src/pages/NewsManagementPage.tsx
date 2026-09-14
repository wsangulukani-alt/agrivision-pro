import {
  ArticleStatus,
  type NewsArticle,
  RegionalFocus,
  createActor,
} from "@/backend";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  useCrops,
  useNewsArticles,
  useUpdateNewsArticle,
} from "@/hooks/useQueries";
import { loadConfig, useActor } from "@caffeineai/core-infrastructure";
import { StorageClient } from "@caffeineai/object-storage";
import { HttpAgent } from "@icp-sdk/core/agent";
import { useMutation } from "@tanstack/react-query";
import {
  CalendarDays,
  ImageUp,
  Loader2,
  Newspaper,
  Pencil,
  Plus,
  Save,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const MIN_BANNER_WIDTH = 1600;
const MIN_BANNER_HEIGHT = 600;

const REGIONAL_FOCUS_OPTIONS: { value: RegionalFocus; label: string }[] = [
  { value: RegionalFocus.malawi, label: "Malawi" },
  { value: RegionalFocus.sadc, label: "SADC" },
  { value: RegionalFocus.global, label: "Global" },
];

const STATUS_OPTIONS: { value: ArticleStatus; label: string }[] = [
  { value: ArticleStatus.draft, label: "Draft" },
  { value: ArticleStatus.pendingReview, label: "Pending Review" },
  { value: ArticleStatus.published, label: "Published" },
];

const STATUS_LABELS: Record<ArticleStatus, string> = {
  [ArticleStatus.draft]: "Draft",
  [ArticleStatus.pendingReview]: "Pending Review",
  [ArticleStatus.published]: "Published",
};

/** Convert a Date to Motoko nanosecond bigint. */
function dateToNs(date: Date): bigint {
  return BigInt(date.getTime()) * 1_000_000n;
}

/** Convert a backend nanosecond timestamp to a Date, or null when invalid. */
function timestampToDate(timestamp: bigint): Date | null {
  const date = new Date(Number(timestamp / 1_000_000n));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Validate that an image meets the minimum banner dimensions. */
function validateBannerDimensions(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(
        img.naturalWidth >= MIN_BANNER_WIDTH &&
          img.naturalHeight >= MIN_BANNER_HEIGHT,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(false);
    };
    img.src = url;
  });
}

function regionLabel(region: RegionalFocus): string {
  return (
    REGIONAL_FOCUS_OPTIONS.find((option) => option.value === region)?.label ??
    region
  );
}

function formatDate(timestamp: bigint): string {
  const date = timestampToDate(timestamp);
  if (!date) return "Date unavailable";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function NewsManagementPage() {
  const { actor } = useActor(createActor);
  const { data: crops = [] } = useCrops();
  const { data: articles = [], isLoading: articlesLoading } = useNewsArticles();

  const [editingId, setEditingId] = useState<bigint | null>(null);

  const [headline, setHeadline] = useState("");
  const [subHeadline, setSubHeadline] = useState("");
  const [regionalFocus, setRegionalFocus] = useState<RegionalFocus>(
    RegionalFocus.malawi,
  );
  const [body, setBody] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [relatedCrops, setRelatedCrops] = useState<string[]>([]);
  const [status, setStatus] = useState<ArticleStatus>(ArticleStatus.draft);
  const [scheduledDate, setScheduledDate] = useState("");
  const [featured, setFeatured] = useState(false);

  const [bannerUrl, setBannerUrl] = useState("");
  const [bannerName, setBannerName] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const tags = useMemo(
    () =>
      tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    [tagsInput],
  );

  const cropOptions = useMemo(
    () =>
      crops
        .map((crop) => crop.name)
        .filter((name, i, arr) => arr.indexOf(name) === i),
    [crops],
  );

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Backend is not ready");
      const article = {
        id: 0n,
        status,
        featuredOnPage: featured ? ["home"] : [],
        body,
        headline,
        createdAt: dateToNs(new Date()),
        regionalFocus,
        tags,
        relatedCrops,
        scheduledPublishDate: scheduledDate
          ? dateToNs(new Date(`${scheduledDate}T00:00:00`))
          : undefined,
        subHeadline,
        bannerImage: bannerUrl,
      };
      return actor.createNewsArticle(article);
    },
    onSuccess: () => {
      toast.success("Article created successfully");
      resetForm();
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to create article",
      );
    },
  });

  const updateMutation = useUpdateNewsArticle();

  const handleBannerUpload = async (file: File) => {
    const valid = await validateBannerDimensions(file);
    if (!valid) {
      toast.error(
        `Banner must be at least ${MIN_BANNER_WIDTH}×${MIN_BANNER_HEIGHT}px. Please upload a larger image.`,
      );
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    try {
      const config = await loadConfig();
      const agent = new HttpAgent({ host: config.backend_host });
      if (config.backend_host?.includes("localhost")) {
        await agent.fetchRootKey().catch(() => undefined);
      }
      const storageClient = new StorageClient(
        config.bucket_name,
        config.storage_gateway_url,
        config.backend_canister_id,
        config.project_id,
        agent,
      );
      const bytes = new Uint8Array(await file.arrayBuffer());
      const { hash } = await storageClient.putFile(
        bytes,
        (percentage) => setUploadProgress(percentage),
        file.type,
        file.name,
      );
      const url = await storageClient.getDirectURL(hash);
      setBannerUrl(url);
      setBannerName(file.name);
      toast.success("Banner uploaded successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Banner upload failed",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setHeadline("");
    setSubHeadline("");
    setRegionalFocus(RegionalFocus.malawi);
    setBody("");
    setTagsInput("");
    setRelatedCrops([]);
    setStatus(ArticleStatus.draft);
    setScheduledDate("");
    setFeatured(false);
    setBannerUrl("");
    setBannerName("");
    setUploadProgress(0);
  };

  const startEdit = (article: NewsArticle) => {
    setEditingId(article.id);
    setHeadline(article.headline);
    setSubHeadline(article.subHeadline);
    setRegionalFocus(article.regionalFocus);
    setBody(article.body);
    setTagsInput(article.tags.join(", "));
    setRelatedCrops(article.relatedCrops);
    setStatus(article.status);
    setFeatured(article.featuredOnPage.includes("home"));
    const scheduled = article.scheduledPublishDate
      ? timestampToDate(article.scheduledPublishDate)
      : null;
    setScheduledDate(
      scheduled
        ? `${scheduled.getFullYear()}-${String(scheduled.getMonth() + 1).padStart(2, "0")}-${String(scheduled.getDate()).padStart(2, "0")}`
        : "",
    );
    setBannerUrl(article.bannerImage);
    setBannerName("");
    setUploadProgress(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = () => {
    if (!headline.trim()) {
      toast.error("Headline is required");
      return;
    }
    if (!body.trim()) {
      toast.error("Article body is required");
      return;
    }
    const scheduledNs = scheduledDate
      ? dateToNs(new Date(`${scheduledDate}T00:00:00`))
      : null;

    if (editingId !== null) {
      updateMutation.mutate(
        {
          id: editingId,
          headline,
          subHeadline,
          body,
          regionalFocus,
          relatedCrops,
          tags,
          status,
          scheduledPublishDate: scheduledNs,
          bannerImage: bannerUrl,
        },
        {
          onSuccess: () => {
            toast.success("Article updated successfully");
            resetForm();
          },
          onError: (error: unknown) => {
            toast.error(
              error instanceof Error
                ? error.message
                : "Failed to update article",
            );
          },
        },
      );
      return;
    }

    createMutation.mutate();
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={editingId !== null ? "Edit Article" : "Create New Article"}
        description={
          editingId !== null
            ? "Update the content, settings, and banner image of an existing article."
            : "Compose and publish agricultural news for the AgriVision Pro community."
        }
        actions={
          editingId !== null ? (
            <Button
              type="button"
              variant="outline"
              data-ocid="news.cancel_edit_button"
              onClick={resetForm}
            >
              <Plus className="mr-2 size-4" />
              New Article
            </Button>
          ) : null
        }
      />

      {/* Existing articles management list */}
      <Card data-ocid="news.management_list_card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="size-5 text-primary" />
            Manage Articles
          </CardTitle>
          <CardDescription>
            Select an article to edit its content, settings, and banner image.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {articlesLoading ? (
            <div
              data-ocid="news.management_loading_state"
              className="flex flex-col gap-3"
            >
              {Array.from({ length: 3 }, (_, i) => `skeleton-${i}`).map(
                (id) => (
                  <div
                    key={id}
                    className="h-16 animate-pulse rounded-lg border border-border bg-muted"
                  />
                ),
              )}
            </div>
          ) : articles.length > 0 ? (
            <ul
              data-ocid="news.management_list"
              className="flex flex-col gap-3"
            >
              {articles.map((article, index) => (
                <li
                  key={article.id.toString()}
                  data-ocid={`news.management_item.${index + 1}`}
                  className="flex items-center gap-4 rounded-lg border border-border bg-muted/30 p-3"
                >
                  <div className="h-14 w-20 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                    {article.bannerImage ? (
                      <img
                        src={article.bannerImage}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-muted-foreground">
                        <Newspaper className="size-5" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm font-semibold text-foreground">
                      {article.headline}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary">
                        {regionLabel(article.regionalFocus)}
                      </Badge>
                      <Badge variant="outline">
                        {STATUS_LABELS[article.status]}
                      </Badge>
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="size-3" />
                        {formatDate(article.createdAt)}
                      </span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    data-ocid={`news.edit_button.${index + 1}`}
                    onClick={() => startEdit(article)}
                  >
                    <Pencil className="mr-2 size-4" />
                    Edit
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <div
              data-ocid="news.management_empty_state"
              className="flex flex-col items-center gap-3 py-10 text-center"
            >
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Newspaper className="size-6" />
              </div>
              <p className="font-display text-base font-semibold text-foreground">
                No articles yet
              </p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Create your first article below to start publishing agricultural
                news.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card data-ocid="news.content_card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Newspaper className="size-5 text-primary" />
                Article Content
              </CardTitle>
              <CardDescription>
                Write the headline, sub-headline, and full body of the article.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="headline">Headline</Label>
                <Input
                  id="headline"
                  data-ocid="news.headline_input"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Malawi maize harvest expected to rise 12% this season"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="subHeadline">Sub-headline</Label>
                <Input
                  id="subHeadline"
                  data-ocid="news.sub_headline_input"
                  value={subHeadline}
                  onChange={(e) => setSubHeadline(e.target.value)}
                  placeholder="A short supporting line shown under the headline"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="body">Article Body</Label>
                <Textarea
                  id="body"
                  data-ocid="news.body_textarea"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write the full article content here. Use paragraphs to structure the story."
                  className="min-h-56"
                />
              </div>
            </CardContent>
          </Card>

          <Card data-ocid="news.banner_card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageUp className="size-5 text-primary" />
                Banner Image
              </CardTitle>
              <CardDescription>
                Upload a wide banner image. Minimum {MIN_BANNER_WIDTH}×
                {MIN_BANNER_HEIGHT}px.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <label
                data-ocid="news.banner_dropzone"
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input bg-muted/40 px-6 py-10 text-center transition-colors hover:border-primary hover:bg-muted/60"
              >
                <ImageUp className="size-8 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  {bannerName || "Click to choose a banner image"}
                </span>
                <span className="text-xs text-muted-foreground">
                  PNG, JPG or WebP · at least {MIN_BANNER_WIDTH}×
                  {MIN_BANNER_HEIGHT}px
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  data-ocid="news.banner_input"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleBannerUpload(file);
                    e.target.value = "";
                  }}
                />
              </label>

              {isUploading ? (
                <div className="flex flex-col gap-2">
                  <Progress
                    value={uploadProgress}
                    data-ocid="news.upload_progress"
                  />
                  <p className="text-xs text-muted-foreground">
                    Uploading banner… {Math.round(uploadProgress)}%
                  </p>
                </div>
              ) : null}

              {bannerUrl && !isUploading ? (
                <div className="overflow-hidden rounded-lg border border-border">
                  <img
                    src={bannerUrl}
                    alt={bannerName || "Article banner"}
                    className="aspect-[8/3] w-full object-cover"
                  />
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card data-ocid="news.settings_card">
            <CardHeader>
              <CardTitle>Publishing Settings</CardTitle>
              <CardDescription>
                Configure regional focus, workflow, and scheduling.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="regionalFocus">Regional Focus</Label>
                <Select
                  value={regionalFocus}
                  onValueChange={(value) =>
                    setRegionalFocus(value as RegionalFocus)
                  }
                >
                  <SelectTrigger
                    id="regionalFocus"
                    data-ocid="news.regional_focus_select"
                  >
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {REGIONAL_FOCUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="status">Publishing Workflow</Label>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as ArticleStatus)}
                >
                  <SelectTrigger id="status" data-ocid="news.status_select">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="scheduledDate">Scheduled Publish Date</Label>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="scheduledDate"
                    type="date"
                    data-ocid="news.scheduled_date_input"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-foreground">
                    Featured on page
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Highlight this article on the home page
                  </span>
                </div>
                <Switch
                  checked={featured}
                  onCheckedChange={setFeatured}
                  data-ocid="news.featured_toggle"
                  aria-label="Featured on page"
                />
              </div>

              <div className="flex flex-col gap-2 border-t border-border pt-4">
                <Button
                  type="button"
                  data-ocid="news.save_button"
                  disabled={isPending || isUploading}
                  onClick={handleSubmit}
                >
                  {isPending ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 size-4" />
                  )}
                  {editingId !== null ? "Save Changes" : "Create Article"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  The article is saved with the workflow status selected above
                  (Draft, Pending Review, or Published).
                </p>
              </div>
            </CardContent>
          </Card>

          <Card data-ocid="news.taxonomy_card">
            <CardHeader>
              <CardTitle>Related Crops & Tags</CardTitle>
              <CardDescription>
                Link the article to crops and add searchable tags.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="relatedCrops">Related Crops</Label>
                <Select
                  value=""
                  onValueChange={(value) => {
                    if (value && !relatedCrops.includes(value)) {
                      setRelatedCrops((current) => [...current, value]);
                    }
                  }}
                >
                  <SelectTrigger
                    id="relatedCrops"
                    data-ocid="news.related_crops_select"
                  >
                    <SelectValue placeholder="Add a related crop" />
                  </SelectTrigger>
                  <SelectContent>
                    {cropOptions.map((crop) => (
                      <SelectItem key={crop} value={crop}>
                        {crop}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {relatedCrops.length > 0 ? (
                  <div
                    className="flex flex-wrap gap-2"
                    data-ocid="news.related_crops_list"
                  >
                    {relatedCrops.map((crop) => (
                      <Badge
                        key={crop}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() =>
                          setRelatedCrops((current) =>
                            current.filter((c) => c !== crop),
                          )
                        }
                      >
                        {crop} ×
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  data-ocid="news.tags_input"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="e.g. maize, harvest, weather (comma separated)"
                />
                {tags.length > 0 ? (
                  <div
                    className="flex flex-wrap gap-2"
                    data-ocid="news.tags_list"
                  >
                    {tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
