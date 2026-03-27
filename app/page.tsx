import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/data/queries";

export default async function IndexPage() {
  const user = await getSessionUser();
  redirect(user ? "/app" : "/login");
}
