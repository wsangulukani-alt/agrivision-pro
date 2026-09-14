import { Card, CardContent } from "@/components/ui/card";
import type { StatCardProps } from "@/types";

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: StatCardProps) {
  return (
    <Card className="gap-0 p-0 shadow-subtle">
      <CardContent className="flex items-center gap-4 px-5 py-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-muted-foreground">
            {title}
          </p>
          <p className="font-display text-xl font-bold tracking-tight text-foreground">
            {value}
          </p>
          {subtitle ? (
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
