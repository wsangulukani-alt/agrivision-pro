import { createActor } from "@/backend";
import type { Sale } from "@/backend";
import { DataTable } from "@/components/DataTable";
import { KpiCard } from "@/components/KpiCard";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { DataTableColumn } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import {
  Banknote,
  BarChart3,
  Receipt,
  Sprout,
  TrendingUp,
  Wheat,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/** Converts a Motoko nanosecond timestamp into a JavaScript Date. */
function timestampToDate(timestamp: bigint): Date | null {
  const date = new Date(Number(timestamp / 1_000_000n));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Formats a number as Malawian Kwacha (MWK). */
function formatMwk(value: number): string {
  return `MWK ${value.toLocaleString("en-MW", {
    maximumFractionDigits: 0,
  })}`;
}

/** Returns all sales recorded on the platform. */
function useSales() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["sales"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listSales();
    },
    enabled: !!actor && !isFetching,
  });
}

/** Returns all payments recorded on the platform. */
function usePayments() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listPayments();
    },
    enabled: !!actor && !isFetching,
  });
}

interface CropBreakdown {
  crop: string;
  quantity: number;
  revenue: number;
  transactions: number;
}

interface FarmBreakdown {
  farm: string;
  revenue: number;
  transactions: number;
}

interface TrendPoint {
  month: string;
  revenue: number;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function buildTrend(sales: Sale[]): TrendPoint[] {
  const buckets = new Map<number, number>();
  for (const sale of sales) {
    const date = timestampToDate(sale.date);
    const month = date ? date.getMonth() : -1;
    if (month < 0) continue;
    buckets.set(month, (buckets.get(month) ?? 0) + sale.totalAmount);
  }
  return MONTHS.map((month, index) => ({
    month,
    revenue: buckets.get(index) ?? 0,
  }));
}

function buildCropBreakdown(sales: Sale[]): CropBreakdown[] {
  const map = new Map<string, CropBreakdown>();
  for (const sale of sales) {
    const entry = map.get(sale.crop) ?? {
      crop: sale.crop,
      quantity: 0,
      revenue: 0,
      transactions: 0,
    };
    entry.quantity += sale.quantity;
    entry.revenue += sale.totalAmount;
    entry.transactions += 1;
    map.set(sale.crop, entry);
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue);
}

function buildFarmBreakdown(sales: Sale[]): FarmBreakdown[] {
  const map = new Map<string, FarmBreakdown>();
  for (const sale of sales) {
    const entry = map.get(sale.farm) ?? {
      farm: sale.farm,
      revenue: 0,
      transactions: 0,
    };
    entry.revenue += sale.totalAmount;
    entry.transactions += 1;
    map.set(sale.farm, entry);
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue);
}

const cropColumns: DataTableColumn<CropBreakdown>[] = [
  { key: "crop", header: "Crop" },
  { key: "quantity", header: "Quantity", align: "right" },
  {
    key: "revenue",
    header: "Revenue",
    align: "right",
    render: (row) => formatMwk(row.revenue),
  },
  { key: "transactions", header: "Transactions", align: "right" },
];

const farmColumns: DataTableColumn<FarmBreakdown>[] = [
  { key: "farm", header: "Farm" },
  {
    key: "revenue",
    header: "Revenue",
    align: "right",
    render: (row) => formatMwk(row.revenue),
  },
  { key: "transactions", header: "Transactions", align: "right" },
];

export function SalesReportsPage() {
  const salesQuery = useSales();
  const paymentsQuery = usePayments();

  const loading = salesQuery.isLoading || paymentsQuery.isLoading;
  const sales = salesQuery.data ?? [];
  const payments = paymentsQuery.data ?? [];

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalTransactions = sales.length;
  const avgSale = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
  const totalPayments = payments.reduce(
    (sum, payment) => sum + payment.amount,
    0,
  );

  const cropBreakdown = buildCropBreakdown(sales);
  const farmBreakdown = buildFarmBreakdown(sales);
  const trend = buildTrend(sales);
  const topCrop = cropBreakdown[0]?.crop ?? "—";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Sales Reports"
        description="Aggregated sales performance across your farms, crops, and buyers in Malawi."
      />

      {/* KPI row */}
      <section
        data-ocid="sales_reports.kpi_row"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {loading ? (
          Array.from({ length: 4 }, (_, i) => `kpi-skeleton-${i}`).map((id) => (
            <Card key={id} className="gap-0 p-0 shadow-subtle">
              <CardContent className="px-5 py-4">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="mt-3 h-7 w-32" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <KpiCard
              label="Total Revenue"
              value={formatMwk(totalRevenue)}
              delta={`${totalTransactions} transactions`}
              trend="up"
              icon={Banknote}
            />
            <KpiCard
              label="Total Transactions"
              value={String(totalTransactions)}
              delta={`${cropBreakdown.length} crops sold`}
              trend="neutral"
              icon={Receipt}
            />
            <KpiCard
              label="Top Crop"
              value={topCrop}
              delta="by revenue"
              trend="up"
              icon={Wheat}
            />
            <KpiCard
              label="Average Sale"
              value={formatMwk(avgSale)}
              delta={`MWK ${totalPayments.toLocaleString("en-MW", {
                maximumFractionDigits: 0,
              })} collected`}
              trend="up"
              icon={TrendingUp}
            />
          </>
        )}
      </section>

      {/* Sales trend chart */}
      <section data-ocid="sales_reports.trend">
        <Card className="gap-0 p-0 shadow-subtle">
          <CardHeader className="px-5 pt-5">
            <CardTitle className="font-display text-base font-semibold">
              Sales Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-5 sm:px-5">
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={trend}
                    margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="revenueFill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="var(--chart-1)"
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--chart-1)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={70}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                      tickFormatter={(value: number) =>
                        `MWK ${(value / 1000).toFixed(0)}k`
                      }
                    />
                    <Tooltip
                      formatter={(value: number) => [
                        formatMwk(value),
                        "Revenue",
                      ]}
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid var(--border)",
                        background: "var(--card)",
                        fontSize: 13,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="var(--chart-1)"
                      strokeWidth={2}
                      fill="url(#revenueFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Breakdown by crop and farm */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="gap-0 p-0 shadow-subtle">
          <CardHeader className="px-5 pt-5">
            <CardTitle className="font-display text-base font-semibold">
              Breakdown by Crop
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }, (_, i) => `crop-skeleton-${i}`).map(
                  (id) => (
                    <Skeleton key={id} className="h-10 w-full" />
                  ),
                )}
              </div>
            ) : (
              <DataTable
                columns={cropColumns}
                data={cropBreakdown}
                rowKey={(row) => row.crop}
                emptyMessage="No sales recorded yet."
              />
            )}
          </CardContent>
        </Card>

        <Card className="gap-0 p-0 shadow-subtle">
          <CardHeader className="px-5 pt-5">
            <CardTitle className="font-display text-base font-semibold">
              Breakdown by Farm
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }, (_, i) => `farm-skeleton-${i}`).map(
                  (id) => (
                    <Skeleton key={id} className="h-10 w-full" />
                  ),
                )}
              </div>
            ) : (
              <DataTable
                columns={farmColumns}
                data={farmBreakdown}
                rowKey={(row) => row.farm}
                emptyMessage="No sales recorded yet."
              />
            )}
          </CardContent>
        </Card>
      </section>

      {/* Summary stat cards */}
      <section
        data-ocid="sales_reports.summary"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <StatCard
          title="Total Revenue"
          value={formatMwk(totalRevenue)}
          subtitle="Across all recorded sales"
          icon={BarChart3}
        />
        <StatCard
          title="Payments Collected"
          value={formatMwk(totalPayments)}
          subtitle={`${payments.length} payment records`}
          icon={Banknote}
        />
        <StatCard
          title="Crops Sold"
          value={String(cropBreakdown.length)}
          subtitle="Distinct crops in sales"
          icon={Sprout}
        />
      </section>
    </div>
  );
}
