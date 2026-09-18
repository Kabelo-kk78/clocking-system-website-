import { useState, useEffect } from 'react'
import { User, Mail, Phone, Hash, Briefcase, Shield, CalendarDays } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { formatDateNice } from '../../utils/dateUtils'

export default function EmployeeProfile() {
  const { userData } = useAuth()

  const details = [
    { label: 'Full Name', value: `${userData?.firstName} ${userData?.lastName}`, icon: User },
    { label: 'Email', value: userData?.email, icon: Mail },
    { label: 'Phone', value: userData?.phone || 'Not set', icon: Phone },
    { label: 'Employee Number', value: userData?.employeeNumber || 'Not set', icon: Hash },
    { label: 'Department', value: userData?.department || 'Not set', icon: Briefcase },
    { label: 'Role', value: userData?.role, icon: Shield },
    { label: 'Member Since', value: userData?.createdAt ? formatDateNice(userData.createdAt?.toDate?.() || new Date(userData.createdAt)) : '—', icon: CalendarDays }
  ]

  const initials = `${userData?.firstName?.[0] || ''}${userData?.lastName?.[0] || ''}`

  return (
    <div className="py-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

      <div className="card text-center mb-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-brand-600 text-white text-2xl font-bold mb-4">
          {initials.toUpperCase() || 'E'}
        </div>
        <h2 className="text-xl font-bold text-gray-900">
          {userData?.firstName} {userData?.lastName}
        </h2>
        <p className="text-sm text-gray-500">
          {userData?.employeeNumber || 'No employee number'} · {userData?.department || 'No department'}
        </p>
        <span className="inline-flex items-center px-3 py-0.5 mt-2 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold capitalize">
          <Shield size={12} className="mr-1.5" />
          {userData?.role}
        </span>
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Account Details</h3>
        <div className="divide-y divide-gray-100">
          {details.map((detail) => (
            <div key={detail.label} className="flex items-center gap-3 py-3">
              <detail.icon size={18} className="text-brand-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500">{detail.label}</p>
                <p className="text-sm font-medium text-gray-800 break-all">{detail.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center mt-4">
        Account status: <span className="font-semibold text-green-600 capitalize">{userData?.status}</span>
      </p>
    </div>
  )
}