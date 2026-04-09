"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ShieldCheck, ChevronLeft, Loader2 } from "lucide-react"
import { useAuth, useFirestore } from "@/firebase"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { logActivity } from "@/services/activityLogger"
import { useToast } from "@/hooks/use-toast"

export default function AdminLoginPage() {
  const router = useRouter()
  const auth = useAuth()
  const db = useFirestore()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      let userCredential;
      if (isSignUp) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password)
        // Corrected collection name to 'userProfiles' for consistency across the app
        await setDoc(doc(db, 'userProfiles', userCredential.user.uid), {
          email,
          role: 'Admin',
          createdAt: new Date().toISOString()
        })
        await logActivity(db, {
          userId: userCredential.user.uid,
          username: email.split('@')[0],
          email: email,
          role: 'admin',
          action: 'User Created',
          status: 'Success'
        })
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password)
      }

      await logActivity(db, {
        userId: userCredential.user.uid,
        username: email.split('@')[0],
        email: email,
        role: 'admin',
        action: 'Admin Login',
        status: 'Success'
      })
      
      toast({
        title: "Authentication Successful",
        description: "Welcome to the Admin Console.",
      })
      
      router.push('/admin/dashboard')
    } catch (error: any) {
      console.error("Auth error", error)
      let message = "An unexpected error occurred."
      
      if (error.code === 'auth/invalid-credential') {
        message = "Invalid email or password. Please check your credentials or sign up."
      } else if (error.code === 'auth/email-already-in-use') {
        message = "This email is already registered. Try logging in instead."
      } else if (error.code === 'auth/weak-password') {
        message = "Password should be at least 6 characters."
      }

      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F2F4F7] p-4">
      <Card className="w-full max-w-md shadow-2xl border-none">
        <CardHeader>
          <Button variant="ghost" size="sm" className="w-fit mb-4" onClick={() => router.push('/')}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-primary/10 rounded-xl">
              <ShieldCheck className="w-10 h-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Administrator Console</CardTitle>
          <CardDescription className="text-center">
            {isSignUp ? "Register a new administrator account" : "Enter your credentials to access the system feed"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="admin@gmail.com" 
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
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button className="w-full h-12" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {loading ? "Authenticating..." : isSignUp ? "Create Admin Account" : "Login as Admin"}
            </Button>
            <Button 
              type="button" 
              variant="link" 
              className="text-sm text-primary" 
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? "Already have an account? Sign In" : "Need to register? Create Admin Account"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}