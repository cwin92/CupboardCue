import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { getSessionUser } from "@/lib/data/queries";

export default async function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return <AppShell>{children}</AppShell>;
}
