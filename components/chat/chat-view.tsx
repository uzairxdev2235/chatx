"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Send, CheckCircle, Info } from "lucide-react"
import { formatTimestamp, getInitials } from "@/lib/utils"
import { db } from "@/lib/firebase"
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore"
import type { User } from "@/types/user"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import UserProfileModal from "../user/user-profile-modal"
import GroupInfoModal from "../group/group-info-modal"

interface ChatViewProps {
  chatId: string
  chatData: any
  onBack: () => void
}

export default function ChatView({ chatId, chatData, onBack }: ChatViewProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [chatPartners, setChatPartners] = useState<User[]>([])
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chatId) return

    const messagesQuery = query(collection(db, "messages"), where("chatId", "==", chatId), orderBy("timestamp", "asc"))

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setMessages(messagesData)
    })

    return () => unsubscribe()
  }, [chatId])

  useEffect(() => {
    if (!chatData || !user) return

    const fetchChatPartners = async () => {
      if (chatData.isGroup) {
        // For groups, we don't need to fetch partners
        return
      }

      // For direct chats, get the other user's info
      const otherUserId = chatData.participants.find((id: string) => id !== user.uid)
      if (otherUserId) {
        const userDoc = await getDoc(doc(db, "users", otherUserId))
        if (userDoc.exists()) {
          setChatPartners([{ uid: userDoc.id, ...userDoc.data() } as User])
        }
      }
    }

    fetchChatPartners()
  }, [chatData, user])

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user || !chatId) return

    setIsLoading(true)
    try {
      await addDoc(collection(db, "messages"), {
        chatId,
        senderId: user.uid,
        text: newMessage,
        timestamp: serverTimestamp(),
        read: false,
      })
      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getChatName = () => {
    if (chatData?.isGroup && chatData?.groupInfo) {
      return chatData.groupInfo.name
    }

    if (chatPartners.length > 0) {
      return chatPartners[0].fullName
    }

    return "Chat"
  }

  const getChatAvatar = () => {
    if (chatData?.isGroup && chatData?.groupInfo) {
      return chatData.groupInfo.profilePic
    }

    if (chatPartners.length > 0) {
      return chatPartners[0].profilePic
    }

    return ""
  }

  const getChatInitials = () => {
    if (chatData?.isGroup && chatData?.groupInfo) {
      return getInitials(chatData.groupInfo.name)
    }

    if (chatPartners.length > 0) {
      return getInitials(chatPartners[0].fullName)
    }

    return "?"
  }

  const isVerified = () => {
    if (chatData?.isGroup && chatData?.groupInfo) {
      return chatData.groupInfo.verified
    }

    if (chatPartners.length > 0) {
      return chatPartners[0].verified
    }

    return false
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setIsInfoModalOpen(true)}>
            <Avatar>
              <AvatarImage src={getChatAvatar() || "/placeholder.svg"} />
              <AvatarFallback>{getChatInitials()}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-1">
                <span className="font-medium">{getChatName()}</span>
                {isVerified() && <CheckCircle className="h-4 w-4 text-blue-500" />}
              </div>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsInfoModalOpen(true)}>
          <Info className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">No messages yet. Start the conversation!</div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.senderId === user?.uid ? "justify-end" : "justify-start"}`}
            >
              <div className={`message-bubble ${message.senderId === user?.uid ? "sent" : "received"}`}>
                <div className="text-sm">{message.text}</div>
                <div className="text-xs opacity-70 text-right mt-1">{formatTimestamp(message.timestamp)}</div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-3 border-t flex items-center space-x-2">
        <Input
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={isLoading || !newMessage.trim()}>
          <Send className="h-5 w-5" />
        </Button>
      </form>

      <Dialog open={isInfoModalOpen} onOpenChange={setIsInfoModalOpen}>
        <DialogContent>
          {chatData?.isGroup ? (
            <GroupInfoModal
              groupData={chatData.groupInfo}
              chatId={chatId}
              participants={chatData.participants}
              currentUser={user as User}
            />
          ) : (
            chatPartners.length > 0 && <UserProfileModal userData={chatPartners[0]} currentUser={user as User} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
