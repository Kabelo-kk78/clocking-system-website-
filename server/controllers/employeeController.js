import admin, { db } from '../services/firebaseAdmin.js'

export const listEmployees = async (req, res) => {
  try {
    const snapshot = await db.collection('users').where('role', '==', 'employee').get()
    const employees = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
    return res.json({ employees })
  } catch (err) {
    console.error('[listEmployees]', err)
    return res.status(500).json({ message: 'Failed to load employees.' })
  }
}

export const createEmployee = async (req, res) => {
  try {
    const { email, password, firstName, lastName, employeeNumber, department, phone } = req.body || {}

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ message: 'Email, password, first name and last name are required.' })
    }

    const userRecord = await admin.auth().createUser({ email, password, displayName: `${firstName} ${lastName}` })

    const userData = {
      firstName,
      lastName,
      email,
      employeeNumber: employeeNumber || '',
      department: department || '',
      phone: phone || '',
      role: 'employee',
      status: 'active',
      createdAt: new Date().toISOString()
    }

    await db.collection('users').doc(userRecord.uid).set(userData)

    return res.status(201).json({ uid: userRecord.uid, ...userData })
  } catch (err) {
    console.error('[createEmployee]', err)
    if (err.code === 'auth/email-already-exists') {
      return res.status(409).json({ message: 'An account with this email already exists.' })
    }
    return res.status(500).json({ message: 'Failed to create employee.' })
  }
}

export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params
    const { firstName, lastName, employeeNumber, department, phone } = req.body || {}

    const updates = {}
    if (firstName !== undefined) updates.firstName = firstName
    if (lastName !== undefined) updates.lastName = lastName
    if (employeeNumber !== undefined) updates.employeeNumber = employeeNumber
    if (department !== undefined) updates.department = department
    if (phone !== undefined) updates.phone = phone

    await db.collection('users').doc(id).update(updates)

    return res.json({ id, ...updates })
  } catch (err) {
    console.error('[updateEmployee]', err)
    return res.status(500).json({ message: 'Failed to update employee.' })
  }
}

export const toggleEmployeeStatus = async (req, res) => {
  try {
    const { id } = req.params
    const docRef = db.collection('users').doc(id)
    const userDoc = await docRef.get()

    if (!userDoc.exists) {
      return res.status(404).json({ message: 'Employee not found.' })
    }

    const currentStatus = userDoc.data().status
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'

    await docRef.update({ status: newStatus })
    await admin.auth().updateUser(id, { disabled: newStatus === 'inactive' })

    return res.json({ id, status: newStatus })
  } catch (err) {
    console.error('[toggleEmployeeStatus]', err)
    return res.status(500).json({ message: 'Failed to update employee status.' })
  }
}