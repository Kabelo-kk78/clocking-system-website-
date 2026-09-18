import { useState, useEffect } from 'react'
import { Search, RefreshCw, Download } from 'lucide-react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { todayISO } from '../../utils/dateUtils'
import Loading from '../../components/Loading'
import AttendanceTable from '../../components/AttendanceTable'
import { exportCSV } from '../../services/reportService'

export default function AdminAttendance() {
  const [attendance, setAttendance] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState(todayISO())
  const [dateTo, setDateTo] = useState(todayISO())
  const [employeeId, setEmployeeId] = useState('')
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')

  const loadData = async (filters) => {
    setLoading(true)
    try {
      const conditions = []
      if (filters.dateFrom) conditions.push(where('date', '>=', filters.dateFrom))
      if (filters.dateTo) conditions.push(where('date', '<=', filters.dateTo))
      if (filters.employeeId) conditions.push(where('employeeId', '==', filters.employeeId))
      if (filters.status) conditions.push(where('status', '==', filters.status))

      const q = conditions.length
        ? query(collection(db, 'attendance'), ...conditions)
        : query(collection(db, 'attendance'))

      const snapshot = await getDocs(q)
      const list = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''))

      setAttendance(list)

      const empSnapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'employee')))
      setEmployees(empSnapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData({ dateFrom, dateTo, employeeId, status })
  }, [])

  const applyFilters = () => {
    loadData({ dateFrom, dateTo, employeeId, status })
  }

  const resetFilters = () => {
    setDateFrom(todayISO())
    setDateTo(todayISO())
    setEmployeeId('')
    setStatus('')
    setSearch('')
    loadData({ dateFrom: todayISO(), dateTo: todayISO(), employeeId: '', status: '' })
  }

  const handleExport = () => {
    const rows = filtered.map((a) => {
      const emp = employees.find((e) => e.id === a.employeeId)
      return {
        Employee: emp ? `${emp.firstName} ${emp.lastName}` : a.employeeName,
        'Employee Number': emp?.employeeNumber || '',
        Department: emp?.department || '',
        Date: a.date,
        'Clock In': a.clockIn || '',
        'Clock Out': a.clockOut || '',
        Status: a.status || '',
        'In Distance (m)': a.clockInDistance ? Math.round(a.clockInDistance) : ''
      }
    })
    exportCSV(rows, `attendance_${todayISO()}.csv`)
  }

  const filtered = attendance.filter((a) => {
    const q = search.toLowerCase()
    const emp = employees.find((e) => e.id === a.employeeId)
    const name = emp ? `${emp.firstName} ${emp.lastName}` : a.employeeName || ''
    const num = emp?.employeeNumber || ''
    return !q || name.toLowerCase().includes(q) || num.toLowerCase().includes(q)
  })

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-sm text-gray-500">Search and filter attendance records</p>
        </div>
        <button onClick={handleExport} className="btn-secondary" disabled={filtered.length === 0}>
          <Download size={18} />
          Export CSV
        </button>
      </div>

      <div className="card mb-6 !p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input-field !py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input-field !py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Employee</label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="input-field !py-2"
            >
              <option value="">All Employees</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="input-field !py-2"
            >
              <option value="">All Statuses</option>
              <option value="PRESENT">Present</option>
              <option value="CLOCKED_IN">Clocked In</option>
              <option value="CLOCKED_OUT">Clocked Out</option>
              <option value="LATE">Late</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button onClick={applyFilters} className="btn-primary !py-2.5 flex-1">
              <Search size={16} />
              Filter
            </button>
            <button onClick={resetFilters} className="btn-secondary !py-2.5">
              <RefreshCw size={16} />
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="relative mb-4 max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by employee name or number..."
          className="input-field !pl-10"
        />
      </div>

      {loading ? (
        <Loading message="Loading attendance..." />
      ) : (
        <div className="card">
          <AttendanceTable attendance={filtered} employees={employees} />
        </div>
      )}
    </div>
  )
}