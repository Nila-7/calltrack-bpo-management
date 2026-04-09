"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ShieldCheck, Lock, Loader2, Mail, ChevronLeft } from "lucide-react"
import { useAuth } from "@/firebase"
import { signInWithEmailAndPassword } from "firebase/auth"
import { useToast } from "@/hooks/use-toast"

export default function AdminLoginPage() {
  const router = useRouter()
  const auth = useAuth()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      
      if (email.toLowerCase() !== 'admin@gmail.com') {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "This portal is reserved for System Administrators.",
        })
        return
      }

      toast({
        title: "Admin Authenticated",
        description: "Welcome to the Command Center.",
      })
      
      router.push("/admin/dashboard")
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Auth Failed",
        description: "Invalid administrator credentials.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-none ring-1 ring-slate-200">
        <CardHeader className="text-center space-y-2 pb-8">
          <Button variant="ghost" size="sm" className="w-fit mb-2" onClick={() => router.push('/user/login')}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Agent Login
          </Button>
          <div className="flex justify-center">
            <div className="p-3 bg-primary/10 rounded-xl">
              <ShieldCheck className="w-10 h-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">Admin Console</CardTitle>
          <CardDescription>Enterprise Command & Control Login</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="admin@gmail.com" 
                  className="pl-10 h-11"
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Access Key</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••"
                  className="pl-10 h-11"
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            <Button className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20" disabled={loading}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <ShieldCheck className="w-5 h-5 mr-2" />}
              Authorize Access
            </Button>
          </CardContent>
        </form>
        <CardFooter className="flex justify-center border-t bg-slate-50/50 pt-6">
          <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em]">Secure System Terminal</p>
        </CardFooter>
      </Card>
    </div>
  )
}
