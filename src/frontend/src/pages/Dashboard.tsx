import { InventoryStatus, PaymentStatus } from "@/backend";
import { KpiCard } from "@/components/KpiCard";
import { MarketPriceFeed } from "@/components/MarketPriceFeed";
import { WeatherWidget } from "@/components/WeatherWidget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCrops,
  useFarms,
  useInventoryItems,
  useNewsArticles,
  usePayments,
  useProductionCycles,
  useSales,
  useSupportRequests,
} from "@/hooks/useQueries";
import type { MarketPrice } from "@/types";
import {
  Activity,
  Boxes,
  Droplets,
  Leaf,
  Sprout,
  TrendingUp,
  Wheat,
} from "lucide-react";
import { useMemo } from "react";

/** Converts a backend nanosecond timestamp to a Date, or null when invalid. */
function timestampToDate(timestamp: bigint): Date | null {
  const date = new Date(Number(timestamp / 1_000_000n));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Formats a monetary value as MWK. */
function formatMWK(amount: number): string {
  return `MWK ${amount.toLocaleString("en-MW", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

/** Formats a date as a short relative label for the activity feed. */
function formatRelative(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  if (hours < 48) return "Yesterday";
  return date.toLocaleDateString("en-MW", {
    day: "numeric",
    month: "short",
  });
}

/** Sample market prices — replaced by real data once a feed is connected. */
const marketPrices: MarketPrice[] = [
  {
    commodity: "Maize",
    price: 450,
    unit: "kg",
    change: 2.4,
    market: "Lilongwe",
  },
  {
    commodity: "Soybeans",
    price: 780,
    unit: "kg",
    change: -1.2,
    market: "Lilongwe",
  },
  {
    commodity: "Groundnuts",
    price: 1250,
    unit: "kg",
    change: 3.8,
    market: "Blantyre",
  },
  { commodity: "Rice", price: 980, unit: "kg", change: 0.6, market: "Mzuzu" },
  {
    commodity: "Cassava",
    price: 320,
    unit: "kg",
    change: -0.4,
    market: "Lilongwe",
  },
];

interface ActivityEntry {
  text: string;
  time: string;
  ts: number;
}

export function DashboardPage() {
  const { data: farms = [], isLoading: farmsLoading } = useFarms();
  const { data: crops = [], isLoading: cropsLoading } = useCrops();
  const { data: sales = [], isLoading: salesLoading } = useSales();
  const { data: payments = [], isLoading: paymentsLoading } = usePayments();
  const { data: productionCycles = [], isLoading: cyclesLoading } =
    useProductionCycles();
  const { data: inventoryItems = [], isLoading: inventoryLoading } =
    useInventoryItems();
  const { data: newsArticles = [], isLoading: newsLoading } = useNewsArticles();
  const { data: supportRequests = [], isLoading: supportLoading } =
    useSupportRequests();

  const isLoading =
    farmsLoading ||
    cropsLoading ||
    salesLoading ||
    paymentsLoading ||
    cyclesLoading ||
    inventoryLoading ||
    newsLoading ||
    supportLoading;

  const kpis = useMemo(() => {
    const monthlySales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const pendingPayments = payments.filter(
      (payment) => payment.status === PaymentStatus.pending,
    ).length;
    return [
      {
        label: "Total Farms",
        value: String(farms.length),
        delta: "Registered on platform",
        trend: "neutral" as const,
        icon: Leaf,
      },
      {
        label: "Active Crops",
        value: String(crops.length),
        delta: "Cultivated this season",
        trend: "neutral" as const,
        icon: Wheat,
      },
      {
        label: "Monthly Sales",
        value: formatMWK(monthlySales),
        delta: "Total revenue",
        trend: "neutral" as const,
        icon: TrendingUp,
      },
      {
        label: "Pending Payments",
        value: String(pendingPayments),
        delta: "Awaiting processing",
        trend: "neutral" as const,
        icon: Activity,
      },
      {
        label: "Inventory Items",
        value: String(inventoryItems.length),
        delta: "Tracked items",
        trend: "neutral" as const,
        icon: Boxes,
      },
    ];
  }, [farms, crops, sales, payments, inventoryItems]);

  const productionData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(0, i).toLocaleString("en", { month: "short" }),
      value: 0,
    }));
    for (const cycle of productionCycles) {
      const date = timestampToDate(cycle.startDate);
      if (!date) continue;
      months[date.getMonth()].value += cycle.expectedYield;
    }
    return months;
  }, [productionCycles]);

  const maxProduction = useMemo(
    () => Math.max(...productionData.map((d) => d.value), 1),
    [productionData],
  );

  const topCrops = useMemo(() => {
    const sorted = [...crops].sort((a, b) => b.areaHa - a.areaHa).slice(0, 5);
    const max = sorted.length ? Math.max(...sorted.map((c) => c.areaHa)) : 1;
    return sorted.map((crop) => ({
      name: crop.name,
      pct: Math.round((crop.areaHa / max) * 100),
    }));
  }, [crops]);

  const activities = useMemo(() => {
    const list: ActivityEntry[] = [];
    for (const sale of sales) {
      const date = timestampToDate(sale.date);
      list.push({
        text: `Sale of ${sale.quantity} kg ${sale.crop} to ${sale.buyer}`,
        time: date ? formatRelative(date) : "—",
        ts: date ? date.getTime() : 0,
      });
    }
    for (const cycle of productionCycles) {
      const date = timestampToDate(cycle.startDate);
      list.push({
        text: `Production cycle started for ${cycle.crop} (${cycle.areaHa} ha)`,
        time: date ? formatRelative(date) : "—",
        ts: date ? date.getTime() : 0,
      });
    }
    for (const article of newsArticles) {
      const date = timestampToDate(article.createdAt);
      list.push({
        text: `News published: ${article.headline}`,
        time: date ? formatRelative(date) : "—",
        ts: date ? date.getTime() : 0,
      });
    }
    for (const request of supportRequests) {
      const date = timestampToDate(request.createdAt);
      list.push({
        text: `Support request: ${request.subject}`,
        time: date ? formatRelative(date) : "—",
        ts: date ? date.getTime() : 0,
      });
    }
    return list.sort((a, b) => b.ts - a.ts).slice(0, 5);
  }, [sales, productionCycles, newsArticles, supportRequests]);

  const inventory = useMemo(
    () =>
      inventoryItems.map((item) => ({
        name: item.name,
        qty: `${item.quantity} ${item.unit}`,
        status:
          item.status === InventoryStatus.critical
            ? "Critical"
            : item.status === InventoryStatus.lowStock
              ? "Low stock"
              : "In stock",
      })),
    [inventoryItems],
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Hero banner */}
      <section
        data-ocid="dashboard.hero"
        className="relative overflow-hidden rounded-xl border border-border shadow-subtle"
      >
        <img
          src="/assets/generated/hero-cornfield.dim_1600x500.jpg"
          alt="A lush green maize field in Malawi at golden hour"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/85 via-primary/60 to-primary/20" />
        <div className="relative flex min-h-44 flex-col justify-center px-6 py-8 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/80">
            AgriVision Pro
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Welcome back, Arthur!
          </h1>
          <p className="mt-1 max-w-md text-sm text-primary-foreground/90">
            Here's what's happening across your farms and operations today.
          </p>
        </div>
      </section>

      {/* KPI row */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {isLoading
          ? Array.from({ length: 5 }, (_, i) => `kpi-skeleton-${i}`).map(
              (id) => (
                <Card key={id} className="gap-0 p-0 shadow-subtle">
                  <CardContent className="px-5 py-4">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="mt-3 h-7 w-24" />
                    <Skeleton className="mt-2 h-3 w-16" />
                  </CardContent>
                </Card>
              ),
            )
          : kpis.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}
      </section>

      {/* Main grid */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Production overview */}
        <Card className="gap-0 p-0 shadow-subtle lg:col-span-2">
          <CardHeader className="px-5 pt-5">
            <CardTitle className="font-display text-base font-semibold">
              Production Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {isLoading ? (
              <div
                data-ocid="dashboard.production_loading"
                className="flex h-48 items-end gap-2"
              >
                {Array.from({ length: 8 }, (_, i) => `bar-skeleton-${i}`).map(
                  (id) => (
                    <Skeleton key={id} className="h-full flex-1" />
                  ),
                )}
              </div>
            ) : maxProduction > 1 ? (
              <div className="flex h-48 items-end gap-2">
                {productionData.map((point) => (
                  <div
                    key={point.month}
                    className="flex flex-1 flex-col items-center gap-1"
                  >
                    <div
                      className="w-full rounded-t-md bg-gradient-primary"
                      style={{
                        height: `${Math.max(
                          (point.value / maxProduction) * 100,
                          2,
                        )}%`,
                      }}
                    />
                    <span className="text-[10px] text-muted-foreground">
                      {point.month}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div
                data-ocid="dashboard.production_empty"
                className="flex h-48 flex-col items-center justify-center gap-2 text-center"
              >
                <Sprout className="size-8 text-muted-foreground/50" />
                <p className="text-sm font-medium text-foreground">
                  No production data yet
                </p>
                <p className="text-sm text-muted-foreground">
                  Add production cycles to see your yield overview here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weather */}
        <WeatherWidget />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Top crops */}
        <Card className="gap-0 p-0 shadow-subtle">
          <CardHeader className="px-5 pt-5">
            <CardTitle className="font-display text-base font-semibold">
              Top Crops
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {isLoading ? (
              <div
                data-ocid="dashboard.crops_loading"
                className="flex flex-col gap-4"
              >
                {Array.from({ length: 4 }, (_, i) => `crop-skeleton-${i}`).map(
                  (id) => (
                    <Skeleton key={id} className="h-6 w-full" />
                  ),
                )}
              </div>
            ) : topCrops.length > 0 ? (
              <ul className="space-y-4">
                {topCrops.map((crop) => (
                  <li key={crop.name}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">
                        {crop.name}
                      </span>
                      <span className="text-muted-foreground">{crop.pct}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-primary"
                        style={{ width: `${crop.pct}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div
                data-ocid="dashboard.crops_empty"
                className="flex flex-col items-center gap-2 py-6 text-center"
              >
                <Wheat className="size-8 text-muted-foreground/50" />
                <p className="text-sm font-medium text-foreground">
                  No crops registered
                </p>
                <p className="text-sm text-muted-foreground">
                  Add crops to see your top performers here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent activities */}
        <Card className="gap-0 p-0 shadow-subtle">
          <CardHeader className="px-5 pt-5">
            <CardTitle className="font-display text-base font-semibold">
              Recent Activities
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {isLoading ? (
              <div
                data-ocid="dashboard.activities_loading"
                className="flex flex-col gap-4"
              >
                {Array.from(
                  { length: 4 },
                  (_, i) => `activity-skeleton-${i}`,
                ).map((id) => (
                  <Skeleton key={id} className="h-8 w-full" />
                ))}
              </div>
            ) : activities.length > 0 ? (
              <ul className="space-y-4">
                {activities.map((activity) => (
                  <li key={activity.text} className="flex gap-3">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                    <div className="min-w-0">
                      <p className="text-sm text-foreground">{activity.text}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.time}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div
                data-ocid="dashboard.activities_empty"
                className="flex flex-col items-center gap-2 py-6 text-center"
              >
                <Activity className="size-8 text-muted-foreground/50" />
                <p className="text-sm font-medium text-foreground">
                  No recent activity
                </p>
                <p className="text-sm text-muted-foreground">
                  Your latest sales, cycles, and updates will appear here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inventory status */}
        <Card className="gap-0 p-0 shadow-subtle">
          <CardHeader className="px-5 pt-5">
            <CardTitle className="font-display text-base font-semibold">
              Inventory Status
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {isLoading ? (
              <div
                data-ocid="dashboard.inventory_loading"
                className="flex flex-col gap-3"
              >
                {Array.from(
                  { length: 4 },
                  (_, i) => `inventory-skeleton-${i}`,
                ).map((id) => (
                  <Skeleton key={id} className="h-10 w-full" />
                ))}
              </div>
            ) : inventory.length > 0 ? (
              <ul className="divide-y divide-border">
                {inventory.map((item) => (
                  <li
                    key={item.name}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.qty}
                      </p>
                    </div>
                    <span
                      className={
                        item.status === "In stock"
                          ? "rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-medium text-success-foreground"
                          : "rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-medium text-warning-foreground"
                      }
                    >
                      {item.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div
                data-ocid="dashboard.inventory_empty"
                className="flex flex-col items-center gap-2 py-6 text-center"
              >
                <Boxes className="size-8 text-muted-foreground/50" />
                <p className="text-sm font-medium text-foreground">
                  No inventory items
                </p>
                <p className="text-sm text-muted-foreground">
                  Add inventory items to track stock levels here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Market prices */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <MarketPriceFeed items={marketPrices} />
        <Card className="gap-0 p-0 shadow-subtle">
          <CardHeader className="px-5 pt-5">
            <CardTitle className="font-display text-base font-semibold">
              Seasonal Outlook
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sprout className="size-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Planting season underway
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Favorable rainfall across the Central Region supports maize
                  and soybean planting. Monitor soil moisture before applying
                  fertilizer.
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-start gap-4 border-t border-border pt-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-warning/15 text-warning-foreground">
                <Droplets className="size-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Irrigation advisory
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Light showers expected Friday. Schedule irrigation for fields
                  in the Southern Region before the weekend.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
