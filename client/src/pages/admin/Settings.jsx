import { useState, useEffect } from 'react'
import { MapPin, Save, Loader2, AlertCircle, CheckCircle2, Crosshair } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { db } from '../../services/firebase'
import { collection, getDocs, addDoc, setDoc, doc } from 'firebase/firestore'
import { todayISO } from '../../utils/dateUtils'
import { getAttendanceLogs } from '../../services/attendanceService'
import { getCurrentPosition } from '../../services/locationService'
import Loading from '../../components/Loading'
import { formatDateTime } from '../../utils/dateUtils'

export default function AdminSettings() {
  const { userData } = useAuth()
  const [company, setCompany] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [form, setForm] = useState({
    companyName: '',
    latitude: '',
    longitude: '',
    radius: 50,
    timezone: 'Africa/Johannesburg'
  })

  const loadAll = async () => {
    setLoading(true)
    try {
      const companySnapshot = await getDocs(collection(db, 'companies'))
      if (!companySnapshot.empty) {
        const d = companySnapshot.docs[0]
        const data = d.data()
        setCompany({ id: d.id, ...data })
        setForm({
          companyName: data.companyName || '',
          latitude: data.latitude ?? '',
          longitude: data.longitude ?? '',
          radius: data.radius ?? 50,
          timezone: data.timezone || 'Africa/Johannesburg'
        })
      }
      const logList = await getAttendanceLogs(50)
      setLogs(logList)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  const useMyLocation = async () => {
    setLocating(true)
    setError(null)
    setSuccess(null)
    try {
      const pos = await getCurrentPosition()
      setForm((f) => ({ ...f, latitude: String(pos.latitude), longitude: String(pos.longitude) }))
      setSuccess('Found your current GPS position. Save to apply it as the company location.')
    } catch (err) {
      setError(err.message || 'Unable to get your GPS location.')
    } finally {
      setLocating(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const data = {
        companyName: form.companyName,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        radius: parseInt(form.radius, 10) || 50,
        timezone: form.timezone,
        updatedBy: userData?.firstName ? `${userData.firstName} ${userData.lastName}` : 'admin',
        updatedAt: new Date().toISOString()
      }

      if (company?.id) {
        await setDoc(doc(db, 'companies', company.id), data)
      } else {
        await addDoc(collection(db, 'companies'), data)
      }
      setSuccess('Company location settings saved.')
      await loadAll()
    } catch (err) {
      setError(err.message || 'Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loading message="Loading settings..." />

  return (
    <div className="py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Settings</h1>
      <p className="text-sm text-gray-500 mb-6">Configure your company location and geofence</p>

      {error && (
        <div className="flex items-start gap-2 bg-red-50 text-red-700 rounded-lg p-3 text-sm mb-6">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2 bg-green-50 text-green-700 rounded-lg p-3 text-sm mb-6">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <MapPin size={20} className="text-brand-600" />
            <h2 className="font-semibold text-gray-900">Company Location</h2>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                required
                className="input-field"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={form.latitude}
                  onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                  required
                  placeholder="-25.7461"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={form.longitude}
                  onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                  required
                  placeholder="28.1881"
                  className="input-field"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={useMyLocation}
              disabled={locating}
              className="btn-secondary w-full flex items-center justify-center gap-2"
            >
              {locating ? <Loader2 size={16} className="animate-spin" /> : <Crosshair size={16} />}
              {locating ? 'Acquiring GPS position...' : 'Use My Current GPS Location'}
            </button>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Allowed Radius (metres)</label>
                <input
                  type="number"
                  min="10"
                  max="500"
                  value={form.radius}
                  onChange={(e) => setForm({ ...form, radius: e.target.value })}
                  required
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                <select
                  value={form.timezone}
                  onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                  className="input-field"
                >
                  <option value="Africa/Johannesburg">Africa/Johannesburg (SAST)</option>
                  <option value="Africa/Cairo">Africa/Cairo (EET)</option>
                  <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                  <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
            </div>

            <div className="bg-blue-50 text-blue-800 rounded-lg p-3 text-sm">
              Employees must be within <strong>{form.radius || 50} metres</strong> of this location to clock in/out.
            </div>

            <button type="submit" disabled={saving} className="btn-primary w-full">
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <MapPin size={20} className="text-brand-600" />
            <h2 className="font-semibold text-gray-900">Recent Activity Logs</h2>
          </div>

          {logs.length === 0 ? (
            <p className="text-center text-gray-500 py-8 text-sm">No activity recorded yet.</p>
          ) : (
            <div className="space-y-3 max-h-[480px] overflow-y-auto">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${log.result === 'APPROVED' || log.result === 'SUCCESS' ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800">
                      {log.employeeName || 'Unknown'} · {String(log.action || '').replace('_', ' ')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {log.result} {log.distance != null && `· ${Math.round(log.distance)}m`}
                    </p>
                    {log.reason && <p className="text-xs text-gray-400 mt-0.5">{log.reason}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(log.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}