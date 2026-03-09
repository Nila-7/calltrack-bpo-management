"use client"

import { useState, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  ChevronLeft, 
  ShieldCheck, 
  ShieldAlert, 
  Eye, 
  Info, 
  Database, 
  AlertTriangle,
  FileText,
  Lock,
  Unlock,
  Loader2,
  Table as TableIcon
} from "lucide-react"
import { useAuth, useFirestore, useUser, useDoc, useCollection, useMemoFirebase } from "@/firebase"
import { logActivity } from "@/services/activityLogger"
import { useToast } from "@/hooks/use-toast"
import { collection, doc } from "firebase/firestore"
import { generateDecoyDocument } from "@/lib/decoyGenerator"

export default function DocumentViewer() {
  const router = useRouter()
  const { id } = useParams() as { id: string }
  const { toast } = useToast()
  const db = useFirestore()
  const { user } = useUser()
  
  const [viewMode, setViewMode] = useState<'original' | 'decoy'>('original')
  const [showClassification, setShowClassification] = useState(false)
  const [suspiciousMode, setSuspiciousMode] = useState(false)

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

  const handleToggleDecoy = (mode: 'original' | 'decoy') => {
    setViewMode(mode)
    if (mode === 'decoy') {
      logActivity(db, {
        userId: user?.uid || '',
        userEmail: user?.email || 'Anonymous',
        action: 'Decoy activated',
        documentId: id,
        fileName: document?.fileName,
        status: 'Warning'
      })
    }
  }

  const simulateBreach = async () => {
    setSuspiciousMode(true)
    setViewMode('decoy')
    await logActivity(db, {
      userId: user?.uid || '',
      userEmail: user?.email || 'Anonymous',
      action: 'Unauthorized access attempt',
      documentId: id,
      fileName: document?.fileName,
      status: 'Alert',
      metadata: { suspicious: true }
    })
    toast({
      variant: "destructive",
      title: "Suspicious Access Detected",
      description: "Security Protocol: Automatic Decoy Serving Activated.",
    })
  }

  if (docLoading) {
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
          <h2 className="text-xl font-bold">Document Not Found</h2>
          <Button onClick={() => router.push('/user/dashboard')} className="mt-4">Return to Vault</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="h-16 border-b bg-white flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div className="h-6 w-px bg-slate-200" />
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-secondary">{document.fileName}</h2>
            <Badge variant="outline" className="text-[10px] uppercase font-bold text-slate-400">Structure-Protected</Badge>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {suspiciousMode && (
            <div className="bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded-full text-sm font-medium animate-pulse flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" /> Suspicious Session
            </div>
          )}
          <Button 
            variant={suspiciousMode ? "destructive" : "outline"} 
            size="sm" 
            onClick={simulateBreach}
            disabled={suspiciousMode}
          >
            <ShieldAlert className="w-4 h-4 mr-2" /> Simulate Breach
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Document Content */}
        <div className="flex-1 p-8 overflow-auto flex justify-center bg-slate-200/50">
          <Card className="w-full max-w-3xl h-fit min-h-full border-none shadow-xl bg-white rounded-none md:rounded-lg">
            <CardContent className="p-12 font-mono text-sm leading-relaxed whitespace-pre-wrap select-text selection:bg-primary/20">
              <div className="mb-8 flex justify-between border-b pb-4">
                <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">Document Feed</div>
                {viewMode === 'decoy' ? (
                  <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200">
                    <ShieldCheck className="w-3 h-3 mr-1" /> Deception Mode
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-slate-400">Original View</Badge>
                )}
              </div>
              {viewMode === 'original' ? document.content : decoyContent}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel: Security Controls */}
        <aside className="w-[450px] bg-white border-l p-6 overflow-auto space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Security Controls</h3>
            
            <Card className={`border-2 transition-all cursor-pointer ${viewMode === 'original' ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200'}`}
                  onClick={() => handleToggleDecoy('original')}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${viewMode === 'original' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <Unlock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold">Original Document</div>
                    <div className="text-xs text-slate-500">View unmodified data</div>
                  </div>
                </div>
                {viewMode === 'original' && <div className="w-2 h-2 rounded-full bg-primary" />}
              </CardContent>
            </Card>

            <Card className={`border-2 transition-all cursor-pointer ${viewMode === 'decoy' ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200'}`}
                  onClick={() => handleToggleDecoy('decoy')}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${viewMode === 'decoy' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold">Decoy Document</div>
                    <div className="text-xs text-slate-500">Shield sensitive data</div>
                  </div>
                </div>
                {viewMode === 'decoy' && <div className="w-2 h-2 rounded-full bg-primary" />}
              </CardContent>
            </Card>

            <Button 
              className="w-full h-12" 
              variant={showClassification ? "secondary" : "outline"}
              onClick={() => setShowClassification(!showClassification)}
            >
              <TableIcon className="w-4 h-4 mr-2" /> 
              {showClassification ? "Hide Classification" : "Show Entity Classification"}
            </Button>
          </div>

          <div className="h-px bg-slate-100" />

          {showClassification && (
            <div className="space-y-4 animate-in slide-in-from-right duration-300">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center">
                <Info className="w-4 h-4 mr-2 text-primary" /> Classification Analysis
              </h3>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="text-[10px] uppercase font-bold">Entity</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold">Original</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold">Decoy</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detections?.map((entity, i) => (
                      <TableRow key={i} className="text-xs">
                        <TableCell className="font-medium text-primary py-2">{entity.key}</TableCell>
                        <TableCell className="text-slate-500 py-2 truncate max-w-[100px]">{entity.originalValue}</TableCell>
                        <TableCell className="text-emerald-600 font-bold py-2 truncate max-w-[100px]">{entity.decoyValue}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {!showClassification && (
            <div className="bg-slate-50 p-6 rounded-xl border border-dashed border-slate-200 text-center">
              <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500 leading-relaxed">
                Detection engine has classified {detections?.length || 0} sensitive entities. Click classification for details.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
