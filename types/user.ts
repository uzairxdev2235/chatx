export interface User {
  uid: string
  email: string
  username: string
  fullName: string
  profilePic: string
  bio?: string
  verified: boolean
  createdAt: Date
  privacySettings: {
    allowChatRequests: boolean
    showOnlineStatus: boolean
  }
}

export interface ChatRequest {
  id: string
  senderId: string
  receiverId: string
  status: "pending" | "accepted" | "rejected"
  createdAt: Date
  senderInfo?: {
    username: string
    fullName: string
    profilePic: string
    verified: boolean
  }
}

export interface Chat {
  id: string
  participants: string[]
  lastMessage?: {
    text: string
    senderId: string
    timestamp: Date
  }
  isGroup: boolean
  groupInfo?: {
    name: string
    description: string
    profilePic: string
    admins: string[]
  }
  createdAt: Date
}

export interface Message {
  id: string
  chatId: string
  senderId: string
  text: string
  timestamp: Date
  read: boolean
}

export interface VerificationRequest {
  id: string
  userId: string
  status: "pending" | "approved" | "denied"
  createdAt: Date
  userInfo: {
    username: string
    email: string
    fullName: string
  }
}
