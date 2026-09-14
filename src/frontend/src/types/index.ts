import type { LucideIcon } from "lucide-react";

/** A single navigation item shown in the sidebar. */
export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

/** A sidebar group grouping related navigation items under a module label. */
export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Props shared by every page header. */
export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

/** A key performance indicator card. */
export interface KpiCardProps {
  label: string;
  value: string;
  delta?: string;
  trend?: "up" | "down" | "neutral";
  icon: LucideIcon;
}

/** A generic stat card. */
export interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
}

/** A column definition for the shared data table. */
export interface DataTableColumn<T> {
  key: string;
  header: string;
  align?: "left" | "right";
  render?: (row: T) => React.ReactNode;
}

/** A single commodity price entry in the market price feed. */
export interface MarketPrice {
  commodity: string;
  price: number;
  unit: string;
  change: number;
  market: string;
}

/** A single forecast entry in the weather widget. */
export interface ForecastDay {
  day: string;
  condition: string;
  high: number;
  low: number;
  icon: LucideIcon;
}
