import 'dotenv/config'
import admin, { db, configured } from './services/firebaseAdmin.js'

const EMAIL = process.env.ADMIN_EMAIL || 'admin@mdihub.co.za'
const PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

if (!configured) {
  console.error('Firebase credentials not configured — aborting.')
  process.exit(1)
}

const run = async () => {
  let uid
  try {
    const record = await admin.auth().createUser({ email: EMAIL, password: PASSWORD, displayName: 'Administrator' })
    uid = record.uid
    console.log('Created Firebase Auth user:', uid)
  } catch (e) {
    if (e.code === 'auth/email-already-exists') {
      const rec = await admin.auth().getUserByEmail(EMAIL)
      uid = rec.uid
      await admin.auth().updateUser(uid, { password: PASSWORD })
      console.log('User already existed; password reset. UID:', uid)
    } else throw e
  }

  await db.collection('users').doc(uid).set(
    {
      firstName: 'Admin',
      lastName: 'Administrator',
      email: EMAIL,
      role: 'admin',
      status: 'active',
      createdAt: new Date().toISOString()
    },
    { merge: true }
  )

  const doc = await db.collection('users').doc(uid).get()
  console.log('Firestore user doc:', JSON.stringify({ uid, ...doc.data() }))
}

run().catch((e) => { console.error(e); process.exit(1) })
