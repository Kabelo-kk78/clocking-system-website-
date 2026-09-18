import { useState, useEffect } from 'react'
import { UserPlus, Search, Loader2, AlertCircle, X } from 'lucide-react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../services/firebase'
import apiFetch from '../../services/apiClient'
import EmployeeCard from '../../components/EmployeeCard'
import Loading from '../../components/Loading'

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  employeeNumber: '',
  department: '',
  otherDepartment: '',
  phone: '',
  password: ''
}

const DEPARTMENTS = [
  'Sales',
  'Marketing',
  'Finance',
  'Human Resources',
  'IT / Software Development',
  'Operations',
  'Customer Support',
  'Logistics',
  'Administration',
  'Other'
]

export default function AdminEmployees() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const loadEmployees = async () => {
    setLoading(true)
    try {
      const snapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'employee')))
      setEmployees(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEmployees()
  }, [])

  const openAddModal = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError(null)
    setModalOpen(true)
  }

  const openEditModal = (employee) => {
    setEditing(employee)
    setForm({
      firstName: employee.firstName || '',
      lastName: employee.lastName || '',
      email: employee.email || '',
      employeeNumber: employee.employeeNumber || '',
      department: DEPARTMENTS.includes(employee.department) ? employee.department : (employee.department ? 'Other' : ''),
      otherDepartment: DEPARTMENTS.includes(employee.department) ? '' : (employee.department || ''),
      phone: employee.phone || '',
      password: ''
    })
    setError(null)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    setForm(EMPTY_FORM)
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const department = form.department === 'Other'
        ? (form.otherDepartment || 'Other').trim()
        : form.department

      if (editing) {
        await apiFetch(`/api/employees/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            firstName: form.firstName,
            lastName: form.lastName,
            employeeNumber: form.employeeNumber,
            department,
            phone: form.phone
          })
        })
      } else {
        await apiFetch('/api/employees', {
          method: 'POST',
          body: JSON.stringify({
            email: form.email,
            password: form.password,
            firstName: form.firstName,
            lastName: form.lastName,
            employeeNumber: form.employeeNumber,
            department,
            phone: form.phone
          })
        })
      }
      await loadEmployees()
      closeModal()
    } catch (err) {
      setError(err.message || 'Failed to save employee.')
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (employee) => {
    try {
      await apiFetch(`/api/employees/${employee.id}/status`, { method: 'PATCH' })
      await loadEmployees()
    } catch (err) {
      alert(err.message || 'Failed to update employee status.')
    }
  }

  const filtered = employees.filter((e) => {
    const q = search.toLowerCase()
    return (
      !q ||
      `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) ||
      (e.employeeNumber || '').toLowerCase().includes(q) ||
      (e.email || '').toLowerCase().includes(q) ||
      (e.department || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="py-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-sm text-gray-500">{employees.length} total employees</p>
        </div>
        <button onClick={openAddModal} className="btn-primary">
          <UserPlus size={18} />
          Add Employee
        </button>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, number, email or department..."
          className="input-field !pl-10"
        />
      </div>

      {loading ? (
        <Loading message="Loading employees..." />
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          <p className="text-lg font-semibold mb-1">No employees found</p>
          <p className="text-sm">Add an employee to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((employee) => (
            <EmployeeCard
              key={employee.id}
              employee={employee}
              onEdit={openEditModal}
              onToggleStatus={toggleStatus}
            />
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 pb-2">
              <h2 className="text-lg font-bold text-gray-900">
                {editing ? 'Edit Employee' : 'Add Employee'}
              </h2>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="mx-6 mb-4 flex items-start gap-2 bg-red-50 text-red-700 rounded-lg p-3 text-sm">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    required
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    required
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  disabled={!!editing}
                  className="input-field disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee Number</label>
                  <input
                    value={form.employeeNumber}
                    onChange={(e) => setForm({ ...form, employeeNumber: e.target.value })}
                    required
                    placeholder="EMP001"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select
                    value={DEPARTMENTS.includes(form.department) ? form.department : ''}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    required
                    className="input-field"
                  >
                    <option value="" disabled>
                      Select department...
                    </option>
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {form.department === 'Other' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department (Other)</label>
                  <input
                    value={form.department === 'Other' ? form.otherDepartment || '' : ''}
                    onChange={(e) => setForm({ ...form, otherDepartment: e.target.value })}
                    placeholder="Enter department name"
                    className="input-field"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+27..."
                  className="input-field"
                />
              </div>

              {!editing && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    minLength={6}
                    className="input-field"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? <Loader2 size={18} className="animate-spin" /> : null}
                  {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Employee'}
                </button>
                <button type="button" onClick={closeModal} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}