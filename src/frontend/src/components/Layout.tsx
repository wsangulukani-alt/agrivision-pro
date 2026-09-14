import { AppSidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { appName } from "@/config/navigation";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Navigate, Outlet } from "@tanstack/react-router";

export function Layout() {
  const { isAuthenticated, isInitializing } = useInternetIdentity();

  if (isInitializing) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">
            Loading AgriVision Pro…
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <TopBar />
        <main className="flex-1 bg-background">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
        <footer className="border-t border-border bg-muted/40 px-4 py-4 sm:px-6">
          <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
            <p className="text-xs text-muted-foreground">{appName}</p>
            <p className="text-xs text-muted-foreground">
              Developed by AS developers network @ 2026
            </p>
          </div>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
