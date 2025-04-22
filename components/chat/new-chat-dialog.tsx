"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { User } from "@/types/user"
import { Search, CheckCircle, Loader2, Users } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore"
import { getInitials } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface NewChatDialogProps {
  currentUser: User
  onClose: () => void
  onChatCreated: (chatId: string) => void
}

export default function NewChatDialog({ currentUser, onClose, onChatCreated }: NewChatDialogProps) {
  const [activeTab, setActiveTab] = useState("user")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [groupName, setGroupName] = useState("")
  const [groupDescription, setGroupDescription] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const { toast } = useToast()

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      // Search by username
      const usernameQuery = query(collection(db, "users"), where("username", "==", searchQuery))

      const usernameSnapshot = await getDocs(usernameQuery)

      // If no results, try partial name match
      if (usernameSnapshot.empty) {
        const nameQuery = query(
          collection(db, "users"),
          where("fullName", ">=", searchQuery),
          where("fullName", "<=", searchQuery + "\uf8ff"),
        )

        const nameSnapshot = await getDocs(nameQuery)

        const results = nameSnapshot.docs
          .map((doc) => ({ uid: doc.id, ...doc.data() }) as User)
          .filter((user) => user.uid !== currentUser.uid)

        setSearchResults(results)
      } else {
        const results = usernameSnapshot.docs
          .map((doc) => ({ uid: doc.id, ...doc.data() }) as User)
          .filter((user) => user.uid !== currentUser.uid)

        setSearchResults(results)
      }
    } catch (error) {
      console.error("Error searching users:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to search users",
      })
    } finally {
      setIsSearching(false)
    }
  }

  const handleUserSelect = (user: User) => {
    if (activeTab === "user") {
      createDirectChat(user)
    } else {
      // Add to group
      if (!selectedUsers.some((u) => u.uid === user.uid)) {
        setSelectedUsers([...selectedUsers, user])
      }
    }
  }

  const removeSelectedUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((user) => user.uid !== userId))
  }

  const createDirectChat = async (user: User) => {
    setIsCreating(true)
    try {
      // Check if chat already exists
      const chatsQuery = query(collection(db, "chats"), where("participants", "array-contains", currentUser.uid))

      const chatsSnapshot = await getDocs(chatsQuery)

      let existingChatId = null

      chatsSnapshot.docs.forEach((doc) => {
        const chatData = doc.data()
        if (!chatData.isGroup && chatData.participants.includes(user.uid) && chatData.participants.length === 2) {
          existingChatId = doc.id
        }
      })

      if (existingChatId) {
        onChatCreated(existingChatId)
        onClose()
        return
      }

      // Create new chat
      const chatRef = await addDoc(collection(db, "chats"), {
        participants: [currentUser.uid, user.uid],
        isGroup: false,
        createdAt: serverTimestamp(),
      })

      onChatCreated(chatRef.id)
      onClose()
    } catch (error) {
      console.error("Error creating chat:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create chat",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const createGroupChat = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a group name and select at least one user",
      })
      return
    }

    setIsCreating(true)
    try {
      // Create group chat
      const participants = [currentUser.uid, ...selectedUsers.map((user) => user.uid)]

      const chatRef = await addDoc(collection(db, "chats"), {
        participants,
        isGroup: true,
        groupInfo: {
          name: groupName,
          description: groupDescription,
          profilePic: "",
          admins: [currentUser.uid],
          createdBy: currentUser.uid,
        },
        createdAt: serverTimestamp(),
      })

      onChatCreated(chatRef.id)
      onClose()
    } catch (error) {
      console.error("Error creating group chat:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create group chat",
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="flex flex-col space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="user">Direct Chat</TabsTrigger>
          <TabsTrigger value="group">Group Chat</TabsTrigger>
        </TabsList>

        <TabsContent value="user" className="space-y-4">
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by username or name..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
            </Button>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2">
            {searchResults.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                {searchQuery ? "No users found" : "Search for users to chat with"}
              </div>
            ) : (
              searchResults.map((user) => (
                <div
                  key={user.uid}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-accent cursor-pointer"
                  onClick={() => handleUserSelect(user)}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={user.profilePic || "/placeholder.svg"} />
                      <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center space-x-1">
                        <span className="font-medium">{user.fullName}</span>
                        {user.verified && <CheckCircle className="h-4 w-4 text-blue-500" />}
                      </div>
                      <span className="text-sm text-muted-foreground">@{user.username}</span>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost">
                    Chat
                  </Button>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="group" className="space-y-4">
          <div className="space-y-4">
            <div>
              <Input placeholder="Group Name" value={groupName} onChange={(e) => setGroupName(e.target.value)} />
            </div>
            <div>
              <Input
                placeholder="Group Description (optional)"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {selectedUsers.map((user) => (
                <div
                  key={user.uid}
                  className="flex items-center space-x-1 bg-secondary text-secondary-foreground rounded-full px-3 py-1"
                >
                  <span className="text-sm">@{user.username}</span>
                  <button
                    onClick={() => removeSelectedUser(user.uid)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>

            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Add members by username or name..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
              </Button>
            </div>

            <div className="max-h-40 overflow-y-auto space-y-2">
              {searchResults.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  {searchQuery ? "No users found" : "Search for users to add to the group"}
                </div>
              ) : (
                searchResults.map((user) => (
                  <div
                    key={user.uid}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-accent cursor-pointer"
                    onClick={() => handleUserSelect(user)}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={user.profilePic || "/placeholder.svg"} />
                        <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-1">
                          <span className="font-medium">{user.fullName}</span>
                          {user.verified && <CheckCircle className="h-4 w-4 text-blue-500" />}
                        </div>
                        <span className="text-sm text-muted-foreground">@{user.username}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost">
                      Add
                    </Button>
                  </div>
                ))
              )}
            </div>

            <Button
              onClick={createGroupChat}
              disabled={isCreating || !groupName.trim() || selectedUsers.length === 0}
              className="w-full"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Group...
                </>
              ) : (
                <>
                  <Users className="mr-2 h-4 w-4" />
                  Create Group Chat
                </>
              )}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
