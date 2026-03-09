"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  ChevronLeft, 
  ShieldAlert, 
  FileText,
  Lock,
  Loader2
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
      action: 'Decoy Served',
      documentId: id,
      documentName: document.fileName,
      status: 'Alert',
      metadata: { trigger: 'Simulate Breach Button' }
    })

    toast({
      variant: "destructive",
      title: "⚠ SECURITY ALERT",
      description: "Deception triggered. Serving decoy document.",
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
    <div className="min-h-screen bg-slate-200 flex flex-col font-sans">
      {/* Top Bar */}
      <header className="h-16 border-b bg-white flex items-center justify-between px-8 shrink-0 shadow-sm z-30">
        <div className="flex items-center space-x-6">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-slate-600 font-medium">
            <ChevronLeft className="w-4 h-4 mr-1" /> Exit Viewer
          </Button>
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-slate-800 tracking-tight">{document.fileName}</h2>
          </div>
        </div>

        <div>
          <Button 
            variant={suspiciousMode ? "destructive" : "default"} 
            size="sm" 
            onClick={simulateBreach}
            disabled={suspiciousMode}
            className="font-bold uppercase text-[11px] tracking-widest h-10 px-6 shadow-lg shadow-primary/20"
          >
            <ShieldAlert className="w-4 h-4 mr-2" /> {suspiciousMode ? "Breach Logged" : "Simulate Breach"}
          </Button>
        </div>
      </header>

      {/* Main Content: Centered PDF-Style Document */}
      <div className="flex-1 overflow-auto flex flex-col items-center py-12 px-4">
        {/* Label Indicator Above Document */}
        <div className="w-full max-w-[850px] mb-4 flex justify-start">
          <div className={`flex items-center px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
            viewMode === 'original' 
              ? 'bg-slate-100 text-slate-600 border-slate-200' 
              : 'bg-red-50 text-red-600 border-red-200 animate-pulse'
          }`}>
            <Lock className="w-3 h-3 mr-2" />
            {viewMode === 'original' ? 'Original Data' : 'Decoy Data'}
          </div>
        </div>

        {/* PDF Page Container */}
        <Card className="w-full max-w-[850px] min-h-[1100px] border-none shadow-[0_20px_50px_rgba(0,0,0,0.15)] bg-white rounded-none relative">
          <CardContent className="p-20 font-mono text-sm leading-[1.8] whitespace-pre-wrap select-none text-slate-800">
            {/* Document Header Mockup */}
            <div className="mb-12 border-b border-slate-100 pb-8 flex justify-between items-end">
              <div>
                <h1 className="text-xl font-bold text-slate-900 uppercase tracking-tighter">Internal Record</h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Classification: Confidential / PII</p>
              </div>
              <div className="text-[10px] text-right text-slate-400 font-mono uppercase">
                System ID: {id.toString().substring(0, 8).toUpperCase()}<br/>
                Printed: {new Date().toLocaleDateString()}
              </div>
            </div>

            {/* Document Content Area */}
            <div className="relative">
              {viewMode === 'original' ? document.content : decoyContent}
            </div>

            {/* Document Footer Mockup */}
            <div className="mt-24 border-t border-slate-100 pt-8 text-[9px] text-slate-300 font-mono text-center uppercase tracking-widest">
              End of Document - Generated by IntelliSecureX Protection Engine
            </div>
          </CardContent>
        </Card>

        {/* Padding Bottom for scroll */}
        <div className="h-12" />
      </div>
    </div>
  )
}
