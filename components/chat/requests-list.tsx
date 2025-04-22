"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import type { User, ChatRequest } from "@/types/user"
import { formatDate, getInitials } from "@/lib/utils"
import { CheckCircle, Check, X, Loader2 } from "lucide-react"
import { db } from "@/lib/firebase"
import { doc, updateDoc, deleteDoc, addDoc, collection, serverTimestamp } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

interface RequestsListProps {
  requests: ChatRequest[]
  currentUser: User
}

export default function RequestsList({ requests, currentUser }: RequestsListProps) {
  const [processingRequests, setProcessingRequests] = useState<Record<string, boolean>>({})
  const { toast } = useToast()

  const handleAcceptRequest = async (request: ChatRequest) => {
    setProcessingRequests((prev) => ({ ...prev, [request.id]: true }))

    try {
      // Update request status
      await updateDoc(doc(db, "chatRequests", request.id), {
        status: "accepted",
      })

      // Create a new chat
      await addDoc(collection(db, "chats"), {
        participants: [currentUser.uid, request.senderId],
        isGroup: false,
        createdAt: serverTimestamp(),
      })

      toast({
        title: "Request accepted",
        description: "You can now chat with this user",
      })
    } catch (error) {
      console.error("Error accepting request:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to accept request",
      })
    } finally {
      setProcessingRequests((prev) => ({ ...prev, [request.id]: false }))
    }
  }

  const handleRejectRequest = async (request: ChatRequest) => {
    setProcessingRequests((prev) => ({ ...prev, [request.id]: true }))

    try {
      // Update request status
      await updateDoc(doc(db, "chatRequests", request.id), {
        status: "rejected",
      })

      toast({
        title: "Request rejected",
      })
    } catch (error) {
      console.error("Error rejecting request:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reject request",
      })
    } finally {
      setProcessingRequests((prev) => ({ ...prev, [request.id]: false }))
    }
  }

  const handleDeleteRequest = async (requestId: string) => {
    setProcessingRequests((prev) => ({ ...prev, [requestId]: true }))

    try {
      await deleteDoc(doc(db, "chatRequests", requestId))

      toast({
        title: "Request deleted",
      })
    } catch (error) {
      console.error("Error deleting request:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete request",
      })
    } finally {
      setProcessingRequests((prev) => ({ ...prev, [requestId]: false }))
    }
  }

  const pendingRequests = requests.filter((req) => req.status === "pending")
  const otherRequests = requests.filter((req) => req.status !== "pending")

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Chat Requests</h2>
        <p className="text-sm text-muted-foreground">Manage your chat requests</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {requests.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">No chat requests</div>
        ) : (
          <>
            {pendingRequests.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium text-sm text-muted-foreground">Pending Requests</h3>
                {pendingRequests.map((request) => (
                  <Card key={request.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={request.senderInfo?.profilePic || "/placeholder.svg"} />
                          <AvatarFallback>{getInitials(request.senderInfo?.fullName || "")}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center space-x-1">
                            <span className="font-medium">{request.senderInfo?.fullName}</span>
                            {request.senderInfo?.verified && <CheckCircle className="h-4 w-4 text-blue-500" />}
                          </div>
                          <span className="text-sm text-muted-foreground">@{request.senderInfo?.username}</span>
                          <div className="text-xs text-muted-foreground mt-1">{formatDate(request.createdAt)}</div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectRequest(request)}
                          disabled={processingRequests[request.id]}
                        >
                          {processingRequests[request.id] ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAcceptRequest(request)}
                          disabled={processingRequests[request.id]}
                        >
                          {processingRequests[request.id] ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {otherRequests.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium text-sm text-muted-foreground">Past Requests</h3>
                {otherRequests.map((request) => (
                  <Card key={request.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={request.senderInfo?.profilePic || "/placeholder.svg"} />
                          <AvatarFallback>{getInitials(request.senderInfo?.fullName || "")}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center space-x-1">
                            <span className="font-medium">{request.senderInfo?.fullName}</span>
                            {request.senderInfo?.verified && <CheckCircle className="h-4 w-4 text-blue-500" />}
                          </div>
                          <span className="text-sm text-muted-foreground">@{request.senderInfo?.username}</span>
                          <div className="flex items-center space-x-1 mt-1">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                request.status === "accepted"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                              }`}
                            >
                              {request.status === "accepted" ? "Accepted" : "Rejected"}
                            </span>
                            <span className="text-xs text-muted-foreground">{formatDate(request.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteRequest(request.id)}
                        disabled={processingRequests[request.id]}
                      >
                        {processingRequests[request.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
