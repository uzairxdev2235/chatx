"use client"

import type React from "react"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Mail, Lock, User, Upload, Loader2 } from "lucide-react"
import { uploadImageToImgBB } from "@/lib/utils"

const formSchema = z.object({
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters" })
    .max(20, { message: "Username must be at most 20 characters" })
    .regex(/^[a-zA-Z0-9_]+$/, { message: "Username can only contain letters, numbers, and underscores" }),
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
})

type FormValues = z.infer<typeof formSchema>

export default function SignUpForm() {
  const { signUpWithEmail } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [profilePic, setProfilePic] = useState<File | null>(null)
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null)
  const { toast } = useToast()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      fullName: "",
      email: "",
      password: "",
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
      let profilePicUrl = ""

      if (profilePic) {
        try {
          profilePicUrl = await uploadImageToImgBB(profilePic)
        } catch (error) {
          console.error("Error uploading profile picture:", error)
          toast({
            variant: "destructive",
            title: "Error uploading profile picture",
            description: "Your account will be created without a profile picture.",
          })
        }
      }

      await signUpWithEmail(data.email, data.password, data.username, data.fullName, profilePicUrl)

      toast({
        title: "Account created successfully",
        description: "Welcome to ChatX!",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error creating account",
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="h-20 w-20 rounded-full overflow-hidden bg-secondary flex items-center justify-center">
                  {profilePicPreview ? (
                    <img
                      src={profilePicPreview || "/placeholder.svg"}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-10 w-10 text-muted-foreground" />
                  )}
                </div>
                <label
                  htmlFor="profile-pic"
                  className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1 cursor-pointer"
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

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <div className="flex items-center border rounded-md focus-within:ring-1 focus-within:ring-primary">
                      <User className="ml-2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Choose a username" className="border-0 focus-visible:ring-0" {...field} />
                    </div>
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
                    <div className="flex items-center border rounded-md focus-within:ring-1 focus-within:ring-primary">
                      <User className="ml-2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Enter your full name" className="border-0 focus-visible:ring-0" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="flex items-center border rounded-md focus-within:ring-1 focus-within:ring-primary">
                      <Mail className="ml-2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Enter your email" className="border-0 focus-visible:ring-0" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="flex items-center border rounded-md focus-within:ring-1 focus-within:ring-primary">
                      <Lock className="ml-2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="password"
                        placeholder="Create a password"
                        className="border-0 focus-visible:ring-0"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Sign Up"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
