"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, CheckCircle } from "lucide-react"
import { formatTimestamp, getInitials } from "@/lib/utils"
import { db } from "@/lib/firebase"
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where, getDocs } from "firebase/firestore"
import type { User } from "@/types/user"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import UserProfileModal from "../user/user-profile-modal"

interface GlobalChatProps {
  currentUser: User
}

export default function GlobalChat({ currentUser }: GlobalChatProps) {
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Fetch global chat messages
    const messagesQuery = query(collection(db, "globalChat"), orderBy("timestamp", "asc"))

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setMessages(messagesData)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    // Fetch online users
    const fetchOnlineUsers = async () => {
      try {
        const usersQuery = query(collection(db, "users"), where("privacySettings.showOnlineStatus", "==", true))

        const snapshot = await getDocs(usersQuery)
        const usersData = snapshot.docs
          .map((doc) => ({ uid: doc.id, ...doc.data() }) as User)
          .filter((user) => user.uid !== currentUser.uid)

        setOnlineUsers(usersData)
      } catch (error) {
        console.error("Error fetching online users:", error)
      }
    }

    fetchOnlineUsers()

    // In a real app, you would use a real-time listener for online status
    const interval = setInterval(fetchOnlineUsers, 60000) // Refresh every minute

    return () => clearInterval(interval)
  }, [currentUser.uid])

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    setIsLoading(true)
    try {
      await addDoc(collection(db, "globalChat"), {
        senderId: currentUser.uid,
        senderName: currentUser.fullName,
        senderUsername: currentUser.username,
        senderProfilePic: currentUser.profilePic,
        senderVerified: currentUser.verified,
        text: newMessage,
        timestamp: serverTimestamp(),
      })
      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUserClick = (user: User) => {
    setSelectedUser(user)
  }

  return (
    <div className="flex flex-col h-full md:flex-row">
      <div className="flex-1 flex flex-col h-full md:border-r">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Global Chat</h2>
          <p className="text-sm text-muted-foreground">Chat with everyone online</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">No messages yet. Start the conversation!</div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.senderId === currentUser.uid ? "justify-end" : "justify-start"}`}
              >
                {message.senderId !== currentUser.uid && (
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage src={message.senderProfilePic || "/placeholder.svg"} />
                    <AvatarFallback>{getInitials(message.senderName)}</AvatarFallback>
                  </Avatar>
                )}
                <div>
                  {message.senderId !== currentUser.uid && (
                    <div className="flex items-center space-x-1 mb-1">
                      <span className="text-xs font-medium">@{message.senderUsername}</span>
                      {message.senderVerified && <CheckCircle className="h-3 w-3 text-blue-500" />}
                    </div>
                  )}
                  <div className={`message-bubble ${message.senderId === currentUser.uid ? "sent" : "received"}`}>
                    <div className="text-sm">{message.text}</div>
                    <div className="text-xs opacity-70 text-right mt-1">{formatTimestamp(message.timestamp)}</div>
                  </div>
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
      </div>

      <div className="hidden md:block w-64 p-4 overflow-y-auto">
        <h3 className="font-medium mb-3">Online Users</h3>
        <div className="space-y-2">
          {onlineUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users online</p>
          ) : (
            onlineUsers.map((user) => (
              <div
                key={user.uid}
                className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                onClick={() => handleUserClick(user)}
              >
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={user.profilePic || "/placeholder.svg"} />
                    <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background"></span>
                </div>
                <div>
                  <div className="flex items-center space-x-1">
                    <span className="font-medium text-sm">{user.fullName}</span>
                    {user.verified && <CheckCircle className="h-3 w-3 text-blue-500" />}
                  </div>
                  <span className="text-xs text-muted-foreground">@{user.username}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent>
          {selectedUser && <UserProfileModal userData={selectedUser} currentUser={currentUser} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
