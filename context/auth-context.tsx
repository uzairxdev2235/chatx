"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import type { User } from "@/types/user"
import { setCookie, deleteCookie } from "cookies-next"

interface AuthContextType {
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signUpWithEmail: (
    email: string,
    password: string,
    username: string,
    fullName: string,
    profilePic?: string,
  ) => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data() as Omit<User, "uid">
          setUser({
            uid: firebaseUser.uid,
            ...userData,
          })
          setCookie("auth", "true")
        } else {
          setUser(null)
          deleteCookie("auth")
        }
      } else {
        setUser(null)
        deleteCookie("auth")
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const firebaseUser = result.user

      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))

      if (!userDoc.exists()) {
        // User doesn't exist, redirect to username setup
        const userData = {
          email: firebaseUser.email,
          fullName: firebaseUser.displayName || "",
          profilePic: firebaseUser.photoURL || "",
          username: "",
          bio: "",
          verified: false,
          createdAt: new Date(),
          privacySettings: {
            allowChatRequests: true,
            showOnlineStatus: true,
          },
        }

        await setDoc(doc(db, "users", firebaseUser.uid), userData)

        setUser({
          uid: firebaseUser.uid,
          ...userData,
        })
      }
    } catch (error) {
      console.error("Error signing in with Google:", error)
      throw error
    }
  }

  const signUpWithEmail = async (
    email: string,
    password: string,
    username: string,
    fullName: string,
    profilePic?: string,
  ) => {
    try {
      // Check if username is already taken
      const usernameQuery = await getDoc(doc(db, "usernames", username))
      if (usernameQuery.exists()) {
        throw new Error("Username is already taken")
      }

      const result = await createUserWithEmailAndPassword(auth, email, password)
      const firebaseUser = result.user

      const userData = {
        email,
        username,
        fullName,
        profilePic: profilePic || "",
        bio: "",
        verified: false,
        createdAt: new Date(),
        privacySettings: {
          allowChatRequests: true,
          showOnlineStatus: true,
        },
      }

      // Save user data to Firestore
      await setDoc(doc(db, "users", firebaseUser.uid), userData)

      // Reserve username
      await setDoc(doc(db, "usernames", username), {
        uid: firebaseUser.uid,
      })

      setUser({
        uid: firebaseUser.uid,
        ...userData,
      })
    } catch (error) {
      console.error("Error signing up with email:", error)
      throw error
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      console.error("Error signing in with email:", error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
      setUser(null)
      deleteCookie("auth")
    } catch (error) {
      console.error("Error signing out:", error)
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signUpWithEmail,
        signInWithEmail,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
