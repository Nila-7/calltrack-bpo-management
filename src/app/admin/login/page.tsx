
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck, Lock, Loader2, Mail, ChevronLeft, AlertCircle } from "lucide-react"
import { useAuth, useUser } from "@/firebase"
import { signInWithEmailAndPassword } from "firebase/auth"
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
      if (user.email?.toLowerCase() === 'admin@gmail.com') {
        router.push("/admin/dashboard")
      } else {
        router.push("/user/dashboard")
      }
    }
  }, [user, isUserLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    const trimmedEmail = email.trim().toLowerCase()
    if (trimmedEmail !== 'admin@gmail.com') {
      setError("Unauthorized Identity. This console is strictly reserved for the Master Administrator.")
      return
    }

    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, trimmedEmail, password)
      
      toast({
        title: "Access Authorized",
        description: "Welcome back, System Administrator.",
      })
      
      router.push("/admin/dashboard")
    } catch (err: any) {
      console.error("Admin Login Error:", err)
      setError(err.code === 'auth/wrong-password' 
        ? "Access key rejected. Please verify your administrative credentials." 
        : "Identity mismatch. Ensure admin@gmail.com is registered at the portal.")
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
        <CardHeader className="text-center space-y-2 pb-8">
          <div className="flex justify-between items-center mb-4">
            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-primary h-8 px-2" onClick={() => router.push('/user/login')}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Agent Portal
            </Button>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 uppercase tracking-[0.2em] text-[10px] font-black">Secure Terminal</Badge>
          </div>
          <div className="flex justify-center">
            <div className="p-4 bg-primary/10 rounded-2xl">
              <ShieldCheck className="w-10 h-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-black tracking-tight text-slate-900">Admin Console</CardTitle>
          <CardDescription>BPO Enterprise Command & Control</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="bg-destructive/5 text-destructive border-destructive/20 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Access Denied</AlertTitle>
                <AlertDescription className="text-xs">
                  {error}
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-500">Administrator ID</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="admin@gmail.com" 
                  className="pl-10 h-12 bg-slate-50/50 border-none ring-1 ring-slate-200 focus-visible:ring-primary"
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-500">Access Key</Label>
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
            <Button type="submit" className="w-full h-12 text-base font-black uppercase tracking-widest shadow-lg shadow-primary/20" disabled={loading}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <ShieldCheck className="w-5 h-5 mr-2" />}
              Authorize Terminal
            </Button>
          </CardContent>
        </form>
        <CardFooter className="flex justify-center border-t bg-slate-50/30 py-6">
          <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.3em]">System Identity Verification Required</p>
        </CardFooter>
      </Card>
    </div>
  )
}
