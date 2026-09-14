import { createActor } from "@/backend";
import { DataTable } from "@/components/DataTable";
import { KpiCard } from "@/components/KpiCard";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import type { DataTableColumn } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Boxes,
  PackageCheck,
  PackageX,
  Plus,
} from "lucide-react";
import { useState } from "react";

/** Inventory status values mirror the backend InventoryStatus variant. */
export enum InventoryStatus {
  inStock = "inStock",
  lowStock = "lowStock",
  critical = "critical",
}

/** Inventory item shape mirrors the backend InventoryItem record. */
export interface InventoryItem {
  id: bigint;
  name: string;
  quantity: number;
  unit: string;
  status: InventoryStatus;
  threshold: number;
}

/** The backend actor surface for inventory operations. */
interface InventoryActor {
  listInventoryItems(): Promise<InventoryItem[]>;
  addInventoryItem(item: Omit<InventoryItem, "id">): Promise<bigint>;
}

const statusMeta: Record<
  InventoryStatus,
  { label: string; className: string }
> = {
  [InventoryStatus.inStock]: {
    label: "In Stock",
    className: "bg-success/15 text-success-foreground",
  },
  [InventoryStatus.lowStock]: {
    label: "Low Stock",
    className: "bg-warning/15 text-warning-foreground",
  },
  [InventoryStatus.critical]: {
    label: "Critical",
    className: "bg-destructive/15 text-destructive-foreground",
  },
};

const unitOptions = ["bags", "kg", "L", "units", "litres", "tonnes"];

function useInventoryItems() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["inventoryItems"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as unknown as InventoryActor).listInventoryItems();
    },
    enabled: !!actor && !isFetching,
  });
}

function useAddInventoryItem() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: Omit<InventoryItem, "id">) => {
      if (!actor) throw new Error("Backend is not ready");
      return (actor as unknown as InventoryActor).addInventoryItem(item);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["inventoryItems"] });
    },
  });
}

export function InventoryPage() {
  const { data: items = [], isLoading } = useInventoryItems();
  const addItem = useAddInventoryItem();

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("bags");
  const [threshold, setThreshold] = useState("");

  const totalItems = items.length;
  const lowStockCount = items.filter(
    (item) => item.status === InventoryStatus.lowStock,
  ).length;
  const criticalCount = items.filter(
    (item) => item.status === InventoryStatus.critical,
  ).length;
  const inStockCount = items.filter(
    (item) => item.status === InventoryStatus.inStock,
  ).length;

  const canSubmit =
    name.trim().length > 0 &&
    quantity.trim().length > 0 &&
    threshold.trim().length > 0;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;
    const qty = Number(quantity);
    const thr = Number(threshold);
    if (Number.isNaN(qty) || Number.isNaN(thr)) return;

    const captured = {
      name: name.trim(),
      quantity: qty,
      unit,
      threshold: thr,
      status: qty <= 0 ? InventoryStatus.critical : InventoryStatus.inStock,
    };

    setName("");
    setQuantity("");
    setThreshold("");
    setUnit("bags");

    addItem.mutate(captured, {
      onError: () => {
        setName((current) => (current === "" ? captured.name : current));
      },
    });
  };

  const columns: DataTableColumn<InventoryItem>[] = [
    {
      key: "name",
      header: "Item",
      render: (item) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{item.name}</p>
          <p className="text-xs text-muted-foreground">
            Reorder at {item.threshold} {item.unit}
          </p>
        </div>
      ),
    },
    {
      key: "quantity",
      header: "Quantity",
      align: "right",
      render: (item) => (
        <span className="tabular-nums text-foreground">
          {item.quantity} {item.unit}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item) => (
        <Badge
          variant="secondary"
          className={statusMeta[item.status].className}
        >
          {statusMeta[item.status].label}
        </Badge>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Inventory"
        description="Track farm inputs, produce, and equipment stock levels across your operations."
      />

      {/* KPI row */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Items" value={String(totalItems)} icon={Boxes} />
        <KpiCard
          label="In Stock"
          value={String(inStockCount)}
          icon={PackageCheck}
        />
        <KpiCard
          label="Low Stock"
          value={String(lowStockCount)}
          icon={AlertTriangle}
        />
        <KpiCard
          label="Critical"
          value={String(criticalCount)}
          icon={PackageX}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Add item form */}
        <Card className="gap-0 p-0 shadow-subtle lg:col-span-1">
          <CardHeader className="px-5 pt-5">
            <CardTitle className="font-display text-base font-semibold">
              Add Inventory Item
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="item-name">Item name</Label>
                <Input
                  id="item-name"
                  data-ocid="inventory.name_input"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Fertilizer (NPK)"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="item-quantity">Quantity</Label>
                  <Input
                    id="item-quantity"
                    data-ocid="inventory.quantity_input"
                    type="number"
                    min="0"
                    step="any"
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="item-unit">Unit</Label>
                  <Select value={unit} onValueChange={setUnit}>
                    <SelectTrigger
                      id="item-unit"
                      data-ocid="inventory.unit_select"
                    >
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {unitOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="item-threshold">Reorder threshold</Label>
                <Input
                  id="item-threshold"
                  data-ocid="inventory.threshold_input"
                  type="number"
                  min="0"
                  step="any"
                  value={threshold}
                  onChange={(event) => setThreshold(event.target.value)}
                  placeholder="e.g. 20"
                />
                <p className="text-xs text-muted-foreground">
                  Stock below this level is flagged as low or critical.
                </p>
              </div>

              {addItem.isError ? (
                <p
                  data-ocid="inventory.error_state"
                  className="text-sm text-destructive"
                >
                  Could not save the item. Please try again.
                </p>
              ) : null}

              <Button
                type="submit"
                data-ocid="inventory.add_button"
                disabled={!canSubmit || addItem.isPending}
              >
                <Plus className="size-4" />
                {addItem.isPending ? "Saving…" : "Add Item"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Inventory list */}
        <Card className="gap-0 p-0 shadow-subtle lg:col-span-2">
          <CardHeader className="px-5 pt-5">
            <CardTitle className="font-display text-base font-semibold">
              Inventory Items
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {isLoading ? (
              <div
                data-ocid="inventory.loading_state"
                className="flex flex-col gap-3"
              >
                {Array.from({ length: 4 }, (_, i) => `skeleton-${i}`).map(
                  (id) => (
                    <Skeleton key={id} className="h-12 w-full" />
                  ),
                )}
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={items}
                rowKey={(item) => item.id.toString()}
                emptyMessage="Add your first inventory item to start tracking stock."
              />
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
