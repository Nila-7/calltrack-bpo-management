"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ShieldCheck, Lock, Loader2, KeyRound, AlertCircle } from "lucide-react"
import { useAuth, useUser } from "@/firebase"
import { signInWithEmailAndPassword } from "firebase/auth"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ThemeToggle } from "@/components/ThemeToggle"

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
      router.push("/admin/dashboard")
    }
  }, [user, isUserLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    
    const normalizedEmail = email.trim().toLowerCase()
    const cleanPassword = password

    try {
      await signInWithEmailAndPassword(auth, normalizedEmail, cleanPassword)
      toast({
        title: "Access Granted",
        description: "Welcome to the Administrative Dashboard.",
      })
    } catch (err: any) {
      console.error("ADMIN_AUTH_FAILURE:", err)
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError("Invalid Admin Credentials. Please check your account details.")
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
    <div className="min-h-screen flex items-center justify-center p-6 relative bg-background transition-colors duration-300">
      <div className="absolute top-8 right-8 z-50">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-[500px] shadow-2xl border-none bg-card p-0 overflow-hidden rounded-[2rem]">
        <div className="p-10 pb-4 text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-primary/10 rounded-2xl">
              <ShieldCheck className="w-10 h-10 text-primary" />
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground uppercase">CallTrack</h1>
            <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-[0.2em]">Administrative Gateway</p>
          </div>
        </div>

        <CardContent className="p-10 pt-4 space-y-8">
          {error && (
            <Alert variant="destructive" className="rounded-xl bg-destructive/5 border-destructive/20 border">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs font-medium">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.2em] ml-1">Admin Email</Label>
                <div className="relative">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input 
                    type="email" 
                    placeholder="admin@calltrack.com" 
                    className="flex h-12 w-full rounded-xl border-none bg-muted/30 px-12 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary font-normal"
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.2em] ml-1">Security Key</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    className="flex h-12 w-full rounded-xl border-none bg-muted/30 px-12 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary font-normal"
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-semibold uppercase tracking-[0.2em] shadow-lg shadow-primary/20 transition-all" disabled={loading}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <KeyRound className="w-5 h-5 mr-2" />}
              Authorize Access
            </Button>
          </form>

          <div className="pt-6 text-center border-t space-y-4">
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => router.push('/user/login')}
                className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider"
              >
                Return to <span className="text-primary font-semibold">User Portal</span>
              </button>
            </div>
            <p className="text-[9px] font-semibold text-muted-foreground/40 uppercase tracking-[0.4em]">SECURE ADMINISTRATIVE GATEWAY</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
