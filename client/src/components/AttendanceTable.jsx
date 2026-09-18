import { MapPin, CheckCircle2, Clock, LogOut } from 'lucide-react'

const STATUS_STYLES = {
  PRESENT: 'bg-green-100 text-green-800',
  ABSENT: 'bg-gray-100 text-gray-600',
  CLOCKED_IN: 'bg-blue-100 text-blue-800',
  CLOCKED_OUT: 'bg-purple-100 text-purple-800',
  LATE: 'bg-amber-100 text-amber-800',
  REJECTED: 'bg-red-100 text-red-800'
}

export const StatusBadge = ({ status }) => {
  const style = STATUS_STYLES[status] || STATUS_STYLES.ABSENT
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${style}`}>
      {status?.replace('_', ' ').toLowerCase()}
    </span>
  )
}

export default function AttendanceTable({ attendance, employees = [], loading = false }) {
  if (loading) {
    return (
      <div className="text-center text-gray-500 py-8 text-sm">Loading attendance...</div>
    )
  }

  if (!attendance || attendance.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8 text-sm">
        No attendance records found.
      </div>
    )
  }

  const employeeName = (employeeId) => {
    const emp = employees.find((e) => e.id === employeeId || e.uid?.toString() === employeeId.toString())
    if (emp) return `${emp.firstName} ${emp.lastName}`
    return attendance.find((a) => a.employeeId === employeeId)?.employeeName || 'Unknown'
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead>
          <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <th className="px-4 py-3">Employee</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Clock In</th>
            <th className="px-4 py-3">Clock Out</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Location</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {attendance.map((record) => (
            <tr key={record.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">
                {employeeName(record.employeeId)}
                <span className="block text-xs text-gray-400 font-normal">
                  {record.employeeNumber || ''}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-600">{record.date}</td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center gap-1 text-gray-700">
                  <Clock size={14} className="text-gray-400" />
                  {record.clockIn ? formatTime(record.clockIn) : '-'}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center gap-1 text-gray-700">
                  <LogOut size={14} className="text-gray-400" />
                  {record.clockOut ? formatTime(record.clockOut) : '-'}
                </span>
              </td>
              <td className="px-4 py-3"><StatusBadge status={record.status} /></td>
              <td className="px-4 py-3 text-gray-600">
                {record.clockInDistance ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={14} className="text-gray-400" />
                    {Math.round(record.clockInDistance)}m
                  </span>
                ) : (
                  '-'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const formatTime = (value) => {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  if (isNaN(date.getTime())) return value
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export { CheckCircle2 }