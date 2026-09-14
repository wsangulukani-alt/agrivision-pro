import type { NavGroup } from "@/types";
import {
  BarChart3,
  Boxes,
  ClipboardList,
  CreditCard,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Leaf,
  Newspaper,
  Receipt,
  Sprout,
  Users,
  Wheat,
} from "lucide-react";

export const navGroups: NavGroup[] = [
  {
    label: "Dashboard",
    items: [{ label: "Dashboard", to: "/", icon: LayoutDashboard }],
  },
  {
    label: "Agriculture",
    items: [
      { label: "Farms", to: "/farms", icon: Leaf },
      { label: "Crops", to: "/crops", icon: Wheat },
      { label: "Crop Productions", to: "/crop-productions", icon: Sprout },
      { label: "News Management", to: "/news-management", icon: Newspaper },
    ],
  },
  {
    label: "Sales & Finance",
    items: [
      { label: "Sales", to: "/sales", icon: Receipt },
      { label: "Payments", to: "/payments", icon: CreditCard },
      { label: "Reports", to: "/reports", icon: FileText },
      { label: "Sales Reports", to: "/sales-reports", icon: BarChart3 },
    ],
  },
  {
    label: "Users",
    items: [{ label: "Users", to: "/users", icon: Users }],
  },
  {
    label: "Inventory",
    items: [{ label: "Inventory", to: "/inventory", icon: Boxes }],
  },
  {
    label: "Help & Support",
    items: [{ label: "Help & Support", to: "/help", icon: HelpCircle }],
  },
];

export const appName = "AgriVision Pro";
export const appTagline = "For Sustainable Development";
