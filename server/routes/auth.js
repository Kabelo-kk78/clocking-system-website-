import { Router } from 'express'
import { verifyFirebaseToken } from '../middleware/auth.js'
import { db } from '../services/firebaseAdmin.js'

const router = Router()

router.get('/me', verifyFirebaseToken, async (req, res) => {
  return res.json({ user: req.user })
})

router.post('/profile', verifyFirebaseToken, async (req, res) => {
  try {
    const { firstName, lastName, phone, department } = req.body || {}
    const updates = {}
    if (firstName !== undefined) updates.firstName = firstName
    if (lastName !== undefined) updates.lastName = lastName
    if (phone !== undefined) updates.phone = phone
    if (department !== undefined) updates.department = department

    await db.collection('users').doc(req.user.uid).update(updates)
    return res.json({ success: true, ...updates })
  } catch (err) {
    console.error('[auth/profile]', err)
    return res.status(500).json({ message: 'Failed to update profile.' })
  }
})

export default router