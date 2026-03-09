
"use client"

import { useState, useMemo, useEffect } from "react"
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
  Search,
  Monitor,
  User as UserIcon
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
import { useAuth, useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase"
import { signOut, createUserWithEmailAndPassword } from "firebase/auth"
import { collection, query, orderBy, limit, doc, setDoc, getDocs, where } from "firebase/firestore"
import { logActivity } from "@/services/activityLogger"
import { useToast } from "@/hooks/use-toast"

export default function AdminDashboard() {
  const router = useRouter()
  const auth = useAuth()
  const db = useFirestore()
  const { user, isUserLoading } = useUser()
  const { toast } = useToast()

  const [newUsername, setNewUsername] = useState("")
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserPassword, setNewUserPassword] = useState("")
  const [creatingUser, setCreatingUser] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const profileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);
  const { data: profile } = useDoc(profileRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/')
    }
  }, [user, isUserLoading, router])

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
    
    const uploads = logs.filter(l => l.action === 'Document Uploaded').length
    const accesses = logs.filter(l => l.action === 'Document Opened' || l.action === 'Document Viewed').length
    const decoys = logs.filter(l => l.action === 'Decoy Activated').length
    const breaches = logs.filter(l => l.action === 'Simulated Breach Triggered' || l.action === 'Unauthorized Access Attempt').length

    return [
      { title: "Active Users", value: (users?.length || 0).toString(), icon: Users, color: "text-blue-600" },
      { title: "Docs Uploaded", value: uploads.toString(), icon: FileText, color: "text-indigo-600" },
      { title: "Data Accesses", value: accesses.toString(), icon: Zap, color: "text-amber-600" },
      { title: "Decoy Serves", value: decoys.toString(), icon: ShieldAlert, color: "text-red-600" },
      { title: "Security Alerts", value: breaches.toString(), icon: Lock, color: "text-red-800" },
    ]
  }, [logs, users])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Success': return <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">SUCCESS</Badge>
      case 'Warning': return <Badge variant="secondary" className="bg-amber-500 hover:bg-amber-600">WARNING</Badge>
      case 'Alert': return <Badge variant="destructive" className="animate-pulse">ALERT</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleLogout = async () => {
    if (user && profile) {
      await logActivity(db, {
        userId: user.uid,
        username: profile.username || 'Admin',
        email: user.email || 'N/A',
        role: 'admin',
        action: 'User Logout',
        status: 'Success'
      })
    }
    await signOut(auth)
    router.push('/')
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreatingUser(true)
    try {
      // Check username unique
      const usernameQuery = query(collection(db, "users"), where("username", "==", newUsername));
      const usernameSnap = await getDocs(usernameQuery);
      if (!usernameSnap.empty) {
        throw new Error("Username already taken");
      }

      const userCredential = await createUserWithEmailAndPassword(auth, newUserEmail, newUserPassword)
      
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        username: newUsername,
        email: newUserEmail,
        role: 'User',
        createdAt: new Date().toISOString()
      })

      await logActivity(db, {
        userId: user?.uid || 'System',
        username: profile?.username || 'Admin',
        email: user?.email || 'Admin',
        role: 'admin',
        action: 'User Created',
        status: 'Success',
        metadata: { targetUsername: newUsername, targetEmail: newUserEmail }
      })

      toast({
        title: "User Provisioned",
        description: `Account for ${newUsername} has been added to the system.`,
      })
      
      setNewUsername("")
      setNewUserEmail("")
      setNewUserPassword("")
      setIsDialogOpen(false)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Provisioning Failed",
        description: error.message,
      })
    } finally {
      setCreatingUser(false)
    }
  }

  if (isUserLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="bg-secondary text-white p-4 flex justify-between items-center px-8 border-b border-primary/20">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="text-accent" />
          <span className="font-bold text-xl tracking-tight uppercase">IntelliSecureX <span className="text-[10px] font-black opacity-50 ml-2 tracking-[0.3em]">Command Center</span></span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 mr-4">
            <Badge variant="outline" className="text-white border-white/20">
              <Monitor className="w-3 h-3 mr-1" /> ADMIN: {profile?.username || 'Loading...'}
            </Badge>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="text-secondary bg-white hover:bg-slate-50 border-none font-bold text-xs">
                <UserPlus className="w-4 h-4 mr-2" /> PROVISION USER
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Provision New Deception Target</DialogTitle>
                <DialogDescription>
                  Manually add a new user identity to the protected environment.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="user-name">Username</Label>
                  <Input 
                    id="user-name" 
                    type="text" 
                    placeholder="nila" 
                    required 
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-email">Email Address</Label>
                  <Input 
                    id="user-email" 
                    type="email" 
                    placeholder="user@isx-vault.com" 
                    required 
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-password">Temporary Password</Label>
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
                    {creatingUser ? "Provisioning..." : "Provision Account"}
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
            <h1 className="text-3xl font-black text-secondary uppercase tracking-tight">System Telemetry</h1>
            <p className="text-muted-foreground font-medium">Identity-aware activity stream and deception performance</p>
          </div>
          <div className="text-xs font-bold text-slate-400 flex items-center uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-ping" />
            Live Network Feed
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="border-none shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader className="bg-white border-b flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold">Real-Time Activity Feed</CardTitle>
              <p className="text-xs text-muted-foreground">Comprehensive audit trail of identity-mapped actions</p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="text-[10px] font-black uppercase tracking-wider">User Context</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-wider">Action</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-wider">Document Context</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-wider">Timestamp</TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase tracking-wider">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs?.map((log) => (
                  <TableRow key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="max-w-[200px]">
                      <div className="font-bold text-slate-700 truncate">{log.username || 'System'}</div>
                      <div className="font-mono text-[9px] text-slate-400 truncate uppercase tracking-tighter">{log.role || 'sys'} | {log.userId}</div>
                    </TableCell>
                    <TableCell className="font-bold text-slate-800 text-sm">{log.action}</TableCell>
                    <TableCell className="text-slate-500 italic text-sm font-medium">{log.documentName || '—'}</TableCell>
                    <TableCell className="text-slate-400 text-xs font-medium">
                      {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : 'Processing...'}
                    </TableCell>
                    <TableCell className="text-right">
                      {getStatusBadge(log.status)}
                    </TableCell>
                  </TableRow>
                ))}
                {!logsLoading && (!logs || logs.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                      <Monitor className="w-12 h-12 mx-auto opacity-10 mb-4" />
                      Waiting for identity-mapped events...
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
