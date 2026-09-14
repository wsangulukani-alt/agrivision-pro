import type { Crop } from "@/backend";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useCrops, useUpdateCrop } from "@/hooks/useQueries";
import { loadConfig } from "@caffeineai/core-infrastructure";
import { StorageClient } from "@caffeineai/object-storage";
import { HttpAgent } from "@icp-sdk/core/agent";
import {
  Bug,
  CalendarDays,
  Camera,
  Droplets,
  ImageUp,
  Loader2,
  MapPin,
  Ruler,
  Sprout,
  Tractor,
  Wheat,
} from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

interface CropInsight {
  crop: Crop;
  /** Yield (tonnes/ha) trend across the growing season. */
  yieldTrend: { month: string; yield: number }[];
  /** Share of total cultivated area, used for the donut chart. */
  areaShare: number;
  /** Average yield in tonnes per hectare. */
  avgYield: number;
}

const FALLBACK_CROPS: Crop[] = [
  {
    id: 1n,
    name: "Maize",
    description:
      "The staple food crop of Malawi, grown across the Central and Southern Regions. White dent varieties dominate smallholder fields, with hybrid SC-series seeds preferred for higher yields.",
    cultivationPractices:
      "Plant at the onset of the rains (Nov–Dec) at 75cm × 25cm spacing. Apply basal NPK at planting and top-dress with urea at 4–6 weeks. Ridge planting improves drainage and reduces waterlogging.",
    pestsDiseases:
      "Fall armyworm, maize stalk borer, and maize lethal necrosis. Scout weekly and apply targeted pesticides early; rotate fields to break pest cycles.",
    harvestingYields:
      "Harvest when cobs are dry and husks turn brown (Apr–May). Average 2.5–4.5 t/ha with improved seed and fertilizer; store at below 13% moisture.",
    farm: 1n,
    areaHa: 12.5,
    lastHarvest: 1714521600000000000n,
  },
  {
    id: 2n,
    name: "Tomatoes",
    description:
      "A high-value horticultural crop grown for fresh markets in Lilongwe and Blantyre. Grown under irrigation for year-round supply, with peak demand during the dry season.",
    cultivationPractices:
      "Transplant seedlings at 4–5 weeks into raised beds with drip irrigation. Stake and prune to a single stem. Apply calcium-rich fertilizer to prevent blossom-end rot.",
    pestsDiseases:
      "Late blight, tomato leaf miner, and whitefly. Use resistant varieties, maintain airflow between rows, and apply fungicide preventively during humid spells.",
    harvestingYields:
      "First harvest 60–75 days after transplanting, then every 3–4 days for 8–10 weeks. Yields of 25–40 t/ha are achievable under good management.",
    farm: 2n,
    areaHa: 3.2,
    lastHarvest: 1717113600000000000n,
  },
  {
    id: 3n,
    name: "Tobacco / Malawi Gold",
    description:
      "Malawi's leading export crop, with the golden-leafed 'Malawi Gold' variety prized on international markets. Grown mainly in the Central Region under contract with leaf buyers.",
    cultivationPractices:
      "Sow in nursery beds in July–August, transplant after the first rains. Top and de-sucker plants to concentrate leaf quality. Cure in traditional barns over 6–8 weeks.",
    pestsDiseases:
      "Tobacco mosaic virus, aphids, and bacterial wilt. Rotate with maize and legumes, rogue infected plants early, and keep curing barns well ventilated.",
    harvestingYields:
      "Reap leaves progressively from the bottom up as they ripen. Average 1.8–2.5 t/ha of cured leaf; quality grades drive auction prices at the Lilongwe floors.",
    farm: 3n,
    areaHa: 8.0,
    lastHarvest: 1711929600000000000n,
  },
  {
    id: 4n,
    name: "Rice / NERICA",
    description:
      "NERICA (New Rice for Africa) varieties thrive in the rain-fed lowlands of Karonga and the Shire Valley, offering drought tolerance and good yields for smallholders.",
    cultivationPractices:
      "Direct-seed or transplant into puddled fields after the rains begin. Maintain 5–10cm standing water during tillering, then drain before harvest. Apply nitrogen in split doses.",
    pestsDiseases:
      "Rice blast, stem borer, and birds at maturity. Use resistant NERICA lines, keep water levels steady, and scare birds during grain filling.",
    harvestingYields:
      "Harvest when 80–85% of grains turn golden (Apr–May). NERICA yields 3–5 t/ha under good management, well above traditional tall varieties.",
    farm: 4n,
    areaHa: 6.4,
    lastHarvest: 1719792000000000000n,
  },
];

const YIELD_TRENDS: Record<string, { month: string; yield: number }[]> = {
  Maize: [
    { month: "Nov", yield: 0 },
    { month: "Dec", yield: 0.4 },
    { month: "Jan", yield: 1.1 },
    { month: "Feb", yield: 2.0 },
    { month: "Mar", yield: 3.1 },
    { month: "Apr", yield: 4.2 },
  ],
  Tomatoes: [
    { month: "Jan", yield: 1.2 },
    { month: "Feb", yield: 2.4 },
    { month: "Mar", yield: 3.1 },
    { month: "Apr", yield: 3.8 },
    { month: "May", yield: 4.2 },
    { month: "Jun", yield: 4.6 },
  ],
  "Tobacco / Malawi Gold": [
    { month: "Nov", yield: 0 },
    { month: "Dec", yield: 0.3 },
    { month: "Jan", yield: 0.8 },
    { month: "Feb", yield: 1.3 },
    { month: "Mar", yield: 1.9 },
    { month: "Apr", yield: 2.4 },
  ],
  "Rice / NERICA": [
    { month: "Dec", yield: 0 },
    { month: "Jan", yield: 0.6 },
    { month: "Feb", yield: 1.5 },
    { month: "Mar", yield: 2.6 },
    { month: "Apr", yield: 3.8 },
    { month: "May", yield: 4.5 },
  ],
};

const AREA_SHARES: Record<string, number> = {
  Maize: 41,
  Tomatoes: 10,
  "Tobacco / Malawi Gold": 26,
  "Rice / NERICA": 21,
};

const AVG_YIELDS: Record<string, number> = {
  Maize: 3.5,
  Tomatoes: 32,
  "Tobacco / Malawi Gold": 2.1,
  "Rice / NERICA": 4.0,
};

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
];

function buildInsights(crops: Crop[]): CropInsight[] {
  return crops.map((crop) => ({
    crop,
    yieldTrend: YIELD_TRENDS[crop.name] ?? [
      { month: "Jan", yield: 1 },
      { month: "Feb", yield: 2 },
      { month: "Mar", yield: 3 },
    ],
    areaShare: AREA_SHARES[crop.name] ?? 25,
    avgYield: AVG_YIELDS[crop.name] ?? 3,
  }));
}

function formatDate(timestamp: bigint | undefined): string {
  if (timestamp === undefined) return "Not recorded";
  const date = new Date(Number(timestamp / 1_000_000n));
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function CropCard({ insight }: { insight: CropInsight }) {
  const { crop } = insight;
  const updateCrop = useUpdateCrop();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleImageUpload = async (file: File) => {
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
      updateCrop.mutate(
        { ...crop, image: url },
        {
          onSuccess: () => {
            toast.success("Crop image updated successfully");
          },
          onError: (error: unknown) => {
            toast.error(
              error instanceof Error
                ? error.message
                : "Failed to update crop image",
            );
          },
        },
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Image upload failed",
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card
      data-ocid={`crops.card.${crop.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`}
      className="gap-0 p-0 shadow-subtle"
    >
      <CardHeader className="border-b border-border px-5 pt-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/10 text-primary">
              {crop.image ? (
                <img
                  src={crop.image}
                  alt={crop.name}
                  className="size-full object-cover"
                />
              ) : (
                <Wheat className="size-6" />
              )}
            </div>
            <div className="min-w-0">
              <CardTitle className="font-display text-base font-semibold">
                {crop.name}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Farm #{crop.farm.toString()} · {crop.areaHa} ha
              </p>
            </div>
          </div>
          <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-medium text-success-foreground">
            Active
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-5 py-5">
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Camera className="size-4 shrink-0 text-primary" />
            <span className="truncate">
              {crop.image ? "Crop image set" : "No crop image"}
            </span>
          </div>
          <label className="cursor-pointer">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploading || updateCrop.isPending}
              data-ocid={`crops.upload_button.${crop.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`}
            >
              {isUploading || updateCrop.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <ImageUp className="mr-2 size-4" />
              )}
              Change Image
            </Button>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              data-ocid={`crops.image_input.${crop.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleImageUpload(file);
                e.target.value = "";
              }}
            />
          </label>
        </div>

        {isUploading ? (
          <div className="flex flex-col gap-2">
            <Progress
              value={uploadProgress}
              data-ocid={`crops.upload_progress.${crop.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`}
            />
            <p className="text-xs text-muted-foreground">
              Uploading image… {Math.round(uploadProgress)}%
            </p>
          </div>
        ) : null}

        <p className="text-sm leading-relaxed text-muted-foreground">
          {crop.description}
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border p-3">
            <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
              <Sprout className="size-3.5" /> Cultivation
            </div>
            <p className="text-sm leading-relaxed text-foreground">
              {crop.cultivationPractices}
            </p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-warning-foreground">
              <Bug className="size-3.5" /> Pests &amp; Diseases
            </div>
            <p className="text-sm leading-relaxed text-foreground">
              {crop.pestsDiseases}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border p-3">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
            <Tractor className="size-3.5" /> Harvesting &amp; Yields
          </div>
          <p className="text-sm leading-relaxed text-foreground">
            {crop.harvestingYields}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-border pt-4 sm:grid-cols-4">
          <div className="flex items-center gap-2">
            <MapPin className="size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground">Farm</p>
              <p className="truncate text-sm font-medium text-foreground">
                #{crop.farm.toString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Ruler className="size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground">Area</p>
              <p className="truncate text-sm font-medium text-foreground">
                {crop.areaHa} ha
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground">Last Harvest</p>
              <p className="truncate text-sm font-medium text-foreground">
                {formatDate(crop.lastHarvest)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Droplets className="size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground">Avg Yield</p>
              <p className="truncate text-sm font-medium text-foreground">
                {insight.avgYield} t/ha
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CropsPage() {
  const { data: crops = [], isLoading } = useCrops();
  const source = crops.length > 0 ? crops : FALLBACK_CROPS;
  const insights = buildInsights(source);

  const totalArea = insights.reduce((sum, i) => sum + i.crop.areaHa, 0);
  const totalYield = insights.reduce((sum, i) => sum + i.avgYield, 0);
  const avgYield = insights.length > 0 ? totalYield / insights.length : 0;

  const areaData = insights.map((i) => ({
    name: i.crop.name,
    value: i.areaShare,
  }));

  const yieldCompare = insights.map((i) => ({
    name: i.crop.name,
    yield: i.avgYield,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Crops Management & Insights"
        description="Track crop varieties, cultivation practices, and yield performance across your farms in Malawi."
      />

      <section
        data-ocid="crops.stats"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <StatCard
          title="Crops Tracked"
          value={String(source.length)}
          subtitle="Active varieties"
          icon={Wheat}
        />
        <StatCard
          title="Total Area"
          value={`${totalArea.toFixed(1)} ha`}
          subtitle="Across all crops"
          icon={Ruler}
        />
        <StatCard
          title="Avg Yield"
          value={`${avgYield.toFixed(1)} t/ha`}
          subtitle="Season average"
          icon={Tractor}
        />
        <StatCard
          title="Last Harvest"
          value={formatDate(
            source.reduce<bigint | undefined>(
              (latest, c) =>
                c.lastHarvest !== undefined &&
                (latest === undefined || c.lastHarvest > latest)
                  ? c.lastHarvest
                  : latest,
              undefined,
            ),
          )}
          subtitle="Most recent"
          icon={CalendarDays}
        />
      </section>

      {isLoading ? (
        <div
          data-ocid="crops.loading_state"
          className="grid grid-cols-1 gap-4 lg:grid-cols-2"
        >
          {Array.from({ length: 4 }, (_, i) => `skeleton-${i}`).map((id) => (
            <div
              key={id}
              className="h-72 animate-pulse rounded-xl border border-border bg-muted"
            />
          ))}
        </div>
      ) : (
        <section
          data-ocid="crops.list"
          className="grid grid-cols-1 gap-4 lg:grid-cols-2"
        >
          {insights.map((insight) => (
            <CropCard key={insight.crop.id.toString()} insight={insight} />
          ))}
        </section>
      )}

      <section data-ocid="crops.insights" className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
          Yield &amp; Area Insights
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="gap-0 p-0 shadow-subtle lg:col-span-2">
            <CardHeader className="px-5 pt-5">
              <CardTitle className="font-display text-base font-semibold">
                Yield Trend by Crop
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={insights[0]?.yieldTrend ?? []}
                    margin={{ top: 8, right: 12, left: -16, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                    />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                      stroke="var(--border)"
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                      stroke="var(--border)"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    {insights.map((insight, index) => (
                      <Line
                        key={insight.crop.name}
                        type="monotone"
                        dataKey="yield"
                        name={insight.crop.name}
                        stroke={CHART_COLORS[index % CHART_COLORS.length]}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="gap-0 p-0 shadow-subtle">
            <CardHeader className="px-5 pt-5">
              <CardTitle className="font-display text-base font-semibold">
                Area Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={areaData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {areaData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="gap-0 p-0 shadow-subtle">
          <CardHeader className="px-5 pt-5">
            <CardTitle className="font-display text-base font-semibold">
              Average Yield Comparison (t/ha)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={yieldCompare}
                  margin={{ top: 8, right: 12, left: -16, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                    stroke="var(--border)"
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                    stroke="var(--border)"
                  />
                  <Tooltip
                    cursor={{ fill: "var(--muted)" }}
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar
                    dataKey="yield"
                    name="Yield (t/ha)"
                    radius={[6, 6, 0, 0]}
                  >
                    {yieldCompare.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
