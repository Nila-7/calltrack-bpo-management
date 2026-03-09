"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, User, ShieldCheck, Lock, Loader2, KeyRound } from "lucide-react"
import { useAuth, useFirestore } from "@/firebase"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth"
import { logActivity, trackSession } from "@/services/activityLogger"
import { useToast } from "@/hooks/use-toast"
import { doc, setDoc } from "firebase/firestore"

export default function LoginPage() {
  const router = useRouter()
  const auth = useAuth()
  const db = useFirestore()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loginType, setLoginType] = useState<'user' | 'admin'>('user')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      let userCredential;
      if (isSignUp) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password)
        // Set user profile with role
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email,
          role: loginType === 'admin' ? 'Admin' : 'User',
          createdAt: new Date().toISOString()
        })
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password)
      }

      // Track active session
      await trackSession(db, {
        userId: userCredential.user.uid,
        email: email,
        role: loginType,
        isActive: true
      })

      // Log authentication event
      await logActivity(db, {
        userId: userCredential.user.uid,
        userEmail: email,
        role: loginType,
        action: loginType === 'admin' ? 'Admin Login' : 'User Login',
        status: 'Success'
      })

      toast({
        title: isSignUp ? "Account Created" : "Authentication Successful",
        description: `Welcome to IntelliSecureX, ${email}.`,
      })
      
      router.push(loginType === 'admin' ? '/admin/dashboard' : '/user/dashboard')
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F2F4F7] p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary rounded-full blur-[120px]" />
      </div>

      <Card className="w-full max-w-md shadow-2xl border-none relative z-10">
        <CardHeader className="text-center space-y-1">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <Shield className="w-12 h-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-secondary">IntelliSecureX</CardTitle>
          <CardDescription className="text-muted-foreground">
            Identity-Aware Document Deception Engine
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 gap-2 mb-6 p-1 bg-slate-100 rounded-lg">
            <Button 
              variant={loginType === 'user' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setLoginType('user')}
              className="text-xs"
            >
              <User className="w-3 h-3 mr-1" /> User Portal
            </Button>
            <Button 
              variant={loginType === 'admin' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setLoginType('admin')}
              className="text-xs"
            >
              <ShieldCheck className="w-3 h-3 mr-1" /> Admin Console
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@example.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button className="w-full h-12 text-lg font-medium" disabled={loading}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <KeyRound className="w-5 h-5 mr-2" />}
              {isSignUp ? "Create Account" : "Sign In"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 text-center">
          <Button 
            variant="link" 
            className="text-sm text-primary" 
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up Now"}
          </Button>
          <div className="flex items-center justify-center text-xs text-muted-foreground uppercase tracking-widest font-bold">
            <Lock className="w-3 h-3 mr-1 text-primary" />
            Secure Session Active
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
