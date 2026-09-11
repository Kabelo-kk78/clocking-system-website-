import { getEmployees } from "@/services/employees/getEmployees";
import EmployeeManager from "@/components/admin/EmployeeManager";

export const metadata = { title: "Employees" };

export default async function AdminEmployeesPage() {
  const employees = await getEmployees();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Employees</h1>
        <p className="text-sm text-neutral-400">Manage employees and their clock-in accounts</p>
      </div>

      <EmployeeManager employees={employees} />
    </div>
  );
}