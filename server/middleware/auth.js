import admin from '../services/firebaseAdmin.js'
import { db } from '../services/firebaseAdmin.js'

export const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

    if (!token) {
      return res.status(401).json({ message: 'Authentication required. Please log in.' })
    }

    const decoded = await admin.auth().verifyIdToken(token)
    req.firebaseUser = decoded

    const userDoc = await db.collection('users').doc(decoded.uid).get()
    if (!userDoc.exists) {
      return res.status(401).json({ message: 'User profile not found.' })
    }

    const userData = userDoc.data()
    if (userData.status === 'inactive') {
      return res.status(403).json({ message: 'Your account has been deactivated.' })
    }

    req.user = { uid: decoded.uid, email: decoded.email || userData.email, ...userData }
    next()
  } catch (err) {
    console.error('[Auth Middleware]', err.message)
    return res.status(401).json({ message: 'Invalid or expired session. Please log in again.' })
  }
}

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'You do not have permission to perform this action.' })
  }
  next()
}