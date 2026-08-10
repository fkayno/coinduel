import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { SignupWizard } from "@/components/auth/signup-wizard";

export const metadata: Metadata = {
  title: "Sign Up — CoinDuel",
};

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-20">
      <SignupWizard />
    </div>
  );
}
