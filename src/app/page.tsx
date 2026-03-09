"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, User, ShieldCheck, Lock } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleLogin = (role: 'admin' | 'user') => {
    setLoading(role)
    // Simulate Firebase Auth Delay
    setTimeout(() => {
      localStorage.setItem('user_role', role)
      router.push(`/${role}/dashboard`)
    }, 800)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F2F4F7] p-4 relative overflow-hidden">
      {/* Abstract Background Decor */}
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
            Document Protection via Cyber-Deception
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="space-y-4">
            <Button 
              className="w-full h-14 text-lg font-medium group transition-all"
              variant="default"
              onClick={() => handleLogin('admin')}
              disabled={loading !== null}
            >
              {loading === 'admin' ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <ShieldCheck className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                  Login as Administrator
                </>
              )}
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-muted" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <Button 
              className="w-full h-14 text-lg font-medium group transition-all"
              variant="outline"
              onClick={() => handleLogin('user')}
              disabled={loading !== null}
            >
              {loading === 'user' ? (
                <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
              ) : (
                <>
                  <User className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                  Login as Regular User
                </>
              )}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 text-center">
          <div className="flex items-center justify-center text-sm text-muted-foreground">
            <Lock className="w-4 h-4 mr-1 text-primary" />
            Rule-based Protection Engine Active
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}