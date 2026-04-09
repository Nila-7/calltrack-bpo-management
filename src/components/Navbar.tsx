"use client"

import { useAuth, useUser } from "@/firebase"
import { signOut } from "firebase/auth"
import { Button } from "@/components/ui/button"
import { ShieldCheck, LogOut, User, LayoutDashboard } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { Badge } from "@/components/ui/badge"

export function Navbar() {
  const { user } = useUser()
  const auth = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    await signOut(auth)
    router.push("/")
  }

  const isAdmin = user?.email === 'admin@gmail.com'

  // Hide navbar on login/signup pages to match the redesign requirements
  if (!user || pathname.includes('/login') || pathname.includes('/signup')) return null

  return (
    <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
            <div className="p-2 bg-blue-500 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-xl tracking-tighter text-[#111827]">IntelliSecureX</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {isAdmin ? (
                <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-600 flex gap-1 items-center px-3 py-1 font-bold">
                  <ShieldCheck className="w-3 h-3" />
                  Admin Console
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-slate-50 text-slate-500 flex gap-1 items-center px-3 py-1 font-bold">
                  <User className="w-3 h-3" />
                  User Portal
                </Badge>
              )}
              <span className="text-sm text-slate-500 font-bold hidden md:block">
                {user.email}
              </span>
            </div>

            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-500 hover:text-red-500 font-bold">
              <LogOut className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
