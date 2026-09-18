import { useState, useEffect } from 'react'
import { Users, UserCheck, UserX, Clock3, LogOut, AlertTriangle, RefreshCw } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { todayISO } from '../../utils/dateUtils'
import Loading from '../../components/Loading'
import AttendanceTable from '../../components/AttendanceTable'

export default function AdminDashboard() {
  const { userData } = useAuth()
  const [employees, setEmployees] = useState([])
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = async () => {
    setRefreshing(true)
    try {
      const today = todayISO()

      const employeesSnapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'employee')))
      const employeeList = employeesSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }))

      const attendanceSnapshot = await getDocs(query(collection(db, 'attendance'), where('date', '==', today)))
      const attendanceList = attendanceSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }))

      setEmployees(employeeList)
      setAttendance(attendanceList)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 60000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return <Loading message="Loading dashboard..." />

  const presentIds = new Set(attendance.filter((a) => a.clockIn).map((a) => a.employeeId))
  const present = attendance.filter((a) => a.clockIn && !a.clockOut)
  const clockedOut = attendance.filter((a) => a.clockOut)
  const absentEmployees = employees.filter((e) => !presentIds.has(e.id))
  const late = attendance.filter((a) => a.status === 'LATE')

  const stats = [
    { label: 'Total Employees', value: employees.length, icon: Users, color: 'bg-brand-600' },
    { label: 'Present Today', value: present.length, icon: UserCheck, color: 'bg-green-600' },
    { label: 'Absent Today', value: absentEmployees.length, icon: UserX, color: 'bg-gray-500' },
    { label: 'Clocked In', value: clockedOut.length ? present.length : present.length, icon: Clock3, color: 'bg-blue-600' },
    { label: 'Clocked Out', value: clockedOut.length, icon: LogOut, color: 'bg-purple-600' },
    { label: 'Late', value: late.length, icon: AlertTriangle, color: 'bg-amber-600' }
  ]

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">
            {todayISO()} · {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button onClick={loadData} className="btn-secondary" disabled={refreshing}>
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="card !p-4">
            <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg text-white mb-3 ${stat.color}`}>
              <stat.icon size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs font-medium text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-4">
          <h2 className="font-semibold text-gray-900">Today's Attendance</h2>
          <span className="text-sm text-gray-500">{attendance.filter((a) => a.clockIn).length} clocked in</span>
        </div>
        <AttendanceTable attendance={attendance} employees={employees} />
      </div>
    </div>
  )
}