"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  ShieldCheck, 
  LogOut, 
  Clock, 
  CheckCircle2, 
  PlayCircle,
  Loader2,
  Users,
  Activity
} from "lucide-react"
import { useAuth, useFirestore, useUser, useCollection, useMemoFirebase, useDoc } from "@/firebase"
import { signOut } from "firebase/auth"
import { collection, doc, updateDoc, query, orderBy, limit } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

export default function BPOAdminDashboard() {
  const router = useRouter()
  const auth = useAuth()
  const db = useFirestore()
  const { user, isUserLoading } = useUser()
  const { toast } = useToast()

  const profileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, 'userProfiles', user.uid);
  }, [db, user]);
  const { data: profile, isLoading: profileLoading } = useDoc(profileRef);

  const isAdmin = user?.email === 'admin@gmail.com' || profile?.role === 'Admin';

  useEffect(() => {
    if (!isUserLoading && !profileLoading) {
      if (!user || !isAdmin) {
        router.push('/bpo/login')
      }
    }
  }, [user, isUserLoading, profileLoading, isAdmin, router])

  const allCallsQuery = useMemoFirebase(() => {
    if (!user || !isAdmin) return null;
    return query(collection(db, 'calls'), orderBy('createdAt', 'desc'), limit(100));
  }, [db, user, isAdmin])

  const { data: calls, isLoading: callsLoading } = useCollection(allCallsQuery)

  const updateStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'calls', id), { status })
      toast({ title: "Status Updated", description: `Call is now ${status}.` })
    } catch (err: any) {
      // Handled globally
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Waiting': return <Badge variant="outline" className="bg-slate-50 text-slate-500">WAITING</Badge>
      case 'In Progress': return <Badge variant="default" className="bg-amber-500">IN PROGRESS</Badge>
      case 'Completed': return <Badge variant="default" className="bg-emerald-500">COMPLETED</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isUserLoading || profileLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-blue-600 px-8 py-4 flex justify-between items-center shadow-lg sticky top-0 z-50">
        <div className="flex items-center space-x-3 text-white">
          <ShieldCheck className="w-6 h-6" />
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
              <Users className="w-4 h-4 text-blue-500" />
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
                <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>
              ) : calls?.map((call) => (
                <div key={call.id} className="p-6 bg-white hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-900">{call.customerName}</span>
                      {getStatusBadge(call.status)}
                    </div>
                    <p className="text-sm text-slate-500">{call.issue}</p>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      Agent: {call.assignedAgent} | Created: {call.createdAt?.toDate?.().toLocaleString()}
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