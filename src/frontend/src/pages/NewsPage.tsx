import { createActor } from "@/backend";
import { ArticleStatus, RegionalFocus } from "@/backend";
import { MarketPriceFeed } from "@/components/MarketPriceFeed";
import { PageHeader } from "@/components/PageHeader";
import { WeatherWidget } from "@/components/WeatherWidget";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { MarketPrice } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  Globe2,
  MapPin,
  Newspaper,
  Search,
  Tag,
} from "lucide-react";
import { useMemo, useState } from "react";

/** Converts a backend nanosecond timestamp to a Date, or null when invalid. */
function timestampToDate(timestamp: bigint): Date | null {
  const date = new Date(Number(timestamp / 1_000_000n));
  return Number.isNaN(date.getTime()) ? null : date;
}

const REGION_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Regions" },
  { value: RegionalFocus.malawi, label: "Malawi" },
  { value: RegionalFocus.sadc, label: "SADC" },
  { value: RegionalFocus.global, label: "Global" },
];

const CROP_OPTIONS = [
  "Maize",
  "Tobacco",
  "Soya",
  "Groundnuts",
  "Rice",
  "Cotton",
  "Tea",
  "Coffee",
];

const MARKET_PRICES: MarketPrice[] = [
  {
    commodity: "Maize",
    price: 320,
    unit: "50kg",
    change: 2.4,
    market: "Lilongwe",
  },
  {
    commodity: "Soya Beans",
    price: 780,
    unit: "50kg",
    change: -1.2,
    market: "Lilongwe",
  },
  {
    commodity: "Groundnuts",
    price: 1450,
    unit: "50kg",
    change: 3.1,
    market: "Mzuzu",
  },
  {
    commodity: "Rice",
    price: 2100,
    unit: "50kg",
    change: 0.8,
    market: "Karonga",
  },
  {
    commodity: "Tobacco",
    price: 3200,
    unit: "kg",
    change: -0.6,
    market: "Lilongwe",
  },
];

function formatPublishDate(timestamp: bigint): string {
  const date = timestampToDate(timestamp);
  if (!date) return "Date unavailable";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ArticleCard({
  headline,
  subHeadline,
  bannerImage,
  region,
  tags,
  publishedAt,
}: {
  headline: string;
  subHeadline: string;
  bannerImage: string;
  region: RegionalFocus;
  tags: string[];
  publishedAt: bigint;
}) {
  const regionLabel =
    region === RegionalFocus.malawi
      ? "Malawi"
      : region === RegionalFocus.sadc
        ? "SADC"
        : "Global";

  return (
    <Card className="group gap-0 overflow-hidden p-0 shadow-subtle transition-smooth hover:shadow-elevated">
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
        {bannerImage ? (
          <img
            src={bannerImage}
            alt={headline}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-primary text-primary-foreground">
            <Newspaper className="size-10" />
          </div>
        )}
        <Badge className="absolute left-3 top-3 bg-background/90 text-foreground backdrop-blur">
          <MapPin className="mr-1 size-3" />
          {regionLabel}
        </Badge>
      </div>
      <CardContent className="flex flex-col gap-3 p-5">
        <h3 className="font-display text-lg font-semibold leading-snug text-foreground">
          {headline}
        </h3>
        {subHeadline ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {subHeadline}
          </p>
        ) : null}
        <div className="mt-auto flex flex-wrap items-center gap-2">
          {tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1 font-normal">
              <Tag className="size-3" />
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex items-center gap-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
          <CalendarDays className="size-3.5" />
          {formatPublishDate(publishedAt)}
        </div>
      </CardContent>
    </Card>
  );
}

function ArticleGridSkeleton() {
  const ids = Array.from({ length: 3 }, (_, i) => `skeleton-${i}`);
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {ids.map((id) => (
        <Card key={id} className="gap-0 overflow-hidden p-0 shadow-subtle">
          <Skeleton className="aspect-[16/9] w-full rounded-none" />
          <CardContent className="flex flex-col gap-3 p-5">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="mt-2 h-6 w-1/2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function NewsPage() {
  const { actor, isFetching } = useActor(createActor);
  const [region, setRegion] = useState("all");
  const [crop, setCrop] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const { data: articles, isLoading } = useQuery({
    queryKey: ["newsArticles"],
    queryFn: async () => {
      if (!actor) return [];
      const all = await actor.listNewsArticles();
      return all.filter(
        (article) => article.status === ArticleStatus.published,
      );
    },
    enabled: !!actor && !isFetching,
  });

  const filtered = useMemo(() => {
    if (!articles) return [];
    return articles.filter((article) => {
      if (region !== "all" && article.regionalFocus !== region) return false;
      if (crop !== "all" && !article.relatedCrops.includes(crop)) return false;
      const date = timestampToDate(article.createdAt);
      if (date) {
        if (fromDate && date < new Date(`${fromDate}T00:00:00`)) return false;
        if (toDate && date > new Date(`${toDate}T23:59:59`)) return false;
      }
      return true;
    });
  }, [articles, region, crop, fromDate, toDate]);

  const localArticles = useMemo(
    () =>
      filtered.filter(
        (article) =>
          article.regionalFocus === RegionalFocus.malawi ||
          article.regionalFocus === RegionalFocus.sadc,
      ),
    [filtered],
  );

  const globalArticles = useMemo(
    () =>
      filtered.filter(
        (article) => article.regionalFocus === RegionalFocus.global,
      ),
    [filtered],
  );

  const hasActiveFilters =
    region !== "all" || crop !== "all" || fromDate !== "" || toDate !== "";

  const resetFilters = () => {
    setRegion("all");
    setCrop("all");
    setFromDate("");
    setToDate("");
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="News"
        description="Local & regional headlines for Malawi and SADC, plus global market and technology updates for agriculture."
      />

      {/* Filters */}
      <Card className="gap-0 p-0 shadow-subtle">
        <CardContent className="p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="region-filter">Region</Label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger
                  id="region-filter"
                  data-ocid="news.region_filter"
                >
                  <SelectValue placeholder="All Regions" />
                </SelectTrigger>
                <SelectContent>
                  {REGION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="crop-filter">Crop Type</Label>
              <Select value={crop} onValueChange={setCrop}>
                <SelectTrigger id="crop-filter" data-ocid="news.crop_filter">
                  <SelectValue placeholder="All Crops" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Crops</SelectItem>
                  {CROP_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="from-date">From Date</Label>
              <Input
                id="from-date"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                data-ocid="news.from_date"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="to-date">To Date</Label>
              <Input
                id="to-date"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                data-ocid="news.to_date"
              />
            </div>
          </div>
          {hasActiveFilters ? (
            <div className="mt-4 flex items-center justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resetFilters}
                data-ocid="news.reset_filters"
              >
                Reset Filters
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Local & Regional Headlines */}
      <section data-ocid="news.local_section">
        <div className="mb-4 flex items-center gap-2">
          <MapPin className="size-5 text-primary" />
          <h2 className="font-display text-xl font-bold text-foreground">
            Local &amp; Regional Headlines
          </h2>
          <span className="text-sm text-muted-foreground">(Malawi / SADC)</span>
        </div>
        {isLoading ? (
          <ArticleGridSkeleton />
        ) : localArticles.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {localArticles.map((article) => (
              <ArticleCard
                key={article.id.toString()}
                headline={article.headline}
                subHeadline={article.subHeadline}
                bannerImage={article.bannerImage}
                region={article.regionalFocus}
                tags={article.tags}
                publishedAt={article.createdAt}
              />
            ))}
          </div>
        ) : (
          <Card className="gap-0 p-0 shadow-subtle">
            <CardContent
              className="flex flex-col items-center gap-3 py-12 text-center"
              data-ocid="news.local_empty_state"
            >
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Search className="size-6" />
              </div>
              <p className="font-display text-base font-semibold text-foreground">
                No local headlines found
              </p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Try adjusting your filters to see more Malawi and SADC
                agricultural news.
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Global Market & Tech Updates */}
      <section data-ocid="news.global_section">
        <div className="mb-4 flex items-center gap-2">
          <Globe2 className="size-5 text-primary" />
          <h2 className="font-display text-xl font-bold text-foreground">
            Global Market &amp; Tech Updates
          </h2>
        </div>
        {isLoading ? (
          <ArticleGridSkeleton />
        ) : globalArticles.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {globalArticles.map((article) => (
              <ArticleCard
                key={article.id.toString()}
                headline={article.headline}
                subHeadline={article.subHeadline}
                bannerImage={article.bannerImage}
                region={article.regionalFocus}
                tags={article.tags}
                publishedAt={article.createdAt}
              />
            ))}
          </div>
        ) : (
          <Card className="gap-0 p-0 shadow-subtle">
            <CardContent
              className="flex flex-col items-center gap-3 py-12 text-center"
              data-ocid="news.global_empty_state"
            >
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Globe2 className="size-6" />
              </div>
              <p className="font-display text-base font-semibold text-foreground">
                No global updates found
              </p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Check back soon for the latest global market and technology
                news.
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Weather + Market Price Feed */}
      <section
        className="grid gap-6 lg:grid-cols-2"
        data-ocid="news.insights_section"
      >
        <WeatherWidget />
        <MarketPriceFeed title="Market Price Feed" items={MARKET_PRICES} />
      </section>
    </div>
  );
}
