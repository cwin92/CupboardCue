import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { getSessionUser } from "@/lib/data/queries";
import { signUpAction } from "@/lib/data/actions";

export default async function SignupPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getSessionUser();
  if (user) redirect("/app");

  const params = await searchParams;

  return (
    <AuthForm
      title="Create account"
      description="Start building your visual menu so you can see what&apos;s ready."
      action={signUpAction}
      submitLabel="Create Account"
      error={params.error}
      footer={
        <p>
          Already have an account? <Link href="/login">Log in</Link>
        </p>
      }
    />
  );
}
