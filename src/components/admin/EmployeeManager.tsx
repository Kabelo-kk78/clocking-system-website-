"use client";

import { useState } from "react";
import { createEmployeeAction } from "@/actions/employees/createEmployeeAction";
import { toggleEmployeeStatusAction } from "@/actions/employees/toggleEmployeeStatusAction";
import StatusBadge from "@/components/ui/StatusBadge";

interface Employee {
  id: string;
  fullName: string;
  email: string;
  employeeNumber?: string;
  department?: string;
  isActive: boolean;
}

const initialForm = { fullName: "", email: "", password: "", employeeNumber: "", department: "" };

export default function EmployeeManager({ employees }: { employees: Employee[] }) {
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setAdding(true);
    setMessage(null);
    setError(null);

    const result = await createEmployeeAction(form);
    if (result.success) {
      setMessage(result.message ?? "Employee created.");
      setForm(initialForm);
    } else {
      setError(result.message ?? "Could not create employee.");
    }
    setAdding(false);
  }

  async function handleToggle(employee: Employee) {
    await toggleEmployeeStatusAction(employee.id, !employee.isActive);
  }

  return (
    <div className="space-y-6">
      <div className="glass-card p-5">
        <h2 className="mb-4 text-lg font-semibold">Add Employee</h2>
        <form onSubmit={handleCreate} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input
            placeholder="Full name *"
            required
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-amber-500"
          />
          <input
            placeholder="Email *"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-amber-500"
          />
          <input
            placeholder="Password *"
            type="password"
            required
            minLength={6}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-amber-500"
          />
          <input
            placeholder="Employee number (e.g. MDI001)"
            value={form.employeeNumber}
            onChange={(e) => setForm({ ...form, employeeNumber: e.target.value })}
            className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-amber-500"
          />
          <input
            placeholder="Department"
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
            className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            disabled={adding}
            className="rounded-lg bg-[#FFC107] px-4 py-2 text-sm font-bold text-[#0f1117] transition hover:bg-amber-400 disabled:opacity-60"
          >
            {adding ? "Adding…" : "Add Employee"}
          </button>
        </form>
        {message && <p className="mt-3 text-sm text-green-400">{message}</p>}
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      </div>

      <div className="glass-card overflow-hidden">
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="text-lg font-semibold">
            {employees.length} Employee{employees.length === 1 ? "" : "s"}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-neutral-400">
                <th className="px-5 py-3 font-medium">Employee</th>
                <th className="px-5 py-3 font-medium">ID</th>
                <th className="px-5 py-3 font-medium">Department</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id} className="border-b border-white/5">
                  <td className="px-5 py-3">
                    <p className="font-medium">{employee.fullName}</p>
                    <p className="text-xs text-neutral-500">{employee.email}</p>
                  </td>
                  <td className="px-5 py-3 text-neutral-300">{employee.employeeNumber ?? "—"}</td>
                  <td className="px-5 py-3 text-neutral-300">{employee.department ?? "—"}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={employee.isActive ? "active" : "inactive"} />
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleToggle(employee)}
                      className="rounded-lg border border-neutral-700 px-3 py-1 text-xs font-semibold text-neutral-300 transition hover:bg-neutral-800"
                    >
                      {employee.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-neutral-500">
                    No employees yet. Add your first employee above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}