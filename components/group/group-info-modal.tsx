"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { User } from "@/types/user"
import { CheckCircle, Edit, Save, Upload, Loader2, UserPlus, Users } from "lucide-react"
import { getInitials, uploadImageToImgBB } from "@/lib/utils"
import { db } from "@/lib/firebase"
import { doc, updateDoc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import NewChatDialog from "../chat/new-chat-dialog"

interface GroupInfoModalProps {
  groupData: any
  chatId: string
  participants: string[]
  currentUser: User
}

export default function GroupInfoModal({ groupData, chatId, participants, currentUser }: GroupInfoModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(groupData?.name || "")
  const [description, setDescription] = useState(groupData?.description || "")
  const [profilePic, setProfilePic] = useState<File | null>(null)
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(groupData?.profilePic || null)
  const [isLoading, setIsLoading] = useState(false)
  const [groupMembers, setGroupMembers] = useState<User[]>([])
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const { toast } = useToast()

  const isAdmin = groupData?.admins?.includes(currentUser.uid)

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setProfilePic(file)
      setProfilePicPreview(URL.createObjectURL(file))
    }
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Group name cannot be empty",
      })
      return
    }

    setIsLoading(true)
    try {
      let profilePicUrl = groupData?.profilePic || ""

      if (profilePic) {
        try {
          profilePicUrl = await uploadImageToImgBB(profilePic)
        } catch (error) {
          console.error("Error uploading profile picture:", error)
          toast({
            variant: "destructive",
            title: "Error uploading profile picture",
            description: "Group info will be updated without the new profile picture.",
          })
        }
      }

      await updateDoc(doc(db, "chats", chatId), {
        "groupInfo.name": name,
        "groupInfo.description": description,
        "groupInfo.profilePic": profilePicUrl,
      })

      toast({
        title: "Group info updated",
      })

      setIsEditing(false)
    } catch (error) {
      console.error("Error updating group info:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update group info",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center">
        <div className="relative mb-4">
          {isEditing ? (
            <>
              <div className="h-24 w-24 rounded-full overflow-hidden bg-secondary flex items-center justify-center">
                {profilePicPreview ? (
                  <img
                    src={profilePicPreview || "/placeholder.svg"}
                    alt="Group"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Users className="h-12 w-12 text-muted-foreground" />
                )}
              </div>
              <label
                htmlFor="group-pic"
                className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 cursor-pointer"
              >
                <Upload className="h-4 w-4" />
              </label>
              <input id="group-pic" type="file" accept="image/*" className="hidden" onChange={handleProfilePicChange} />
            </>
          ) : (
            <Avatar className="h-24 w-24">
              <AvatarImage src={groupData?.profilePic || "/placeholder.svg"} />
              <AvatarFallback className="text-xl">{getInitials(groupData?.name || "Group")}</AvatarFallback>
            </Avatar>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-4 w-full">
            <div>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Group Name"
                className="text-center font-bold text-lg"
              />
            </div>
            <div>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Group Description"
                className="resize-none"
                rows={3}
              />
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" className="flex-1" onClick={() => setIsEditing(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSave} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center space-x-1">
              <h2 className="text-xl font-bold">{groupData?.name || "Group"}</h2>
              {groupData?.verified && <CheckCircle className="h-5 w-5 text-blue-500" />}
            </div>

            {groupData?.description && (
              <p className="text-center text-muted-foreground mt-2">{groupData.description}</p>
            )}

            {isAdmin && (
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Group Info
              </Button>
            )}
          </>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium">Members ({participants.length})</h3>
          {isAdmin && (
            <Button variant="ghost" size="sm" onClick={() => setIsAddMemberOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          )}
        </div>

        <div className="max-h-60 overflow-y-auto space-y-2">
          {/* Members list would be rendered here */}
          <p className="text-center text-muted-foreground py-4">Members list would be displayed here</p>
        </div>
      </div>

      <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Members</DialogTitle>
          </DialogHeader>
          <NewChatDialog currentUser={currentUser} onClose={() => setIsAddMemberOpen(false)} onChatCreated={() => {}} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
