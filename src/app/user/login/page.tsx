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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden bg-background">
      <Card className="w-full max-w-[500px] shadow-2xl border bg-card p-10 space-y-8 transition-all">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20">
              <ShieldCheck className="w-14 h-14 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-foreground uppercase">CallTrack BPO</h1>
          <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">Enterprise Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Agent Username</Label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                  type="email" 
                  placeholder="Enter username" 
                  className="pl-12 h-14 bg-muted/20 border-border rounded-xl focus-visible:ring-primary font-medium"
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Security Access Code</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                  type="password" 
                  placeholder="••••••••"
                  className="pl-12 h-14 bg-muted/20 border-border rounded-xl focus-visible:ring-primary font-medium"
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-lg font-black uppercase tracking-widest shadow-xl shadow-blue-500/25 transition-all" disabled={loading}>
            {loading ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <KeyRound className="w-6 h-6 mr-2" />}
            Sign In to Terminal
          </Button>
        </form>

        <div className="pt-6 text-center border-t space-y-6">
          <button 
            onClick={() => router.push('/user/signup')}
            className="text-sm font-black text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest"
          >
            Need an account? <span className="text-primary underline underline-offset-4 ml-1">Create Agent ID</span>
          </button>
        </div>
      </Card>

      <div className="fixed bottom-8 right-8 z-50">
        <button className="p-4 bg-primary text-primary-foreground rounded-full shadow-2xl shadow-primary/40 hover:scale-110 transition-transform">
          <MessageSquare className="w-6 h-6" />
        </button>
      </div>
    </div>
  )
}