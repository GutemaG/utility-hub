import * as React from "react";
import { createRootRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { AppSidebar } from "@/components/app-sidebar";
import { CommandPalette } from "@/components/command-palette";
import { InstallPwaButton } from "@/components/install-pwa-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { navigationGroups } from "@/config/navigation";
import { recordToolUsage } from "@/lib/tool-preferences";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const TanStackRouterDevtools = import.meta.env.DEV
  ? React.lazy(() =>
      import("@tanstack/react-router-devtools").then((m) => ({
        default: m.TanStackRouterDevtools,
      }))
    )
  : () => null;

const knownToolUrls = new Set(
  navigationGroups.flatMap((group) => group.items.map((item) => item.url))
);

function RootLayout() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  React.useEffect(() => {
    if (!knownToolUrls.has(pathname)) {
      return;
    }

    recordToolUsage(pathname);
  }, [pathname]);

  return (
    <>
      <SidebarProvider>
        <CommandPalette />
        <AppSidebar className="print:hidden" />
        <SidebarInset>
          <header className="bg-background sticky top-0 flex h-16 shrink-0 items-center gap-2 border-b px-4 print:hidden">
            <SidebarTrigger className="-ml-1" />
            <div className="ml-auto flex items-center gap-2">
              <InstallPwaButton />
              <ThemeToggle />
            </div>
          </header>
          <div className="">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
      <React.Suspense fallback={null}>
        <TanStackRouterDevtools />
      </React.Suspense>
    </>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
  errorComponent: ({ error }) => (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <div className="max-w-md rounded-xl border border-red-200 bg-red-50 p-8 text-center shadow-sm">
        <h1 className="mb-4 text-2xl font-bold text-red-700">Something went wrong</h1>
        <p className="mb-4 text-sm text-red-700">{error.message}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
        >
          Reload page
        </button>
      </div>
    </div>
  ),
});
