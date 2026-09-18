import { Menu, LogOut, Shield } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Navbar({ onMenuClick }) {
  const { userData, logout } = useAuth()

  return (
    <header className="fixed inset-x-0 top-0 z-40 h-16 bg-gray-900 text-white flex items-center px-4 sm:px-6">
      <button
        onClick={onMenuClick}
        className="lg:hidden mr-4 p-2 -ml-2 rounded-lg hover:bg-gray-800"
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Shield className="text-brand-400" size={22} />
        <span className="font-bold text-lg truncate">MDIHub <span className="text-brand-400">Clocking</span></span>
      </div>

      {userData && (
        <div className="hidden sm:flex items-center gap-3 mr-4">
          <div className="text-right">
            <p className="text-sm font-medium leading-tight">
              {userData.firstName} {userData.lastName}
            </p>
            <p className="text-xs text-gray-400 capitalize leading-tight">{userData.role}</p>
          </div>
        </div>
      )}

      <button
        onClick={logout}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm font-medium"
      >
        <LogOut size={16} />
        <span className="hidden sm:inline">Logout</span>
      </button>
    </header>
  )
}