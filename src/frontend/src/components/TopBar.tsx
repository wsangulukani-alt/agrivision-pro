import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { appName, appTagline } from "@/config/navigation";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { LogOut, Sprout } from "lucide-react";

export function TopBar() {
  const { clear } = useInternetIdentity();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-card px-4 shadow-subtle">
      <SidebarTrigger className="md:hidden" />
      <div className="flex items-center gap-2.5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground">
          <Sprout className="size-4" />
        </div>
        <div className="hidden leading-tight sm:block">
          <p className="font-display text-sm font-bold tracking-tight text-foreground">
            {appName}
          </p>
          <p className="text-[11px] text-muted-foreground">{appTagline}</p>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              data-ocid="topbar.profile"
              className="flex items-center gap-2.5 rounded-full border border-border bg-background py-1 pl-1 pr-3 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  A
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-left leading-tight sm:block">
                <span className="block text-sm font-semibold text-foreground">
                  Arthur
                </span>
                <span className="block text-[11px] text-muted-foreground">
                  Super Admin
                </span>
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="text-sm font-semibold text-foreground">Arthur</p>
              <p className="text-xs font-normal text-muted-foreground">
                Super Admin
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              data-ocid="topbar.signout"
              onSelect={() => clear()}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
