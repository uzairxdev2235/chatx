"use client"

import type React from "react"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import type { User } from "@/types/user"
import { doc, updateDoc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import { uploadImageToImgBB } from "@/lib/utils"
import { Upload, Loader2, UserCircle } from "lucide-react"

const formSchema = z.object({
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters" })
    .max(20, { message: "Username must be at most 20 characters" })
    .regex(/^[a-zA-Z0-9_]+$/, { message: "Username can only contain letters, numbers, and underscores" }),
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters" }),
  bio: z.string().max(160, { message: "Bio must be at most 160 characters" }).optional(),
})

type FormValues = z.infer<typeof formSchema>

interface ProfileSettingsProps {
  user: User
}

export default function ProfileSettings({ user }: ProfileSettingsProps) {
  const [profilePic, setProfilePic] = useState<File | null>(null)
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(user.profilePic || null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: user.username || "",
      fullName: user.fullName || "",
      bio: user.bio || "",
    },
  })

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setProfilePic(file)
      setProfilePicPreview(URL.createObjectURL(file))
    }
  }

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true)
    try {
      // Check if username is changed and if it's already taken
      if (data.username !== user.username) {
        const usernameDoc = await getDoc(doc(db, "usernames", data.username))
        if (usernameDoc.exists()) {
          form.setError("username", {
            type: "manual",
            message: "This username is already taken",
          })
          setIsLoading(false)
          return
        }
      }

      let profilePicUrl = user.profilePic || ""

      if (profilePic) {
        try {
          profilePicUrl = await uploadImageToImgBB(profilePic)
        } catch (error) {
          console.error("Error uploading profile picture:", error)
          toast({
            variant: "destructive",
            title: "Error uploading profile picture",
            description: "Your profile will be updated without the new profile picture.",
          })
        }
      }

      // Update user document
      await updateDoc(doc(db, "users", user.uid), {
        username: data.username,
        fullName: data.fullName,
        bio: data.bio || "",
        profilePic: profilePicUrl,
      })

      // If username is changed, update usernames collection
      if (data.username !== user.username) {
        // Delete old username
        // await deleteDoc(doc(db, "usernames", user.username));
        // Add new username
        // await setDoc(doc(db, "usernames", data.username), {
        //   uid: user.uid,
        // });
      }

      toast({
        title: "Profile updated successfully",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        variant: "destructive",
        title: "Error updating profile",
        description: "Please try again later",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserCircle className="mr-2 h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>Update your profile information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="h-24 w-24 rounded-full overflow-hidden bg-secondary flex items-center justify-center">
                {profilePicPreview ? (
                  <img
                    src={profilePicPreview || "/placeholder.svg"}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserCircle className="h-12 w-12 text-muted-foreground" />
                )}
              </div>
              <label
                htmlFor="profile-pic"
                className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 cursor-pointer"
              >
                <Upload className="h-4 w-4" />
              </label>
              <input
                id="profile-pic"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProfilePicChange}
              />
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Full Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Tell us about yourself" className="resize-none" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating Profile...
                  </>
                ) : (
                  "Update Profile"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
