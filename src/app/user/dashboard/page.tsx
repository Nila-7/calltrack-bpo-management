"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  FileText, 
  Upload, 
  Trash2, 
  Eye, 
  Shield, 
  LogOut, 
  FolderLock,
  Search,
  MoreVertical,
  Plus,
  Loader2
} from "lucide-react"
import { useAuth, useFirestore, useUser, useCollection } from "@/firebase"
import { signOut } from "firebase/auth"
import { collection, addDoc, serverTimestamp, doc, deleteDoc } from "firebase/firestore"
import { logActivity } from "@/services/activityLogger"
import { useToast } from "@/hooks/use-toast"
import { detectEntitiesAction } from "@/ai/flows/detect-entities-flow"

export default function UserDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const auth = useAuth()
  const db = useFirestore()
  const { user } = useUser()

  const [uploading, setUploading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const docsQuery = useMemo(() => {
    if (!user) return null
    return collection(db, 'users', user.uid, 'documents')
  }, [db, user])
  
  const { data: docs, isLoading: docsLoading } = useCollection(docsQuery)

  const handleLogout = async () => {
    await signOut(auth)
    router.push('/')
  }

  const handleDelete = async (docId: string, fileName: string) => {
    if (!user) return
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'documents', docId))
      await logActivity(db, {
        userId: user.uid,
        userEmail: user.email || 'Anonymous',
        action: 'Document deleted',
        fileName,
        status: 'Warning'
      })
      toast({
        title: "Document Deleted",
        description: `${fileName} has been removed.`,
      })
    } catch (error) {
      console.error("Delete failed", error)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setUploading(true)
    try {
      // For this prototype, we read the text directly if it's a TXT file
      // In a real app, you'd use a server-side parser for PDF/DOCX
      const text = await file.text()
      
      // 1. Send to Gemini for entity detection
      const { entities } = await detectEntitiesAction({ text })

      // 2. Store document metadata and content in Firestore
      const docRef = await addDoc(collection(db, 'users', user.uid, 'documents'), {
        userId: user.uid,
        fileName: file.name,
        fileType: file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN',
        content: text,
        uploadDate: new Date().toISOString(),
        securityStatus: 'Processed',
        hasDecoy: true,
        createdAt: serverTimestamp()
      })

      // 3. Store entity detections
      for (const entity of entities) {
        await addDoc(collection(db, 'users', user.uid, 'documents', docRef.id, 'entity_detections'), {
          ...entity,
          createdAt: serverTimestamp()
        })
      }

      await logActivity(db, {
        userId: user.uid,
        userEmail: user.email || 'Anonymous',
        action: 'Document uploaded',
        documentId: docRef.id,
        fileName: file.name,
        status: 'Success'
      })

      toast({
        title: "Secure Upload Complete",
        description: "Gemini has identified and processed sensitive entities.",
      })
    } catch (error) {
      console.error("Upload failed", error)
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: "Error processing document. Please try again.",
      })
    } finally {
      setUploading(false)
    }
  }

  const filteredDocs = docs?.filter(doc => 
    doc.fileName.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  return (
    <div className="min-h-screen bg-[#F2F4F7]">
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-1.5 bg-primary rounded-lg">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl text-secondary">IntelliSecureX</span>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-primary outline-none w-64"
              placeholder="Search secure documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </nav>

      <main className="p-8 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-secondary">Document Vault</h1>
            <p className="text-muted-foreground">All files are protected by Gemini-powered deception engine</p>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".txt,.pdf,.docx"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <Button 
              className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" 
              asChild
              disabled={uploading}
            >
              <label htmlFor="file-upload" className="cursor-pointer flex items-center">
                {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                {uploading ? "Analyzing..." : "Secure Upload"}
              </label>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocs.map((doc) => (
            <Card key={doc.id} className="group hover:ring-2 hover:ring-primary/20 transition-all border-none shadow-sm overflow-hidden bg-white">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-primary/5 transition-colors">
                    <FileText className="w-8 h-8 text-primary/70" />
                  </div>
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
                <CardTitle className="text-lg font-semibold truncate mt-4">{doc.fileName}</CardTitle>
                <CardDescription className="flex items-center text-xs uppercase tracking-wider font-medium text-slate-400">
                  <FolderLock className="w-3 h-3 mr-1" /> Protected {doc.fileType}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center text-sm text-slate-500 mb-6">
                  <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
                  <Badge variant="outline" className="text-[10px]">{doc.securityStatus}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="default" 
                    className="w-full bg-secondary hover:bg-secondary/90"
                    onClick={() => {
                      logActivity(db, {
                        userId: user?.uid || '',
                        userEmail: user?.email || 'Anonymous',
                        action: 'Document accessed',
                        documentId: doc.id,
                        fileName: doc.fileName,
                        status: 'Success'
                      })
                      router.push(`/viewer/${doc.id}`)
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" /> Open
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full text-destructive hover:bg-destructive/5 hover:text-destructive border-slate-200"
                    onClick={() => handleDelete(doc.id, doc.fileName)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredDocs.length === 0 && !docsLoading && (
            <div className="col-span-full py-20 text-center">
              <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-lg font-medium text-slate-600">Vault is empty</h3>
              <p className="text-muted-foreground max-w-xs mx-auto">Upload sensitive documents to protect them with dynamic deception.</p>
            </div>
          )}

          {docsLoading && (
            <div className="col-span-full flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
