import type { Sale } from "@/backend";
import { DataTable } from "@/components/DataTable";
import { KpiCard } from "@/components/KpiCard";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAddSale, useSales } from "@/hooks/useQueries";
import type { DataTableColumn } from "@/types";
import { Receipt, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { useMemo, useState } from "react";

/** Converts a backend nanosecond timestamp to a readable date string. */
function formatDate(timestamp: bigint): string {
  const date = new Date(Number(timestamp / 1_000_000n));
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-MW", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Formats a monetary value as MWK. */
function formatMWK(amount: number): string {
  return `MWK ${amount.toLocaleString("en-MW", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

const columns: DataTableColumn<Sale>[] = [
  { key: "crop", header: "Crop" },
  { key: "farm", header: "Farm" },
  { key: "buyer", header: "Buyer" },
  { key: "date", header: "Date", render: (row) => formatDate(row.date) },
  { key: "quantity", header: "Quantity", align: "right" },
  {
    key: "unitPrice",
    header: "Unit Price",
    align: "right",
    render: (row) => formatMWK(row.unitPrice),
  },
  {
    key: "totalAmount",
    header: "Total",
    align: "right",
    render: (row) => (
      <span className="font-semibold text-foreground">
        {formatMWK(row.totalAmount)}
      </span>
    ),
  },
];

export function SalesPage() {
  const { data: sales = [], isLoading } = useSales();
  const addSale = useAddSale();

  const [crop, setCrop] = useState("");
  const [farm, setFarm] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [buyer, setBuyer] = useState("");
  const [error, setError] = useState<string | null>(null);

  const quantityNum = Number(quantity);
  const unitPriceNum = Number(unitPrice);
  const totalAmount = quantityNum * unitPriceNum;

  const canSubmit =
    crop.trim() !== "" &&
    farm.trim() !== "" &&
    buyer.trim() !== "" &&
    quantityNum > 0 &&
    unitPriceNum > 0;

  const totalRevenue = useMemo(
    () => sales.reduce((sum, sale) => sum + sale.totalAmount, 0),
    [sales],
  );
  const totalQuantity = useMemo(
    () => sales.reduce((sum, sale) => sum + sale.quantity, 0),
    [sales],
  );
  const uniqueBuyers = useMemo(
    () => new Set(sales.map((sale) => sale.buyer)).size,
    [sales],
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    setError(null);
    const captured = {
      crop: crop.trim(),
      farm: farm.trim(),
      buyer: buyer.trim(),
      quantity: quantityNum,
      unitPrice: unitPriceNum,
      totalAmount,
      id: 0n,
      date: BigInt(Date.now()) * 1_000_000n,
    };
    setCrop("");
    setFarm("");
    setQuantity("");
    setUnitPrice("");
    setBuyer("");
    addSale.mutate(captured, {
      onError: () => {
        setError("Unable to record the sale. Please try again.");
        setCrop(captured.crop);
        setFarm(captured.farm);
        setBuyer(captured.buyer);
        setQuantity(String(captured.quantity));
        setUnitPrice(String(captured.unitPrice));
      },
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Sales"
        description="Record sales transactions and track revenue in MWK."
      />

      {/* KPI row */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Revenue"
          value={formatMWK(totalRevenue)}
          icon={TrendingUp}
        />
        <KpiCard
          label="Transactions"
          value={String(sales.length)}
          icon={Receipt}
        />
        <KpiCard
          label="Quantity Sold"
          value={`${totalQuantity.toLocaleString("en-MW")} kg`}
          icon={ShoppingCart}
        />
        <KpiCard label="Buyers" value={String(uniqueBuyers)} icon={Users} />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Record sale form */}
        <Card className="gap-0 p-0 shadow-subtle lg:col-span-1">
          <CardHeader className="px-5 pt-5">
            <CardTitle className="font-display text-base font-semibold">
              Record New Sale
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sale-crop">Crop</Label>
                <Input
                  id="sale-crop"
                  data-ocid="sale.crop_input"
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                  placeholder="e.g. Maize"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sale-farm">Farm</Label>
                <Input
                  id="sale-farm"
                  data-ocid="sale.farm_input"
                  value={farm}
                  onChange={(e) => setFarm(e.target.value)}
                  placeholder="e.g. Lilongwe Farm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="sale-quantity">Quantity (kg)</Label>
                  <Input
                    id="sale-quantity"
                    data-ocid="sale.quantity_input"
                    type="number"
                    min="0"
                    step="any"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="sale-unit-price">Unit Price (MWK)</Label>
                  <Input
                    id="sale-unit-price"
                    data-ocid="sale.unit_price_input"
                    type="number"
                    min="0"
                    step="any"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sale-buyer">Buyer</Label>
                <Input
                  id="sale-buyer"
                  data-ocid="sale.buyer_input"
                  value={buyer}
                  onChange={(e) => setBuyer(e.target.value)}
                  placeholder="e.g. GreenFields Co-op"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2.5">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="font-display text-base font-bold text-foreground">
                  {Number.isFinite(totalAmount) && totalAmount > 0
                    ? formatMWK(totalAmount)
                    : "MWK 0"}
                </span>
              </div>

              {error ? (
                <p
                  data-ocid="sale.error_state"
                  className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {error}
                </p>
              ) : null}

              <Button
                type="submit"
                data-ocid="sale.submit_button"
                disabled={!canSubmit || addSale.isPending}
              >
                {addSale.isPending ? "Recording…" : "Record Sale"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Sales table */}
        <Card className="gap-0 p-0 shadow-subtle lg:col-span-2">
          <CardHeader className="px-5 pt-5">
            <CardTitle className="font-display text-base font-semibold">
              Sales Transactions
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {isLoading ? (
              <div
                data-ocid="sale.loading_state"
                className="flex flex-col gap-3"
              >
                {Array.from({ length: 5 }, (_, i) => `skeleton-${i}`).map(
                  (id) => (
                    <Skeleton key={id} className="h-10 w-full" />
                  ),
                )}
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={sales}
                rowKey={(sale) => String(sale.id)}
                emptyMessage="Record your first sale to start tracking revenue."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
