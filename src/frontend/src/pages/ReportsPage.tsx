import { type Report, ReportStatus, ReportType, createActor } from "@/backend";
import { DataTable } from "@/components/DataTable";
import { MarketPriceFeed } from "@/components/MarketPriceFeed";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { WeatherWidget } from "@/components/WeatherWidget";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DataTableColumn, MarketPrice } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Download,
  Eye,
  FileBarChart,
  FileText,
  Leaf,
  Share2,
  Sprout,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  [ReportType.yield_]: "Yield",
  [ReportType.soil]: "Soil",
  [ReportType.market]: "Market",
  [ReportType.fieldActivity]: "Field Activity",
};

const REPORT_TYPE_OPTIONS: { value: ReportType; label: string }[] = [
  { value: ReportType.yield_, label: "Yield" },
  { value: ReportType.soil, label: "Soil" },
  { value: ReportType.market, label: "Market" },
  { value: ReportType.fieldActivity, label: "Field Activity" },
];

const TIME_PERIOD_OPTIONS = [
  { value: "This Month", label: "This Month" },
  { value: "Last 3 Months", label: "Last 3 Months" },
  { value: "This Season", label: "This Season" },
  { value: "Last 12 Months", label: "Last 12 Months" },
];

function timestampToDate(timestamp: bigint): Date | null {
  const date = new Date(Number(timestamp / 1_000_000n));
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(timestamp: bigint): string {
  const date = timestampToDate(timestamp);
  if (!date) return "—";
  return date.toLocaleDateString("en-MW", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function useReports() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listReports();
    },
    enabled: !!actor && !isFetching,
  });
}

function useAddReport() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (report: Report) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.addReport(report);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

const yieldData = [
  { month: "Jan", maize: 4.2, soya: 2.1 },
  { month: "Feb", maize: 4.8, soya: 2.4 },
  { month: "Mar", maize: 5.1, soya: 2.6 },
  { month: "Apr", maize: 5.6, soya: 2.9 },
  { month: "May", maize: 5.2, soya: 2.7 },
  { month: "Jun", maize: 4.9, soya: 2.5 },
];

const priceCorrelationData = [
  { month: "Jan", price: 320, yield: 4.2 },
  { month: "Feb", price: 335, yield: 4.8 },
  { month: "Mar", price: 348, yield: 5.1 },
  { month: "Apr", price: 360, yield: 5.6 },
  { month: "May", price: 352, yield: 5.2 },
  { month: "Jun", price: 340, yield: 4.9 },
];

const soilZones = [
  { zone: "North Field", health: "Good", level: 3 },
  { zone: "East Field", health: "Moderate", level: 2 },
  { zone: "South Field", health: "Good", level: 3 },
  { zone: "West Field", health: "Poor", level: 1 },
  { zone: "Central Field", health: "Good", level: 3 },
  { zone: "River Valley", health: "Moderate", level: 2 },
];

const marketPrices: MarketPrice[] = [
  {
    commodity: "Maize",
    price: 340,
    unit: "kg",
    change: 2.4,
    market: "Lilongwe",
  },
  {
    commodity: "Soya Beans",
    price: 520,
    unit: "kg",
    change: -1.2,
    market: "Lilongwe",
  },
  {
    commodity: "Groundnuts",
    price: 780,
    unit: "kg",
    change: 3.1,
    market: "Mzuzu",
  },
  { commodity: "Rice", price: 610, unit: "kg", change: 0.8, market: "Karonga" },
];

const soilLevelStyles: Record<number, string> = {
  1: "bg-destructive/80",
  2: "bg-warning/70",
  3: "bg-primary/70",
};

export function ReportsPage() {
  const { data: reports = [], isLoading } = useReports();
  const addReport = useAddReport();

  const [reportType, setReportType] = useState<ReportType>(ReportType.yield_);
  const [timePeriod, setTimePeriod] = useState(TIME_PERIOD_OPTIONS[0].value);
  const [locationFarm, setLocationFarm] = useState("");

  const canGenerate = locationFarm.trim().length > 0;

  const handleGenerate = () => {
    if (!canGenerate) return;
    const name = `${REPORT_TYPE_LABELS[reportType]} Report — ${locationFarm.trim()}`;
    const report: Report = {
      id: 0n,
      status: ReportStatus.generated,
      name,
      reportType,
      locationFarm: locationFarm.trim(),
      generatedDate: BigInt(Date.now()) * 1_000_000n,
    };
    setLocationFarm("");
    addReport.mutate(report, {
      onError: () =>
        setLocationFarm((current) =>
          current === "" ? report.locationFarm : current,
        ),
    });
  };

  const generatedCount = useMemo(
    () => reports.filter((r) => r.status === ReportStatus.generated).length,
    [reports],
  );
  const savedCount = useMemo(
    () => reports.filter((r) => r.status === ReportStatus.saved).length,
    [reports],
  );
  const marketCount = useMemo(
    () => reports.filter((r) => r.reportType === ReportType.market).length,
    [reports],
  );

  const columns: DataTableColumn<Report>[] = [
    { key: "name", header: "Report Name" },
    {
      key: "reportType",
      header: "Type",
      render: (row) => REPORT_TYPE_LABELS[row.reportType],
    },
    {
      key: "generatedDate",
      header: "Generated Date",
      render: (row) => formatDate(row.generatedDate),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge
          variant={
            row.status === ReportStatus.generated ? "default" : "secondary"
          }
        >
          {row.status === ReportStatus.generated ? "Generated" : "Saved"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: () => (
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="View report"
            data-ocid="report.view_button"
          >
            <Eye className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Download report"
            data-ocid="report.download_button"
          >
            <Download className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Share report"
            data-ocid="report.share_button"
          >
            <Share2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reports"
        description="Generate operational and financial reports and analyse farm performance across Malawi."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Reports"
          value={String(reports.length)}
          subtitle="All generated reports"
          icon={FileText}
        />
        <StatCard
          title="Generated"
          value={String(generatedCount)}
          subtitle="Ready to view"
          icon={FileBarChart}
        />
        <StatCard
          title="Saved Drafts"
          value={String(savedCount)}
          subtitle="Awaiting finalisation"
          icon={Leaf}
        />
        <StatCard
          title="Market Reports"
          value={String(marketCount)}
          subtitle="Price & correlation"
          icon={TrendingUp}
        />
      </div>

      <Card className="gap-0 p-0 shadow-subtle">
        <CardHeader className="px-5 pt-5">
          <CardTitle className="font-display text-base font-semibold">
            Generate Report
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <form
            className="grid grid-cols-1 gap-4 md:grid-cols-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleGenerate();
            }}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="report-type">Report Type</Label>
              <Select
                value={reportType}
                onValueChange={(v) => setReportType(v as ReportType)}
              >
                <SelectTrigger id="report-type" data-ocid="report.type_select">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="time-period">Time Period</Label>
              <Select value={timePeriod} onValueChange={setTimePeriod}>
                <SelectTrigger
                  id="time-period"
                  data-ocid="report.period_select"
                >
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_PERIOD_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="location-farm">Location / Farm</Label>
              <Input
                id="location-farm"
                data-ocid="report.location_input"
                placeholder="e.g. Lilongwe Central Farm"
                value={locationFarm}
                onChange={(e) => setLocationFarm(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button
                type="submit"
                data-ocid="report.generate_button"
                className="w-full md:w-auto"
                disabled={!canGenerate || addReport.isPending}
              >
                {addReport.isPending ? "Generating…" : "Generate Report"}
              </Button>
            </div>
          </form>
          {addReport.isError ? (
            <p
              data-ocid="report.error_state"
              className="mt-3 text-sm text-destructive"
            >
              Failed to generate the report. Please try again.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="gap-0 p-0 shadow-subtle">
        <CardHeader className="px-5 pt-5">
          <CardTitle className="font-display text-base font-semibold">
            Report Inventory
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {isLoading ? (
            <div
              data-ocid="report.loading_state"
              className="flex items-center justify-center rounded-lg border border-border bg-muted/30 px-6 py-12 text-sm text-muted-foreground"
            >
              Loading reports…
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={reports}
              rowKey={(row) => String(row.id)}
              emptyMessage="Generate your first report to see it here."
            />
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-4 font-display text-lg font-semibold text-foreground">
          Report Analysis
        </h2>
        <Tabs defaultValue="yield" data-ocid="report.analysis_tabs">
          <TabsList>
            <TabsTrigger value="yield" data-ocid="report.tab.yield">
              Yield Analysis
            </TabsTrigger>
            <TabsTrigger value="soil" data-ocid="report.tab.soil">
              Soil Health
            </TabsTrigger>
            <TabsTrigger value="market" data-ocid="report.tab.market">
              Market Correlation
            </TabsTrigger>
            <TabsTrigger value="weather" data-ocid="report.tab.weather">
              Weather & Prices
            </TabsTrigger>
          </TabsList>

          <TabsContent value="yield" className="mt-4">
            <Card className="gap-0 p-0 shadow-subtle">
              <CardHeader className="px-5 pt-5">
                <CardTitle className="font-display text-base font-semibold">
                  Yield Analysis (t/ha)
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <ChartContainer
                  config={{
                    maize: { label: "Maize", color: "var(--chart-1)" },
                    soya: { label: "Soya", color: "var(--chart-3)" },
                  }}
                  className="h-72 w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={yieldData}>
                      <CartesianGrid vertical={false} stroke="var(--border)" />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar
                        dataKey="maize"
                        fill="var(--chart-1)"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="soya"
                        fill="var(--chart-3)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="soil" className="mt-4">
            <Card className="gap-0 p-0 shadow-subtle">
              <CardHeader className="px-5 pt-5">
                <CardTitle className="font-display text-base font-semibold">
                  Soil Health Map
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {soilZones.map((zone) => (
                    <div
                      key={zone.zone}
                      data-ocid="report.soil_zone"
                      className="flex flex-col items-center gap-2 rounded-lg border border-border p-4"
                    >
                      <div
                        className={`flex size-14 items-center justify-center rounded-xl ${soilLevelStyles[zone.level]}`}
                      >
                        <Sprout className="size-7 text-primary-foreground" />
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        {zone.zone}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {zone.health}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-border pt-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="size-3 rounded-sm bg-primary/70" /> Good
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-3 rounded-sm bg-warning/70" />{" "}
                    Moderate
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-3 rounded-sm bg-destructive/80" />{" "}
                    Poor
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="market" className="mt-4">
            <Card className="gap-0 p-0 shadow-subtle">
              <CardHeader className="px-5 pt-5">
                <CardTitle className="font-display text-base font-semibold">
                  Market Price vs Yield Correlation
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <ChartContainer
                  config={{
                    price: { label: "Price (MWK/kg)", color: "var(--chart-2)" },
                    yield: { label: "Yield (t/ha)", color: "var(--chart-1)" },
                  }}
                  className="h-72 w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={priceCorrelationData}>
                      <CartesianGrid vertical={false} stroke="var(--border)" />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                      />
                      <YAxis
                        yAxisId="left"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="price"
                        stroke="var(--chart-2)"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="yield"
                        stroke="var(--chart-1)"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="weather" className="mt-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <WeatherWidget />
              <MarketPriceFeed items={marketPrices} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
