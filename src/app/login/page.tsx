import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import LoginForm from "@/components/auth/LoginForm";

export const metadata = { title: "Sign In" };

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect(session.user.role === "admin" ? "/admin" : "/dashboard");
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0f1117] p-6">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </main>
  );
}