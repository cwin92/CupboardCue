import type { ReactNode } from "react";

import { BottomNav } from "@/components/layout/bottom-nav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <div className="app-shell-frame">
        <main className="app-main">{children}</main>
      </div>
      <BottomNav pathname="/app" />
    </div>
  );
}
