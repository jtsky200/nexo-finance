import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import MobileLayout from '@/components/MobileLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { usePeople } from '@/lib/firebaseHooks';
import { 
  FileText, Search, Upload, FolderOpen, 
  User, Clock, Eye, Trash2, RefreshCw,
  ScanLine, FileImage, File, AlertCircle, Check, X, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface Document {
  id: string;
  personId: string;
  personName: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  folder: string;
  status: string;
  analyzedData?: any;
  createdAt: string | null;
  updatedAt: string | null;
}

interface AnalysisResult {
  type: string;
  confidence: number;
  extractedData: {
    amount?: number;
    currency?: string;
    dueDate?: string;
    iban?: string;
    description?: string;
    date?: string;
    time?: string;
    title?: string;
  };
  rawText?: string;
}

export default function MobileDocuments() {
  const { t } = useTranslation();
  const { data: people = [], isLoading: peopleLoading } = usePeople();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPerson, setSelectedPerson] = useState<string>('all');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [tempDocumentData, setTempDocumentData] = useState<string | null>(null);
  const [assignPersonId, setAssignPersonId] = useState<string>('');
  const [assignFolder, setAssignFolder] = useState<string>('Sonstiges');
  const [isSaving, setIsSaving] = useState(false);
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const folders = [
    { value: 'all', label: 'Alle Ordner' },
    { value: 'Rechnungen', label: 'Rechnungen' },
    { value: 'Termine', label: 'Termine' },
    { value: 'Verträge', label: 'Verträge' },
    { value: 'Sonstiges', label: 'Sonstiges' },
  ];

  const documentFolders = [
    { value: 'Rechnungen', label: 'Rechnungen' },
    { value: 'Termine', label: 'Termine' },
    { value: 'Verträge', label: 'Verträge' },
    { value: 'Sonstiges', label: 'Sonstiges' },
  ];

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const getDocumentsFunc = httpsCallable(functions, 'getDocuments');
      const result = await getDocumentsFunc({});
      const data = result.data as { documents: any[] };
      
      const mappedDocs = (data.documents || []).map((doc: any) => ({
        ...doc,
        createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
        updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
      }));
      
      setDocuments(mappedDocs);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching documents:', error);
      }
      toast.error('Fehler beim Laden der Dokumente');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const filteredDocuments = useMemo(() => {
    let result = [...documents];
    
    if (selectedPerson !== 'all') {
      result = result.filter(d => d.personId === selectedPerson);
    }
    
    if (selectedFolder !== 'all') {
      result = result.filter(d => d.folder === selectedFolder);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(d => 
        d.fileName.toLowerCase().includes(query) ||
        d.personName.toLowerCase().includes(query) ||
        d.folder.toLowerCase().includes(query)
      );
    }
    
    return result.sort((a, b) => {
      const dateA = a.updatedAt || a.createdAt || '';
      const dateB = b.updatedAt || b.createdAt || '';
      return dateB.localeCompare(dateA);
    });
  }, [documents, selectedPerson, selectedFolder, searchQuery]);

  const handleFileSelect = async (file: File) => {
    if (!file) return;
    
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Datei ist zu groß. Maximal 10MB erlaubt.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadedFile(file);
      
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          setTempDocumentData(base64);
          
          const analyzeDocumentFunc = httpsCallable(functions, 'analyzeDocument');
          const result = await analyzeDocumentFunc({
            fileData: base64,
            fileName: file.name,
            fileType: file.type,
          });
          
          const analysis = result.data as AnalysisResult;
          setAnalysisResult(analysis);
          setShowAssignDialog(true);
          setUploadProgress(100);
        } catch (error: any) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Error analyzing document:', error);
          }
          toast.error('Fehler bei der Analyse: ' + (error.message || 'Unbekannter Fehler'));
          setIsUploading(false);
        }
      };
      
      reader.onerror = () => {
        toast.error('Fehler beim Lesen der Datei');
        setIsUploading(false);
      };
      
      reader.readAsDataURL(file);
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);
      
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error selecting file:', error);
      }
      toast.error('Fehler: ' + (error.message || 'Unbekannter Fehler'));
      setIsUploading(false);
    }
  };

  const handleSaveDocument = async () => {
    if (!tempDocumentData || !assignPersonId || !uploadedFile) {
      toast.error('Bitte füllen Sie alle Felder aus');
      return;
    }

    try {
      setIsSaving(true);
      
      const saveDocumentFunc = httpsCallable(functions, 'saveDocument');
      await saveDocumentFunc({
        fileData: tempDocumentData,
        fileName: uploadedFile.name,
        fileType: uploadedFile.type,
        personId: assignPersonId,
        folder: assignFolder,
        analysisResult: analysisResult,
      });
      
      toast.success('Dokument gespeichert');
      setShowAssignDialog(false);
      setUploadedFile(null);
      setTempDocumentData(null);
      setAnalysisResult(null);
      setAssignPersonId('');
      setAssignFolder('Sonstiges');
      setIsUploading(false);
      setUploadProgress(0);
      await fetchDocuments();
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error saving document:', error);
      }
      toast.error('Fehler beim Speichern: ' + (error.message || 'Unbekannter Fehler'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    try {
      const deleteDocumentFunc = httpsCallable(functions, 'deleteDocument');
      await deleteDocumentFunc({ documentId: docId });
      toast.success('Dokument gelöscht');
      await fetchDocuments();
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error deleting document:', error);
      }
      toast.error('Fehler: ' + (error.message || 'Unbekannter Fehler'));
    }
  };

  const handlePreview = (doc: Document) => {
    setPreviewUrl(doc.fileUrl);
    setShowPreview(true);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      return format(new Date(dateStr), 'dd.MM.yyyy', { locale: de });
    } catch {
      return 'N/A';
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <FileImage className="w-5 h-5" />;
    if (fileType.includes('pdf')) return <FileText className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  return (
    <MobileLayout title="Dokumente" showSidebar={true}>
      {/* Filters */}
      <div className="mobile-card mb-4">
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Suche</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 min-h-[44px]"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Person</Label>
              <Select value={selectedPerson} onValueChange={setSelectedPerson}>
                <SelectTrigger className="h-10 min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  {people.map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      {person.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Ordner</Label>
              <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                <SelectTrigger className="h-10 min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {folders.map((folder) => (
                    <SelectItem key={folder.value} value={folder.value}>
                      {folder.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Button */}
      <Button
        onClick={() => fileInputRef.current?.click()}
        className="w-full mb-4 h-12 min-h-[44px]"
        disabled={isUploading}
      >
        {isUploading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Lädt...
          </>
        ) : (
          <>
            <Upload className="w-5 h-5 mr-2" />
            Dokument hochladen
          </>
        )}
      </Button>

      {isUploading && (
        <div className="mobile-card mb-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Upload Fortschritt</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*,.pdf,.doc,.docx"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
          e.target.value = '';
        }}
      />

      {/* Documents List */}
      {loading || peopleLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="mobile-card">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="w-5 h-5 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="mobile-card text-center py-8">
          <p className="text-muted-foreground">Keine Dokumente gefunden</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDocuments.map((doc) => (
            <Card key={doc.id} className="mobile-card">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {getFileIcon(doc.fileType)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm mb-1 truncate">{doc.fileName}</h3>
                    
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3" />
                        <span>{doc.personName}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <FolderOpen className="w-3 h-3" />
                        <span>{doc.folder}</span>
                      </div>
                      
                      {doc.updatedAt && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(doc.updatedAt)}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreview(doc)}
                        className="h-8 min-h-[44px] flex-1"
                        aria-label={`Dokument ${doc.fileName} ansehen`}
                      >
                        <Eye className="w-4 h-4 mr-1" aria-hidden="true" />
                        Ansehen
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="h-8 min-h-[44px] text-red-500"
                        aria-label={`Dokument ${doc.fileName} löschen`}
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Assign Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="!fixed !top-[50%] !left-[50%] !right-auto !bottom-auto !translate-x-[-50%] !translate-y-[-50%] !w-[85vw] !max-w-sm !max-h-fit !rounded-3xl !m-0 !overflow-visible !shadow-2xl">
          <DialogHeader className="px-5 pt-5 pb-3">
            <DialogTitle className="text-lg font-semibold">Dokument zuordnen</DialogTitle>
            <DialogDescription>
              Wählen Sie eine Person und einen Ordner für dieses Dokument
            </DialogDescription>
          </DialogHeader>
          
          <div className="px-5 pb-2">
            {analysisResult && (
              <div className="space-y-3 mb-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs font-semibold mb-2">Analyse-Ergebnis</p>
                  {analysisResult.extractedData.amount && (
                    <p className="text-sm">
                      Betrag: CHF {(analysisResult.extractedData.amount / 100).toFixed(2)}
                    </p>
                  )}
                  {analysisResult.extractedData.dueDate && (
                    <p className="text-sm">
                      Fälligkeitsdatum: {formatDate(analysisResult.extractedData.dueDate)}
                    </p>
                  )}
                  {analysisResult.extractedData.description && (
                    <p className="text-sm">
                      Beschreibung: {analysisResult.extractedData.description}
                    </p>
                  )}
                </div>
              </div>
            )}
            
            <div className="space-y-3">
            <div>
              <Label>Person *</Label>
              <Select value={assignPersonId} onValueChange={setAssignPersonId}>
                <SelectTrigger className="h-10 min-h-[44px] mt-1">
                  <SelectValue placeholder="Person auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {people.map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      {person.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Ordner *</Label>
              <Select value={assignFolder} onValueChange={setAssignFolder}>
                <SelectTrigger className="h-10 min-h-[44px] mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {documentFolders.map((folder) => (
                    <SelectItem key={folder.value} value={folder.value}>
                      {folder.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          </div>
          
          <DialogFooter className="px-5 pb-3 pt-2 gap-2.5">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAssignDialog(false);
                setIsUploading(false);
                setUploadProgress(0);
              }}
              className="h-10 min-h-[44px]"
            >
              Abbrechen
            </Button>
            <Button 
              onClick={handleSaveDocument} 
              disabled={isSaving || !assignPersonId}
              className="h-10 min-h-[44px]"
            >
              {isSaving ? 'Speichert...' : 'Speichern'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="!fixed !top-[50%] !left-[50%] !right-auto !bottom-auto !translate-x-[-50%] !translate-y-[-50%] !w-[85vw] !max-w-sm !max-h-fit !rounded-3xl !m-0 !overflow-visible !shadow-2xl">
          <DialogHeader className="px-5 pt-5 pb-3">
            <DialogTitle className="text-lg font-semibold">Dokument Vorschau</DialogTitle>
          </DialogHeader>
          
          {previewUrl && (
            <div className="w-full">
              {previewUrl.includes('image') ? (
                <img src={previewUrl} alt="Preview" className="w-full h-auto rounded-lg" />
              ) : (
                <iframe
                  src={previewUrl}
                  className="w-full h-[60vh] rounded-lg"
                  title="Document Preview"
                />
              )}
            </div>
          )}
          
          <DialogFooter className="px-5 pb-3 pt-2">
            <Button variant="outline" onClick={() => setShowPreview(false)} className="h-11 min-h-[44px] w-full rounded-xl text-sm font-medium">
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
}

