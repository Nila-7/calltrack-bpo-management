"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ShieldCheck, Lock, Loader2, KeyRound, AlertCircle } from "lucide-react"
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
          title: "Administrative Access Authorized",
          description: "Welcome to the Command Center.",
        })
        router.push("/admin/dashboard")
      } else {
        await signOut(auth)
        setError("Unauthorized Identity. This terminal is strictly reserved for the Master Administrator.")
      }
    } catch (err: any) {
      console.error("ADMIN_AUTH_CRITICAL_FAILURE:", err)
      setError("Access key rejected. Please verify your administrative credentials.")
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
            <div className="p-4 bg-destructive/10 rounded-2xl border border-destructive/20">
              <ShieldCheck className="w-14 h-14 text-destructive" />
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-foreground uppercase">Master Console</h1>
          <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">CallTrack BPO Command Center</p>
        </div>

        {error && (
          <Alert variant="destructive" className="rounded-xl border-destructive/50 bg-destructive/5">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="font-black uppercase text-xs tracking-widest">Access Denied</AlertTitle>
            <AlertDescription className="text-xs font-medium">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Admin Username</Label>
              <div className="relative">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                  type="email" 
                  placeholder="admin@gmail.com" 
                  className="pl-12 h-14 bg-muted/20 border-border rounded-xl focus-visible:ring-destructive font-medium"
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Admin Access Key</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                  type="password" 
                  placeholder="••••••••"
                  className="pl-12 h-14 bg-muted/20 border-border rounded-xl focus-visible:ring-destructive font-medium"
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full h-14 bg-destructive hover:bg-destructive/90 text-white rounded-xl text-lg font-black uppercase tracking-widest shadow-xl shadow-destructive/25 transition-all" disabled={loading}>
            {loading ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <KeyRound className="w-6 h-6 mr-2" />}
            Authenticate Admin
          </Button>
        </form>

        <div className="pt-6 text-center border-t space-y-6">
          <button 
            onClick={() => router.push('/user/login')}
            className="text-sm font-black text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest"
          >
            Return to <span className="text-primary underline underline-offset-4 ml-1">Agent Portal</span>
          </button>
        </div>
      </Card>
    </div>
  )
}