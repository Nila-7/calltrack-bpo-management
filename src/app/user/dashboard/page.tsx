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

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/user/login")
    }
  }, [user, isUserLoading, router])

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
    
    if (!customerName || !issue) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please fill in all required fields." })
      return
    }

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
      case 'Pending': 
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200 font-medium uppercase text-[10px] tracking-wider px-2 py-0.5"><Clock className="w-3 h-3 mr-1" /> PENDING</Badge>
      case 'In Progress': 
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 font-medium uppercase text-[10px] tracking-wider px-2 py-0.5"><PlayCircle className="w-3 h-3 mr-1" /> ACTIVE</Badge>
      case 'Completed': 
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 font-medium uppercase text-[10px] tracking-wider px-2 py-0.5"><CheckCircle2 className="w-3 h-3 mr-1" /> CLOSED</Badge>
      default: 
        return <Badge variant="outline" className="font-medium text-[10px]">{status}</Badge>
    }
  }

  if (isUserLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-3">
        <Loader2 className="animate-spin text-primary w-10 h-10 mx-auto" />
        <p className="text-muted-foreground font-medium text-sm tracking-wide">Synchronizing Workspace...</p>
      </div>
    </div>
  )

  if (!user) return null;

  return (
    <div className="w-full max-w-[1600px] mx-auto px-6 py-10 transition-all duration-300">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-10">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-primary">
            <Layout className="w-5 h-5" />
            <span className="text-[11px] font-medium uppercase tracking-[0.3em]">Agent Dashboard</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground uppercase">Agent Workspace</h1>
          <p className="text-muted-foreground font-normal text-sm">Central command for BPO call tracking and record management</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Module: Log Call Record */}
        <div className="lg:col-span-5 xl:col-span-4">
          <Card className="border shadow-xl shadow-black/5 bg-card overflow-hidden">
            <CardHeader className="bg-muted/5 border-b py-6">
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Plus className="w-4 h-4" />
                </div>
                <CardTitle className="text-lg font-semibold uppercase tracking-tight">Log Call Entry</CardTitle>
              </div>
              <CardDescription className="font-normal text-xs text-muted-foreground">Input customer interaction details for processing</CardDescription>
            </CardHeader>
            <CardContent className="pt-8">
              <form onSubmit={handleAddCall} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Customer Identity *</Label>
                  <Input 
                    placeholder="e.g. Acme Corp / Jane Doe" 
                    className="h-11 bg-muted/20 border-border focus-visible:ring-primary font-normal"
                    required 
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Assigned Agent (Optional)</Label>
                  <Input 
                    placeholder={user.email || "Agent Identifier"} 
                    className="h-11 bg-muted/20 border-border font-normal"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Inquiry Details *</Label>
                  <Textarea 
                    placeholder="Describe the nature of the customer interaction..." 
                    required 
                    className="min-h-[140px] bg-muted/20 border-border resize-none font-normal leading-relaxed text-sm"
                    value={issue}
                    onChange={(e) => setIssue(e.target.value)}
                  />
                </div>
                <Button className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-medium uppercase tracking-widest text-xs shadow-lg shadow-primary/20 transition-all" disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  Submit Record
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
                <History className="w-4 h-4 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold text-foreground uppercase tracking-tight">Recent Synchronization</h2>
            </div>
            <div className="text-[10px] font-semibold text-primary bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20 tracking-wider">
              {sortedCalls.length} TOTAL RECORDS
            </div>
          </div>
          
          <div className="space-y-4">
            {callsLoading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-4 bg-card rounded-2xl border border-dashed border-border">
                <Loader2 className="animate-spin text-primary w-10 h-10" />
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-[0.2em]">Accessing Logs...</p>
              </div>
            ) : sortedCalls.map((call) => (
              <Card key={call.id} className="border shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden bg-card">
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    <div className={`w-1 transition-colors duration-300 ${call.status === 'Completed' ? 'bg-emerald-500' : call.status === 'In Progress' ? 'bg-blue-500' : 'bg-yellow-400'}`} />
                    <div className="flex-1 p-6 flex flex-col sm:flex-row justify-between items-start gap-6">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center flex-wrap gap-3">
                          <span className="font-semibold text-lg text-foreground tracking-tight">{call.customerName}</span>
                          {getStatusBadge(call.status)}
                        </div>
                        <p className="text-[13px] text-muted-foreground font-normal leading-relaxed max-w-3xl line-clamp-3">{call.issue}</p>
                        <div className="flex items-center gap-6 pt-4 border-t mt-4">
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium uppercase tracking-[0.2em]">
                            Agent: {call.assignedAgent}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.2em] border-l pl-6">
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
              <div className="text-center py-32 bg-card rounded-2xl border-2 border-dashed border-border flex flex-col items-center space-y-4">
                <div className="p-5 bg-muted rounded-full opacity-50">
                  <AlertCircle className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="text-foreground font-medium uppercase tracking-widest text-sm">No Log Data Detected</p>
                  <p className="text-xs text-muted-foreground font-normal">Your personal synchronization queue is currently empty.</p>
                </div>
                <Button variant="outline" size="sm" className="mt-4 font-medium text-[10px] uppercase tracking-widest h-9" onClick={() => (document.querySelector('input') as HTMLElement)?.focus()}>
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
