"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { User } from "@/types/user"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Shield } from "lucide-react"

interface PrivacySettingsProps {
  user: User
}

export default function PrivacySettings({ user }: PrivacySettingsProps) {
  const [allowChatRequests, setAllowChatRequests] = useState(user.privacySettings?.allowChatRequests !== false)
  const [showOnlineStatus, setShowOnlineStatus] = useState(user.privacySettings?.showOnlineStatus !== false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSavePrivacySettings = async () => {
    setIsLoading(true)
    try {
      await updateDoc(doc(db, "users", user.uid), {
        "privacySettings.allowChatRequests": allowChatRequests,
        "privacySettings.showOnlineStatus": showOnlineStatus,
      })

      toast({
        title: "Privacy settings updated",
      })
    } catch (error) {
      console.error("Error updating privacy settings:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update privacy settings",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            Privacy Settings
          </CardTitle>
          <CardDescription>Control who can contact you and see your information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="allow-chat-requests">Allow Chat Requests</Label>
              <p className="text-sm text-muted-foreground">Allow other users to send you chat requests</p>
            </div>
            <Switch id="allow-chat-requests" checked={allowChatRequests} onCheckedChange={setAllowChatRequests} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show-online-status">Show Online Status</Label>
              <p className="text-sm text-muted-foreground">Show when you are online to other users</p>
            </div>
            <Switch id="show-online-status" checked={showOnlineStatus} onCheckedChange={setShowOnlineStatus} />
          </div>

          <Button onClick={handleSavePrivacySettings} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Privacy Settings"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
