"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ShieldCheck, Lock, Loader2, KeyRound, User as UserIcon, MessageSquare } from "lucide-react"
import { useAuth, useUser } from "@/firebase"
import { signInWithEmailAndPassword } from "firebase/auth"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export default function UserLoginPage() {
  const router = useRouter()
  const auth = useAuth()
  const { user, isUserLoading } = useUser()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  useEffect(() => {
    if (!isUserLoading && user) {
      if (user.email === 'admin@gmail.com') {
        router.push("/admin/dashboard")
      } else {
        router.push("/user/dashboard")
      }
    }
  }, [user, isUserLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const normalizedEmail = email.trim().toLowerCase()
      await signInWithEmailAndPassword(auth, normalizedEmail, password)
      
      toast({
        title: "Access Authorized",
        description: `Identity verified. Synchronizing dashboard...`,
      })
    } catch (error: any) {
      console.error("USER_AUTH_ERROR:", error)
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: error.code === 'auth/wrong-password' 
          ? "Incorrect password. Please try again." 
          : "Invalid credentials. Ensure your account is registered.",
      })
    } finally {
      setLoading(false)
    }
  }

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#111827]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[#111827] pointer-events-none" />
      
      <Card className="w-full max-w-[450px] shadow-2xl border-none rounded-3xl z-10 bg-white p-8 space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="relative p-4 border-2 border-blue-500/20 rounded-2xl">
              <ShieldCheck className="w-12 h-12 text-blue-500" />
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-6 h-6 bg-blue-500 rounded-sm opacity-10" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-[#111827]">IntelliSecureX</h1>
          <p className="text-slate-400 text-sm font-medium">Identity-Aware Document Deception Engine</p>
        </div>

        {/* Tab Selection */}
        <div className="flex p-1 bg-slate-50 rounded-2xl border border-slate-100">
          <button 
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition-all"
          >
            <UserIcon className="w-4 h-4" />
            User Portal
          </button>
          <button 
            onClick={() => router.push('/admin/login')}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-blue-500 font-bold text-sm hover:bg-white transition-all"
          >
            <ShieldCheck className="w-4 h-4" />
            Admin Console
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-bold text-[#111827] ml-1">Username</Label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input 
                  type="email" 
                  placeholder="Enter username" 
                  className="pl-12 h-14 bg-slate-50 border-none rounded-2xl focus-visible:ring-blue-500 font-medium"
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-bold text-[#111827] ml-1">Password</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input 
                  type="password" 
                  placeholder="••••••••"
                  className="pl-12 h-14 bg-slate-50 border-none rounded-2xl focus-visible:ring-blue-500 font-medium"
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full h-14 bg-blue-500 hover:bg-blue-600 rounded-2xl text-lg font-bold shadow-xl shadow-blue-500/25 transition-all" disabled={loading}>
            {loading ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <KeyRound className="w-6 h-6 mr-2" />}
            Sign In
          </Button>
        </form>

        <div className="pt-4 text-center border-t border-slate-50 space-y-6">
          <button 
            onClick={() => router.push('/user/signup')}
            className="text-sm font-bold text-slate-500 hover:text-blue-500 transition-colors"
          >
            Need an account? <span className="text-blue-500">Sign Up Now</span>
          </button>
          
          <div className="text-[10px] font-black text-slate-300 tracking-[0.4em] uppercase">
            SECURE SESSION GATEWAY
          </div>
        </div>
      </Card>

      {/* Floating Elements */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-2 bg-[#1f2937] text-slate-400 text-[10px] font-black tracking-[0.2em] rounded-full border border-white/5 z-50">
        SECURE SESSION GATEWAY
      </div>

      <div className="fixed bottom-8 right-8 z-50">
        <button className="p-4 bg-blue-500 text-white rounded-full shadow-2xl shadow-blue-500/40 hover:scale-110 transition-transform">
          <MessageSquare className="w-6 h-6" />
        </button>
      </div>
    </div>
  )
}
