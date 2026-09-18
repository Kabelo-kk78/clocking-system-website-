import { Users, UserCheck, ToggleLeft, ToggleRight, Pencil } from 'lucide-react'
import { StatusBadge } from './AttendanceTable'

export { StatusBadge }

export default function EmployeeCard({ employee, onEdit, onToggleStatus }) {
  const initials = `${employee.firstName?.[0] || ''}${employee.lastName?.[0] || ''}`
  const active = employee.status === 'active'

  return (
    <div className={`bg-white rounded-xl border p-5 shadow-sm transition-shadow hover:shadow-md ${active ? 'border-gray-100' : 'border-gray-200 opacity-70'}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-white ${active ? 'bg-brand-600' : 'bg-gray-400'}`}>
          {initials.toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900 truncate">
            {employee.firstName} {employee.lastName}
          </p>
          <p className="text-xs text-gray-500">{employee.employeeNumber || 'No employee number'}</p>
        </div>
        <button
          onClick={() => onEdit(employee)}
          className="p-2 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50"
          aria-label="Edit employee"
        >
          <Pencil size={16} />
        </button>
      </div>

      {employee.department && (
        <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium mb-2">
          {employee.department}
        </span>
      )}

      <div className="text-sm text-gray-600 mb-4 break-all">{employee.email}</div>

      <div className="flex items-center justify-between">
        <StatusBadge status={active ? 'active' : 'inactive'} />
        <button
          onClick={() => onToggleStatus(employee)}
          className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
            active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'
          }`}
        >
          {active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
          {active ? 'Deactivate' : 'Activate'}
        </button>
      </div>
    </div>
  )
}