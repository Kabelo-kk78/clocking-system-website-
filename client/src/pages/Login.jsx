import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Loader2, AlertCircle } from 'lucide-react'
import { loginUser, resetPassword } from '../services/authService'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [resetMessage, setResetMessage] = useState(null)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { userData } = await loginUser(email, password)
      navigate(userData.role === 'admin' ? '/admin' : '/dashboard')
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Enter your email address first.')
      return
    }
    setError(null)
    setResetMessage(null)
    try {
      await resetPassword(email)
      setResetMessage(`Password reset link sent to ${email}.`)
    } catch (err) {
      setError(err.message || 'Unable to send reset link.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600 text-white mb-4">
              <Shield size={28} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">MDIHub Clocking System</h1>
            <p className="text-sm text-gray-500 mt-1">Employee Attendance Management</p>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 text-red-700 rounded-lg p-3 text-sm mb-4">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {resetMessage && (
            <div className="flex items-start gap-2 bg-green-50 text-green-700 rounded-lg p-3 text-sm mb-4">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{resetMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@company.co.za"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="input-field"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Shield size={18} />}
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </form>

          <button
            onClick={handleForgotPassword}
            className="mt-4 w-full text-center text-sm text-brand-600 hover:text-brand-700 font-medium"
          >
            Forgot Password?
          </button>
        </div>

        <p className="text-center text-gray-400 text-xs mt-6">
          © 2026 MDIHub. Location-verified attendance system.
        </p>
      </div>
    </div>
  )
}