"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOutAction } from "@/actions/auth/sessionAction";

const adminNav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/attendance", label: "Attendance" },
  { href: "/admin/employees", label: "Employees" },
  { href: "/admin/qr-codes", label: "QR Codes" },
  { href: "/admin/settings", label: "Settings" },
];

const employeeNav = [{ href: "/dashboard", label: "My Attendance" }];

interface AppShellProps {
  children: React.ReactNode;
  fullName: string;
  role: string;
}

export default function AppShell({ children, fullName, role }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = role === "admin";
  const nav = isAdmin ? adminNav : employeeNav;

  async function handleSignOut() {
    await signOutAction();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-white/10 bg-neutral-900/60 p-4 md:flex">
        <Link href="/" className="mb-8 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FFC107] text-sm font-black text-[#0f1117]">
            M
          </div>
          <div>
            <p className="text-sm font-bold leading-none">Attendance</p>
            <p className="text-xs text-neutral-500">MDI Hub</p>
          </div>
        </Link>

        <nav className="flex-1 space-y-1">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-[#FFC107] text-[#0f1117]"
                    : "text-neutral-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={handleSignOut}
          className="rounded-lg px-3 py-2 text-left text-sm font-medium text-neutral-400 transition hover:bg-white/5 hover:text-white"
        >
          Sign Out
        </button>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="block text-sm font-semibold md:hidden">Attendance · MDI Hub</div>
          <div className="ml-auto text-right">
            <p className="text-sm font-semibold">{fullName ?? "User"}</p>
            <p className="text-xs capitalize text-neutral-500">{role}</p>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
