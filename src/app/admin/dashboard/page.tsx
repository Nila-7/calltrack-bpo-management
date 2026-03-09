"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Users, 
  FileText, 
  ShieldAlert, 
  Zap, 
  Lock, 
  LogOut, 
  Activity, 
  UserPlus,
  Loader2,
  Search
} from "lucide-react"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { useAuth, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { signOut, createUserWithEmailAndPassword } from "firebase/auth"
import { collection, query, orderBy, limit, doc, setDoc } from "firebase/firestore"
import { logActivity } from "@/services/activityLogger"
import { useToast } from "@/hooks/use-toast"

export default function AdminDashboard() {
  const router = useRouter()
  const auth = useAuth()
  const db = useFirestore()
  const { toast } = useToast()

  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserPassword, setNewUserPassword] = useState("")
  const [creatingUser, setCreatingUser] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Memoize logs query
  const logsQuery = useMemoFirebase(() => 
    query(collection(db, 'activity_logs'), orderBy('timestamp', 'desc'), limit(50))
  , [db])
  const { data: logs, isLoading: logsLoading } = useCollection(logsQuery)

  // Memoize users collection
  const usersCollection = useMemoFirebase(() => collection(db, 'users'), [db])
  const { data: users } = useCollection(usersCollection)

  const stats = useMemo(() => {
    if (!logs || !users) return []
    
    const uploads = logs.filter(l => l.action === 'Document uploaded').length
    const accesses = logs.filter(l => l.action === 'Document accessed').length
    const decoys = logs.filter(l => l.action === 'Decoy activated').length
    const breaches = logs.filter(l => l.action === 'Unauthorized access attempt').length

    return [
      { title: "Total Users", value: (users?.length || 0).toString(), icon: Users, color: "text-blue-600" },
      { title: "Documents Uploaded", value: uploads.toString(), icon: FileText, color: "text-indigo-600" },
      { title: "Documents Accessed", value: accesses.toString(), icon: Zap, color: "text-amber-600" },
      { title: "Decoy Activations", value: decoys.toString(), icon: ShieldAlert, color: "text-red-600" },
      { title: "Security Breaches", value: breaches.toString(), icon: Lock, color: "text-red-800" },
    ]
  }, [logs, users])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Success': return <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">Success</Badge>
      case 'Warning': return <Badge variant="secondary" className="bg-amber-500 hover:bg-amber-600">Warning</Badge>
      case 'Alert': return <Badge variant="destructive" className="animate-pulse">Alert</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleLogout = async () => {
    await signOut(auth)
    router.push('/')
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreatingUser(true)
    try {
      // Create user (Note: This might sign out the admin in some Firebase Client SDK configurations)
      const userCredential = await createUserWithEmailAndPassword(auth, newUserEmail, newUserPassword)
      
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: newUserEmail,
        role: 'User',
        createdAt: new Date().toISOString()
      })

      logActivity(db, {
        userId: userCredential.user.uid,
        userEmail: newUserEmail,
        action: 'User registered',
        status: 'Success'
      })

      toast({
        title: "User Created",
        description: `Account for ${newUserEmail} has been successfully registered.`,
      })
      
      setNewUserEmail("")
      setNewUserPassword("")
      setIsDialogOpen(false)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: error.message,
      })
    } finally {
      setCreatingUser(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="bg-secondary text-white p-4 flex justify-between items-center px-8 border-b border-primary/20">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="text-accent" />
          <span className="font-bold text-xl tracking-tight">IntelliSecureX <span className="text-xs font-normal opacity-70 ml-2">ADMIN CONSOLE</span></span>
        </div>
        <div className="flex items-center space-x-4">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="text-secondary bg-white hover:bg-slate-50 border-none">
                <UserPlus className="w-4 h-4 mr-2" /> Register User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Register New User</DialogTitle>
                <DialogDescription>
                  Create a new user account for the deception platform.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="user-email">Email Address</Label>
                  <Input 
                    id="user-email" 
                    type="email" 
                    placeholder="user@example.com" 
                    required 
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-password">Password</Label>
                  <Input 
                    id="user-password" 
                    type="password" 
                    required 
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full" disabled={creatingUser}>
                    {creatingUser && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {creatingUser ? "Creating..." : "Create Account"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Button variant="ghost" className="text-white hover:bg-white/10" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </div>

      <main className="p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-secondary">System Monitoring</h1>
            <p className="text-muted-foreground">Real-time entity detection and deception telemetry</p>
          </div>
          <div className="text-sm text-muted-foreground flex items-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-ping" />
            Live System Feed
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="border-none shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader className="bg-white border-b flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Live Activity Feed</CardTitle>
              <p className="text-xs text-muted-foreground">Centralized logs for all security-relevant events</p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>User Context</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Document Context</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs?.map((log) => (
                  <TableRow key={log.id} className="hover:bg-slate-50/50">
                    <TableCell className="max-w-[200px]">
                      <div className="font-medium text-slate-700 truncate">{log.userEmail || 'System'}</div>
                      <div className="font-mono text-[10px] text-slate-400 truncate">{log.userId}</div>
                    </TableCell>
                    <TableCell className="font-medium text-slate-700">{log.action}</TableCell>
                    <TableCell className="text-muted-foreground italic text-sm">{log.fileName || 'N/A'}</TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : 'Just now'}
                    </TableCell>
                    <TableCell className="text-right">
                      {getStatusBadge(log.status)}
                    </TableCell>
                  </TableRow>
                ))}
                {!logsLoading && (!logs || logs.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No system events recorded yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
