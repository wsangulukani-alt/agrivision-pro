import { UserRole, createActor } from "@/backend";
import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useCallerUserRole, useIsCallerAdmin } from "@/hooks/useQueries";
import { useActor } from "@caffeineai/core-infrastructure";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldAlert, ShieldCheck, UserCog, Users } from "lucide-react";
import { useState } from "react";

const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.admin]: "Admin",
  [UserRole.user]: "User",
  [UserRole.guest]: "Guest",
};

function roleBadgeVariant(role: UserRole) {
  if (role === UserRole.admin) return "default" as const;
  if (role === UserRole.user) return "secondary" as const;
  return "outline" as const;
}

export function UsersPage() {
  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();
  const { data: callerRole, isLoading: roleLoading } = useCallerUserRole();
  const { identity } = useInternetIdentity();
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  const [selectedRole, setSelectedRole] = useState<UserRole | "">("");
  const [error, setError] = useState<string | null>(null);

  const assignRole = useMutation({
    mutationFn: async (role: UserRole) => {
      if (!actor) throw new Error("Backend is not ready");
      if (!identity) throw new Error("No active identity");
      return actor.assignCallerUserRole(identity.getPrincipal(), role);
    },
    onSuccess: () => {
      setSelectedRole("");
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ["callerUserRole"] });
      void queryClient.invalidateQueries({ queryKey: ["isCallerAdmin"] });
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : "Failed to update role");
    },
  });

  if (adminLoading || roleLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Users"
          description="Manage platform users, roles, and access permissions."
        />
        <div
          data-ocid="users.access_denied"
          className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 px-6 py-16 text-center"
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-warning/15 text-warning">
            <ShieldAlert className="size-6" />
          </div>
          <h2 className="font-display text-lg font-bold text-foreground">
            Super Admin access required
          </h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Only a Super Admin can view and manage platform users and their
            access permissions. Contact your administrator if you believe this
            is a mistake.
          </p>
        </div>
      </div>
    );
  }

  const currentRole = callerRole ?? UserRole.user;

  const rows = [
    {
      name: identity?.getPrincipal().toText() ?? "Current user",
      role: currentRole,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Users"
        description="Manage platform users, roles, and access permissions."
        actions={
          <Badge variant="secondary" className="gap-1.5">
            <ShieldCheck className="size-3.5" />
            Super Admin
          </Badge>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="gap-0 p-0 shadow-subtle lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <Users className="size-4 text-primary" />
              Platform users
            </CardTitle>
            <CardDescription>
              Registered users and their current access roles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                {
                  key: "name",
                  header: "User",
                  render: (row) => (
                    <span className="font-medium text-foreground">
                      {row.name}
                    </span>
                  ),
                },
                {
                  key: "role",
                  header: "Role",
                  render: (row) => (
                    <Badge variant={roleBadgeVariant(row.role)}>
                      {ROLE_LABELS[row.role]}
                    </Badge>
                  ),
                },
              ]}
              data={rows}
              rowKey={(row) => row.name}
              emptyMessage="No platform users have been registered yet."
            />
          </CardContent>
        </Card>

        <Card className="gap-0 p-0 shadow-subtle">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <UserCog className="size-4 text-primary" />
              Access management
            </CardTitle>
            <CardDescription>
              Assign a role to the signed-in user. Role changes take effect
              immediately.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="role-select"
                className="text-sm font-medium text-foreground"
              >
                Role
              </label>
              <Select
                value={selectedRole}
                onValueChange={(value) => setSelectedRole(value as UserRole)}
              >
                <SelectTrigger id="role-select" className="w-full">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UserRole.admin}>Admin</SelectItem>
                  <SelectItem value={UserRole.user}>User</SelectItem>
                  <SelectItem value={UserRole.guest}>Guest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error ? (
              <p
                data-ocid="users.error_state"
                className="text-sm text-destructive"
              >
                {error}
              </p>
            ) : null}

            <Button
              type="button"
              data-ocid="users.assign_role_button"
              disabled={!selectedRole || assignRole.isPending}
              onClick={() => {
                if (selectedRole) assignRole.mutate(selectedRole);
              }}
            >
              {assignRole.isPending ? "Saving…" : "Assign role"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
