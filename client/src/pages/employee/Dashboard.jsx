import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ScanLine, CalendarCheck, MapPin, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getTodayAttendance, getCompany, getDailyQR, getMyAttendanceHistory } from '../../services/attendanceService'
import { getClockedPosition, haversineDistance } from '../../services/locationService'
import { greeting, todayISO, formatDateNice, formatTime } from '../../utils/dateUtils'
import Loading from '../../components/Loading'

export default function EmployeeDashboard() {
  const { userData } = useAuth()
  const [today, setToday] = useState(null)
  const [company, setCompany] = useState(null)
  const [distance, setDistance] = useState(null)
  const [locationOk, setLocationOk] = useState(false)
  const [locationLoading, setLocationLoading] = useState(true)
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)
  const [hasQr, setHasQr] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [att, cmp, qr, history] = await Promise.all([
          getTodayAttendance(userData?.uid),
          getCompany(),
          getDailyQR(todayISO()),
          getMyAttendanceHistory(userData?.uid, 5)
        ])

        let dist = null
        let ok = false
        if (cmp) {
          try {
            const pos = await getClockedPosition()
            dist = haversineDistance(cmp.latitude, cmp.longitude, pos.latitude, pos.longitude)
            ok = dist <= (cmp.radius || 50)
          } catch {
            ok = false
          }
        }

        setToday(att)
        setCompany(cmp)
        setDistance(dist)
        setLocationOk(ok)
        setHasQr(!!qr)
        setRecent(history)
      } finally {
        setLoading(false)
        setLocationLoading(false)
      }
    }
    load()
  }, [userData])

  if (loading) return <Loading message="Loading dashboard..." />

  const canClock = locationOk && hasQr

  return (
    <div className="py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {greeting()}, {userData?.firstName} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Today's Attendance</h2>
            <div className="text-center py-4">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 ${
                today?.clockIn ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
              }`}>
                {today?.clockIn ? <CheckCircle2 size={32} /> : <Clock size={32} />}
              </div>
              <p className="font-bold text-lg text-gray-900">
                {today?.clockIn ? formatTime(today.clockIn) : 'Not clocked in yet'}
              </p>
              {today?.clockOut && (
                <p className="text-sm text-gray-500 mt-1">Clocked out at {formatTime(today.clockOut)}</p>
              )}
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <MapPin size={18} className="text-brand-600" />
                Location
              </h2>
            </div>
            {locationLoading ? (
              <Loading small message="Checking location..." />
            ) : distance === null ? (
              <p className="text-sm text-amber-600">GPS unavailable. Enable location to clock in.</p>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Distance from company</span>
                  <span className="font-bold">{Math.round(distance)}m</span>
                </div>
                {locationOk ? (
                  <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                    <CheckCircle2 size={16} />
                    Within {company?.radius || 50}m area
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600 text-sm font-medium">
                    <XCircle size={16} />
                    Outside permitted area
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="card text-center py-8 mb-6">
            <h2 className="font-semibold text-gray-900 mb-1">Today's Date</h2>
            <p className="text-lg text-gray-700 mb-6">{formatDateNice(todayISO())}</p>

            <Link to="/clock" className="btn-primary !px-8 !py-4 !text-base">
              <ScanLine size={22} />
              {today?.clockIn ? 'Clock In / Out' : 'Scan Today\'s QR Code'}
            </Link>

            {!hasQr && (
              <p className="text-xs text-amber-600 mt-4">
                No active QR code for today yet. Ask the administrator to generate one.
              </p>
            )}
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Recent Attendance</h2>
              <Link to="/my-attendance" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
                View all
              </Link>
            </div>
            {recent.length === 0 ? (
              <p className="text-center text-gray-500 py-6 text-sm">
                No recent attendance records yet. Clock in to get started.
              </p>
            ) : (
              <div className="divide-y divide-gray-100">
                {recent.map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-3">
                    <span className="flex items-center gap-3">
                      <CalendarCheck size={16} className="text-brand-600" />
                      <span className="text-sm font-medium text-gray-800">{r.date}</span>
                    </span>
                    <span className="text-sm text-gray-600">{formatTime(r.clockIn)}</span>
                    <span className="text-xs font-semibold uppercase text-green-700">{r.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}