
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserPlus, Mail, Lock, Loader2, PhoneCall, AlertCircle } from "lucide-react"
import { useAuth, useFirestore, useUser } from "@/firebase"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
      if (user.email?.toLowerCase() === 'admin@gmail.com') {
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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      
      const isAdminEmail = email.toLowerCase() === 'admin@gmail.com'
      
      await setDoc(doc(db, 'userProfiles', userCredential.user.uid), {
        email: email,
        role: isAdminEmail ? 'Admin' : 'User',
        createdAt: new Date().toISOString()
      })

      toast({
        title: isAdminEmail ? "Admin Authorized" : "Agent Identity Created",
        description: isAdminEmail 
          ? "The System Administrator has been initialized." 
          : "Your account is now active.",
      })
      
      if (isAdminEmail) {
        router.push('/admin/dashboard')
      } else {
        router.push('/user/dashboard')
      }
    } catch (error: any) {
      let message = error.message;
      if (error.code === 'auth/email-already-in-use') {
        message = "This identity is already active. Please sign in to the Portal."
      }
      
      toast({
        variant: "destructive",
        title: "Registration Interrupted",
        description: message,
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
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-slate-50">
      <Card className="w-full max-w-md shadow-2xl border-none ring-1 ring-slate-200">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-4 bg-primary/10 rounded-2xl">
              <PhoneCall className="w-10 h-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-black tracking-tight text-slate-900 uppercase">Agent Registration</CardTitle>
          <CardDescription>BPO Enterprise Resource Planning</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-500">Professional Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="agent@bpo-system.com" 
                  className="pl-10 h-12 bg-slate-50/50 border-none ring-1 ring-slate-200 focus-visible:ring-primary"
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" title="Set your password" className="text-xs font-bold uppercase tracking-wider text-slate-500">Security Access Code</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••"
                  className="pl-10 h-12 bg-slate-50/50 border-none ring-1 ring-slate-200 focus-visible:ring-primary"
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {email.toLowerCase() === 'admin@gmail.com' && (
              <Alert className="bg-amber-50 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-xs text-amber-700 font-medium">
                  Initializing System Administrator. If already registered, please navigate to the Login page.
                </AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full h-12 text-base font-black uppercase tracking-widest shadow-lg shadow-primary/20" disabled={loading}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <UserPlus className="w-5 h-5 mr-2" />}
              Create Identity
            </Button>
          </CardContent>
        </form>
        <CardFooter className="flex flex-col space-y-4 text-center border-t bg-slate-50/30 pt-6">
          <Button variant="link" className="text-sm font-bold text-slate-600 hover:text-primary" onClick={() => router.push('/user/login')}>
            Already registered? <span className="text-primary ml-1">Sign In</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
