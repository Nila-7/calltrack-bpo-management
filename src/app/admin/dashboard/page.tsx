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
  Activity,
  Filter,
  BarChart3,
  Search,
  Clock,
  ShieldAlert,
  Download
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
    return query(collection(db, 'callRecords'), limit(500));
  }, [db, user, isAdmin])

  const { data: calls, isLoading: callsLoading } = useCollection(allCallsQuery)

  const updateStatus = async (id: string, status: string) => {
    try {
      const docRef = doc(db, 'callRecords', id);
      await updateDoc(docRef, { status });
      toast({ title: "Log Updated", description: `Record status set to ${status}.` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Action Inhibited", description: "Failed to modify record status." });
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
      case 'Pending': 
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200 font-medium uppercase text-[9px] tracking-widest px-2">PENDING</Badge>
      case 'In Progress': 
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 font-medium uppercase text-[9px] tracking-widest px-2">ACTIVE</Badge>
      case 'Completed': 
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 font-medium uppercase text-[9px] tracking-widest px-2">CLOSED</Badge>
      default: 
        return <Badge variant="outline" className="text-[9px]">{status}</Badge>
    }
  }

  if (isUserLoading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-10 h-10 mx-auto" />
          <p className="text-muted-foreground font-medium uppercase tracking-[0.2em] text-[10px]">Verifying Administrative Privileges...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto px-6 py-10 transition-all duration-300">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-10">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-primary">
            <ShieldAlert className="w-5 h-5" />
            <span className="text-[11px] font-medium uppercase tracking-[0.3em]">System Oversight</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground uppercase">Master Command Center</h1>
          <p className="text-muted-foreground font-normal text-sm">Enterprise-wide surveillance of BPO operations and agent logs</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-card border-border font-medium text-xs uppercase tracking-widest shadow-sm h-11 px-6" onClick={() => window.print()}>
            <Download className="w-4 h-4 mr-2" /> Export Audit Log
          </Button>
        </div>
      </header>

      <div className="space-y-10">
        {/* KPI Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatCard title="System Volume" value={stats.total} icon={<BarChart3 className="w-4 h-4" />} color="primary" />
          <StatCard title="Pending Queue" value={stats.pending} icon={<Clock className="h-4 w-4" />} color="slate" />
          <StatCard title="Operational" value={stats.active} icon={<Activity className="h-4 w-4" />} color="amber" />
          <StatCard title="Total Archived" value={stats.closed} icon={<CheckCircle2 className="h-4 w-4" />} color="emerald" />
        </div>

        {/* Filters Module */}
        <div className="bg-card p-6 rounded-2xl shadow-xl shadow-black/5 border border-border flex flex-col lg:flex-row gap-6 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search master logs by customer, agent, or incident..." 
              className="pl-12 h-12 bg-muted/20 border-border focus-visible:ring-primary font-normal text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-3 w-full lg:w-auto">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full lg:w-[220px] h-12 bg-muted/20 border-border font-medium text-[10px] uppercase tracking-widest">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ALL LOGS</SelectItem>
                <SelectItem value="Pending">PENDING QUEUE</SelectItem>
                <SelectItem value="In Progress">IN PROGRESS</SelectItem>
                <SelectItem value="Completed">ARCHIVED</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Global Record Feed */}
        <Card className="border-none shadow-2xl shadow-black/10 overflow-hidden ring-1 ring-border bg-card">
          <CardHeader className="bg-muted/5 border-b px-8 py-6 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold uppercase tracking-tight">Enterprise Record Stream</CardTitle>
              <CardDescription className="text-xs text-muted-foreground font-normal">Real-time synchronization of all agent activities</CardDescription>
            </div>
            <Badge variant="secondary" className="px-4 py-1.5 font-medium text-[9px] tracking-widest bg-primary/10 text-primary border border-primary/20 uppercase">Audit Mode: Full Access</Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {callsLoading ? (
                <div className="flex flex-col items-center justify-center py-40 gap-4">
                  <Loader2 className="animate-spin text-primary w-10 h-10" />
                  <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-muted-foreground">Synchronizing Master Feed...</p>
                </div>
              ) : processedCalls.map((call) => (
                <div key={call.id} className="p-8 hover:bg-muted/5 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-8 group">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-xl text-foreground tracking-tight">{call.customerName}</span>
                      {getStatusBadge(call.status)}
                    </div>
                    <p className="text-sm text-muted-foreground font-normal leading-relaxed max-w-4xl">{call.issue}</p>
                    <div className="flex items-center gap-6 text-[10px] text-muted-foreground font-medium uppercase tracking-[0.2em] pt-2">
                      <span className="bg-muted/50 px-3 py-1 rounded-md">Agent: {call.assignedAgent}</span>
                      <span className="border-l pl-6">Timestamp: {call.createdAt?.toDate?.().toLocaleString() || 'N/A'}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {call.status === 'Pending' && (
                      <Button 
                        className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 font-medium text-[10px] tracking-widest px-6 h-10"
                        onClick={() => updateStatus(call.id, 'In Progress')}
                      >
                        <PlayCircle className="w-3 h-3 mr-2" /> START PROCESS
                      </Button>
                    )}
                    {call.status === 'In Progress' && (
                      <Button 
                        className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 font-medium text-[10px] tracking-widest px-6 h-10"
                        onClick={() => updateStatus(call.id, 'Completed')}
                      >
                        <CheckCircle2 className="w-3 h-3 mr-2" /> ARCHIVE RECORD
                      </Button>
                    )}
                    {call.status === 'Completed' && (
                      <div className="flex items-center gap-2 text-emerald-600 font-medium text-[10px] tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-6 py-2.5 rounded-xl">
                        <CheckCircle2 className="w-3 h-3" /> AUDIT VERIFIED
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {!callsLoading && processedCalls.length === 0 && (
                <div className="text-center py-40 text-muted-foreground flex flex-col items-center space-y-4">
                  <div className="p-5 bg-muted rounded-full opacity-50">
                    <Search className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-foreground font-medium uppercase tracking-widest text-sm">No Matches Detected</p>
                    <p className="text-xs font-normal">Your current filters yielded zero results from the master logs.</p>
                  </div>
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
    primary: 'text-primary bg-primary/10 border-primary/20',
    slate: 'text-slate-500 bg-slate-500/10 border-slate-500/20',
    amber: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
  }
  
  return (
    <Card className="border shadow-sm bg-card overflow-hidden group">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-[10px] font-medium uppercase tracking-[0.3em] text-muted-foreground">{title}</CardTitle>
        <div className={`p-2 rounded-lg border ${colorMap[color]} transition-transform group-hover:scale-105`}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold text-foreground tracking-tight">{value}</div>
      </CardContent>
    </Card>
  )
}
