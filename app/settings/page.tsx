"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ProfileSettings from "@/components/settings/profile-settings"
import PrivacySettings from "@/components/settings/privacy-settings"
import VerificationSettings from "@/components/settings/verification-settings"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SettingsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("profile")

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex items-center p-4 border-b">
        <Button variant="ghost" size="icon" onClick={() => router.push("/home")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold ml-2">Settings</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="p-4">
          <ProfileSettings user={user} />
        </TabsContent>

        <TabsContent value="privacy" className="p-4">
          <PrivacySettings user={user} />
        </TabsContent>

        <TabsContent value="verification" className="p-4">
          <VerificationSettings user={user} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
