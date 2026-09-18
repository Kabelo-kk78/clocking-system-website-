import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged
} from 'firebase/auth'
import {
  doc,
  setDoc,
  getDoc,
  query,
  collection,
  where,
  getDocs,
  serverTimestamp
} from 'firebase/firestore'
import { auth, db } from './firebase'

export const subscribeToAuthChanges = (callback) => {
  return onAuthStateChanged(auth, callback)
}

export const registerUser = async ({ email, password, firstName, lastName, employeeNumber, department, role = 'employee' }) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password)
  const user = userCredential.user

  const userData = {
    firstName,
    lastName,
    email,
    employeeNumber,
    department,
    role,
    status: 'active',
    createdAt: serverTimestamp()
  }

  await setDoc(doc(db, 'users', user.uid), userData)

  return { user, userData }
}

export const loginUser = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password)

  const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid))
  if (!userDoc.exists()) {
    throw new Error('User profile not found. Please contact your administrator.')
  }

  const userData = userDoc.data()
  if (userData.status === 'inactive') {
    await signOut(auth)
    throw new Error('Your account is deactivated. Please contact your administrator.')
  }

  return { user: userCredential.user, userData }
}

export const logoutUser = async () => {
  await signOut(auth)
}

export const resetPassword = async (email) => {
  await sendPasswordResetEmail(auth, email)
}

export const getUserProfile = async (uid) => {
  const userDoc = await getDoc(doc(db, 'users', uid))
  return userDoc.exists() ? userDoc.data() : null
}

export const getUserByEmail = async (email) => {
  const q = query(collection(db, 'users'), where('email', '==', email))
  const snapshot = await getDocs(q)
  return snapshot.empty ? null : snapshot.docs[0].data()
}