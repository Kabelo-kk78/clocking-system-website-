import { Router } from 'express'
import { verifyFirebaseToken, requireAdmin } from '../middleware/auth.js'
import { adminOrCron } from '../middleware/cron.js'
import {
  generateDailyQR,
  getTodayQR,
  validateQRToken,
  revokeTodayQR,
  emailTodayQR
} from '../controllers/qrController.js'

const router = Router()

router.get('/today', getTodayQR)
router.post('/generate', verifyFirebaseToken, requireAdmin, generateDailyQR)
router.post('/validate', verifyFirebaseToken, validateQRToken)
router.post('/revoke', verifyFirebaseToken, requireAdmin, revokeTodayQR)

// Email today's QR to all active employees.
// Callable by an admin OR by an external scheduler using x-cron-secret.
router.post('/email', verifyFirebaseToken, adminOrCron, emailTodayQR)
router.post('/send-daily', verifyFirebaseToken, adminOrCron, emailTodayQR)

export default router