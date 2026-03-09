"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
  Plus
} from "lucide-react"
import { activityLogger } from "@/services/activityLogger"
import { useToast } from "@/hooks/use-toast"

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
}

const MOCK_DOCS: Document[] = [
  { id: '1', name: 'Q4_Employee_Payroll.docx', type: 'DOCX', size: '1.2 MB', uploadedAt: '2023-11-20' },
  { id: '2', name: 'Identity_Verification_Rahul.pdf', type: 'PDF', size: '4.5 MB', uploadedAt: '2023-11-18' },
  { id: '3', name: 'Bank_Statement_Nov.txt', type: 'TXT', size: '42 KB', uploadedAt: '2023-11-25' },
];

export default function UserDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const [docs, setDocs] = useState<Document[]>(MOCK_DOCS)

  useEffect(() => {
    const role = localStorage.getItem('user_role')
    if (role !== 'user') {
      router.push('/')
      return
    }
  }, [router])

  const handleDelete = (id: string, name: string) => {
    setDocs(docs.filter(d => d.id !== id))
    activityLogger.log('Document deleted', 'user@isx.com', name, 'Warning')
    toast({
      title: "Document Deleted",
      description: `${name} has been permanently removed.`,
    })
  }

  const handleUpload = () => {
    toast({
      title: "Simulation Only",
      description: "Upload functionality is simulated for this demo.",
    })
  }

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
            />
          </div>
          <Button variant="ghost" onClick={() => {
            localStorage.removeItem('user_role')
            router.push('/')
          }}>
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </nav>

      <main className="p-8 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-secondary">Document Vault</h1>
            <p className="text-muted-foreground">All files are protected by IntelliSecureX decoy engine</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" onClick={handleUpload}>
            <Plus className="w-4 h-4 mr-2" /> Secure Upload
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {docs.map((doc) => (
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
                <CardTitle className="text-lg font-semibold truncate mt-4">{doc.name}</CardTitle>
                <CardDescription className="flex items-center text-xs uppercase tracking-wider font-medium text-slate-400">
                  <FolderLock className="w-3 h-3 mr-1" /> Protected {doc.type}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center text-sm text-slate-500 mb-6">
                  <span>{doc.size}</span>
                  <span>{doc.uploadedAt}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="default" 
                    className="w-full bg-secondary hover:bg-secondary/90"
                    onClick={() => {
                      activityLogger.log('Document accessed', 'user@isx.com', doc.name);
                      router.push(`/viewer/${doc.id}?name=${encodeURIComponent(doc.name)}`)
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" /> View
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full text-destructive hover:bg-destructive/5 hover:text-destructive border-slate-200"
                    onClick={() => handleDelete(doc.id, doc.name)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Empty State */}
          {docs.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-lg font-medium text-slate-600">Vault is empty</h3>
              <p className="text-muted-foreground max-w-xs mx-auto">Upload sensitive documents to protect them with rule-based deception.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}