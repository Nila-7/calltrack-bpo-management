"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ShieldCheck, Lock, Loader2, KeyRound, User as UserIcon, MessageSquare, AlertCircle } from "lucide-react"
import { useAuth, useUser } from "@/firebase"
import { signInWithEmailAndPassword, signOut } from "firebase/auth"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function AdminLoginPage() {
  const router = useRouter()
  const auth = useAuth()
  const { user, isUserLoading } = useUser()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isUserLoading && user) {
      if (user.email === 'admin@gmail.com') {
        router.push("/admin/dashboard")
      }
    }
  }, [user, isUserLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    
    const normalizedEmail = email.trim().toLowerCase()

    try {
      const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password)
      const authenticatedUser = userCredential.user

      if (authenticatedUser.email === 'admin@gmail.com') {
        toast({
          title: "Access Authorized",
          description: "Welcome back, System Administrator.",
        })
        router.push("/admin/dashboard")
      } else {
        await signOut(auth)
        setError("Unauthorized Identity. This terminal is strictly reserved for the Master Administrator.")
      }
    } catch (err: any) {
      console.error("ADMIN_AUTH_CRITICAL_FAILURE:", err)
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError("Access key rejected. Please verify your administrative credentials.")
      } else {
        setError(err.message || "Identity verification failed. Please try again.")
      }
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
            onClick={() => router.push('/user/login')}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-blue-500 font-bold text-sm hover:bg-white transition-all"
          >
            <UserIcon className="w-4 h-4" />
            User Portal
          </button>
          <button 
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition-all"
          >
            <ShieldCheck className="w-4 h-4" />
            Admin Console
          </button>
        </div>

        {error && (
          <Alert variant="destructive" className="bg-destructive/5 text-destructive border-destructive/20 rounded-2xl">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="font-bold">Access Denied</AlertTitle>
            <AlertDescription className="text-xs">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-bold text-[#111827] ml-1">Username</Label>
              <div className="relative">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input 
                  type="email" 
                  placeholder="admin@gmail.com" 
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
