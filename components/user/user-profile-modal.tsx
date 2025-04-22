"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { User } from "@/types/user"
import { CheckCircle, MessageSquare, Loader2 } from "lucide-react"
import { getInitials } from "@/lib/utils"
import { db } from "@/lib/firebase"
import { collection, addDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface UserProfileModalProps {
  userData: User
  currentUser: User
}

export default function UserProfileModal({ userData, currentUser }: UserProfileModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleStartChat = async () => {
    setIsLoading(true)
    try {
      // Check if chat already exists
      const chatsQuery = query(collection(db, "chats"), where("participants", "array-contains", currentUser.uid))

      const chatsSnapshot = await getDocs(chatsQuery)

      let existingChatId = null

      chatsSnapshot.docs.forEach((doc) => {
        const chatData = doc.data()
        if (!chatData.isGroup && chatData.participants.includes(userData.uid) && chatData.participants.length === 2) {
          existingChatId = doc.id
        }
      })

      if (existingChatId) {
        router.push(`/chat/${existingChatId}`)
        return
      }

      // Check if there's a pending request
      const requestsQuery = query(
        collection(db, "chatRequests"),
        where("senderId", "==", currentUser.uid),
        where("receiverId", "==", userData.uid),
      )

      const requestsSnapshot = await getDocs(requestsQuery)

      if (!requestsSnapshot.empty) {
        toast({
          title: "Chat request already sent",
          description: "Please wait for the user to accept your request",
        })
        setIsLoading(false)
        return
      }

      // Create chat request
      await addDoc(collection(db, "chatRequests"), {
        senderId: currentUser.uid,
        receiverId: userData.uid,
        status: "pending",
        createdAt: serverTimestamp(),
        senderInfo: {
          username: currentUser.username,
          fullName: currentUser.fullName,
          profilePic: currentUser.profilePic,
          verified: currentUser.verified,
        },
      })

      toast({
        title: "Chat request sent",
        description: "We'll notify you when they accept",
      })
    } catch (error) {
      console.error("Error starting chat:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send chat request",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center space-y-6">
      <Avatar className="h-24 w-24">
        <AvatarImage src={userData.profilePic || "/placeholder.svg"} />
        <AvatarFallback className="text-xl">{getInitials(userData.fullName)}</AvatarFallback>
      </Avatar>

      <div className="text-center">
        <div className="flex items-center justify-center space-x-1">
          <h2 className="text-xl font-bold">{userData.fullName}</h2>
          {userData.verified && <CheckCircle className="h-5 w-5 text-blue-500" />}
        </div>
        <p className="text-muted-foreground">@{userData.username}</p>

        {userData.bio && <p className="mt-2">{userData.bio}</p>}
      </div>

      <Button onClick={handleStartChat} disabled={isLoading} className="w-full">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending Request...
          </>
        ) : (
          <>
            <MessageSquare className="mr-2 h-4 w-4" />
            Send Chat Request
          </>
        )}
      </Button>
    </div>
  )
}
