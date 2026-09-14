import { createActor } from "@/backend";
import { PaymentStatus } from "@/backend";
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
import type { DataTableColumn } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard, Loader2, Plus } from "lucide-react";
import { useState } from "react";

type Payment = {
  id: bigint;
  status: PaymentStatus;
  date: bigint;
  description: string;
  amount: number;
};

function timestampToDate(timestamp: bigint): Date | null {
  const date = new Date(Number(timestamp / 1_000_000n));
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatMWK(amount: number): string {
  return `MWK ${amount.toLocaleString("en-MW", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(timestamp: bigint): string {
  const date = timestampToDate(timestamp);
  if (!date) return "—";
  return date.toLocaleDateString("en-MW", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function useListPayments() {
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

function useAddPayment() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payment: Payment) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.addPayment(payment);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });
}

export function PaymentsPage() {
  const { data: payments = [], isLoading } = useListPayments();
  const addPayment = useAddPayment();

  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<PaymentStatus>(PaymentStatus.pending);
  const [description, setDescription] = useState("");

  const totalReceived = payments.reduce(
    (sum, payment) => sum + payment.amount,
    0,
  );
  const pendingTotal = payments
    .filter((payment) => payment.status === PaymentStatus.pending)
    .reduce((sum, payment) => sum + payment.amount, 0);
  const processedTotal = payments
    .filter((payment) => payment.status === PaymentStatus.processed)
    .reduce((sum, payment) => sum + payment.amount, 0);

  const canSubmit = amount.trim() !== "" && Number(amount) > 0;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsedAmount = Number(amount);
    if (!canSubmit) return;

    const capturedAmount = parsedAmount;
    const capturedStatus = status;
    const capturedDescription = description.trim();
    setAmount("");
    setDescription("");

    addPayment.mutate(
      {
        id: 0n,
        amount: capturedAmount,
        status: capturedStatus,
        date: BigInt(Date.now()) * 1_000_000n,
        description: capturedDescription,
      },
      {
        onError: () => {
          setAmount((current) =>
            current === "" ? String(capturedAmount) : current,
          );
          setDescription((current) =>
            current === "" ? capturedDescription : current,
          );
        },
      },
    );
  }

  const columns: DataTableColumn<Payment>[] = [
    {
      key: "description",
      header: "Description",
      render: (payment) => (
        <span className="font-medium text-foreground">
          {payment.description || "Payment"}
        </span>
      ),
    },
    {
      key: "date",
      header: "Date",
      render: (payment) => (
        <span className="text-muted-foreground">
          {formatDate(payment.date)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (payment) => (
        <Badge
          variant={
            payment.status === PaymentStatus.processed ? "default" : "secondary"
          }
          className={
            payment.status === PaymentStatus.pending
              ? "bg-warning/15 text-warning-foreground"
              : "bg-success/15 text-success-foreground"
          }
        >
          {payment.status === PaymentStatus.processed ? "Processed" : "Pending"}
        </Badge>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (payment) => (
        <span className="font-semibold tabular-nums text-foreground">
          {formatMWK(payment.amount)}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Payments"
        description="Record and track payments received across your operations in MWK."
      />

      {/* Summary KPIs */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label="Total Received"
          value={formatMWK(totalReceived)}
          icon={CreditCard}
        />
        <KpiCard
          label="Pending"
          value={formatMWK(pendingTotal)}
          delta={`${payments.filter((p) => p.status === PaymentStatus.pending).length} awaiting processing`}
          trend="neutral"
          icon={CreditCard}
        />
        <KpiCard
          label="Processed"
          value={formatMWK(processedTotal)}
          delta={`${payments.filter((p) => p.status === PaymentStatus.processed).length} completed`}
          trend="up"
          icon={CreditCard}
        />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Record payment form */}
        <Card className="gap-0 p-0 shadow-subtle lg:col-span-1">
          <CardHeader className="px-5 pt-5">
            <CardTitle className="font-display text-base font-semibold">
              Record Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="payment-amount">Amount (MWK)</Label>
                <Input
                  id="payment-amount"
                  data-ocid="payment.amount_input"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="e.g. 150000"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="payment-status">Status</Label>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as PaymentStatus)}
                >
                  <SelectTrigger
                    id="payment-status"
                    data-ocid="payment.status_select"
                    className="w-full"
                  >
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={PaymentStatus.pending}>
                      Pending
                    </SelectItem>
                    <SelectItem value={PaymentStatus.processed}>
                      Processed
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="payment-description">Description</Label>
                <Input
                  id="payment-description"
                  data-ocid="payment.description_input"
                  type="text"
                  placeholder="e.g. Maize sale from GreenFields Co-op"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </div>

              {addPayment.isError ? (
                <p
                  data-ocid="payment.error_state"
                  className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  Failed to record payment. Please try again.
                </p>
              ) : null}

              <Button
                type="submit"
                data-ocid="payment.submit_button"
                disabled={!canSubmit || addPayment.isPending}
                className="w-full"
              >
                {addPayment.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                {addPayment.isPending ? "Recording…" : "Record Payment"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Payments table */}
        <Card className="gap-0 p-0 shadow-subtle lg:col-span-2">
          <CardHeader className="px-5 pt-5">
            <CardTitle className="font-display text-base font-semibold">
              Payment History
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {isLoading ? (
              <div
                data-ocid="payment.loading_state"
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
                data={payments}
                rowKey={(payment) => payment.id.toString()}
                emptyMessage="Record your first payment to see it listed here."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
