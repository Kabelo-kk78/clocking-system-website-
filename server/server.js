import app from './app.js'
import { configured } from './services/firebaseAdmin.js'
import { startQrEmailScheduler } from './services/qrEmailScheduler.js'

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`MDIHub Clocking Server running on http://localhost:${PORT}`)
  if (!configured) {
    console.log('   → Running without Firebase credentials. Add server/.env to enable the live API.')
  }
  startQrEmailScheduler()
})