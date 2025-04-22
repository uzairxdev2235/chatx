"use client"

import { MessageSquare, Users, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MobileNavbarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export default function MobileNavbar({ activeTab, setActiveTab }: MobileNavbarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 border-t bg-background z-10 md:hidden">
      <div className="flex items-center justify-around p-2">
        <Button
          variant={activeTab === "chats" ? "default" : "ghost"}
          size="icon"
          onClick={() => setActiveTab("chats")}
          className="h-12 w-12 rounded-full"
        >
          <MessageSquare className="h-5 w-5" />
        </Button>
        <Button
          variant={activeTab === "global" ? "default" : "ghost"}
          size="icon"
          onClick={() => setActiveTab("global")}
          className="h-12 w-12 rounded-full"
        >
          <Users className="h-5 w-5" />
        </Button>
        <Button
          variant={activeTab === "requests" ? "default" : "ghost"}
          size="icon"
          onClick={() => setActiveTab("requests")}
          className="h-12 w-12 rounded-full"
        >
          <Bell className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
