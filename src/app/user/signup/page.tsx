"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PhoneCall, Mail, Lock, Loader2, UserPlus, AlertCircle } from "lucide-react"
import { useAuth, useFirestore, useUser } from "@/firebase"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ThemeToggle } from "@/components/ThemeToggle"

export default function UserSignupPage() {
  const router = useRouter()
  const auth = useAuth()
  const db = useFirestore()
  const { user, isUserLoading } = useUser()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push("/")
    }
  }, [user, isUserLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const normalizedEmail = email.trim().toLowerCase()
    let finalEmail = normalizedEmail
    if (normalizedEmail.includes('admin@gamil.com')) {
      finalEmail = normalizedEmail.replace('gamil.com', 'gmail.com')
    }

    setLoading(true)
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, finalEmail, password)
      const isAdminEmail = finalEmail === 'admin@gmail.com'
      
      await setDoc(doc(db, 'userProfiles', userCredential.user.uid), {
        email: finalEmail,
        role: isAdminEmail ? 'Admin' : 'User',
        createdAt: new Date().toISOString()
      })

      toast({
        title: "Registration Successful",
        description: "Your agent identity has been created.",
      })
    } catch (error: any) {
      console.error("SIGNUP_ERROR:", error)
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.code === 'auth/email-already-in-use' 
          ? "This email is already registered." 
          : "An error occurred during registration.",
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
            <h1 className="text-4xl font-black tracking-tight text-foreground">CallTrack</h1>
            <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest">Create New Agent ID</p>
          </div>
        </div>

        <CardContent className="p-8 pt-6 space-y-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    type="email" 
                    placeholder="Enter email" 
                    className="pl-12 h-12 bg-muted/30 border-none rounded-xl focus-visible:ring-primary font-medium"
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Security Key</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    type="password" 
                    placeholder="••••••••"
                    className="pl-12 h-12 bg-muted/30 border-none rounded-xl focus-visible:ring-primary font-medium"
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {(email.toLowerCase().includes('admin@gmail.com')) && (
              <Alert className="bg-primary/5 border-primary/20">
                <AlertCircle className="h-4 w-4 text-primary" />
                <AlertDescription className="text-xs font-bold uppercase tracking-wider">
                  System Admin Role Detected
                </AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90 text-white rounded-xl text-base font-bold uppercase tracking-widest shadow-lg shadow-primary/20 transition-all" disabled={loading}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <UserPlus className="w-5 h-5 mr-2" />}
              Create Identity
            </Button>
          </form>

          <div className="pt-4 text-center border-t space-y-4">
            <button 
              onClick={() => router.push('/user/login')}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Already have an account? <span className="text-primary font-bold">Sign In</span>
            </button>
            <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.3em]">SECURE SESSION GATEWAY</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}