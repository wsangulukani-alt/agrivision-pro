import { PageHeader } from "@/components/PageHeader";
import type { LucideIcon } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function PlaceholderPage({
  title,
  description,
  icon: Icon,
}: PlaceholderPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={title} description={description} />
      <div
        data-ocid="page.empty_state"
        className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-card px-6 py-20 text-center shadow-subtle"
      >
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="size-7" />
        </div>
        <div className="max-w-sm">
          <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
            {title} module coming soon
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            This module is part of the AgriVision Pro platform and will be
            available in an upcoming release.
          </p>
        </div>
      </div>
    </div>
  );
}
