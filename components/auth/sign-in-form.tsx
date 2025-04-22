"use client"

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
import { Mail, Lock, Loader2 } from "lucide-react"

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
})

type FormValues = z.infer<typeof formSchema>

export default function SignInForm({ onNeedsUsername }: { onNeedsUsername: () => void }) {
  const { signInWithEmail, signInWithGoogle } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const { toast } = useToast()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true)
    try {
      await signInWithEmail(data.email, data.password)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error signing in",
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    try {
      await signInWithGoogle()
      onNeedsUsername()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error signing in with Google",
        description: error.message,
      })
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        placeholder="Enter your password"
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
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </Form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <Button variant="outline" onClick={handleGoogleSignIn} disabled={isGoogleLoading} className="w-full">
          {isGoogleLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.37.32.17.64.31.98.43.69.24 1.42.38 2.16.38.75 0 1.47-.13 2.14-.37a5.3 5.3 0 0 0 1.98-1.29c.8-.84 1.41-1.91 1.71-3.1.3-1.19.25-2.45-.15-3.57a5.94 5.94 0 0 0-2.42-2.78c-.91-.53-1.96-.8-3.03-.78-1.07.02-2.11.32-3.01.88a5.98 5.98 0 0 0-2.28 2.59c-.5 1.04-.67 2.2-.51 3.34.16 1.14.62 2.2 1.33 3.04.71.84 1.65 1.46 2.7 1.77 1.05.31 2.17.31 3.22-.01zm-10.84-3.75c0 .97.19 1.92.57 2.78.38.87.94 1.65 1.65 2.26.71.61 1.55 1.02 2.44 1.19.89.17 1.8.08 2.62-.25.83-.33 1.55-.88 2.08-1.56a5.85 5.85 0 0 0 1.07-2.42c.14-.89.07-1.8-.2-2.64a5.82 5.82 0 0 0-1.41-2.26 5.83 5.83 0 0 0-2.37-1.29c-.88-.23-1.8-.23-2.68 0a5.83 5.83 0 0 0-2.37 1.29 5.82 5.82 0 0 0-1.41 2.26c-.27.84-.34 1.75-.2 2.64h.01z"
                fill="currentColor"
              />
            </svg>
          )}
          Sign in with Google
        </Button>
      </CardContent>
    </Card>
  )
}
