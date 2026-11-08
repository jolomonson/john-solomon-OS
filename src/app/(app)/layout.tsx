import { Suspense } from "react";
import { BottomTabs } from "@/components/shell/bottom-tabs";
import { HeaderClock } from "@/components/shell/header-clock";
import { Sidebar } from "@/components/shell/sidebar";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { UserMenu } from "@/components/shell/user-menu";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * App shell. Static chrome renders instantly; anything that reads the session
 * (clock needs settings, user menu needs email) streams in behind <Suspense>.
 * Auth is enforced by the proxy and again by requireUser() in each data read.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex box-content h-12 items-center gap-3 border-b bg-background/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur">
          <span className="font-mono text-sm font-semibold md:hidden">24 @ 24</span>
          <Suspense fallback={<Skeleton className="h-4 w-44" />}>
            <HeaderClock />
          </Suspense>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <Suspense fallback={<Skeleton className="size-8 rounded-full" />}>
              <UserMenu />
            </Suspense>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-4 pb-24 md:px-6 md:pb-8">{children}</main>
      </div>
      <BottomTabs />
    </div>
  );
}
