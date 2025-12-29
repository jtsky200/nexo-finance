import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import DocumentUploader from './DocumentUploader';
import { 
  FolderOpen, 
  Receipt, 
  Calendar, 
  FileText, 
  File,
  Trash2,
  Download,
  MoreVertical,
  ExternalLink,
  Loader2,
  FolderPlus
} from 'lucide-react';

interface Document {
  id: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  folder: string;
  status: string;
  analysisResult?: any;
  processedType?: string;
  createdAt: string;
}

interface PersonDocumentsTabProps {
  personId: string;
  personName: string;
  onInvoiceCreated?: () => void;
  onReminderCreated?: () => void;
}

export default function PersonDocumentsTab({
  personId,
  personName,
  onInvoiceCreated,
  onReminderCreated,
}: PersonDocumentsTabProps) {
  const { t } = useTranslation();
  
  const FOLDERS = useMemo(() => [
    { id: 'all', label: t('common.all', 'Alle'), icon: FolderOpen },
    { id: 'Rechnungen', label: t('people.invoices', 'Rechnungen'), icon: Receipt },
    { id: 'Termine', label: t('people.appointments', 'Termine'), icon: Calendar },
    { id: 'Verträge', label: t('documents.contracts', 'Verträge'), icon: FileText },
    { id: 'Sonstiges', label: t('documents.other', 'Sonstiges'), icon: File },
  ], [t]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFolder, setActiveFolder] = useState('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const getPersonDocuments = httpsCallable(functions, 'getPersonDocuments');
      const result: any = await getPersonDocuments({ personId });
      setDocuments(result.data.documents || []);
    } catch (error) {
      toast.error(t('documents.loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [personId]);

  const handleDelete = async (documentId: string) => {
    try {
      const deleteDocument = httpsCallable(functions, 'deleteDocument');
      await deleteDocument({ documentId, personId });
      toast.success(t('documents.documentDeleted'));
      fetchDocuments();
    } catch (error) {
      toast.error(t('documents.deleteError'));
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const filteredDocuments = activeFolder === 'all' 
    ? documents 
    : documents.filter(doc => doc.folder === activeFolder);

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <File className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('de-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getFolderCount = (folderId: string) => {
    if (folderId === 'all') return documents.length;
    return documents.filter(doc => doc.folder === folderId).length;
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <DocumentUploader
        personId={personId}
        personName={personName}
        onUploadComplete={fetchDocuments}
        onInvoiceCreated={(id) => {
          fetchDocuments();
          onInvoiceCreated?.();
        }}
        onReminderCreated={(id) => {
          fetchDocuments();
          onReminderCreated?.();
        }}
      />

      {/* Folder Tabs */}
      <div className="flex flex-wrap gap-2">
        {FOLDERS.map((folder) => {
          const Icon = folder.icon;
          const count = getFolderCount(folder.id);
          return (
            <Button
              key={folder.id}
              variant={activeFolder === folder.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFolder(folder.id)}
              className="gap-2"
            >
              <Icon className="w-4 h-4" />
              {folder.label}
              {count > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {count}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>

      {/* Documents List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              {activeFolder === 'all' 
                ? t('documents.noDocumentsUploaded')
                : t('documents.noDocumentsInFolder', { folder: FOLDERS.find(f => f.id === activeFolder)?.label })
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredDocuments.map((doc) => (
            <Card key={doc.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Thumbnail / Icon */}
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    {doc.fileType.startsWith('image/') && doc.fileUrl ? (
                      <img 
                        src={doc.fileUrl} 
                        alt={doc.fileName}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      getFileIcon(doc.fileType)
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{doc.fileName}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {doc.folder}
                      </Badge>
                      {doc.processedType && (
                        <Badge variant="secondary" className="text-xs">
                          {doc.processedType === 'rechnung' ? t('documents.invoiceCreated') : 
                           doc.processedType === 'termin' ? t('documents.appointmentCreated') : 
                           doc.status}
                        </Badge>
                      )}
                      <span>{formatDate(doc.createdAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          {t('common.open')}
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <a href={doc.fileUrl} download={doc.fileName}>
                          <Download className="w-4 h-4 mr-2" />
                          {t('common.download')}
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setDeleteConfirmId(doc.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {t('common.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('documents.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('documents.deleteDocumentDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="bg-red-600 hover:bg-red-700"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

