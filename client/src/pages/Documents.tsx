import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { usePeople } from '@/lib/firebaseHooks';
import { 
  FileText, Search, Filter, Upload, FolderOpen, 
  User, Clock, Eye, Trash2, RefreshCw,
  ScanLine, FileImage, File, AlertCircle, Check, X, Loader2, Download
} from 'lucide-react';
import ContextMenu from '@/components/ContextMenu';
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

export default function Documents() {
  const { t } = useTranslation();
  const { data: people = [], isLoading: peopleLoading } = usePeople();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPerson, setSelectedPerson] = useState<string>('all');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  
  // Analysis & Assignment Dialog
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [tempDocumentData, setTempDocumentData] = useState<string | null>(null); // base64 data
  const [assignPersonId, setAssignPersonId] = useState<string>('');
  const [assignFolder, setAssignFolder] = useState<string>(t('documents.folders.other', 'Sonstiges'));
  const [isSaving, setIsSaving] = useState(false);
  
  // Preview state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const folders = [
    { value: 'all', label: t('documents.allFolders', 'Alle Ordner') },
    { value: 'Rechnungen', label: t('documents.folders.invoices', 'Rechnungen') },
    { value: 'Termine', label: t('documents.folders.appointments', 'Termine') },
    { value: 'Verträge', label: t('documents.folders.contracts', 'Verträge') },
    { value: 'Sonstiges', label: t('documents.folders.other', 'Sonstiges') },
  ];

  const documentFolders = [
    { value: 'Rechnungen', label: t('documents.folders.invoices', 'Rechnungen') },
    { value: 'Termine', label: t('documents.folders.appointments', 'Termine') },
    { value: 'Verträge', label: t('documents.folders.contracts', 'Verträge') },
    { value: 'Sonstiges', label: t('documents.folders.other', 'Sonstiges') },
  ];

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const getAllDocuments = httpsCallable(functions, 'getAllDocuments');
      const result = await getAllDocuments({ folder: selectedFolder === 'all' ? null : selectedFolder });
      const data = result.data as { documents: Document[], total: number };
      setDocuments(data.documents || []);
    } catch (error) {
      // Error fetching documents - silently fail
      toast.error(t('documents.errors.loadError', 'Fehler beim Laden der Dokumente'));
    } finally {
      setLoading(false);
    }
  }, [selectedFolder]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Handle file selection
  const handleFileSelect = async (file: File) => {
    if (!file) return;
    
    // Validate file type - now supports Word, Excel, PDF, Images
    const validTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic',
      'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // Word
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // Excel
      'text/csv', 'text/plain'
    ];
    const fileExt = file.name.toLowerCase().split('.').pop();
    const validExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt'];
    
    if (!validTypes.includes(file.type) && !validExts.includes(fileExt || '')) {
      toast.error(t('documents.invalidFileFormat', 'Ungültiges Dateiformat. Unterstützt: JPG, PNG, PDF, DOCX, XLSX, CSV, TXT'));
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('documents.fileTooLarge', 'Datei ist zu gross (max. 10MB)'));
      return;
    }
    
    setUploadedFile(file);
    setIsUploading(true);
    setUploadProgress(10);
    
    // Create preview
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
    
    try {
      // Convert to base64
      setUploadProgress(30);
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // Remove data:xxx;base64, prefix
        };
        reader.readAsDataURL(file);
      });
      
      setTempDocumentData(base64);
      setUploadProgress(50);
      
      // Analyze document - send filename for extension detection
      toast.info(t('documents.analyzing', 'Dokument wird analysiert...'));
      const analyzeDocumentFunc = httpsCallable(functions, 'analyzeDocument');
      const result = await analyzeDocumentFunc({ 
        fileData: base64,
        fileName: file.name,
        fileType: file.type || 'application/octet-stream'
      });
      
      setUploadProgress(90);
      const analysisData = result.data as AnalysisResult;
      setAnalysisResult(analysisData);
      
      // Set default folder based on analysis
      if (analysisData.type === 'rechnung') {
        setAssignFolder(t('documents.folders.invoices', 'Rechnungen'));
      } else if (analysisData.type === 'termin') {
        setAssignFolder(t('documents.folders.appointments', 'Termine'));
      } else if (analysisData.type === 'vertrag') {
        setAssignFolder(t('documents.folders.contracts', 'Verträge'));
      } else {
        setAssignFolder(t('documents.folders.other', 'Sonstiges'));
      }
      
      setUploadProgress(100);
      setShowAssignDialog(true);
      
    } catch (error: any) {
      toast.error(t('documents.errors.analysisError', 'Fehler bei der Analyse') + ': ' + (error.message || t('common.unknownError', 'Unbekannter Fehler')));
      // Still show dialog to assign manually
      setShowAssignDialog(true);
    } finally {
      setIsUploading(false);
    }
  };

  // Save document to selected person
  const handleSaveDocument = async () => {
    if (!assignPersonId) {
      toast.error(t('documents.selectPersonFirst', 'Bitte wähle eine Person aus'));
      return;
    }
    
    if (!tempDocumentData || !uploadedFile) {
      toast.error(t('documents.noFileToSave', 'Keine Datei zum Speichern'));
      return;
    }
    
    setIsSaving(true);
    
    try {
      const uploadDocument = httpsCallable(functions, 'uploadDocument');
      await uploadDocument({
        personId: assignPersonId,
        fileData: tempDocumentData,
        fileName: uploadedFile.name,
        fileType: uploadedFile.type,
        folder: assignFolder,
        analyzedData: analysisResult?.extractedData || null
      });
      
      toast.success(t('documents.saved', 'Dokument gespeichert') + '!');
      setShowAssignDialog(false);
      resetUploadState();
      fetchDocuments();
      
    } catch (error: any) {
      toast.error(t('documents.errors.saveError', 'Fehler beim Speichern') + ': ' + (error.message || t('common.unknownError', 'Unbekannter Fehler')));
    } finally {
      setIsSaving(false);
    }
  };

  const resetUploadState = () => {
    setUploadedFile(null);
    setFilePreview(null);
    setTempDocumentData(null);
    setAnalysisResult(null);
    setAssignPersonId('');
    setAssignFolder(t('documents.folders.other', 'Sonstiges'));
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const [deleteDocumentConfirm, setDeleteDocumentConfirm] = useState<{ personId: string; documentId: string } | null>(null);

  const handleDeleteDocument = (personId: string, documentId: string) => {
    setDeleteDocumentConfirm({ personId, documentId });
  };

  const confirmDeleteDocument = async () => {
    if (!deleteDocumentConfirm) return;
    
    try {
      const deleteDocument = httpsCallable(functions, 'deleteDocument');
      await deleteDocument({ personId: deleteDocumentConfirm.personId, documentId: deleteDocumentConfirm.documentId });
      toast.success(t('documents.deleted', 'Dokument gelöscht'));
      fetchDocuments();
      setDeleteDocumentConfirm(null);
    } catch (error) {
      toast.error(t('documents.errors.deleteError', 'Fehler beim Löschen'));
      setDeleteDocumentConfirm(null);
    }
  };

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    if (selectedPerson !== 'all' && doc.personId !== selectedPerson) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        doc.fileName?.toLowerCase().includes(query) ||
        doc.personName?.toLowerCase().includes(query) ||
        doc.folder?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Statistics
  const stats = {
    total: documents.length,
    rechnungen: documents.filter(d => d.folder === 'Rechnungen').length,
    termine: documents.filter(d => d.folder === 'Termine').length,
    vertraege: documents.filter(d => d.folder === 'Verträge').length,
    sonstiges: documents.filter(d => d.folder === 'Sonstiges').length,
  };

  const getFileIcon = (fileType: string) => {
    if (fileType?.startsWith('image/')) return <FileImage className="w-5 h-5 text-blue-500" />;
    if (fileType?.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const getFolderColor = (folder: string) => {
    switch (folder) {
      case 'Rechnungen': return 'bg-orange-100 text-orange-700';
      case 'Termine': return 'bg-green-100 text-green-700';
      case 'Verträge': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'rechnung': return t('documents.types.rechnung', 'Rechnung');
      case 'termin': return t('documents.types.termin', 'Termin');
      case 'vertrag': return t('documents.types.vertrag', 'Vertrag');
      default: return t('documents.types.other', 'Sonstiges');
    }
  };

  return (
    <Layout title={t('documents.title', 'Dokumente')}>
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ScanLine className="w-7 h-7" />
            {t('documents.title', 'Dokumente')}
          </h1>
          <p className="text-muted-foreground">{t('documents.description', 'Dokumente hochladen, scannen und verwalten')}</p>
        </div>
        <Button variant="outline" onClick={fetchDocuments} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {t('common.update', 'Aktualisieren')}
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">{t('documents.stats.total', 'Gesamt')}</div>
          </CardContent>
        </Card>
        <Card className="bg-orange-50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.rechnungen}</div>
            <div className="text-sm text-muted-foreground">{t('documents.folders.invoices', 'Rechnungen')}</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.termine}</div>
            <div className="text-sm text-muted-foreground">{t('documents.folders.appointments', 'Termine')}</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.vertraege}</div>
            <div className="text-sm text-muted-foreground">{t('documents.folders.contracts', 'Verträge')}</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">{stats.sonstiges}</div>
            <div className="text-sm text-muted-foreground">{t('documents.folders.other', 'Sonstiges')}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Upload Section - Now without required person selection */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Upload className="w-5 h-5" />
              {t('documents.upload', 'Dokument hochladen')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            />
            
            {/* Upload Area - Always visible */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer hover:border-primary/50 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                isUploading ? 'border-primary bg-primary/5' : 'border-gray-200'
              }`}
              onClick={() => !isUploading && fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !isUploading) {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={t('documents.upload', 'Datei hochladen')}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const file = e.dataTransfer.files[0];
                if (file) handleFileSelect(file);
              }}
            >
              {isUploading ? (
                <div className="space-y-3">
                  <Loader2 className="w-10 h-10 mx-auto text-primary animate-spin" />
                  <p className="text-sm font-medium">{t('documents.uploadingAnalyzing', 'Wird hochgeladen & analysiert...')}</p>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              ) : (
                <>
                  <Upload className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                  <p className="font-medium">{t('documents.uploadFile', 'Datei hochladen')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('documents.uploadHint', 'Klicke oder ziehe eine Datei hierher')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {t('documents.personAssignedAfterAnalysis', 'Die Person wird nach der Analyse zugeordnet')}
                  </p>
                </>
              )}
            </div>

            {/* Quick Tips */}
            <div className="bg-slate-50 rounded-lg p-3 text-sm">
              <p className="font-medium mb-2">{t('documents.supportedFormats', 'Unterstützte Formate')}:</p>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline" className="text-xs">JPG</Badge>
                <Badge variant="outline" className="text-xs">PNG</Badge>
                <Badge variant="outline" className="text-xs">PDF</Badge>
                <Badge variant="outline" className="text-xs">DOCX</Badge>
                <Badge variant="outline" className="text-xs">XLSX</Badge>
                <Badge variant="outline" className="text-xs">CSV</Badge>
                <Badge variant="outline" className="text-xs">TXT</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FolderOpen className="w-5 h-5" />
                {t('documents.allDocuments', 'Alle Dokumente')}
              </CardTitle>
              <Badge variant="secondary">{filteredDocuments.length}</Badge>
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-2 pt-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t('common.search', 'Suchen...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={selectedPerson} onValueChange={setSelectedPerson}>
                <SelectTrigger className="w-[180px]">
                  <User className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('documents.allPeople', 'Alle Personen')}</SelectItem>
                  {(people || []).map(person => (
                    <SelectItem key={person.id} value={person.id}>{person.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {folders.map(folder => (
                    <SelectItem key={folder.value} value={folder.value}>{folder.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-muted-foreground">{t('documents.noDocuments', 'Keine Dokumente gefunden')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredDocuments.map(doc => {
                    // Build context menu actions
                    const contextMenuActions = [
                      {
                        id: 'view',
                        label: t('common.view', 'Anzeigen'),
                        icon: <Eye className="w-4 h-4" />,
                        onClick: () => {
                          setPreviewUrl(doc.fileUrl);
                          setShowPreview(true);
                        },
                      },
                      {
                        id: 'download',
                        label: t('common.download', 'Herunterladen'),
                        icon: <Download className="w-4 h-4" />,
                        onClick: () => {
                          window.open(doc.fileUrl, '_blank');
                        },
                      },
                      {
                        id: 'delete',
                        label: t('common.delete', 'Löschen'),
                        icon: <Trash2 className="w-4 h-4" />,
                        onClick: () => handleDeleteDocument(doc.personId, doc.id),
                        variant: 'destructive' as const,
                      },
                    ];

                    return (
                      <ContextMenu key={doc.id} actions={contextMenuActions}>
                        <div
                          className="flex items-center gap-3 p-3 rounded-lg border hover:bg-slate-50 transition-colors group"
                        >
                      {/* File Icon */}
                      <div className="flex-shrink-0">
                        {getFileIcon(doc.fileType)}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{doc.fileName}</span>
                          <Badge className={`text-xs ${getFolderColor(doc.folder)}`}>
                            {doc.folder}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {doc.personName}
                          </span>
                          {doc.createdAt && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(doc.createdAt), 'dd.MM.yy HH:mm', { locale: de })}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setPreviewUrl(doc.fileUrl);
                            setShowPreview(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDocument(doc.personId, doc.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    </ContextMenu>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Assignment Dialog - Shows after upload & analysis */}
      <Dialog open={showAssignDialog} onOpenChange={(open) => {
        if (!open) {
          resetUploadState();
        }
        setShowAssignDialog(open);
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {t('documents.assign', 'Dokument zuordnen')}
            </DialogTitle>
            <DialogDescription>
              {t('documents.assignDescriptionShort', 'Wähle eine Person und einen Ordner für das Dokument')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* File Preview */}
            {uploadedFile && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                {filePreview ? (
                  <img src={filePreview} alt={t('documents.previewAlt', 'Vorschau')} className="w-16 h-16 object-cover rounded" />
                ) : (
                  <div className="w-16 h-16 bg-slate-200 rounded flex items-center justify-center">
                    <FileText className="w-8 h-8 text-slate-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{uploadedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            )}

            {/* Analysis Result */}
            {analysisResult && (
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-700">
                    {t('documents.recognizedAs', 'Erkannt als')}: {getTypeLabel(analysisResult.type)}
                  </span>
                  <Badge variant="secondary" className="ml-auto">
                    {analysisResult.confidence}% {t('documents.confidence', 'Sicherheit')}
                  </Badge>
                </div>
                {analysisResult.extractedData?.amount && (
                  <p className="text-sm text-green-700">
                    {t('documents.amount', 'Betrag')}: CHF {(analysisResult.extractedData.amount / 100).toFixed(2)}
                  </p>
                )}
                {analysisResult.extractedData?.dueDate && (
                  <p className="text-sm text-green-700">
                    {t('documents.due', 'Fällig')}: {analysisResult.extractedData.dueDate}
                  </p>
                )}
              </div>
            )}

            {/* Person Selection */}
            <div className="space-y-2">
              <Label>{t('documents.assignPerson', 'Person zuordnen')} *</Label>
              <Select value={assignPersonId} onValueChange={setAssignPersonId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('documents.selectPerson', 'Person auswählen...')} />
                </SelectTrigger>
                <SelectContent>
                  {peopleLoading ? (
                    <div className="p-2 text-center text-muted-foreground">{t('common.loading', 'Laden...')}</div>
                  ) : (people || []).length === 0 ? (
                    <div className="p-2 text-center text-muted-foreground">
                      {t('documents.noPeopleAvailable', 'Keine Personen vorhanden.')}
                      <br />
                      <span className="text-xs">{t('documents.createPersonFirst', 'Erstelle zuerst eine Person unter "Personen"')}</span>
                    </div>
                  ) : (
                    (people || []).map(person => (
                      <SelectItem key={person.id} value={person.id}>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {person.name}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Folder Selection */}
            <div className="space-y-2">
              <Label>{t('documents.folder', 'Ordner')}</Label>
              <Select value={assignFolder} onValueChange={setAssignFolder}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {documentFolders.map(folder => (
                    <SelectItem key={folder.value} value={folder.value}>
                      {folder.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAssignDialog(false);
                resetUploadState();
              }}
              disabled={isSaving}
            >
              <X className="w-4 h-4 mr-2" />
              {t('common.cancel', 'Abbrechen')}
            </Button>
            <Button 
              onClick={handleSaveDocument} 
              disabled={!assignPersonId || isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('common.saving', 'Speichern...')}
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  {t('common.save', 'Speichern')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{t('documents.preview', 'Dokument-Vorschau')}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center bg-slate-100 rounded-lg overflow-hidden">
            {previewUrl && (
              previewUrl.toLowerCase().includes('.pdf') ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-[70vh]"
                  title={t('documents.preview', 'Dokument-Vorschau')}
                />
              ) : (
                <img
                  src={previewUrl}
                  alt={t('documents.preview', 'Dokument-Vorschau')}
                  className="max-w-full max-h-[70vh] object-contain"
                />
              )
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
      {/* Delete Document Confirmation */}
      <AlertDialog open={!!deleteDocumentConfirm} onOpenChange={(open) => !open && setDeleteDocumentConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('documents.confirmDelete', 'Dokument löschen?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('documents.confirmDeleteDescription', 'Das Dokument wird unwiderruflich gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Abbrechen')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteDocument} className="bg-red-600 hover:bg-red-700">
              {t('common.delete', 'Löschen')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </Layout>
    );
  }
