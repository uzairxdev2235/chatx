"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import ChatList from "@/components/chat/chat-list"
import ChatView from "@/components/chat/chat-view"
import MobileNavbar from "@/components/layout/mobile-navbar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import GlobalChat from "@/components/chat/global-chat"
import RequestsList from "@/components/chat/requests-list"
import { db } from "@/lib/firebase"
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore"
import type { User } from "@/types/user"

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [activeChat, setActiveChat] = useState<string | null>(null)
  const [activeChatData, setActiveChatData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("chats")
  const [userChats, setUserChats] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return

    // Fetch user's chats
    const chatsQuery = query(collection(db, "chats"), where("participants", "array-contains", user.uid))

    const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
      const chatsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setUserChats(chatsData)
    })

    // Fetch chat requests
    const requestsQuery = query(collection(db, "chatRequests"), where("receiverId", "==", user.uid))

    const requestsUnsubscribe = onSnapshot(requestsQuery, (snapshot) => {
      const requestsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setRequests(requestsData)
    })

    return () => {
      unsubscribe()
      requestsUnsubscribe()
    }
  }, [user])

  useEffect(() => {
    if (!activeChat) {
      setActiveChatData(null)
      return
    }

    const fetchChatData = async () => {
      const chatDoc = await getDoc(doc(db, "chats", activeChat))
      if (chatDoc.exists()) {
        setActiveChatData({
          id: chatDoc.id,
          ...chatDoc.data(),
        })
      }
    }

    fetchChatData()
  }, [activeChat])

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
      <MobileNavbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="hidden">
            <TabsTrigger value="chats">Chats</TabsTrigger>
            <TabsTrigger value="global">Global</TabsTrigger>
            <TabsTrigger value="requests">Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="chats" className="h-full">
            {activeChat ? (
              <ChatView chatId={activeChat} chatData={activeChatData} onBack={() => setActiveChat(null)} />
            ) : (
              <ChatList chats={userChats} onChatSelect={setActiveChat} currentUser={user as User} />
            )}
          </TabsContent>

          <TabsContent value="global" className="h-full">
            <GlobalChat currentUser={user as User} />
          </TabsContent>

          <TabsContent value="requests" className="h-full">
            <RequestsList requests={requests} currentUser={user as User} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
