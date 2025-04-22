"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { User, Loader2 } from "lucide-react"
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

const formSchema = z.object({
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters" })
    .max(20, { message: "Username must be at most 20 characters" })
    .regex(/^[a-zA-Z0-9_]+$/, { message: "Username can only contain letters, numbers, and underscores" }),
})

type FormValues = z.infer<typeof formSchema>

export default function UsernameSetupForm() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
    },
  })

  const onSubmit = async (data: FormValues) => {
    if (!user) return

    setIsLoading(true)
    try {
      // Check if username is already taken
      const usernameDoc = await getDoc(doc(db, "usernames", data.username))

      if (usernameDoc.exists()) {
        form.setError("username", {
          type: "manual",
          message: "This username is already taken",
        })
        setIsLoading(false)
        return
      }

      // Update user document with username
      await updateDoc(doc(db, "users", user.uid), {
        username: data.username,
      })

      // Reserve username
      await setDoc(doc(db, "usernames", data.username), {
        uid: user.uid,
      })

      toast({
        title: "Username set successfully",
        description: "Welcome to ChatX!",
      })

      // Reload the page to update auth context
      window.location.href = "/home"
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error setting username",
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Set Your Username</CardTitle>
        <CardDescription>Choose a unique username to complete your account setup</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting Username...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
