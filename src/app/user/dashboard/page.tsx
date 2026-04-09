"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Clock, 
  CheckCircle2, 
  PlayCircle,
  Loader2,
  AlertCircle,
  History,
  PhoneForwarded,
  Layout
} from "lucide-react"
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { collection, addDoc, serverTimestamp, query, where } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

export default function UserDashboard() {
  const router = useRouter()
  const db = useFirestore()
  const { user, isUserLoading } = useUser()
  const { toast } = useToast()

  const [customerName, setCustomerName] = useState("")
  const [issue, setIssue] = useState("")
  const [agentName, setAgentName] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const isAdmin = user?.email === 'admin@gmail.com'

  useEffect(() => {
    if (!isUserLoading) {
      if (!user) {
        router.push("/user/login")
      } else if (isAdmin) {
        // router.push("/admin/dashboard") // Allow admins to use user dashboard if they want
      }
    }
  }, [user, isUserLoading, isAdmin, router])

  const callsQuery = useMemoFirebase(() => {
    if (!user || isUserLoading) return null
    return query(
      collection(db, 'callRecords'),
      where('userId', '==', user.uid)
    )
  }, [db, user, isUserLoading])

  const { data: calls, isLoading: callsLoading } = useCollection(callsQuery)

  const sortedCalls = calls ? [...calls].sort((a, b) => {
    const timeA = a.createdAt?.seconds || 0;
    const timeB = b.createdAt?.seconds || 0;
    return timeB - timeA;
  }) : [];

  const handleAddCall = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || submitting) return
    setSubmitting(true)
    try {
      await addDoc(collection(db, 'callRecords'), {
        customerName,
        issue,
        assignedAgent: agentName || user.email,
        status: 'Pending',
        userId: user.uid,
        createdAt: serverTimestamp()
      })
      setCustomerName("")
      setIssue("")
      setAgentName("")
      toast({ 
        title: "Log Entry Successful", 
        description: "Your call record has been synchronized with the master database." 
      })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Logging Failed", description: "Internal system error. Please retry." })
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending': return <Badge variant="outline" className="text-slate-500 bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 font-bold uppercase text-[10px] tracking-wider"><Clock className="w-3 h-3 mr-1" /> PENDING</Badge>
      case 'In Progress': return <Badge variant="default" className="bg-amber-500 hover:bg-amber-600 font-bold uppercase text-[10px] tracking-wider"><PlayCircle className="w-3 h-3 mr-1" /> ACTIVE</Badge>
      case 'Completed': return <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600 font-bold uppercase text-[10px] tracking-wider"><CheckCircle2 className="w-3 h-3 mr-1" /> CLOSED</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isUserLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-3">
        <Loader2 className="animate-spin text-primary w-10 h-10 mx-auto" />
        <p className="text-muted-foreground font-medium">Synchronizing Workspace...</p>
      </div>
    </div>
  )

  if (!user) return null;

  return (
    <div className="w-full max-w-[1600px] mx-auto px-6 py-8 transition-all duration-300">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-primary">
            <Layout className="w-6 h-6" />
            <span className="text-xs font-black uppercase tracking-[0.3em]">Agent Dashboard</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-foreground uppercase">Agent Workspace</h1>
          <p className="text-muted-foreground font-medium">Central command for BPO call tracking and record management</p>
        </div>
        <div className="flex items-center gap-3 bg-card border rounded-xl px-4 py-2 shadow-sm">
          <div className="text-right">
            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Active Session</div>
            <div className="text-sm font-bold text-foreground">{user.email}</div>
          </div>
          <PhoneForwarded className="w-5 h-5 text-primary ml-2" />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Module: Log Call Record */}
        <div className="lg:col-span-5 xl:col-span-4">
          <Card className="border shadow-xl shadow-black/5 bg-card overflow-hidden">
            <CardHeader className="bg-muted/30 border-b">
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Plus className="w-5 h-5" />
                </div>
                <CardTitle className="text-xl font-bold uppercase tracking-tight">Log Call Entry</CardTitle>
              </div>
              <CardDescription>Input customer interaction details for processing</CardDescription>
            </CardHeader>
            <CardContent className="pt-8">
              <form onSubmit={handleAddCall} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Customer Identity</Label>
                  <Input 
                    placeholder="e.g. Acme Corp / Jane Doe" 
                    className="h-12 bg-muted/20 border-border focus-visible:ring-primary"
                    required 
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Assigned Agent</Label>
                  <Input 
                    placeholder={user.email || "Agent Identifier"} 
                    className="h-12 bg-muted/20 border-border"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Inquiry Details</Label>
                  <Textarea 
                    placeholder="Describe the nature of the customer interaction..." 
                    required 
                    className="min-h-[150px] bg-muted/20 border-border resize-none"
                    value={issue}
                    onChange={(e) => setIssue(e.target.value)}
                  />
                </div>
                <Button className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all" disabled={submitting}>
                  {submitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Plus className="w-5 h-5 mr-2" />}
                  Finalize Record
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Module: Recent Activity */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          <div className="flex items-center justify-between bg-card p-4 rounded-xl border border-border/50 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <History className="w-5 h-5 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Recent Synchronization</h2>
            </div>
            <div className="text-xs font-black text-primary bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20">
              {sortedCalls.length} TOTAL RECORDS
            </div>
          </div>
          
          <div className="space-y-4">
            {callsLoading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-4 bg-card rounded-2xl border border-dashed border-border">
                <Loader2 className="animate-spin text-primary w-12 h-12" />
                <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest">Accessing Logs...</p>
              </div>
            ) : sortedCalls.map((call) => (
              <Card key={call.id} className="border shadow-md hover:shadow-xl transition-all duration-300 group overflow-hidden bg-card">
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    <div className={`w-2 transition-colors duration-300 ${call.status === 'Completed' ? 'bg-emerald-500' : call.status === 'In Progress' ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
                    <div className="flex-1 p-6 flex flex-col sm:flex-row justify-between items-start gap-6">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center flex-wrap gap-3">
                          <span className="font-black text-xl text-foreground tracking-tight">{call.customerName}</span>
                          {getStatusBadge(call.status)}
                        </div>
                        <p className="text-sm text-muted-foreground font-medium leading-relaxed max-w-3xl">{call.issue}</p>
                        <div className="flex items-center gap-6 pt-4">
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] bg-muted/50 px-3 py-1 rounded-md">
                            Agent: {call.assignedAgent}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">
                            {call.createdAt?.toDate?.().toLocaleString() || 'SYNCING...'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {!callsLoading && sortedCalls.length === 0 && (
              <div className="text-center py-40 bg-card rounded-2xl border-2 border-dashed border-border flex flex-col items-center space-y-4">
                <div className="p-6 bg-muted rounded-full">
                  <AlertCircle className="w-10 h-10 text-muted-foreground/30" />
                </div>
                <div className="space-y-1">
                  <p className="text-foreground font-black uppercase tracking-widest">No Log Data Detected</p>
                  <p className="text-sm text-muted-foreground font-medium">Your personal synchronization queue is currently empty.</p>
                </div>
                <Button variant="outline" className="mt-4 font-bold text-xs uppercase tracking-widest" onClick={() => (document.querySelector('input') as HTMLElement)?.focus()}>
                  Initiate First Entry
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}