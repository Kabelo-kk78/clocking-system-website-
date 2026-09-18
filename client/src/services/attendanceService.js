import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  limit,
  doc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore'
import { db } from './firebase'
import apiFetch from './apiClient'

export const clockIn = async (token, location) => {
  return apiFetch('/api/attendance/clock-in', {
    method: 'POST',
    body: JSON.stringify({ token, location })
  })
}

export const clockOut = async (token, location) => {
  return apiFetch('/api/attendance/clock-out', {
    method: 'POST',
    body: JSON.stringify({ token, location })
  })
}

export const getTodayAttendance = async (employeeId) => {
  const today = new Date().toISOString().split('T')[0]
  const q = query(
    collection(db, 'attendance'),
    where('employeeId', '==', employeeId),
    where('date', '==', today),
    limit(1)
  )
  const snapshot = await getDocs(q)
  if (snapshot.empty) return null

  const docSnap = snapshot.docs[0]
  return { id: docSnap.id, ...docSnap.data() }
}

export const getMyAttendanceHistory = async (employeeId, itemsPerPage = 30) => {
  const q = query(
    collection(db, 'attendance'),
    where('employeeId', '==', employeeId),
    limit(itemsPerPage)
  )
  const snapshot = await getDocs(q)
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
}

export const getTodayAttendanceForCompany = async (date) => {
  const today = date || new Date().toISOString().split('T')[0]
  const q = query(
    collection(db, 'attendance'),
    where('date', '==', today)
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const updateAttendance = async (attendanceId, data) => {
  const ref = doc(db, 'attendance', attendanceId)
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
  return true
}

export const getCompany = async () => {
  const snapshot = await getDocs(collection(db, 'companies'))
  if (snapshot.empty) return null
  const docSnap = snapshot.docs[0]
  return { id: docSnap.id, ...docSnap.data() }
}

export const getDailyQR = async (date) => {
  const today = date || new Date().toISOString().split('T')[0]
  const q = query(
    collection(db, 'dailyQrCodes'),
    where('date', '==', today),
    where('active', '==', true),
    limit(1)
  )
  const snapshot = await getDocs(q)
  if (snapshot.empty) return null
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() }
}

export const getAttendanceLogs = async (itemsPerPage = 100) => {
  const q = query(
    collection(db, 'attendanceLogs'),
    orderBy('timestamp', 'desc'),
    limit(itemsPerPage)
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}