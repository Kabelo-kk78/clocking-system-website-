import { Router } from 'express'
import { verifyFirebaseToken, requireAdmin } from '../middleware/auth.js'
import {
  listEmployees,
  createEmployee,
  updateEmployee,
  toggleEmployeeStatus
} from '../controllers/employeeController.js'

const router = Router()

router.use(verifyFirebaseToken, requireAdmin)

router.get('/', listEmployees)
router.post('/', createEmployee)
router.put('/:id', updateEmployee)
router.patch('/:id/status', toggleEmployeeStatus)

export default router