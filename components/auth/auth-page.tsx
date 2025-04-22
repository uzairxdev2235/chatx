"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import SignInForm from "./sign-in-form"
import SignUpForm from "./sign-up-form"
import UsernameSetupForm from "./username-setup-form"
import { useAuth } from "@/context/auth-context"

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("signin")
  const [needsUsername, setNeedsUsername] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  if (user) {
    if (!user.username) {
      return <UsernameSetupForm />
    }
    router.push("/home")
    return null
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">ChatX</h1>
          <p className="text-muted-foreground mt-2">Connect and chat with friends</p>
        </div>

        {needsUsername ? (
          <UsernameSetupForm />
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <SignInForm onNeedsUsername={() => setNeedsUsername(true)} />
            </TabsContent>
            <TabsContent value="signup">
              <SignUpForm />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
