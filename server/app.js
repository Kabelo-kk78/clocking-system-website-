import 'dotenv/config'
import express from 'express'
import cors from 'cors'

import { configured } from './services/firebaseAdmin.js'

import authRoutes from './routes/auth.js'
import attendanceRoutes from './routes/attendance.js'
import qrRoutes from './routes/qr.js'
import employeeRoutes from './routes/employees.js'
import reportRoutes from './routes/reports.js'

const app = express()

app.use(cors({ origin: true, credentials: true }))
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'mdihub-clocking-server',
    firebaseConfigured: configured,
    time: new Date().toISOString()
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/attendance', attendanceRoutes)
app.use('/api/qr', qrRoutes)
app.use('/api/employees', employeeRoutes)
app.use('/api/reports', reportRoutes)

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[Server Error]', err)
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' })
})

export default app