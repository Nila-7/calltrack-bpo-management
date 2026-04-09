
"use client"

import { useState, useEffect, useMemo } from "react"
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
  Download,
  TrendingUp,
  Users as UsersIcon,
  PieChart as PieChartIcon,
  LayoutDashboard,
  Database,
  Timer
} from "lucide-react"
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { collection, doc, updateDoc, query, limit, getDocs, serverTimestamp } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area
} from "recharts"

export default function AdminDashboard() {
  const router = useRouter()
  const db = useFirestore()
  const { user, isUserLoading } = useUser()
  const { toast } = useToast()

  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/user/login")
    }
  }, [user, isUserLoading, router])

  const allCallsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, 'callRecords'), limit(1000));
  }, [db, user])

  const { data: calls, isLoading: callsLoading } = useCollection(allCallsQuery)

  const analyticsData = useMemo(() => {
    if (!calls) return { statusData: [], timeData: [], agentData: [] };

    const statusCounts = {
      'Pending': 0,
      'In Progress': 0,
      'Completed': 0
    };
    calls.forEach(c => {
      if (statusCounts.hasOwnProperty(c.status)) {
        statusCounts[c.status as keyof typeof statusCounts]++;
      }
    });
    const statusData = [
      { name: 'Pending', value: statusCounts['Pending'], color: '#eab308' },
      { name: 'Active', value: statusCounts['In Progress'], color: '#3b82f6' },
      { name: 'Completed', value: statusCounts['Completed'], color: '#10b981' }
    ].filter(d => d.value > 0);

    const timeMap = new Map();
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      timeMap.set(dateStr, 0);
    }

    calls.forEach(c => {
      const createdAt = c.createdAt?.toDate?.() || new Date(c.createdAt);
      const dateStr = createdAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (timeMap.has(dateStr)) {
        timeMap.set(dateStr, timeMap.get(dateStr) + 1);
      }
    });

    const timeData = Array.from(timeMap).map(([date, count]) => ({ date, count }));

    const agentMap = new Map();
    calls.forEach(c => {
      const agent = c.assignedAgent || 'Unassigned';
      agentMap.set(agent, (agentMap.get(agent) || 0) + 1);
    });

    const agentData = Array.from(agentMap)
      .map(([agent, count]) => ({ agent: agent.split('@')[0], count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return { statusData, timeData, agentData };
  }, [calls]);

  const stats = useMemo(() => {
    if (!calls) return { total: 0, pending: 0, active: 0, resolved: 0, avgResolutionTime: "0m" };

    const total = calls.length;
    const pending = calls.filter(c => c.status === 'Pending').length;
    const active = calls.filter(c => c.status === 'In Progress').length;
    const resolved = calls.filter(c => c.status === 'Completed');
    
    let totalResolutionMs = 0;
    let resolvedCountWithTime = 0;

    resolved.forEach(c => {
      if (c.createdAt && c.resolvedAt) {
        const start = c.createdAt.toDate?.() || new Date(c.createdAt);
        const end = c.resolvedAt.toDate?.() || new Date(c.resolvedAt);
        totalResolutionMs += end.getTime() - start.getTime();
        resolvedCountWithTime++;
      }
    });

    const avgMs = resolvedCountWithTime > 0 ? totalResolutionMs / resolvedCountWithTime : 0;
    const avgMinutes = Math.round(avgMs / 60000);
    const avgFormatted = avgMinutes > 60 
      ? `${Math.floor(avgMinutes / 60)}h ${avgMinutes % 60}m`
      : `${avgMinutes}m`;

    return {
      total,
      pending,
      active,
      resolved: resolved.length,
      avgResolutionTime: avgFormatted
    };
  }, [calls]);

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);

    try {
      const querySnapshot = await getDocs(collection(db, 'callRecords'));
      const records = querySnapshot.docs.map(doc => doc.data());

      if (records.length === 0) {
        toast({ title: "No Records", description: "There are no call records available to export." });
        return;
      }

      const headers = ["Customer Name", "Problem", "Assigned Agent", "Status", "Created At", "User ID"];
      const csvRows = [headers.join(",")];

      for (const record of records) {
        const createdAt = (record as any).createdAt?.toDate?.()?.toLocaleString() || 'N/A';
        const row = [
          `"${((record as any).customerName || "").toString().replace(/"/g, '""')}"`,
          `"${((record as any).issue || "").toString().replace(/"/g, '""')}"`,
          `"${((record as any).assignedAgent || "").toString().replace(/"/g, '""')}"`,
          `"${((record as any).status || "").toString().replace(/"/g, '""')}"`,
          `"${createdAt}"`,
          `"${((record as any).userId || "").toString().replace(/"/g, '""')}"`
        ];
        csvRows.push(row.join(","));
      }

      const csvString = csvRows.join("\n");
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "audit-log.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({ title: "Export Success", description: "Audit log downloaded successfully." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Export Error", description: "System failed to generate report." });
    } finally {
      setIsExporting(false);
    }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      const docRef = doc(db, 'callRecords', id);
      const updates: any = { status };
      if (status === 'Completed') {
        updates.resolvedAt = serverTimestamp();
      }
      await updateDoc(docRef, updates);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending': 
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200 font-medium uppercase text-[10px] tracking-widest px-2">PENDING</Badge>
      case 'In Progress': 
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 font-medium uppercase text-[10px] tracking-widest px-2">ACTIVE</Badge>
      case 'Completed': 
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 font-medium uppercase text-[10px] tracking-widest px-2">RESOLVED</Badge>
      default: 
        return <Badge variant="outline" className="text-[10px]">{status}</Badge>
    }
  }

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-10 h-10 mx-auto" />
          <p className="text-muted-foreground font-medium uppercase tracking-[0.2em] text-[10px]">Loading Administrative View...</p>
        </div>
      </div>
    )
  }

  if (!user) return null;

  return (
    <div className="w-full max-w-[1600px] mx-auto px-6 py-10 transition-all duration-300">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b pb-12">
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-primary">
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.3em]">Operational Oversight</span>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground uppercase">Master Command Center</h1>
          <p className="text-muted-foreground font-normal text-sm leading-relaxed max-w-2xl">Enterprise-wide monitoring and lifecycle management of BPO call records and agent activities.</p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            className="bg-card border-border font-medium text-[10px] uppercase tracking-widest shadow-sm h-11 px-8 rounded-xl" 
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2 text-primary" />}
            {isExporting ? "Exporting..." : "Export Audit Log"}
          </Button>
        </div>
      </header>

      <div className="space-y-12">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Calls" value={stats.total} icon={<Database className="w-4 h-4" />} color="primary" />
          <StatCard title="Pending Calls" value={stats.pending} icon={<Clock className="h-4 w-4" />} color="slate" />
          <StatCard title="Resolved Calls" value={stats.resolved} icon={<CheckCircle2 className="h-4 w-4" />} color="emerald" />
          <StatCard title="Avg Resolution Time" value={stats.avgResolutionTime} icon={<Timer className="h-4 w-4" />} color="amber" />
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="shadow-2xl shadow-black/5 border-border bg-card rounded-2xl overflow-hidden">
            <CardHeader className="pb-6 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <PieChartIcon className="w-4 h-4 text-primary" />
                </div>
                <CardTitle className="text-sm font-semibold uppercase tracking-widest">Queue Composition</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="h-[300px] pt-8">
              {analyticsData.statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={95}
                      paddingAngle={8}
                      dataKey="value"
                    >
                      {analyticsData.statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-[10px] uppercase tracking-widest">Awaiting System Data...</div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-2xl shadow-black/5 border-border bg-card rounded-2xl overflow-hidden">
            <CardHeader className="pb-6 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <CardTitle className="text-sm font-semibold uppercase tracking-widest">Traffic Trends</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="h-[300px] pt-8">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData.timeData} margin={{ left: -20, right: 10 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="date" fontSize={10} axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-2xl shadow-black/5 border-border bg-card rounded-2xl overflow-hidden">
            <CardHeader className="pb-6 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <UsersIcon className="w-4 h-4 text-primary" />
                </div>
                <CardTitle className="text-sm font-semibold uppercase tracking-widest">Agent Throughput</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="h-[300px] pt-8">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.agentData} layout="vertical" margin={{ left: -10, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="agent" type="category" fontSize={10} width={80} axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <RechartsTooltip cursor={{ fill: 'hsl(var(--muted)/0.1)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Global Controls */}
        <div className="bg-card p-8 rounded-3xl shadow-2xl shadow-black/5 border border-border/50 flex flex-col lg:flex-row gap-8 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Filter master logs by customer identity, agent ID, or incident profile..." 
              className="pl-12 h-14 bg-muted/10 border-border focus-visible:ring-primary font-normal text-sm rounded-2xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-4 w-full lg:w-auto">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full lg:w-[260px] h-14 bg-muted/10 border-border font-medium text-[10px] uppercase tracking-[0.2em] rounded-2xl">
                <div className="flex items-center gap-3">
                  <Filter className="w-4 h-4 text-primary" />
                  <SelectValue placeholder="Lifecycle Filter" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-border">
                <SelectItem value="all">ALL SYSTEM LOGS</SelectItem>
                <SelectItem value="Pending">PENDING QUEUE</SelectItem>
                <SelectItem value="In Progress">ACTIVE SESSIONS</SelectItem>
                <SelectItem value="Completed">ARCHIVED RECORDS</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Data Stream */}
        <Card className="border-none shadow-2xl shadow-black/10 overflow-hidden ring-1 ring-border bg-card rounded-3xl">
          <CardHeader className="bg-muted/5 border-b px-10 py-8 flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-semibold uppercase tracking-tight">Enterprise Record Stream</CardTitle>
              <CardDescription className="text-xs text-muted-foreground font-normal tracking-wide">Real-time synchronization of global support infrastructure activities.</CardDescription>
            </div>
            <div className="hidden md:block">
              <Badge variant="secondary" className="bg-muted px-4 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                LIVE STATUS: {processedCalls.length} ACTIVE LOGS
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {callsLoading ? (
                <div className="flex flex-col items-center justify-center py-48 gap-6">
                  <Loader2 className="animate-spin text-primary w-12 h-12" />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-muted-foreground">Synchronizing Master Feed...</p>
                </div>
              ) : processedCalls.map((call) => (
                <div key={call.id} className="p-10 hover:bg-muted/10 transition-all duration-300 flex flex-col lg:flex-row lg:items-center justify-between gap-10 group">
                  <div className="space-y-4 flex-1">
                    <div className="flex items-center gap-6">
                      <span className="font-semibold text-2xl text-foreground tracking-tight">{call.customerName}</span>
                      {getStatusBadge(call.status)}
                    </div>
                    <p className="text-[15px] text-muted-foreground font-normal leading-relaxed max-w-5xl">{call.issue}</p>
                    <div className="flex items-center gap-8 text-[10px] text-muted-foreground font-semibold uppercase tracking-[0.2em] pt-4">
                      <div className="flex items-center gap-2 bg-muted/40 px-4 py-2 rounded-xl">
                        <UsersIcon className="w-3 h-3 text-primary" />
                        <span>AGENT: {call.assignedAgent}</span>
                      </div>
                      <div className="flex items-center gap-2 border-l border-border pl-8">
                        <Clock className="w-3 h-3" />
                        <span>TIMESTAMP: {call.createdAt?.toDate?.().toLocaleString() || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 shrink-0">
                    {call.status === 'Pending' && (
                      <Button 
                        className="bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 font-semibold text-[10px] tracking-widest px-8 h-12 rounded-2xl"
                        onClick={() => updateStatus(call.id, 'In Progress')}
                      >
                        <PlayCircle className="w-4 h-4 mr-2" /> INITIATE PROCESS
                      </Button>
                    )}
                    {call.status === 'In Progress' && (
                      <Button 
                        className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 font-semibold text-[10px] tracking-widest px-8 h-12 rounded-2xl"
                        onClick={() => updateStatus(call.id, 'Completed')}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" /> FINALIZE RECORD
                      </Button>
                    )}
                    {call.status === 'Completed' && (
                      <div className="flex items-center gap-3 text-emerald-600 font-semibold text-[10px] tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-8 py-3.5 rounded-2xl">
                        <CheckCircle2 className="w-4 h-4" /> COMPLIANCE VERIFIED
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {!callsLoading && processedCalls.length === 0 && (
                <div className="text-center py-48 text-muted-foreground flex flex-col items-center space-y-6">
                  <div className="p-8 bg-muted/20 rounded-full border border-dashed border-border">
                    <Search className="w-12 h-12 text-muted-foreground/50" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-foreground font-semibold uppercase tracking-[0.2em] text-sm">No Matching Logs Detected</p>
                    <p className="text-xs font-normal tracking-wide">The current system filters yielded zero results from the master stream.</p>
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

function StatCard({ title, value, icon, color }: { title: string, value: string | number, icon: React.ReactNode, color: string }) {
  const colorMap: Record<string, string> = {
    primary: 'text-primary bg-primary/10 border-primary/20',
    slate: 'text-slate-500 bg-slate-500/10 border-slate-500/20',
    amber: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
  }
  
  return (
    <Card className="border shadow-2xl shadow-black/5 bg-card overflow-hidden group rounded-3xl transition-all duration-300 hover:scale-[1.02]">
      <CardHeader className="flex flex-row items-center justify-between pb-6 pt-8 px-8">
        <CardTitle className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">{title}</CardTitle>
        <div className={`p-3 rounded-2xl border ${colorMap[color]} transition-transform group-hover:rotate-6`}>{icon}</div>
      </CardHeader>
      <CardContent className="px-8 pb-8">
        <div className="text-4xl font-semibold text-foreground tracking-tighter">{value}</div>
      </CardContent>
    </Card>
  )
}
