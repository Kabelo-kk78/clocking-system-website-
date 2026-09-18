export const parseQrPayload = (value) => {
  if (!value) return null
  try {
    const parsed = JSON.parse(value)
    if (parsed && parsed.app === 'mdihub-clock' && parsed.token) return parsed
  } catch {
    return null
  }
  return { token: value, legacy: true }
}

export const extractToken = (value) => {
  const parsed = parseQrPayload(value)
  return parsed ? parsed.token : value
}

export const buildQrPayload = ({ token, date, company, shift }) =>
  JSON.stringify({
    v: 1,
    app: 'mdihub-clock',
    date,
    token,
    shift: shift || 'general',
    companyId: company?.id || 'default',
    company: company?.companyName || '',
    lat: company?.latitude != null ? Number(company.latitude) : null,
    lng: company?.longitude != null ? Number(company.longitude) : null,
    radius: Number(company?.radius) || 50
  })