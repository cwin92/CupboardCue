import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { getSessionUser } from "@/lib/data/queries";
import { signInAction } from "@/lib/data/actions";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getSessionUser();
  if (user) redirect("/app");

  const params = await searchParams;

  return (
    <AuthForm
      title="Welcome back"
      description="Sign in to see your visual menu and what&apos;s ready now."
      action={signInAction}
      submitLabel="Log In"
      error={params.error}
      footer={
        <p>
          Need an account? <Link href="/signup">Create one</Link>
        </p>
      }
    />
  );
}
