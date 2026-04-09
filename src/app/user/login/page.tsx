
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PhoneCall, Lock, Loader2, KeyRound, Mail, ShieldAlert } from "lucide-react"
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-none ring-1 ring-slate-200">
        <CardHeader className="text-center space-y-2 pb-8">
          <div className="flex justify-center">
            <div className="p-4 bg-primary/10 rounded-2xl">
              <PhoneCall className="w-10 h-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">Agent Portal</CardTitle>
          <CardDescription className="text-slate-500">BPO Enterprise Call Center System</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Work Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  id="email" 
                  type="email" 
                  className="pl-10 h-11"
                  placeholder="agent@bpo-system.com" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Security Key</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  id="password" 
                  type="password" 
                  className="pl-10 h-11"
                  placeholder="••••••••"
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20" disabled={loading}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <KeyRound className="w-5 h-5 mr-2" />}
              Sign In to Terminal
            </Button>
          </CardContent>
        </form>
        <CardFooter className="flex flex-col space-y-4 text-center border-t bg-slate-50/50 pt-6">
          <Button variant="link" className="text-sm font-medium text-slate-600" onClick={() => router.push('/user/signup')}>
            Don't have an account? <span className="text-primary ml-1">Create Agent ID</span>
          </Button>
          <div className="flex justify-center">
            <button 
              type="button" 
              onClick={() => router.push('/admin/login')} 
              className="flex items-center gap-1.5 text-[10px] text-slate-400 hover:text-primary font-black uppercase tracking-widest transition-colors"
            >
              <ShieldAlert className="w-3 h-3" />
              Administrative Login
            </button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
