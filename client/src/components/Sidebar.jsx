import { NavLink, useNavigate } from 'react-router-dom'
import { X, LayoutDashboard, Users, CalendarCheck, QrCode, ScanLine, BarChart3, MapPin, Activity, Settings } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const adminLinks = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin/employees', label: 'Employees', icon: Users },
  { to: '/admin/attendance', label: 'Attendance', icon: CalendarCheck },
  { to: '/admin/daily-qr', label: 'Daily QR Code', icon: QrCode },
  { to: '/admin/qr-scanner', label: 'QR Scanner', icon: ScanLine },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { to: '/admin/settings', label: 'Settings', icon: Settings }
]

const employeeLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/clock', label: 'Clock In / Out', icon: ScanLine },
  { to: '/my-attendance', label: 'My Attendance', icon: CalendarCheck },
  { to: '/profile', label: 'Profile', icon: Users }
]

export default function Sidebar({ open, onClose }) {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const links = isAdmin ? adminLinks : employeeLinks

  const handleNav = (e, to) => {
    if (window.innerWidth < 1024) {
      e.preventDefault()
      onClose()
      navigate(to)
    }
  }

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed z-50 inset-y-0 left-0 w-72 bg-gray-900 text-white flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
          <span className="font-bold text-lg">Navigation</span>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-800 lg:hidden" aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.exact}
              onClick={(e) => handleNav(e, link.to)}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <link.icon size={18} />
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center font-bold uppercase">
              {isAdmin ? 'A' : 'E'}
            </div>
            <div>
              <p className="text-sm font-medium">MDIHub</p>
              <p className="text-xs text-gray-400">Clocking System v1.0</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}