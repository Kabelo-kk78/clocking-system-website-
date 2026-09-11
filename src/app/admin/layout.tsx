import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AppShell from "@/components/layout/AppShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "admin") redirect("/dashboard");

  return (
    <AppShell fullName={session.user.fullName} role={session.user.role}>
      {children}
    </AppShell>
  );
}
