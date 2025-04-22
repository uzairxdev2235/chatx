"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import type { User } from "@/types/user"
import { formatTimestamp, getInitials } from "@/lib/utils"
import { Search, Plus, Settings, CheckCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import NewChatDialog from "./new-chat-dialog"

interface ChatListProps {
  chats: any[]
  onChatSelect: (chatId: string) => void
  currentUser: User
}

export default function ChatList({ chats, onChatSelect, currentUser }: ChatListProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [isNewChatOpen, setIsNewChatOpen] = useState(false)

  const filteredChats = chats.filter((chat) => {
    if (!searchQuery) return true

    if (chat.isGroup && chat.groupInfo) {
      return chat.groupInfo.name.toLowerCase().includes(searchQuery.toLowerCase())
    }

    // For direct chats, we need to get the other user's info
    // This is a simplified version, in a real app you'd have the other user's info cached
    return false
  })

  const getChatName = (chat: any) => {
    if (chat.isGroup && chat.groupInfo) {
      return chat.groupInfo.name
    }

    // For direct chats, return the other participant's name
    // This is simplified, in a real app you'd have this info cached
    return "Loading..."
  }

  const getChatAvatar = (chat: any) => {
    if (chat.isGroup && chat.groupInfo) {
      return chat.groupInfo.profilePic
    }

    // For direct chats, return the other participant's avatar
    return ""
  }

  const getChatInitials = (chat: any) => {
    if (chat.isGroup && chat.groupInfo) {
      return getInitials(chat.groupInfo.name)
    }

    // For direct chats, return the other participant's initials
    return "?"
  }

  const getLastMessageText = (chat: any) => {
    if (!chat.lastMessage) return "No messages yet"
    return chat.lastMessage.text
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between">
        <h1 className="text-xl font-bold">ChatX</h1>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => setIsNewChatOpen(true)}>
            <Plus className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => router.push("/settings")}>
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredChats.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {searchQuery ? "No chats found" : "No chats yet. Start a new conversation!"}
          </div>
        ) : (
          filteredChats.map((chat) => (
            <Card
              key={chat.id}
              className="p-3 cursor-pointer hover:bg-accent transition-colors"
              onClick={() => onChatSelect(chat.id)}
            >
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={getChatAvatar(chat) || "/placeholder.svg"} />
                  <AvatarFallback>{getChatInitials(chat)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <span className="font-medium truncate">{getChatName(chat)}</span>
                      {chat.isGroup && chat.groupInfo?.verified && <CheckCircle className="h-4 w-4 text-blue-500" />}
                    </div>
                    {chat.lastMessage && (
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(chat.lastMessage.timestamp)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{getLastMessageText(chat)}</p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Chat</DialogTitle>
          </DialogHeader>
          <NewChatDialog
            currentUser={currentUser}
            onClose={() => setIsNewChatOpen(false)}
            onChatCreated={onChatSelect}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
