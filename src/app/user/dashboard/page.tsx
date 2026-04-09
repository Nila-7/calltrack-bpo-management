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
  History
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

  // Removed orderBy from the query to prevent missing index errors (Permission Denied)
  const callsQuery = useMemoFirebase(() => {
    if (!user || isUserLoading) return null
    return query(
      collection(db, 'callRecords'),
      where('userId', '==', user.uid)
    )
  }, [db, user, isUserLoading])

  const { data: calls, isLoading: callsLoading } = useCollection(callsQuery)

  // Sort calls in memory to ensure recent records appear first without requiring a composite index
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
        title: "Record Logged", 
        description: "Call has been added to the queue successfully." 
      })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Logging Failed", description: "Internal system error. Try again." })
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending': return <Badge variant="outline" className="text-slate-500 bg-slate-50 border-slate-200 font-bold uppercase text-[10px] tracking-wider"><Clock className="w-3 h-3 mr-1" /> PENDING</Badge>
      case 'In Progress': return <Badge variant="default" className="bg-amber-500 hover:bg-amber-600 font-bold uppercase text-[10px] tracking-wider"><PlayCircle className="w-3 h-3 mr-1" /> IN PROGRESS</Badge>
      case 'Completed': return <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600 font-bold uppercase text-[10px] tracking-wider"><CheckCircle2 className="w-3 h-3 mr-1" /> COMPLETED</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isUserLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-3">
        <Loader2 className="animate-spin text-primary w-10 h-10 mx-auto" />
        <p className="text-slate-500 font-medium">Syncing Agent Terminal...</p>
      </div>
    </div>
  )

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
          <Card className="border-none shadow-xl shadow-slate-200/50 sticky top-24 ring-1 ring-slate-100">
            <CardHeader className="bg-slate-50/50 border-b rounded-t-lg">
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                Log Call Record
              </CardTitle>
              <CardDescription>Enter customer interaction details</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleAddCall} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Customer Name</Label>
                  <Input 
                    placeholder="e.g. Acme Corp / Jane Doe" 
                    className="h-11 bg-slate-50/30"
                    required 
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Agent Identifier</Label>
                  <Input 
                    placeholder={user.email || "Agent ID"} 
                    className="h-11 bg-slate-50/30"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Issue Description</Label>
                  <Textarea 
                    placeholder="Briefly describe the customer's request..." 
                    required 
                    className="min-h-[120px] bg-slate-50/30 resize-none"
                    value={issue}
                    onChange={(e) => setIssue(e.target.value)}
                  />
                </div>
                <Button className="w-full h-12 bg-primary hover:bg-primary/90 transition-all shadow-lg shadow-primary/20" disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  Finalize Record
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-6 h-6 text-slate-400" />
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Personal Records</h2>
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">
              {sortedCalls.length} Total
            </div>
          </div>
          
          <div className="space-y-4">
            {callsLoading ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <Loader2 className="animate-spin text-primary w-10 h-10" />
                <p className="text-sm text-slate-400 font-medium">Fetching History...</p>
              </div>
            ) : sortedCalls.map((call) => (
              <Card key={call.id} className="border-none shadow-md hover:shadow-xl transition-all duration-300 group ring-1 ring-slate-100 overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    <div className={`w-1.5 ${call.status === 'Completed' ? 'bg-emerald-500' : call.status === 'In Progress' ? 'bg-amber-500' : 'bg-slate-300'}`} />
                    <div className="flex-1 p-6 flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center flex-wrap gap-2">
                          <span className="font-bold text-lg text-slate-900">{call.customerName}</span>
                          {getStatusBadge(call.status)}
                        </div>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-2xl">{call.issue}</p>
                        <div className="flex items-center gap-4 pt-3">
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-widest border-r pr-4">
                            Agent: {call.assignedAgent}
                          </div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            {call.createdAt?.toDate?.().toLocaleString() || 'Syncing...'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {!callsLoading && sortedCalls.length === 0 && (
              <div className="text-center py-32 bg-white rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center space-y-3">
                <div className="p-4 bg-slate-50 rounded-full">
                  <AlertCircle className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-400 font-medium italic">Your record queue is currently empty.</p>
                <Button variant="ghost" className="text-primary font-bold text-xs" onClick={() => (document.querySelector('input') as HTMLElement)?.focus()}>
                  Log your first call now
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}