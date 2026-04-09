"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/firebase"
import { Loader2, ShieldCheck } from "lucide-react"

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
    <div className="min-h-screen flex items-center justify-center bg-[#111827]">
      <div className="text-center space-y-6">
        <div className="relative inline-block">
          <Loader2 className="w-20 h-20 animate-spin text-blue-500 opacity-20" />
          <ShieldCheck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 text-blue-500 animate-pulse" />
        </div>
        <div className="space-y-2">
          <h2 className="text-white font-black uppercase tracking-[0.4em] text-sm">IntelliSecureX Gateway</h2>
          <p className="text-slate-500 font-medium text-xs animate-pulse italic">Synchronizing Enterprise Deception Nodes...</p>
        </div>
      </div>
    </div>
  )
}
