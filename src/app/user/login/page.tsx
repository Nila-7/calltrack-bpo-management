
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PhoneCall, Lock, Loader2, KeyRound, User as UserIcon, ShieldCheck, AlertCircle } from "lucide-react"
import { useAuth, useUser } from "@/firebase"
import { signInWithEmailAndPassword } from "firebase/auth"
import { useToast } from "@/hooks/use-toast"
import { ThemeToggle } from "@/components/ThemeToggle"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function UserLoginPage() {
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
      } else {
        router.push("/user/dashboard")
      }
    }
  }, [user, isUserLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    
    // Normalize email and fix common typos
    const normalizedEmail = email.trim().toLowerCase()
    let finalEmail = normalizedEmail
    if (normalizedEmail.includes('admin@gamil.com')) {
      finalEmail = normalizedEmail.replace('gamil.com', 'gmail.com')
    }

    try {
      await signInWithEmailAndPassword(auth, finalEmail, password)
      
      toast({
        title: "Access Authorized",
        description: `Welcome back. Redirecting to workspace...`,
      })
    } catch (err: any) {
      console.error("USER_AUTH_ERROR:", err)
      
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError("Invalid credentials. Please verify your email and password.")
      } else if (err.code === 'auth/invalid-email') {
        setError("The email address provided is not valid.")
      } else {
        setError("Authentication failed. Please check your network or try again later.")
      }
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
    <div className="min-h-screen flex items-center justify-center p-6 relative bg-background">
      <div className="absolute top-8 right-8 z-50">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-[500px] shadow-2xl border-none bg-card p-0 overflow-hidden rounded-[2rem]">
        <div className="p-8 pb-0 text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-primary/10 rounded-2xl">
              <PhoneCall className="w-10 h-10 text-primary" />
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">CallTrack</h1>
            <p className="text-muted-foreground text-sm font-normal uppercase tracking-widest leading-relaxed">Smart BPO Call Management System</p>
          </div>
        </div>

        <CardContent className="p-8 pt-6 space-y-8">
          {/* Portal Toggle */}
          <div className="grid grid-cols-2 p-1 bg-muted rounded-xl gap-1">
            <Button 
              variant="default" 
              className="rounded-lg font-semibold text-xs shadow-sm h-10"
              onClick={() => router.push('/user/login')}
            >
              <UserIcon className="w-3.5 h-3.5 mr-2" />
              User Portal
            </Button>
            <Button 
              variant="ghost" 
              className="rounded-lg font-semibold text-xs text-muted-foreground hover:text-foreground h-10"
              onClick={() => router.push('/admin/login')}
            >
              <ShieldCheck className="w-3.5 h-3.5 mr-2" />
              Admin Console
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="rounded-xl bg-destructive/5 border-destructive/20">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs font-semibold uppercase tracking-wider">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Username / Email</Label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    type="email" 
                    placeholder="Enter email" 
                    className="pl-12 h-12 bg-muted/30 border-none rounded-xl focus-visible:ring-primary font-normal"
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    type="password" 
                    placeholder="••••••••"
                    className="pl-12 h-12 bg-muted/30 border-none rounded-xl focus-visible:ring-primary font-normal"
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90 text-white rounded-xl text-base font-semibold uppercase tracking-widest shadow-lg shadow-primary/20 transition-all" disabled={loading}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <KeyRound className="w-5 h-5 mr-2" />}
              Sign In
            </Button>
          </form>

          <div className="pt-4 text-center border-t space-y-4">
            <button 
              onClick={() => router.push('/user/signup')}
              className="text-sm font-normal text-muted-foreground hover:text-primary transition-colors"
            >
              Need an account? <span className="text-primary font-semibold">Sign Up Now</span>
            </button>
            <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-[0.3em]">SECURE SESSION GATEWAY</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
