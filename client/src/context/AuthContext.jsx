import { createContext, useContext, useEffect, useState } from 'react'
import { subscribeToAuthChanges, logoutUser, getUserProfile } from '../services/authService'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await getUserProfile(firebaseUser.uid)
          setUser({ uid: firebaseUser.uid, email: firebaseUser.email, ...profile })
          setUserData(profile)
        } catch (err) {
          setUser(null)
          setUserData(null)
        }
      } else {
        setUser(null)
        setUserData(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const logout = async () => {
    await logoutUser()
  }

  return (
    <AuthContext.Provider value={{ user, userData, loading, logout, isAdmin: userData?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  )
}