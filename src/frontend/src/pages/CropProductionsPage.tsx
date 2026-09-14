import { Stage, createActor } from "@/backend";
import type { ProductionCycle } from "@/backend";
import { DataTable } from "@/components/DataTable";
import { MarketPriceFeed } from "@/components/MarketPriceFeed";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { WeatherWidget } from "@/components/WeatherWidget";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DataTableColumn, MarketPrice } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarRange,
  Leaf,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Sprout,
  Wheat,
} from "lucide-react";
import { useMemo, useState } from "react";

const STAGE_LABELS: Record<Stage, string> = {
  [Stage.planting]: "Planting",
  [Stage.growing]: "Growing",
  [Stage.harvesting]: "Harvesting",
};

const STAGE_ORDER: Stage[] = [Stage.planting, Stage.growing, Stage.harvesting];

function timestampToDate(timestamp: bigint): Date | null {
  const date = new Date(Number(timestamp / 1_000_000n));
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatNumber(value: number): string {
  return value.toLocaleString("en-MW", { maximumFractionDigits: 1 });
}

function useListProductionCycles() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["productionCycles"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listProductionCycles();
    },
    enabled: !!actor && !isFetching,
  });
}

function useAddProductionCycle() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (cycle: ProductionCycle) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.addProductionCycle(cycle);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["productionCycles"] });
    },
  });
}

function useUpdateProductionCycle() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (cycle: ProductionCycle) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.updateProductionCycle(cycle);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["productionCycles"] });
    },
  });
}

interface CycleFormState {
  crop: string;
  farmField: string;
  stage: Stage;
  status: string;
  areaHa: string;
  expectedYield: string;
  startDate: string;
  endDate: string;
}

const EMPTY_FORM: CycleFormState = {
  crop: "",
  farmField: "",
  stage: Stage.planting,
  status: "Active",
  areaHa: "",
  expectedYield: "",
  startDate: "",
  endDate: "",
};

function formToCycle(form: CycleFormState, id: bigint): ProductionCycle {
  return {
    id,
    crop: form.crop.trim(),
    farmField: form.farmField.trim(),
    stage: form.stage,
    status: form.status.trim() || "Active",
    areaHa: Number(form.areaHa) || 0,
    expectedYield: Number(form.expectedYield) || 0,
    startDate: BigInt(new Date(form.startDate).getTime()) * 1_000_000n,
    endDate: form.endDate
      ? BigInt(new Date(form.endDate).getTime()) * 1_000_000n
      : undefined,
  };
}

function cycleToForm(cycle: ProductionCycle): CycleFormState {
  const start = timestampToDate(cycle.startDate);
  const end = cycle.endDate ? timestampToDate(cycle.endDate) : null;
  return {
    crop: cycle.crop,
    farmField: cycle.farmField,
    stage: cycle.stage,
    status: cycle.status,
    areaHa: String(cycle.areaHa),
    expectedYield: String(cycle.expectedYield),
    startDate: start ? start.toISOString().slice(0, 10) : "",
    endDate: end ? end.toISOString().slice(0, 10) : "",
  };
}

/** Simple stylized Malawi regional map with crop-density shading. */
function MalawiDensityMap({ cycles }: { cycles: ProductionCycle[] }) {
  const regions = useMemo(() => {
    const byRegion: Record<string, ProductionCycle[]> = {
      Northern: [],
      Central: [],
      Southern: [],
    };
    for (const cycle of cycles) {
      const field = cycle.farmField.toLowerCase();
      if (
        field.includes("northern") ||
        field.includes("karonga") ||
        field.includes("mzuzu")
      ) {
        byRegion.Northern.push(cycle);
      } else if (
        field.includes("southern") ||
        field.includes("blantyre") ||
        field.includes("zomba")
      ) {
        byRegion.Southern.push(cycle);
      } else {
        byRegion.Central.push(cycle);
      }
    }
    return byRegion;
  }, [cycles]);

  const max = Math.max(1, ...Object.values(regions).map((list) => list.length));

  const regionShapes: {
    name: string;
    d: string;
    labelX: number;
    labelY: number;
  }[] = [
    {
      name: "Northern",
      d: "M120 20 L150 18 L168 34 L160 62 L138 78 L118 66 L108 44 Z",
      labelX: 138,
      labelY: 46,
    },
    {
      name: "Central",
      d: "M112 84 L150 80 L172 96 L166 128 L140 142 L112 132 L104 104 Z",
      labelX: 138,
      labelY: 112,
    },
    {
      name: "Southern",
      d: "M118 150 L148 146 L168 160 L160 190 L136 202 L112 188 L106 166 Z",
      labelX: 138,
      labelY: 176,
    },
  ];

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <svg
        viewBox="90 10 100 200"
        className="h-56 w-full max-w-[220px] shrink-0"
        role="img"
        aria-label="Malawi regional crop density map"
        data-ocid="crop_productions.map"
      >
        {regionShapes.map((region) => {
          const count = regions[region.name].length;
          const intensity = count / max;
          const fill =
            intensity > 0.66
              ? "oklch(0.42 0.13 145)"
              : intensity > 0.33
                ? "oklch(0.55 0.13 145 / 0.7)"
                : "oklch(0.62 0.12 165 / 0.45)";
          return (
            <g key={region.name}>
              <path
                d={region.d}
                fill={fill}
                stroke="oklch(0.985 0.004 150)"
                strokeWidth="2"
                className="transition-colors"
              />
              <text
                x={region.labelX}
                y={region.labelY}
                textAnchor="middle"
                className="fill-background text-[11px] font-semibold"
              >
                {region.name}
              </text>
              <text
                x={region.labelX}
                y={region.labelY + 12}
                textAnchor="middle"
                className="fill-background text-[10px]"
              >
                {count} cycle{count === 1 ? "" : "s"}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex flex-col gap-2 text-sm">
        {regionShapes.map((region) => {
          const count = regions[region.name].length;
          const pct = cycles.length
            ? Math.round((count / cycles.length) * 100)
            : 0;
          return (
            <div
              key={region.name}
              className="flex items-center justify-between gap-4"
            >
              <span className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="size-4 text-primary" />
                {region.name} Region
              </span>
              <span className="font-medium tabular-nums text-foreground">
                {count} · {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Horizontal Gantt timeline of production cycles across the season. */
function GanttTimeline({ cycles }: { cycles: ProductionCycle[] }) {
  const { min, max } = useMemo(() => {
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    for (const cycle of cycles) {
      const start = Number(cycle.startDate / 1_000_000n);
      const end = cycle.endDate ? Number(cycle.endDate / 1_000_000n) : start;
      min = Math.min(min, start);
      max = Math.max(max, end);
    }
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      const now = Date.now();
      return { min: now - 120 * 86400000, max: now + 120 * 86400000 };
    }
    if (max - min < 60 * 86400000) {
      const mid = (min + max) / 2;
      return { min: mid - 60 * 86400000, max: mid + 60 * 86400000 };
    }
    return { min, max };
  }, [cycles]);

  const span = max - min || 1;

  function leftPct(ts: bigint): number {
    return Math.max(
      0,
      Math.min(100, ((Number(ts / 1_000_000n) - min) / span) * 100),
    );
  }
  function widthPct(cycle: ProductionCycle): number {
    const start = Number(cycle.startDate / 1_000_000n);
    const end = cycle.endDate ? Number(cycle.endDate / 1_000_000n) : start;
    return Math.max(4, ((end - start) / span) * 100);
  }

  const stageColor: Record<Stage, string> = {
    [Stage.planting]: "bg-chart-2",
    [Stage.growing]: "bg-chart-1",
    [Stage.harvesting]: "bg-chart-3",
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {new Date(min).toLocaleDateString("en-MW", {
            month: "short",
            year: "numeric",
          })}
        </span>
        <span>
          {new Date(max).toLocaleDateString("en-MW", {
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {cycles.map((cycle) => (
          <div key={cycle.id.toString()} className="flex items-center gap-3">
            <span className="w-28 shrink-0 truncate text-xs font-medium text-foreground">
              {cycle.crop}
            </span>
            <div className="relative h-6 flex-1 rounded-md bg-muted/50">
              <div
                data-ocid="crop_productions.gantt_bar"
                className={`absolute top-1 h-4 rounded-full ${stageColor[cycle.stage]}`}
                style={{
                  left: `${leftPct(cycle.startDate)}%`,
                  width: `${widthPct(cycle)}%`,
                }}
                title={`${cycle.crop} · ${STAGE_LABELS[cycle.stage]}`}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        {STAGE_ORDER.map((stage) => (
          <span key={stage} className="flex items-center gap-1.5">
            <span className={`size-2.5 rounded-full ${stageColor[stage]}`} />
            {STAGE_LABELS[stage]}
          </span>
        ))}
      </div>
    </div>
  );
}

export function CropProductionsPage() {
  const { data: cycles = [], isLoading } = useListProductionCycles();
  const addCycle = useAddProductionCycle();
  const updateCycle = useUpdateProductionCycle();

  const [cropFilter, setCropFilter] = useState("all");
  const [farmFilter, setFarmFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProductionCycle | null>(null);
  const [form, setForm] = useState<CycleFormState>(EMPTY_FORM);

  const crops = useMemo(
    () => Array.from(new Set(cycles.map((c) => c.crop))).sort(),
    [cycles],
  );
  const farms = useMemo(
    () => Array.from(new Set(cycles.map((c) => c.farmField))).sort(),
    [cycles],
  );
  const statuses = useMemo(
    () => Array.from(new Set(cycles.map((c) => c.status))).sort(),
    [cycles],
  );

  const filtered = useMemo(() => {
    const now = Date.now();
    const seasonStart = now - 180 * 86400000;
    const seasonEnd = now + 180 * 86400000;
    return cycles.filter((cycle) => {
      if (cropFilter !== "all" && cycle.crop !== cropFilter) return false;
      if (farmFilter !== "all" && cycle.farmField !== farmFilter) return false;
      if (statusFilter !== "all" && cycle.status !== statusFilter) return false;
      if (periodFilter !== "all") {
        const start = Number(cycle.startDate / 1_000_000n);
        if (
          periodFilter === "current" &&
          (start < seasonStart || start > seasonEnd)
        )
          return false;
        if (periodFilter === "past" && start >= seasonStart) return false;
        if (periodFilter === "upcoming" && start <= seasonEnd) return false;
      }
      return true;
    });
  }, [cycles, cropFilter, farmFilter, statusFilter, periodFilter]);

  const totalArea = filtered.reduce((sum, c) => sum + c.areaHa, 0);
  const totalYield = filtered.reduce((sum, c) => sum + c.expectedYield, 0);
  const activeCount = filtered.filter((c) => c.status !== "Completed").length;
  const harvestingCount = filtered.filter(
    (c) => c.stage === Stage.harvesting,
  ).length;

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(cycle: ProductionCycle) {
    setEditing(cycle);
    setForm(cycleToForm(cycle));
    setDialogOpen(true);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const captured = form;
    const capturedEditing = editing;
    setDialogOpen(false);

    if (capturedEditing) {
      updateCycle.mutate(formToCycle(captured, capturedEditing.id));
    } else {
      addCycle.mutate(formToCycle(captured, 0n));
    }
  }

  const columns: DataTableColumn<ProductionCycle>[] = [
    {
      key: "id",
      header: "Cycle ID",
      render: (cycle) => (
        <span className="font-mono text-xs font-medium text-muted-foreground">
          #{cycle.id.toString()}
        </span>
      ),
    },
    {
      key: "crop",
      header: "Crop",
      render: (cycle) => (
        <span className="flex items-center gap-2 font-medium text-foreground">
          <Wheat className="size-4 text-primary" />
          {cycle.crop}
        </span>
      ),
    },
    {
      key: "farmField",
      header: "Farm/Field",
      render: (cycle) => (
        <span className="text-muted-foreground">{cycle.farmField}</span>
      ),
    },
    {
      key: "areaHa",
      header: "Area Ha",
      align: "right",
      render: (cycle) => (
        <span className="tabular-nums text-foreground">
          {formatNumber(cycle.areaHa)}
        </span>
      ),
    },
    {
      key: "expectedYield",
      header: "Expected Yield",
      align: "right",
      render: (cycle) => (
        <span className="tabular-nums text-foreground">
          {formatNumber(cycle.expectedYield)} t
        </span>
      ),
    },
    {
      key: "stage",
      header: "Stage",
      render: (cycle) => (
        <Badge
          variant="outline"
          className={
            cycle.stage === Stage.harvesting
              ? "border-chart-3 bg-chart-3/10 text-foreground"
              : cycle.stage === Stage.growing
                ? "border-chart-1 bg-chart-1/10 text-foreground"
                : "border-chart-2 bg-chart-2/10 text-foreground"
          }
        >
          {STAGE_LABELS[cycle.stage]}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (cycle) => (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          data-ocid={`crop_productions.edit_button.${cycle.id.toString()}`}
          aria-label={`Edit ${cycle.crop} cycle`}
          onClick={() => openEdit(cycle)}
        >
          <Pencil className="size-4" />
        </Button>
      ),
    },
  ];

  const marketPrices: MarketPrice[] = [
    {
      commodity: "Maize",
      price: 320000,
      unit: "50kg",
      change: 2.4,
      market: "Lilongwe",
    },
    {
      commodity: "Soybean",
      price: 480000,
      unit: "50kg",
      change: -1.2,
      market: "Lilongwe",
    },
    {
      commodity: "Groundnuts",
      price: 560000,
      unit: "50kg",
      change: 3.1,
      market: "Mzuzu",
    },
    {
      commodity: "Rice",
      price: 410000,
      unit: "50kg",
      change: 0.8,
      market: "Karonga",
    },
    {
      commodity: "Tobacco",
      price: 1250000,
      unit: "kg",
      change: 1.6,
      market: "Blantyre",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Crop Productions"
        description="Plan, monitor, and manage crop production cycles across Malawi."
        actions={
          <Button
            type="button"
            data-ocid="crop_productions.add_button"
            onClick={openAdd}
          >
            <Plus className="size-4" />
            Add Production Cycle
          </Button>
        }
      />

      {/* Key production metrics */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Active Cycles"
          value={String(activeCount)}
          subtitle={`${filtered.length} total in view`}
          icon={Sprout}
        />
        <StatCard
          title="Total Area"
          value={`${formatNumber(totalArea)} ha`}
          subtitle="Across filtered cycles"
          icon={Leaf}
        />
        <StatCard
          title="Expected Yield"
          value={`${formatNumber(totalYield)} t`}
          subtitle="Projected harvest volume"
          icon={Wheat}
        />
        <StatCard
          title="Harvesting Now"
          value={String(harvestingCount)}
          subtitle="Cycles in harvest stage"
          icon={CalendarRange}
        />
      </section>

      {/* Filters */}
      <Card className="gap-0 p-0 shadow-subtle">
        <CardContent className="grid grid-cols-1 gap-4 px-5 py-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="filter-crop">Crop</Label>
            <Select value={cropFilter} onValueChange={setCropFilter}>
              <SelectTrigger
                id="filter-crop"
                data-ocid="crop_productions.filter_crop"
                className="w-full"
              >
                <SelectValue placeholder="All crops" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All crops</SelectItem>
                {crops.map((crop) => (
                  <SelectItem key={crop} value={crop}>
                    {crop}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="filter-farm">Farm</Label>
            <Select value={farmFilter} onValueChange={setFarmFilter}>
              <SelectTrigger
                id="filter-farm"
                data-ocid="crop_productions.filter_farm"
                className="w-full"
              >
                <SelectValue placeholder="All farms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All farms</SelectItem>
                {farms.map((farm) => (
                  <SelectItem key={farm} value={farm}>
                    {farm}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="filter-status">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger
                id="filter-status"
                data-ocid="crop_productions.filter_status"
                className="w-full"
              >
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="filter-period">Time Period</Label>
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger
                id="filter-period"
                data-ocid="crop_productions.filter_period"
                className="w-full"
              >
                <SelectValue placeholder="All periods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All periods</SelectItem>
                <SelectItem value="current">Current season</SelectItem>
                <SelectItem value="past">Past season</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Gantt timeline + regional map */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="gap-0 p-0 shadow-subtle lg:col-span-2">
          <CardHeader className="px-5 pt-5">
            <CardTitle className="font-display text-base font-semibold">
              Production Cycle Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {isLoading ? (
              <div
                data-ocid="crop_productions.loading_state"
                className="flex flex-col gap-3"
              >
                {Array.from({ length: 4 }, (_, i) => `skeleton-${i}`).map(
                  (id) => (
                    <div
                      key={id}
                      className="h-6 animate-pulse rounded-md bg-muted"
                    />
                  ),
                )}
              </div>
            ) : filtered.length === 0 ? (
              <div
                data-ocid="crop_productions.empty_state"
                className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-6 py-10 text-center"
              >
                <CalendarRange className="size-8 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">
                  No cycles to display
                </p>
                <p className="text-sm text-muted-foreground">
                  Add a production cycle to see it on the timeline.
                </p>
              </div>
            ) : (
              <GanttTimeline cycles={filtered} />
            )}
          </CardContent>
        </Card>

        <Card className="gap-0 p-0 shadow-subtle">
          <CardHeader className="px-5 pt-5">
            <CardTitle className="font-display text-base font-semibold">
              Regional Crop Density
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <MalawiDensityMap cycles={filtered} />
          </CardContent>
        </Card>
      </div>

      {/* Crop production table */}
      <Card className="gap-0 p-0 shadow-subtle">
        <CardHeader className="px-5 pt-5">
          <CardTitle className="font-display text-base font-semibold">
            Crop Production Records
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {isLoading ? (
            <div
              data-ocid="crop_productions.loading_state"
              className="flex flex-col gap-3"
            >
              {Array.from({ length: 4 }, (_, i) => `skeleton-${i}`).map(
                (id) => (
                  <div
                    key={id}
                    className="h-12 animate-pulse rounded-md bg-muted"
                  />
                ),
              )}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filtered}
              rowKey={(cycle) => cycle.id.toString()}
              emptyMessage="Add your first production cycle to see it listed here."
            />
          )}
        </CardContent>
      </Card>

      {/* Weather + market prices */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <WeatherWidget />
        <MarketPriceFeed items={marketPrices} />
      </div>

      {/* Add / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-ocid="crop_productions.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editing ? "Edit Production Cycle" : "Add Production Cycle"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Update the details of this production cycle."
                : "Record a new crop production cycle for your farm."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="cycle-crop">Crop</Label>
                <Input
                  id="cycle-crop"
                  data-ocid="crop_productions.crop_input"
                  type="text"
                  placeholder="e.g. Maize"
                  value={form.crop}
                  onChange={(e) => setForm({ ...form, crop: e.target.value })}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="cycle-farm">Farm / Field</Label>
                <Input
                  id="cycle-farm"
                  data-ocid="crop_productions.farm_input"
                  type="text"
                  placeholder="e.g. Central Region - Field A"
                  value={form.farmField}
                  onChange={(e) =>
                    setForm({ ...form, farmField: e.target.value })
                  }
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="cycle-stage">Stage</Label>
                <Select
                  value={form.stage}
                  onValueChange={(value) =>
                    setForm({ ...form, stage: value as Stage })
                  }
                >
                  <SelectTrigger
                    id="cycle-stage"
                    data-ocid="crop_productions.stage_select"
                    className="w-full"
                  >
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGE_ORDER.map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {STAGE_LABELS[stage]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="cycle-status">Status</Label>
                <Input
                  id="cycle-status"
                  data-ocid="crop_productions.status_input"
                  type="text"
                  placeholder="e.g. Active"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="cycle-area">Area (Ha)</Label>
                <Input
                  id="cycle-area"
                  data-ocid="crop_productions.area_input"
                  type="number"
                  min="0"
                  step="0.1"
                  inputMode="decimal"
                  placeholder="e.g. 12.5"
                  value={form.areaHa}
                  onChange={(e) => setForm({ ...form, areaHa: e.target.value })}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="cycle-yield">Expected Yield (t)</Label>
                <Input
                  id="cycle-yield"
                  data-ocid="crop_productions.yield_input"
                  type="number"
                  min="0"
                  step="0.1"
                  inputMode="decimal"
                  placeholder="e.g. 45"
                  value={form.expectedYield}
                  onChange={(e) =>
                    setForm({ ...form, expectedYield: e.target.value })
                  }
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="cycle-start">Start Date</Label>
                <Input
                  id="cycle-start"
                  data-ocid="crop_productions.start_input"
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm({ ...form, startDate: e.target.value })
                  }
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="cycle-end">End Date (optional)</Label>
                <Input
                  id="cycle-end"
                  data-ocid="crop_productions.end_input"
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm({ ...form, endDate: e.target.value })
                  }
                />
              </div>
            </div>

            {addCycle.isError || updateCycle.isError ? (
              <p
                data-ocid="crop_productions.error_state"
                className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                Failed to save production cycle. Please try again.
              </p>
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                data-ocid="crop_productions.cancel_button"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                data-ocid="crop_productions.submit_button"
                disabled={addCycle.isPending || updateCycle.isPending}
              >
                {addCycle.isPending || updateCycle.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                {editing ? "Save Changes" : "Add Cycle"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
