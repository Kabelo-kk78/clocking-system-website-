import { useState, useEffect } from 'react'
import { CalendarCheck, MapPin } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getMyAttendanceHistory } from '../../services/attendanceService'
import { formatDateNice, formatTime } from '../../utils/dateUtils'
import Loading from '../../components/Loading'
import { StatusBadge } from '../../components/AttendanceTable'

export default function EmployeeAttendance() {
  const { userData } = useAuth()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const list = await getMyAttendanceHistory(userData?.uid, 60)
        setRecords(list)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [userData])

  if (loading) return <Loading message="Loading your attendance..." />

  return (
    <div className="py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Attendance</h1>
        <p className="text-sm text-gray-500">Your recent clocking records</p>
      </div>

      {records.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          <CalendarCheck size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No attendance records yet</p>
          <p className="text-sm">Clock in to start building your history.</p>
        </div>
      ) : (
        <div className="card overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Clock In</th>
                  <th className="px-4 py-3">Clock Out</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <span className="flex items-center gap-2">
                        <CalendarCheck size={14} className="text-brand-600" />
                        {r.date}
                      </span>
                      <span className="block text-xs text-gray-400 font-normal">
                        {formatDateNice(r.date)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{formatTime(r.clockIn)}</td>
                    <td className="px-4 py-3 text-gray-700">{formatTime(r.clockOut)}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3 text-gray-600">
                      {r.clockInDistance != null ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={14} className="text-gray-400" />
                          {Math.round(r.clockInDistance)}m
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
        </div>
      )}
    </div>
  )
}