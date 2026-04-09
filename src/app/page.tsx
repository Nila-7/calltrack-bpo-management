
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/firebase"
import { Loader2 } from "lucide-react"

export default function RootRedirect() {
  const router = useRouter()
  const { user, isUserLoading } = useUser()

  useEffect(() => {
    if (!isUserLoading) {
      if (!user) {
        router.push("/user/login")
      } else {
        if (user.email === 'admin@gmail.com') {
          router.push("/admin/dashboard")
        } else {
          router.push("/user/dashboard")
        }
      }
    }
  }, [user, isUserLoading, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
        <p className="text-slate-500 font-medium animate-pulse">Initializing System Gateway...</p>
      </div>
    </div>
  )
}
