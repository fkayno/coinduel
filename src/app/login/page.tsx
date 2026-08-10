import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Login — CoinDuel",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  // Only ever follow an internal relative path — never an absolute/external
  // URL, which would make this an open-redirect vector.
  const redirectTo = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  const user = await getCurrentUser();
  if (user) redirect(redirectTo);

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-20">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-6">
          <Image src="/logo.png" alt="CoinDuel" width={40} height={40} />
          <h1 className="text-xl font-extrabold tracking-tight text-foreground">
            LOG IN TO COINDUEL
          </h1>
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-surface p-8">
          <LoginForm redirectTo={redirectTo} />
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-accent hover:text-accent-dim">
            CREATE ACCOUNT
          </Link>
        </p>
      </div>
    </div>
  );
}
