import { Router } from 'express'
import { verifyFirebaseToken } from '../middleware/auth.js'
import {
  clockInHandler,
  clockOutHandler,
  getMyAttendance
} from '../controllers/attendanceController.js'

const router = Router()

router.post('/clock-in', verifyFirebaseToken, clockInHandler)
router.post('/clock-out', verifyFirebaseToken, clockOutHandler)
router.get('/me', verifyFirebaseToken, getMyAttendance)

export default router