"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  ChevronLeft, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle,
  FileText,
  Lock,
  Unlock,
  Loader2,
  Activity
} from "lucide-react"
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase } from "@/firebase"
import { logActivity } from "@/services/activityLogger"
import { useToast } from "@/hooks/use-toast"
import { collection, doc } from "firebase/firestore"
import { generateDecoyDocument } from "@/lib/decoyGenerator"

export default function DocumentViewer() {
  const router = useRouter()
  const { id } = useParams() as { id: string }
  const { toast } = useToast()
  const db = useFirestore()
  const { user, isUserLoading } = useUser()
  
  const [viewMode, setViewMode] = useState<'original' | 'decoy'>('original')
  const [suspiciousMode, setSuspiciousMode] = useState(false)

  const profileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);
  const { data: profile } = useDoc(profileRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/')
    }
  }, [user, isUserLoading, router])

  const docRef = useMemoFirebase(() => {
    if (!user || !id) return null
    return doc(db, 'users', user.uid, 'documents', id)
  }, [db, user, id])

  const { data: document, isLoading: docLoading } = useDoc(docRef)

  const detectionsQuery = useMemoFirebase(() => {
    if (!user || !id) return null
    return collection(db, 'users', user.uid, 'documents', id, 'entity_detections')
  }, [db, user, id])

  const { data: detections } = useCollection(detectionsQuery)

  const decoyContent = useMemo(() => {
    if (!document?.content || !detections) return ""
    return generateDecoyDocument(document.content, detections)
  }, [document, detections])

  const simulateBreach = async () => {
    if (!user || !profile || !document) return
    
    setSuspiciousMode(true)
    setViewMode('decoy')

    await logActivity(db, {
      userId: user.uid,
      username: profile.username || 'N/A',
      email: user.email || 'N/A',
      role: profile.role.toLowerCase() as 'admin' | 'user',
      action: 'Simulated Breach Triggered',
      documentId: id,
      documentName: document.fileName,
      status: 'Alert',
      metadata: { trigger: 'Simulate Breach Button' }
    })

    toast({
      variant: "destructive",
      title: "⚠ DECEPTION SHIELD ACTIVATED",
      description: "Suspicious access profile detected. Decoy document served.",
    })
  }

  if (docLoading || isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  if (!document) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold">Document Unavailable</h2>
          <Button onClick={() => router.push('/user/dashboard')} className="mt-4">Return to Workspace</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="h-16 border-b bg-white flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Exit Viewer
          </Button>
          <div className="h-6 w-px bg-slate-200" />
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-secondary">{document.fileName}</h2>
            <Badge variant="outline" className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Active Protection</Badge>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Button 
            variant={suspiciousMode ? "destructive" : "outline"} 
            size="sm" 
            onClick={simulateBreach}
            disabled={suspiciousMode}
            className="font-black uppercase text-[10px] tracking-widest h-10 px-6"
          >
            <ShieldAlert className="w-4 h-4 mr-2" /> Simulate Breach
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Document Content */}
        <div className="flex-1 p-8 overflow-auto flex flex-col items-center bg-slate-100">
          <div className="w-full max-w-3xl mb-4 flex justify-center">
            {viewMode === 'decoy' && (
              <Badge className="bg-red-600 text-white border-none px-6 py-2 font-black text-xs uppercase tracking-[0.2em] animate-pulse shadow-lg">
                <AlertTriangle className="w-4 h-4 mr-2" /> Deception Mode Activated
              </Badge>
            )}
          </div>
          
          <Card className="w-full max-w-3xl border-none shadow-2xl bg-white rounded-lg relative overflow-hidden">
            {viewMode === 'decoy' && (
              <div className="absolute top-0 left-0 w-full h-1 bg-red-600 animate-pulse" />
            )}
            <CardContent className="p-12 font-mono text-sm leading-relaxed whitespace-pre-wrap select-none">
              <div className="mb-8 flex justify-between border-b border-slate-100 pb-4">
                <div className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold">Identity-Mapped Stream</div>
                {viewMode === 'decoy' ? (
                  <div className="flex items-center text-red-600 font-black text-[10px] uppercase tracking-widest">
                    <Lock className="w-3 h-3 mr-1" /> Decoy Version
                  </div>
                ) : (
                  <div className="flex items-center text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                    <Unlock className="w-3 h-3 mr-1" /> Original Data
                  </div>
                )}
              </div>
              <div className="bg-slate-50/50 p-8 border border-slate-100 rounded-sm">
                {viewMode === 'original' ? document.content : decoyContent}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel: Security Controls */}
        <aside className="w-[350px] bg-white border-l p-6 overflow-auto space-y-6">
          <div className="space-y-4">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Security Protocols</h3>
            
            {/* Original Document Indicator */}
            <Card className={`border-2 transition-all ${viewMode === 'original' ? 'border-primary bg-primary/5' : 'border-slate-50 opacity-40'}`}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${viewMode === 'original' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <Unlock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black uppercase tracking-wider">Original Document</div>
                    <div className="text-[10px] text-slate-500">Unmodified data stream</div>
                  </div>
                </div>
                {viewMode === 'original' && <ShieldCheck className="w-4 h-4 text-primary" />}
              </CardContent>
            </Card>

            {/* Decoy Mode Indicator */}
            <Card className={`border-2 transition-all ${viewMode === 'decoy' ? 'border-red-600 bg-red-50' : 'border-slate-50 opacity-40'}`}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${viewMode === 'decoy' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black uppercase tracking-wider">Decoy Document</div>
                    <div className="text-[10px] text-slate-500">Active deceptive PII served</div>
                  </div>
                </div>
                {viewMode === 'decoy' && <ShieldAlert className="w-4 h-4 text-red-600 animate-pulse" />}
              </CardContent>
            </Card>
          </div>

          <div className="h-px bg-slate-100" />

          <div className="bg-slate-50 p-6 rounded-xl border border-dashed border-slate-200 text-center space-y-3">
            <Activity className="w-8 h-8 text-slate-300 mx-auto" />
            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500">Telemetry Monitoring</h4>
            <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
              The IntelliSecureX engine is monitoring this session for unauthorized patterns. Decoy serving is triggered by behavioral anomalies.
            </p>
          </div>

          {suspiciousMode && (
            <div className="p-4 bg-red-600/10 border border-red-600/20 rounded-lg space-y-2">
              <div className="flex items-center text-red-600 font-black text-[10px] uppercase tracking-tighter">
                <AlertTriangle className="w-3 h-3 mr-2" /> Alert Logged to Admin
              </div>
              <p className="text-[9px] text-red-800/70 font-medium">
                Identity: {profile?.username}<br/>
                Action: Breach Simulation<br/>
                Status: DECEPTION_ACTIVE
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
