import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { usePeople } from '@/lib/firebaseHooks';
import DocumentUploader from '@/components/DocumentUploader';
import { 
  FileText, Search, Filter, Upload, FolderOpen, 
  User, Calendar, Clock, Eye, Trash2, RefreshCw,
  ScanLine, FileImage, File, AlertCircle
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

export default function Documents() {
  const { t } = useTranslation();
  const { people = [], loading: peopleLoading, refetch: refetchPeople } = usePeople();
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPerson, setSelectedPerson] = useState<string>('all');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Upload state
  const [uploadPersonId, setUploadPersonId] = useState<string>('');
  
  // Preview state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const folders = [
    { value: 'all', label: 'Alle Ordner' },
    { value: 'Rechnungen', label: 'Rechnungen' },
    { value: 'Termine', label: 'Termine' },
    { value: 'Verträge', label: 'Verträge' },
    { value: 'Sonstiges', label: 'Sonstiges' },
  ];

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const getAllDocuments = httpsCallable(functions, 'getAllDocuments');
      const result = await getAllDocuments({ folder: selectedFolder === 'all' ? null : selectedFolder });
      const data = result.data as { documents: Document[], total: number };
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Fehler beim Laden der Dokumente');
    } finally {
      setLoading(false);
    }
  }, [selectedFolder]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);


  const handleDeleteDocument = async (personId: string, documentId: string) => {
    if (!confirm('Dokument wirklich löschen?')) return;
    
    try {
      const deleteDocument = httpsCallable(functions, 'deleteDocument');
      await deleteDocument({ personId, documentId });
      toast.success('Dokument gelöscht');
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Fehler beim Löschen');
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ScanLine className="w-7 h-7" />
            Dokumente
          </h1>
          <p className="text-muted-foreground">Dokumente hochladen, scannen und verwalten</p>
        </div>
        <Button variant="outline" onClick={fetchDocuments} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Aktualisieren
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Gesamt</div>
          </CardContent>
        </Card>
        <Card className="bg-orange-50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.rechnungen}</div>
            <div className="text-sm text-muted-foreground">Rechnungen</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.termine}</div>
            <div className="text-sm text-muted-foreground">Termine</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.vertraege}</div>
            <div className="text-sm text-muted-foreground">Verträge</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">{stats.sonstiges}</div>
            <div className="text-sm text-muted-foreground">Sonstiges</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Upload Section */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Upload className="w-5 h-5" />
              Dokument hochladen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Person Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Person zuordnen</label>
              <Select value={uploadPersonId} onValueChange={setUploadPersonId}>
                <SelectTrigger>
                  <SelectValue placeholder="Person auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {(people || []).map(person => (
                    <SelectItem key={person.id} value={person.id}>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {person.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Upload Area */}
            {uploadPersonId ? (
              <DocumentUploader
                personId={uploadPersonId}
                personName={(people || []).find(p => p.id === uploadPersonId)?.name || ''}
                onUploadComplete={() => fetchDocuments()}
                onInvoiceCreated={() => fetchDocuments()}
                onReminderCreated={() => fetchDocuments()}
              />
            ) : (
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                <AlertCircle className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Bitte wähle zuerst eine Person aus
                </p>
              </div>
            )}

            {/* Quick Tips */}
            <div className="bg-slate-50 rounded-lg p-3 text-sm">
              <p className="font-medium mb-2">Unterstützte Formate:</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">JPG</Badge>
                <Badge variant="outline">PNG</Badge>
                <Badge variant="outline">PDF</Badge>
                <Badge variant="outline">HEIC</Badge>
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
                Alle Dokumente
              </CardTitle>
              <Badge variant="secondary">{filteredDocuments.length}</Badge>
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-2 pt-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Suchen..."
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
                  <SelectItem value="all">Alle Personen</SelectItem>
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
                  <p className="text-muted-foreground">Keine Dokumente gefunden</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredDocuments.map(doc => (
                    <div
                      key={doc.id}
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
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>


      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Dokument-Vorschau</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center bg-slate-100 rounded-lg overflow-hidden">
            {previewUrl && (
              previewUrl.toLowerCase().includes('.pdf') ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-[70vh]"
                  title="PDF Preview"
                />
              ) : (
                <img
                  src={previewUrl}
                  alt="Document Preview"
                  className="max-w-full max-h-[70vh] object-contain"
                />
              )
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

