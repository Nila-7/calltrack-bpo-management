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
  PhoneCall, 
  Plus, 
  LogOut, 
  Clock, 
  CheckCircle2, 
  PlayCircle,
  Loader2,
  ListTodo,
  User as UserIcon
} from "lucide-react"
import { useAuth, useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { signOut } from "firebase/auth"
import { collection, addDoc, serverTimestamp, query, where } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

export default function UserDashboard() {
  const router = useRouter()
  const auth = useAuth()
  const db = useFirestore()
  const { user, isUserLoading } = useUser()
  const { toast } = useToast()

  const [customerName, setCustomerName] = useState("")
  const [issue, setIssue] = useState("")
  const [agent, setAgent] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/')
    }
  }, [user, isUserLoading, router])

  const callsQuery = useMemoFirebase(() => {
    if (!user || isUserLoading) return null
    // Simplified query to avoid composite index requirements during permission debugging
    return query(
      collection(db, 'calls'),
      where('userId', '==', user.uid)
    )
  }, [db, user, isUserLoading])

  const { data: calls, isLoading: callsLoading } = useCollection(callsQuery)

  const handleAddCall = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSubmitting(true)
    try {
      await addDoc(collection(db, 'calls'), {
        customerName,
        issue,
        assignedAgent: agent || user.email,
        status: 'Waiting',
        userId: user.uid,
        createdAt: serverTimestamp()
      })
      setCustomerName("")
      setIssue("")
      setAgent("")
      toast({ title: "Call Recorded", description: "The call record has been added to the queue." })
    } catch (err: any) {
      // Errors handled globally
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Waiting': return <Badge variant="outline" className="text-slate-500 bg-slate-50 border-slate-200 font-bold"><Clock className="w-3 h-3 mr-1" /> WAITING</Badge>
      case 'In Progress': return <Badge variant="default" className="bg-amber-500 hover:bg-amber-600 font-bold"><PlayCircle className="w-3 h-3 mr-1" /> IN PROGRESS</Badge>
      case 'Completed': return <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600 font-bold"><CheckCircle2 className="w-3 h-3 mr-1" /> COMPLETED</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isUserLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-3">
        <Loader2 className="animate-spin text-primary w-10 h-10 mx-auto" />
        <p className="text-slate-500 font-medium">Loading Workspace...</p>
      </div>
    </div>
  )

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-body">
      <nav className="bg-white border-b px-8 py-4 flex justify-between items-center shadow-sm sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <PhoneCall className="text-primary w-6 h-6" />
          <span className="font-bold text-xl text-slate-900 tracking-tight">BPO Agent Portal</span>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="secondary" className="px-3 py-1 font-mono text-xs flex items-center">
            <UserIcon className="w-3 h-3 mr-2" />
            {user?.email}
          </Badge>
          <Button variant="ghost" size="sm" onClick={() => signOut(auth)}>
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </nav>

      <main className="p-8 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card className="border-none shadow-sm sticky top-24">
            <CardHeader>
              <CardTitle className="text-lg">Log New Call</CardTitle>
              <CardDescription>Enter details of the incoming customer request</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddCall} className="space-y-4">
                <div className="space-y-2">
                  <Label>Customer Name</Label>
                  <Input 
                    placeholder="Jane Doe" 
                    required 
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Assigned Agent (Optional)</Label>
                  <Input 
                    placeholder="Agent Name" 
                    value={agent}
                    onChange={(e) => setAgent(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Issue Details</Label>
                  <Textarea 
                    placeholder="Describe the problem..." 
                    required 
                    className="min-h-[100px]"
                    value={issue}
                    onChange={(e) => setIssue(e.target.value)}
                  />
                </div>
                <Button className="w-full bg-primary hover:bg-primary/90 transition-colors" disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  Submit Record
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center space-x-2 mb-2">
            <ListTodo className="w-5 h-5 text-slate-400" />
            <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Recent Records</h2>
          </div>
          
          <div className="space-y-3">
            {callsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>
            ) : calls?.map((call) => (
              <Card key={call.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5 flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900">{call.customerName}</span>
                      {getStatusBadge(call.status)}
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-2">{call.issue}</p>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pt-2">
                      Agent: {call.assignedAgent} | {call.createdAt?.toDate?.().toLocaleString() || 'Syncing...'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {!callsLoading && calls?.length === 0 && (
              <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-slate-100">
                <p className="text-slate-400">No call records found. Start by logging a new call.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}