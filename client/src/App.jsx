import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import EmployeeRoute from './components/EmployeeRoute'
import Layout from './components/Layout'

import Login from './pages/Login'

import AdminDashboard from './pages/admin/Dashboard'
import AdminEmployees from './pages/admin/Employees'
import AdminAttendance from './pages/admin/Attendance'
import AdminQRScanner from './pages/admin/QRScanner'
import AdminDailyQR from './pages/admin/DailyQR'
import AdminReports from './pages/admin/Reports'
import AdminSettings from './pages/admin/Settings'

import EmployeeDashboard from './pages/employee/Dashboard'
import EmployeeClockIn from './pages/employee/ClockIn'
import EmployeeAttendance from './pages/employee/Attendance'
import EmployeeProfile from './pages/employee/Profile'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              {/* Admin routes */}
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/employees" element={<AdminEmployees />} />
                <Route path="/admin/attendance" element={<AdminAttendance />} />
                <Route path="/admin/qr-scanner" element={<AdminQRScanner />} />
                <Route path="/admin/daily-qr" element={<AdminDailyQR />} />
                <Route path="/admin/reports" element={<AdminReports />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
              </Route>

              {/* Employee routes */}
              <Route element={<EmployeeRoute />}>
                <Route path="/dashboard" element={<EmployeeDashboard />} />
                <Route path="/clock" element={<EmployeeClockIn />} />
                <Route path="/my-attendance" element={<EmployeeAttendance />} />
                <Route path="/profile" element={<EmployeeProfile />} />
              </Route>
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}