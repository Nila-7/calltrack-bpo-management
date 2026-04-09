"use client"

import { useAuth, useUser } from "@/firebase"
import { signOut } from "firebase/auth"
import { Button } from "@/components/ui/button"
import { ShieldCheck, LogOut, UserCircle } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { ThemeToggle } from "./ThemeToggle"

export function Navbar() {
  const { user } = useUser()
  const auth = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    await signOut(auth)
    router.push("/")
  }

  // Navbar is hidden on auth pages
  if (!user && (pathname === '/user/login' || pathname === '/admin/login' || pathname === '/user/signup')) {
    return null
  }

  return (
    <nav className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-50 w-full transition-colors duration-300 shadow-sm">
      <div className="max-w-[1600px] mx-auto px-6">
        <div className="flex justify-between h-16 items-center">
          {/* Left: Branding */}
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => router.push('/')}>
            <div className="p-2 bg-blue-600 rounded-lg group-hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-xl tracking-tighter text-foreground">CallTrack BPO Management</span>
          </div>

          {/* Right: Actions & User Info */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
            
            {user && (
              <div className="flex items-center gap-4 border-l pl-4 ml-2">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-[10px] font-semibold text-primary uppercase tracking-widest leading-none mb-1">
                    System Access
                  </span>
                  <span className="text-[11px] text-muted-foreground font-medium truncate max-w-[150px]">
                    {user.email}
                  </span>
                </div>
                
                <UserCircle className="w-8 h-8 text-muted-foreground" />

                <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all rounded-full">
                  <LogOut className="w-5 h-5" />
                  <span className="sr-only">Logout</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
