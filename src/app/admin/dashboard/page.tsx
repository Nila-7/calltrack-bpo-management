"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  LogOut, 
  CheckCircle2, 
  PlayCircle,
  Loader2,
  Users,
  Activity,
  PhoneCall
} from "lucide-react"
import { useAuth, useFirestore, useUser, useCollection, useMemoFirebase, useDoc } from "@/firebase"
import { signOut } from "firebase/auth"
import { collection, doc, updateDoc, query, orderBy, limit } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

export default function AdminDashboard() {
  const router = useRouter()
  const auth = useAuth()
  const db = useFirestore()
  const { user, isUserLoading } = useUser()
  const { toast } = useToast()

  // Fetch profile to verify admin role
  const profileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, 'userProfiles', user.uid);
  }, [db, user]);
  const { data: profile, isLoading: profileLoading } = useDoc(profileRef);

  // Robust admin check
  const isAdmin = user?.email === 'admin@gmail.com' || profile?.role === 'Admin';

  useEffect(() => {
    // Wait for all loading states before making a routing decision
    if (!isUserLoading && !profileLoading) {
      if (!user) {
        router.push('/')
      } else if (!isAdmin) {
        // If they logged in as a regular agent, send them to the agent portal
        router.push('/user/dashboard')
      }
    }
  }, [user, isUserLoading, profileLoading, isAdmin, router])

  // Gate the query: Only run if we are 100% sure the user is an authorized admin
  const allCallsQuery = useMemoFirebase(() => {
    if (!user || isUserLoading || profileLoading || !isAdmin) return null;
    return query(collection(db, 'calls'), orderBy('createdAt', 'desc'), limit(100));
  }, [db, user, isAdmin, isUserLoading, profileLoading])

  const { data: calls, isLoading: callsLoading } = useCollection(allCallsQuery)

  const updateStatus = async (id: string, status: string) => {
    try {
      const docRef = doc(db, 'calls', id);
      await updateDoc(docRef, { status });
      toast({ title: "Status Updated", description: `Call is now ${status}.` });
    } catch (err: any) {
      // Permission errors are handled by the global listener
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Waiting': return <Badge variant="outline" className="bg-slate-50 text-slate-500 font-bold">WAITING</Badge>
      case 'In Progress': return <Badge variant="default" className="bg-amber-500 font-bold">IN PROGRESS</Badge>
      case 'Completed': return <Badge variant="default" className="bg-emerald-500 font-bold">COMPLETED</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isUserLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-10 h-10 mx-auto" />
          <p className="text-slate-500 font-medium">Verifying Administrator Access...</p>
        </div>
      </div>
    )
  }

  // Double check admin status before rendering sensitive UI
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-body">
      <nav className="bg-primary px-8 py-4 flex justify-between items-center shadow-lg sticky top-0 z-50">
        <div className="flex items-center space-x-3 text-white">
          <PhoneCall className="w-6 h-6" />
          <span className="font-bold text-xl uppercase tracking-tight">BPO Admin Command Center</span>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="text-white border-white/30 bg-white/10 uppercase tracking-widest font-black">Admin Access</Badge>
          <Button variant="ghost" className="text-white hover:bg-white/10" onClick={() => signOut(auth)}>
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </nav>

      <main className="p-8 max-w-7xl mx-auto space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Total Records</CardTitle>
              <Users className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent><div className="text-2xl font-black">{calls?.length || 0}</div></CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">In Progress</CardTitle>
              <Activity className="w-4 h-4 text-amber-500" />
            </CardHeader>
            <CardContent><div className="text-2xl font-black">{calls?.filter(c => c.status === 'In Progress').length || 0}</div></CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Closed</CardTitle>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </CardHeader>
            <CardContent><div className="text-2xl font-black">{calls?.filter(c => c.status === 'Completed').length || 0}</div></CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-white border-b">
            <CardTitle>Global Call Queue</CardTitle>
            <CardDescription>Manage and update call statuses across all agents</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {callsLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>
              ) : calls?.map((call) => (
                <div key={call.id} className="p-6 bg-white hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-900">{call.customerName}</span>
                      {getStatusBadge(call.status)}
                    </div>
                    <p className="text-sm text-slate-500">{call.issue}</p>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      Agent: {call.assignedAgent} | Created: {call.createdAt?.toDate?.().toLocaleString() || 'N/A'}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {call.status === 'Waiting' && (
                      <Button 
                        size="sm" 
                        className="bg-amber-500 hover:bg-amber-600 text-xs font-bold"
                        onClick={() => updateStatus(call.id, 'In Progress')}
                      >
                        <PlayCircle className="w-3 h-3 mr-1" /> START PROCESS
                      </Button>
                    )}
                    {call.status === 'In Progress' && (
                      <Button 
                        size="sm" 
                        className="bg-emerald-500 hover:bg-emerald-600 text-xs font-bold"
                        onClick={() => updateStatus(call.id, 'Completed')}
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" /> MARK COMPLETED
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {!callsLoading && calls?.length === 0 && (
                <div className="text-center py-20 text-slate-400">Queue is empty.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}