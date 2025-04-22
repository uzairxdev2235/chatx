import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import AuthPage from "@/components/auth/auth-page"

export default function Home() {
  const cookieStore = cookies()
  const authCookie = cookieStore.get("auth")

  if (authCookie) {
    redirect("/home")
  }

  return <AuthPage />
}
