import admin from 'firebase-admin'

let db = null
let configured = false

const readCredentials = () => {
  // Support a single bundled JSON/base64 service-account value (handy on Vercel,
  // where multi-line vars are awkward) as well as the split FIREBASE_* vars.
  const bundled =
    process.env.FIREBASE_SERVICE_ACCOUNT_B64 ||
    process.env.FIREBASE_SERVICE_ACCOUNT ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON

  if (bundled) {
    const raw = bundled.startsWith('{') ? bundled : Buffer.from(bundled, 'base64').toString('utf8')
    return JSON.parse(raw)
  }

  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    return {
      project_id: process.env.FIREBASE_PROJECT_ID,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n')
    }
  }

  return null
}

try {
  const creds = readCredentials()
  if (creds?.project_id && creds?.client_email && creds?.private_key) {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(creds),
        databaseURL: process.env.FIREBASE_DATABASE_URL
      })
    }
    db = admin.firestore()
    configured = true
    console.log('[firebaseAdmin] Firebase Admin initialised.')
  } else {
    console.warn(
      '[firebaseAdmin] Firebase Admin credentials not found. ' +
        'The API will start, but database routes require credentials (see server/.env or env vars).'
    )
  }
} catch (err) {
  console.warn('[firebaseAdmin] Firebase Admin could not be initialised:', err.message)
}

export { db, configured }
export default admin