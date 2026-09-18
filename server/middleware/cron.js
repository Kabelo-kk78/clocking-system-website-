import { verifyFirebaseToken, requireAdmin } from './auth.js'

// Authorization for actions that may be triggered by an external scheduler
// (e.g. Vercel Cron or cron-job.org) OR by an authenticated admin.
// The scheduler authenticates via a shared secret passed in the x-cron-secret header.
export const adminOrCron = (req, res, next) => {
  if (process.env.CRON_SECRET && req.headers['x-cron-secret'] === process.env.CRON_SECRET) {
    req.user = { uid: 'cron', email: 'cron', role: 'admin', firstName: 'System', lastName: 'Cron' }
    return next()
  }
  return requireAdmin(req, res, next)
}