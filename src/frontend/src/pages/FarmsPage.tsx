import { createActor } from "@/backend";
import type { Farm } from "@/backend";
import { FarmStatus } from "@/backend";
import { DataTable } from "@/components/DataTable";
import { KpiCard } from "@/components/KpiCard";
import { PageHeader } from "@/components/PageHeader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import type { DataTableColumn } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Leaf,
  Map as MapIcon,
  MapPin,
  Pencil,
  Plus,
  Sprout,
  Trash2,
  Users,
} from "lucide-react";
import { useState } from "react";

interface FarmFormState {
  name: string;
  location: string;
  totalAreaHa: string;
  manager: string;
  keyCrops: string;
}

const EMPTY_FORM: FarmFormState = {
  name: "",
  location: "",
  totalAreaHa: "",
  manager: "",
  keyCrops: "",
};

function useListFarms() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["farms"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listFarms();
    },
    enabled: !!actor && !isFetching,
  });
}

function useAddFarm() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (farm: Farm) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.addFarm(farm);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["farms"] });
    },
  });
}

function useUpdateFarm() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (farm: Farm) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.updateFarm(farm);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["farms"] });
    },
  });
}

function useDeleteFarm() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.deleteFarm(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["farms"] });
    },
  });
}

function formatArea(area: number): string {
  return `${area.toLocaleString("en-MW")} ha`;
}

function FarmStatusBadge({ status }: { status: FarmStatus }) {
  return status === FarmStatus.active ? (
    <Badge className="bg-success/15 text-success">Active</Badge>
  ) : (
    <Badge variant="secondary">Inactive</Badge>
  );
}

/** Stylized map snippet shown in the farm profile quick view. */
function MapSnippet({ farm }: { farm: Farm }) {
  return (
    <div
      data-ocid="map_snippet"
      className="relative overflow-hidden rounded-lg border border-border bg-muted/40"
      aria-label={`Map location for ${farm.name}`}
    >
      <svg
        viewBox="0 0 400 220"
        className="h-44 w-full"
        role="img"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="grid"
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 24 0 L 0 0 0 24"
              fill="none"
              stroke="oklch(0.5 0.13 145 / 0.12)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="400" height="220" fill="url(#grid)" />
        <path
          d="M 40 180 C 90 150 120 120 150 90 C 180 60 220 40 260 50 C 300 60 330 90 350 130 C 360 150 355 180 330 195 C 300 210 260 215 220 210 C 180 205 140 200 100 195 C 70 190 50 188 40 180 Z"
          fill="oklch(0.5 0.13 145 / 0.18)"
          stroke="oklch(0.42 0.13 145 / 0.5)"
          strokeWidth="1.5"
        />
        <path
          d="M 90 150 C 130 130 170 120 210 130 C 250 140 280 160 300 185"
          fill="none"
          stroke="oklch(0.82 0.15 90 / 0.6)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="210" cy="130" r="7" fill="oklch(0.55 0.22 25 / 0.15)" />
        <circle
          cx="210"
          cy="130"
          r="5"
          fill="oklch(0.55 0.22 25)"
          stroke="white"
          strokeWidth="1.5"
        />
      </svg>
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-md bg-background/90 px-2 py-1 text-xs font-medium text-foreground shadow-subtle">
        <MapPin className="size-3.5 text-primary" />
        {farm.location}
      </div>
    </div>
  );
}

function FarmFormDialog({
  open,
  onOpenChange,
  farm,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  farm: Farm | null;
  onSaved: () => void;
}) {
  const addFarm = useAddFarm();
  const updateFarm = useUpdateFarm();
  const isEditing = farm !== null;

  const [form, setForm] = useState<FarmFormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  // Initialize the draft when opening for an existing farm.
  const [initializedFor, setInitializedFor] = useState<bigint | null>(null);
  if (open && isEditing && initializedFor !== farm.id) {
    setForm({
      name: farm.name,
      location: farm.location,
      totalAreaHa: String(farm.totalAreaHa),
      manager: farm.manager,
      keyCrops: farm.keyCrops.join(", "),
    });
    setInitializedFor(farm.id);
  }
  if (open && !isEditing && initializedFor !== null) {
    setForm(EMPTY_FORM);
    setInitializedFor(null);
  }

  const set = (field: keyof FarmFormState) => (value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const canSubmit =
    form.name.trim() !== "" &&
    form.location.trim() !== "" &&
    form.manager.trim() !== "" &&
    form.totalAreaHa.trim() !== "" &&
    !addFarm.isPending &&
    !updateFarm.isPending;

  const handleSubmit = () => {
    const area = Number(form.totalAreaHa);
    if (Number.isNaN(area) || area <= 0) {
      setError("Total area must be a positive number in hectares.");
      return;
    }
    const keyCrops = form.keyCrops
      .split(",")
      .map((crop) => crop.trim())
      .filter((crop) => crop !== "");

    const payload: Farm = {
      id: farm?.id ?? 0n,
      name: form.name.trim(),
      location: form.location.trim(),
      totalAreaHa: area,
      manager: form.manager.trim(),
      keyCrops,
      status: farm?.status ?? FarmStatus.active,
    };

    if (isEditing) {
      updateFarm.mutate(payload, {
        onSuccess: () => {
          setForm(EMPTY_FORM);
          setError(null);
          onSaved();
        },
        onError: (err) => setError(err.message),
      });
    } else {
      addFarm.mutate(payload, {
        onSuccess: () => {
          setForm(EMPTY_FORM);
          setError(null);
          onSaved();
        },
        onError: (err) => setError(err.message),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Farm" : "Add New Farm"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details for this farm."
              : "Register a new farm in the AgriVision Pro system."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="farm-name">Farm Name</Label>
            <Input
              id="farm-name"
              data-ocid="farm.input.name"
              value={form.name}
              onChange={(e) => set("name")(e.target.value)}
              placeholder="e.g. Lilongwe Central Estate"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="farm-location">Location</Label>
            <Input
              id="farm-location"
              data-ocid="farm.input.location"
              value={form.location}
              onChange={(e) => set("location")(e.target.value)}
              placeholder="e.g. Lilongwe, Central Region"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="farm-area">Total Area (Ha)</Label>
              <Input
                id="farm-area"
                data-ocid="farm.input.area"
                type="number"
                min="0"
                step="0.1"
                value={form.totalAreaHa}
                onChange={(e) => set("totalAreaHa")(e.target.value)}
                placeholder="e.g. 120"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="farm-manager">Manager</Label>
              <Input
                id="farm-manager"
                data-ocid="farm.input.manager"
                value={form.manager}
                onChange={(e) => set("manager")(e.target.value)}
                placeholder="e.g. Grace Banda"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="farm-crops">Key Crops</Label>
            <Textarea
              id="farm-crops"
              data-ocid="farm.input.crops"
              value={form.keyCrops}
              onChange={(e) => set("keyCrops")(e.target.value)}
              placeholder="Comma-separated, e.g. Maize, Soybean, Groundnut"
              rows={2}
            />
          </div>
          {error ? (
            <p
              data-ocid="farm.form_error"
              className="text-sm font-medium text-destructive"
            >
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            data-ocid="farm.cancel_button"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            data-ocid="farm.submit_button"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {isEditing ? "Save Changes" : "Add Farm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FarmProfileSheet({
  farm,
  onClose,
}: {
  farm: Farm | null;
  onClose: () => void;
}) {
  return (
    <Sheet open={farm !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {farm ? (
          <>
            <SheetHeader>
              <div className="flex items-center gap-3 pr-8">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Leaf className="size-5" />
                </div>
                <div className="min-w-0">
                  <SheetTitle className="truncate">{farm.name}</SheetTitle>
                  <SheetDescription className="flex items-center gap-1">
                    <MapPin className="size-3.5" />
                    {farm.location}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="px-4">
              <MapSnippet farm={farm} />

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Farm ID
                  </p>
                  <p className="mt-1 font-display text-lg font-bold text-foreground">
                    #{farm.id.toString()}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Status
                  </p>
                  <div className="mt-1">
                    <FarmStatusBadge status={farm.status} />
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Total Area
                  </p>
                  <p className="mt-1 font-display text-lg font-bold text-foreground">
                    {formatArea(farm.totalAreaHa)}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Manager
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <Users className="size-4 text-primary" />
                    {farm.manager}
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Key Crops
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {farm.keyCrops.length > 0 ? (
                    farm.keyCrops.map((crop) => (
                      <Badge key={crop} variant="secondary" className="gap-1">
                        <Sprout className="size-3 text-primary" />
                        {crop}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No crops recorded yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

export function FarmsPage() {
  const { data: farms = [], isLoading } = useListFarms();
  const deleteFarm = useDeleteFarm();

  const [formOpen, setFormOpen] = useState(false);
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
  const [profileFarm, setProfileFarm] = useState<Farm | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Farm | null>(null);

  const totalArea = farms.reduce((sum, farm) => sum + farm.totalAreaHa, 0);
  const activeFarms = farms.filter(
    (farm) => farm.status === FarmStatus.active,
  ).length;

  const columns: DataTableColumn<Farm>[] = [
    {
      key: "id",
      header: "Farm ID",
      render: (farm) => (
        <span className="font-mono text-sm text-muted-foreground">
          #{farm.id.toString()}
        </span>
      ),
    },
    {
      key: "name",
      header: "Farm Name",
      render: (farm) => (
        <button
          type="button"
          data-ocid={`farm.profile_button.${farm.id.toString()}`}
          onClick={() => setProfileFarm(farm)}
          className="text-left font-medium text-primary hover:underline"
        >
          {farm.name}
        </button>
      ),
    },
    { key: "location", header: "Location" },
    {
      key: "totalAreaHa",
      header: "Total Area (Ha)",
      align: "right",
      render: (farm) => (
        <span className="tabular-nums">{formatArea(farm.totalAreaHa)}</span>
      ),
    },
    { key: "manager", header: "Manager" },
    {
      key: "keyCrops",
      header: "Key Crops",
      render: (farm) => (
        <div className="flex max-w-56 flex-wrap gap-1">
          {farm.keyCrops.slice(0, 3).map((crop) => (
            <Badge key={crop} variant="secondary">
              {crop}
            </Badge>
          ))}
          {farm.keyCrops.length > 3 ? (
            <Badge variant="outline">+{farm.keyCrops.length - 3}</Badge>
          ) : null}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (farm) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            data-ocid={`farm.edit_button.${farm.id.toString()}`}
            aria-label={`Edit ${farm.name}`}
            onClick={() => {
              setEditingFarm(farm);
              setFormOpen(true);
            }}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            data-ocid={`farm.delete_button.${farm.id.toString()}`}
            aria-label={`Delete ${farm.name}`}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setDeleteTarget(farm)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Farms"
        description="Manage farm records, locations, and ownership across Malawi."
        actions={
          <Button
            type="button"
            data-ocid="farm.add_button"
            onClick={() => {
              setEditingFarm(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" />
            Add New Farm
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <KpiCard
          label="Total Managed Area"
          value={`${totalArea.toLocaleString("en-MW")} ha`}
          delta={`${farms.length} farms`}
          trend="neutral"
          icon={MapIcon}
        />
        <KpiCard
          label="Active Farms"
          value={activeFarms.toString()}
          delta={`${farms.length - activeFarms} inactive`}
          trend="neutral"
          icon={Leaf}
        />
      </div>

      {isLoading ? (
        <div
          data-ocid="farm.loading_state"
          className="flex flex-col gap-3 rounded-lg border border-border p-4"
        >
          {Array.from({ length: 5 }, (_, i) => `skeleton-${i}`).map((id) => (
            <Skeleton key={id} className="h-10 w-full" />
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={farms}
          rowKey={(farm) => farm.id.toString()}
          emptyMessage="No farms registered yet. Add your first farm to get started."
        />
      )}

      <FarmFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        farm={editingFarm}
        onSaved={() => setFormOpen(false)}
      />

      <FarmProfileSheet
        farm={profileFarm}
        onClose={() => setProfileFarm(null)}
      />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this farm?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.name}
              </span>{" "}
              and its records from the system. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="farm.delete_cancel">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="farm.delete_confirm"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) {
                  deleteFarm.mutate(deleteTarget.id);
                }
                setDeleteTarget(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
