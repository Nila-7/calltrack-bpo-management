
"use client"

import { useAuth, useUser } from "@/firebase"
import { signOut } from "firebase/auth"
import { Button } from "@/components/ui/button"
import { PhoneCall, LogOut, User, ShieldCheck } from "lucide-react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"

export function Navbar() {
  const { user } = useUser()
  const auth = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await signOut(auth)
    router.push("/")
  }

  const isAdmin = user?.email === 'admin@gmail.com'

  if (!user) return null

  return (
    <nav className="border-b bg-white/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary rounded-lg">
              <PhoneCall className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight hidden sm:block">BPO System</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {isAdmin ? (
                <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary flex gap-1 items-center px-3 py-1">
                  <ShieldCheck className="w-3 h-3" />
                  Admin Console
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-slate-50 text-slate-500 flex gap-1 items-center px-3 py-1">
                  <User className="w-3 h-3" />
                  Agent Portal
                </Badge>
              )}
              <span className="text-sm text-slate-500 font-medium hidden md:block">
                {user.email}
              </span>
            </div>

            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-500 hover:text-destructive">
              <LogOut className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
