
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  CheckCircle2, 
  PlayCircle,
  Loader2,
  Users,
  Activity,
  Filter,
  BarChart3,
  Search,
  Clock,
  LayoutDashboard
} from "lucide-react"
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { collection, doc, updateDoc, query, limit } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AdminDashboard() {
  const router = useRouter()
  const db = useFirestore()
  const { user, isUserLoading } = useUser()
  const { toast } = useToast()

  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")

  const isAdmin = user?.email === 'admin@gmail.com'

  useEffect(() => {
    if (!isUserLoading) {
      if (!user || !isAdmin) {
        router.push("/admin/login")
      }
    }
  }, [user, isUserLoading, isAdmin, router])

  const allCallsQuery = useMemoFirebase(() => {
    if (!user || !isAdmin) return null;
    return query(collection(db, 'callRecords'), limit(200));
  }, [db, user, isAdmin])

  const { data: calls, isLoading: callsLoading } = useCollection(allCallsQuery)

  const updateStatus = async (id: string, status: string) => {
    try {
      const docRef = doc(db, 'callRecords', id);
      await updateDoc(docRef, { status });
      toast({ title: "Status Synchronized", description: `Record updated to ${status}.` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Update Failed", description: "Could not modify record status." });
    }
  }

  const processedCalls = calls ? calls
    .filter(call => {
      const matchesSearch = call.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          call.issue.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          call.assignedAgent.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || call.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    }) : [];

  const stats = {
    total: calls?.length || 0,
    pending: calls?.filter(c => c.status === 'Pending').length || 0,
    active: calls?.filter(c => c.status === 'In Progress').length || 0,
    closed: calls?.filter(c => c.status === 'Completed').length || 0
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending': return <Badge variant="outline" className="bg-slate-50 text-slate-500 font-black text-[9px] tracking-widest px-2">PENDING</Badge>
      case 'In Progress': return <Badge variant="default" className="bg-amber-500 font-black text-[9px] tracking-widest px-2">ACTIVE</Badge>
      case 'Completed': return <Badge variant="default" className="bg-emerald-500 font-black text-[9px] tracking-widest px-2">CLOSED</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isUserLoading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
          <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Authenticating Admin Session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-1000">
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
              <LayoutDashboard className="w-8 h-8 text-primary" />
              System Overview
            </h1>
            <p className="text-slate-500 font-medium">Real-time enterprise record surveillance</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="bg-white shadow-sm font-bold text-xs" onClick={() => window.print()}>
              Export Audit Log
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <StatCard title="Total Volume" value={stats.total} icon={<BarChart3 className="w-4 h-4" />} color="primary" />
          <StatCard title="Pending Queue" value={stats.pending} icon={<Clock className="w-4 h-4" />} color="slate" />
          <StatCard title="In Progress" value={stats.active} icon={<Activity className="w-4 h-4" />} color="amber" />
          <StatCard title="Total Closed" value={stats.closed} icon={<CheckCircle2 className="w-4 h-4" />} color="emerald" />
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search by customer, agent, or issue..." 
              className="pl-10 h-10 bg-slate-50/50 border-none ring-1 ring-slate-100 focus-visible:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[180px] h-10 bg-slate-50/50 border-none ring-1 ring-slate-100">
                <Filter className="w-3 h-3 mr-2" />
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className="border-none shadow-2xl shadow-slate-200/50 overflow-hidden ring-1 ring-slate-100">
          <CardHeader className="bg-white border-b px-6 py-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Global Record Feed</CardTitle>
              <CardDescription>Comprehensive oversight of all call center activity</CardDescription>
            </div>
            <Badge variant="secondary" className="px-3 py-1 font-mono text-[10px] tracking-tighter">READ_ONLY_ACCESS</Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {callsLoading ? (
                <div className="flex justify-center py-32"><Loader2 className="animate-spin text-primary w-12 h-12" /></div>
              ) : processedCalls.map((call) => (
                <div key={call.id} className="p-6 bg-white hover:bg-slate-50/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-black text-slate-900 text-lg tracking-tight">{call.customerName}</span>
                      {getStatusBadge(call.status)}
                    </div>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-3xl">{call.issue}</p>
                    <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em]">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Agent: {call.assignedAgent}</span>
                      <span className="flex items-center gap-1 border-l pl-4"><Clock className="w-3 h-3" /> Logged: {call.createdAt?.toDate?.().toLocaleString() || 'N/A'}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {call.status === 'Pending' && (
                      <Button 
                        size="sm" 
                        className="bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-500/20 font-black text-[10px] tracking-widest"
                        onClick={() => updateStatus(call.id, 'In Progress')}
                      >
                        <PlayCircle className="w-3 h-3 mr-2" /> START PROCESS
                      </Button>
                    )}
                    {call.status === 'In Progress' && (
                      <Button 
                        size="sm" 
                        className="bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-500/20 font-black text-[10px] tracking-widest"
                        onClick={() => updateStatus(call.id, 'Completed')}
                      >
                        <CheckCircle2 className="w-3 h-3 mr-2" /> FINALIZE
                      </Button>
                    )}
                    {call.status === 'Completed' && (
                      <div className="flex items-center gap-1.5 text-emerald-500 font-black text-[10px] tracking-widest bg-emerald-50 px-4 py-2 rounded-lg">
                        <CheckCircle2 className="w-3 h-3" /> VERIFIED
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {!callsLoading && processedCalls.length === 0 && (
                <div className="text-center py-32 text-slate-400 flex flex-col items-center space-y-2">
                  <Search className="w-8 h-8 text-slate-200" />
                  <p className="font-medium italic">No matching records found in the audit logs.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, color }: { title: string, value: number, icon: React.ReactNode, color: string }) {
  const colorMap: Record<string, string> = {
    primary: 'text-primary bg-primary/10',
    slate: 'text-slate-500 bg-slate-100',
    amber: 'text-amber-500 bg-amber-50',
    emerald: 'text-emerald-500 bg-emerald-50'
  }
  
  return (
    <Card className="border-none shadow-sm ring-1 ring-slate-100">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${colorMap[color]}`}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-black text-slate-900 tracking-tighter">{value}</div>
      </CardContent>
    </Card>
  )
}
