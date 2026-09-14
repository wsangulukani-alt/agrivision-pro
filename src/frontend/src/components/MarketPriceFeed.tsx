import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { MarketPrice } from "@/types";
import { TrendingDown, TrendingUp } from "lucide-react";

interface MarketPriceFeedProps {
  title?: string;
  items: MarketPrice[];
}

export function MarketPriceFeed({
  title = "Market Prices",
  items,
}: MarketPriceFeedProps) {
  return (
    <Card className="gap-0 p-0 shadow-subtle">
      <CardHeader className="px-5 pt-5">
        <CardTitle className="font-display text-base font-semibold">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <ul className="divide-y divide-border">
          {items.map((item) => {
            const up = item.change >= 0;
            return (
              <li
                key={item.commodity}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {item.commodity}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.market}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
                    MWK {item.price.toLocaleString()}
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                      /{item.unit}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "flex items-center gap-0.5 text-xs font-medium tabular-nums",
                      up ? "text-success" : "text-destructive",
                    )}
                  >
                    {up ? (
                      <TrendingUp className="size-3.5" />
                    ) : (
                      <TrendingDown className="size-3.5" />
                    )}
                    {up ? "+" : ""}
                    {item.change}%
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
