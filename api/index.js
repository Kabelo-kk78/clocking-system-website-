// Vercel serverless entry point.
// vercel.json rewrites /api/* requests here with the original URL in the
// `uri` query param, so the local Express app sees an unmodified request.
import app from '../server/app.js'

export default function handler(req, res) {
  const uri = req.query?.uri
  if (uri) {
    req.url = Array.isArray(uri) ? `/${uri.join('/')}` : uri
    delete req.query.uri
  }
  return app(req, res)
}