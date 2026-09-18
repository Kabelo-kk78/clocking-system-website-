import { Router } from 'express'
import { verifyFirebaseToken, requireAdmin } from '../middleware/auth.js'
import {
  dailyReport,
  weeklyReport,
  monthlyReport
} from '../controllers/reportController.js'

const router = Router()

router.use(verifyFirebaseToken, requireAdmin)

router.get('/daily', dailyReport)
router.get('/weekly', weeklyReport)
router.get('/monthly', monthlyReport)

export default router