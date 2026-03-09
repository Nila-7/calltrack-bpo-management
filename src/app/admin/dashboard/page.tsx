
"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, FileText, ShieldAlert, Zap, Lock, LogOut, ChevronRight, Activity } from "lucide-react"
import { useAuth, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { signOut } from "firebase/auth"
import { collection, query, orderBy, limit } from "firebase/firestore"

export default function AdminDashboard() {
  const router = useRouter()
  const auth = useAuth()
  const db = useFirestore()

  const logsQuery = useMemoFirebase(() => query(collection(db, 'activity_logs'), orderBy('timestamp', 'desc'), limit(50)), [db])
  const { data: logs, isLoading: logsLoading } = useCollection(logsQuery)

  const usersQuery = useMemoFirebase(() => collection(db, 'users'), [db])
  const { data: users } = useCollection(usersQuery)

  const stats = useMemo(() => {
    if (!logs || !users) return []
    
    const uploads = logs.filter(l => l.action === 'Document uploaded').length
    const accesses = logs.filter(l => l.action === 'Document accessed').length
    const decoys = logs.filter(l => l.action === 'Decoy activated').length
    const breaches = logs.filter(l => l.action === 'Unauthorized access attempt').length

    return [
      { title: "Total Users", value: users.length.toString(), icon: Users, color: "text-blue-600" },
      { title: "Documents Processed", value: uploads.toString(), icon: FileText, color: "text-indigo-600" },
      { title: "Safe Accesses", value: accesses.toString(), icon: Zap, color: "text-amber-600" },
      { title: "Decoy Activations", value: decoys.toString(), icon: ShieldAlert, color: "text-red-600" },
      { title: "Security Breaches", value: breaches.toString(), icon: Lock, color: "text-red-800" },
    ]
  }, [logs, users])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Success': return <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">Success</Badge>
      case 'Warning': return <Badge variant="secondary" className="bg-amber-500 hover:bg-amber-600">Warning</Badge>
      case 'Alert': return <Badge variant="destructive" className="animate-pulse">Alert</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleLogout = async () => {
    await signOut(auth)
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="bg-secondary text-white p-4 flex justify-between items-center px-8 border-b border-primary/20">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="text-accent" />
          <span className="font-bold text-xl tracking-tight">IntelliSecureX <span className="text-xs font-normal opacity-70 ml-2">ADMIN CONSOLE</span></span>
        </div>
        <Button variant="ghost" className="text-white hover:bg-white/10" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" /> Logout
        </Button>
      </div>

      <main className="p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-secondary">System Overview</h1>
            <p className="text-muted-foreground">Real-time monitoring of document security events</p>
          </div>
          <div className="text-sm text-muted-foreground flex items-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-ping" />
            Live System Feed
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="border-none shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader className="bg-white border-b flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent System Activity</CardTitle>
              <p className="text-xs text-muted-foreground">Detailed logs of all authenticated interactions</p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Document Context</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs?.map((log) => (
                  <TableRow key={log.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-mono text-xs text-slate-500">{log.userId}</TableCell>
                    <TableCell className="font-medium text-slate-700">{log.action}</TableCell>
                    <TableCell className="text-muted-foreground italic text-sm">{log.fileName || 'N/A'}</TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : 'Just now'}
                    </TableCell>
                    <TableCell className="text-right">
                      {getStatusBadge(log.status)}
                    </TableCell>
                  </TableRow>
                ))}
                {!logsLoading && logs?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No system events recorded yet.
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
