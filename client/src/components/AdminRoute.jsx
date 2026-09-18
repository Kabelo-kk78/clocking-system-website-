import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AdminRoute() {
  const { userData, loading } = useAuth()
  const location = useLocation()

  if (loading) return null

  if (!userData || userData.role !== 'admin') {
    return <Navigate to={userData ? '/dashboard' : '/login'} state={{ from: location }} replace />
  }

  return <Outlet />
}