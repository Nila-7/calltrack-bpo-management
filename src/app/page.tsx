"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, User as UserIcon, ShieldCheck, Lock, Loader2, KeyRound, UserPlus } from "lucide-react"
import { useAuth, useFirestore } from "@/firebase"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth"
import { logActivity, trackSession } from "@/services/activityLogger"
import { useToast } from "@/hooks/use-toast"
import { doc, setDoc, getDocs, collection, query, where, limit } from "firebase/firestore"

export default function LoginPage() {
  const router = useRouter()
  const auth = useAuth()
  const db = useFirestore()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loginType, setLoginType] = useState<'user' | 'admin'>('user')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const cleanUsername = username.trim()
    const cleanEmail = email.trim()

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match")
        }

        // 1. Check if username unique
        const usernameQuery = query(collection(db, "users"), where("username", "==", cleanUsername), limit(1));
        const usernameSnap = await getDocs(usernameQuery);
        if (!usernameSnap.empty) {
          throw new Error("Username already taken");
        }

        // 2. Create Auth User
        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password)
        const uid = userCredential.user.uid

        // 3. Create Firestore Profile
        const newUser = {
          username: cleanUsername,
          email: cleanEmail,
          role: loginType === 'admin' ? 'Admin' : 'User',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };
        
        await setDoc(doc(db, 'users', uid), newUser)

        // 4. Log the creation - CRITICAL: await this before signOut
        await logActivity(db, {
          userId: uid,
          username: cleanUsername,
          email: cleanEmail,
          role: loginType === 'admin' ? 'admin' : 'user',
          action: 'User Created',
          status: 'Success'
        })

        // 5. Sign out as per requirements for redirect
        await signOut(auth)
        
        toast({
          title: "Account Created Successfully",
          description: "Please log in with your new credentials.",
        })
        
        setIsSignUp(false)
        setUsername("")
        setEmail("")
        setPassword("")
        setConfirmPassword("")

      } else {
        // LOGIN FLOW: Map username to email
        const userQuery = query(collection(db, "users"), where("username", "==", cleanUsername), limit(1));
        const userSnap = await getDocs(userQuery);
        
        if (userSnap.empty) {
          throw new Error("Invalid username or password");
        }
        
        const userData = userSnap.docs[0].data();
        const userUid = userSnap.docs[0].id;
        
        try {
          const userCredential = await signInWithEmailAndPassword(auth, userData.email, password);

          await trackSession(db, {
            userId: userCredential.user.uid,
            username: userData.username,
            email: userData.email,
            role: userData.role.toLowerCase() as 'admin' | 'user',
            isActive: true
          })

          await logActivity(db, {
            userId: userCredential.user.uid,
            username: userData.username,
            email: userData.email,
            role: userData.role.toLowerCase() as 'admin' | 'user',
            action: userData.role === 'Admin' ? 'Admin Login' : 'User Login',
            status: 'Success'
          })

          toast({
            title: "Authentication Successful",
            description: `Welcome back, ${userData.username}.`,
          })

          router.push(userData.role === 'Admin' ? '/admin/dashboard' : '/user/dashboard')
        } catch (loginError: any) {
          await logActivity(db, {
            userId: userUid,
            username: userData.username,
            email: userData.email,
            role: userData.role.toLowerCase() as 'admin' | 'user',
            action: 'Login Failure',
            status: 'Alert',
            metadata: { error: loginError.message }
          })
          throw new Error("Invalid username or password");
        }
      }
      
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Process Failed",
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
          {!isSignUp && (
            <div className="grid grid-cols-2 gap-2 mb-6 p-1 bg-slate-100 rounded-lg">
              <Button 
                variant={loginType === 'user' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setLoginType('user')}
                className="text-xs"
              >
                <UserIcon className="w-3 h-3 mr-1" /> User Portal
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
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  id="username" 
                  type="text" 
                  placeholder="Enter username" 
                  className="pl-10"
                  required 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>
            {isSignUp && (
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
            )}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••"
                  className="pl-10"
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input 
                  id="confirm-password" 
                  type="password" 
                  required 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            )}
            <Button className="w-full h-12 text-lg font-medium" disabled={loading}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : isSignUp ? <UserPlus className="w-5 h-5 mr-2" /> : <KeyRound className="w-5 h-5 mr-2" />}
              {isSignUp ? "Create Account" : "Sign In"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 text-center">
          <Button 
            variant="link" 
            className="text-sm text-primary" 
            onClick={() => {
              setIsSignUp(!isSignUp)
              setUsername("")
              setEmail("")
              setPassword("")
              setConfirmPassword("")
            }}
          >
            {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up Now"}
          </Button>
          <div className="flex items-center justify-center text-xs text-muted-foreground uppercase tracking-widest font-bold">
            <Lock className="w-3 h-3 mr-1 text-primary" />
            Secure Session Gateway
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
