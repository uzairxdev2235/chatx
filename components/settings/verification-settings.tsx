"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { User, VerificationRequest } from "@/types/user"
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, Clock, XCircle, Loader2, BadgeCheck } from "lucide-react"

interface VerificationSettingsProps {
  user: User
}

export default function VerificationSettings({ user }: VerificationSettingsProps) {
  const [verificationStatus, setVerificationStatus] = useState<"none" | "pending" | "approved" | "denied">("none")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const checkVerificationStatus = async () => {
      setIsLoading(true)
      try {
        // Check if user is already verified
        if (user.verified) {
          setVerificationStatus("approved")
          setIsLoading(false)
          return
        }

        // Check if there's a pending verification request
        const requestsQuery = query(collection(db, "verificationRequests"), where("userId", "==", user.uid))

        const snapshot = await getDocs(requestsQuery)

        if (!snapshot.empty) {
          const requestData = snapshot.docs[0].data() as VerificationRequest
          setVerificationStatus(requestData.status)
        } else {
          setVerificationStatus("none")
        }
      } catch (error) {
        console.error("Error checking verification status:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkVerificationStatus()
  }, [user])

  const handleRequestVerification = async () => {
    setIsSubmitting(true)
    try {
      // Create verification request
      await addDoc(collection(db, "verificationRequests"), {
        userId: user.uid,
        status: "pending",
        createdAt: serverTimestamp(),
        userInfo: {
          username: user.username,
          email: user.email,
          fullName: user.fullName,
        },
      })

      // Send email using formsubmit
      const formData = new FormData()
      formData.append("uid", user.uid)
      formData.append("email", user.email)
      formData.append("username", user.username)

      await fetch("https://formsubmit.co/uzairxdev223@gmail.com", {
        method: "POST",
        body: formData,
      })

      setVerificationStatus("pending")

      toast({
        title: "Verification request submitted",
        description: "We'll review your request and get back to you soon.",
      })
    } catch (error) {
      console.error("Error requesting verification:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit verification request",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderVerificationStatus = () => {
    switch (verificationStatus) {
      case "approved":
        return (
          <div className="flex flex-col items-center space-y-4 py-6">
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium">Verified Account</h3>
              <p className="text-muted-foreground">
                Your account has been verified. The verified badge is now visible on your profile.
              </p>
            </div>
          </div>
        )
      case "pending":
        return (
          <div className="flex flex-col items-center space-y-4 py-6">
            <div className="h-16 w-16 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
              <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium">Verification Pending</h3>
              <p className="text-muted-foreground">
                Your verification request is being reviewed. We'll notify you once it's processed.
              </p>
            </div>
          </div>
        )
      case "denied":
        return (
          <div className="flex flex-col items-center space-y-4 py-6">
            <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
              <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium">Verification Denied</h3>
              <p className="text-muted-foreground">
                Your verification request was denied. You can submit a new request after 30 days.
              </p>
            </div>
            <Button onClick={handleRequestVerification} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Request Again"
              )}
            </Button>
          </div>
        )
      default:
        return (
          <div className="space-y-4 py-6">
            <p className="text-muted-foreground">
              Get a verified badge to let other users know that your account is authentic.
            </p>
            <Button onClick={handleRequestVerification} disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting Request...
                </>
              ) : (
                <>
                  <BadgeCheck className="mr-2 h-4 w-4" />
                  Request Verification
                </>
              )}
            </Button>
          </div>
        )
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BadgeCheck className="mr-2 h-5 w-5" />
            Account Verification
          </CardTitle>
          <CardDescription>Get a verified badge for your account</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            renderVerificationStatus()
          )}
        </CardContent>
      </Card>
    </div>
  )
}
