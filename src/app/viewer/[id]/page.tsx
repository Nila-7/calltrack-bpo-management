"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  Unlock
} from "lucide-react"
import { detectEntities, DetectedEntity } from "@/lib/entityDetector"
import { generateDecoyDocument, generateDecoyValue } from "@/lib/decoyGenerator"
import { activityLogger } from "@/services/activityLogger"
import { useToast } from "@/hooks/use-toast"

const SAMPLE_CONTENT = `
INTELSECUREX SECURE DOCUMENT SYSTEM
-----------------------------------
Subject: Internal Audit & Personnel Verification
Date: 25/03/2023
Department: Level-3 Infrastructure Systems

This report contains highly sensitive PII for Rahul Srinivasan, a senior architect at Level-3.
Employee ID: EMP-28417
Current Address: Mumbai, India

IDENTITY VERIFICATION:
PAN Number: BQTPS9172M
Aadhaar Number: 4512 9087 3342
Email: rahul.srinivasan@isx-systems.com
Phone: +91 9876543210

BANKING DETAILS:
Account Holder: Rahul Srinivasan
Bank Name: HDFC Bank
Account Number: 50200087349122
IFSC Code: HDFC0001426

ACCESS CONTROL:
The mentioned person has Level-3 access to core production servers.
Please verify these details before granting expanded credentials.
`;

export default function DocumentViewer() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const [viewMode, setViewMode] = useState<'original' | 'decoy'>('original')
  const [showClassification, setShowClassification] = useState(false)
  const [suspiciousMode, setSuspiciousMode] = useState(false)
  
  const docName = searchParams.get('name') || 'Untitled Document'
  const rawContent = SAMPLE_CONTENT

  const entities = useMemo(() => detectEntities(rawContent), [rawContent])
  const decoyContent = useMemo(() => generateDecoyDocument(rawContent, entities), [rawContent, entities])

  const handleToggleDecoy = () => {
    const nextMode = viewMode === 'original' ? 'decoy' : 'original'
    setViewMode(nextMode)
    if (nextMode === 'decoy') {
      activityLogger.log('Decoy activated', 'user@isx.com', docName, 'Warning')
    }
  }

  const simulateSuspiciousAccess = () => {
    setSuspiciousMode(true)
    setViewMode('decoy')
    activityLogger.log('Unauthorized access attempt', 'Unknown IP', docName, 'Alert')
    toast({
      variant: "destructive",
      title: "Suspicious Access Detected",
      description: "Security Protocol 74: Automatic Decoy Serving Activated.",
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="h-16 border-b bg-white flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div className="h-6 w-px bg-slate-200" />
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-secondary">{docName}</h2>
            <Badge variant="outline" className="text-[10px] uppercase font-bold text-slate-400">Rule-Protected</Badge>
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
            onClick={simulateSuspiciousAccess}
            disabled={suspiciousMode}
          >
            <ShieldAlert className="w-4 h-4 mr-2" /> Simulate Breach
          </Button>
        </div>
      </header>

      {/* Main Viewport */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Content */}
        <div className="flex-1 p-8 overflow-auto flex justify-center bg-slate-200/50">
          <Card className="w-full max-w-3xl h-fit min-h-full border-none shadow-xl bg-white rounded-none md:rounded-lg">
            <CardContent className="p-12 font-mono text-sm leading-relaxed whitespace-pre-wrap select-text selection:bg-primary/20">
              <div className="mb-8 flex justify-between border-b pb-4">
                <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">Document Header</div>
                {viewMode === 'decoy' ? (
                  <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200">
                    <ShieldCheck className="w-3 h-3 mr-1" /> Deception Mode
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-slate-400">Original View</Badge>
                )}
              </div>
              {viewMode === 'original' ? rawContent : decoyContent}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel: Controls */}
        <aside className="w-96 bg-white border-l p-6 overflow-auto space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Security Controls</h3>
            
            <Card className={`border-2 transition-all cursor-pointer ${viewMode === 'original' ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200'}`}
                  onClick={() => setViewMode('original')}>
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
                  onClick={() => setViewMode('decoy')}>
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
              <Database className="w-4 h-4 mr-2" /> 
              {showClassification ? "Hide Classification" : "Show NLP Classification"}
            </Button>
          </div>

          <div className="h-px bg-slate-100" />

          {showClassification && (
            <div className="space-y-4 animate-in slide-in-from-right duration-300">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center">
                <Info className="w-4 h-4 mr-2 text-primary" /> Entity Analysis
              </h3>
              <div className="space-y-3">
                {entities.map((entity, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-primary">{entity.entityType}</span>
                      <span className="text-slate-400">Confidence: {(entity.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-center">
                      <div className="text-slate-500 bg-white p-1.5 rounded border border-slate-200 truncate" title={entity.originalValue}>
                        {entity.originalValue}
                      </div>
                      <span className="text-slate-300">→</span>
                      <div className="text-emerald-600 bg-white p-1.5 rounded border border-emerald-100 font-bold truncate">
                        {generateDecoyValue(entity)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!showClassification && (
            <div className="bg-slate-50 p-6 rounded-xl border border-dashed border-slate-200 text-center">
              <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500 leading-relaxed">
                Our rule-based NLP engine has detected {entities.length} sensitive entities. Click classification for details.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}