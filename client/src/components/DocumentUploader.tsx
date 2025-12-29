import { functions } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

import { useState, useRef, useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { httpsCallable } from 'firebase/functions';

import { toast } from 'sonner';

import { 
  Upload, 
  FileText, 
  FileImage, 
  X, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  Receipt,
  FileQuestion,
  FolderOpen
} from 'lucide-react';

interface DocumentUploaderProps {
  personId: string;
  personName: string;
  onUploadComplete?: () => void;
  onInvoiceCreated?: (invoiceId: string) => void;
  onReminderCreated?: (reminderId: string) => void;
}

interface AnalysisResult {
  type: 'rechnung' | 'termin' | 'vertrag' | 'sonstiges' | 'unknown';
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
    location?: string;
    startDate?: string;
    endDate?: string;
  };
  rawText?: string;
  error?: string;
  message?: string;
}

const FOLDER_IDS = ['Rechnungen', 'Termine', 'Verträge', 'Sonstiges'] as const;
const FOLDER_ICONS = {
  'Rechnungen': Receipt,
  'Termine': Calendar,
  'Verträge': FileText,
  'Sonstiges': FolderOpen,
};

export default function DocumentUploader({
  personId,
  personName,
  onUploadComplete,
  onInvoiceCreated,
  onReminderCreated,
}: DocumentUploaderProps) {
  const { t } = useTranslation();
  
  const FOLDERS = useMemo(() => [
    { id: 'Rechnungen', label: t('people.invoices', 'Rechnungen'), icon: Receipt },
    { id: 'Termine', label: t('people.appointments', 'Termine'), icon: Calendar },
    { id: 'Verträge', label: t('documents.contracts', 'Verträge'), icon: FileText },
    { id: 'Sonstiges', label: t('documents.other', 'Sonstiges'), icon: FolderOpen },
  ], [t]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [documentId, setDocumentId] = useState<string | null>(null);
  
  // Form data for confirmation
  const [confirmData, setConfirmData] = useState({
    type: 'sonstiges',
    folder: 'Sonstiges',
    // Invoice fields
    amount: 0,
    currency: 'CHF',
    dueDate: '',
    iban: '',
    description: '',
    direction: 'outgoing',
    // Appointment fields
    title: '',
    date: '',
    time: '',
    location: '',
  });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileSelect = (file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error(t('documents.onlyImagesAndPdfsAllowed'));
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('documents.fileTooLarge'));
      return;
    }
    
    setSelectedFile(file);
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Convert file to base64
      const reader = new FileReader();
      const fileData = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });
      
      setUploadProgress(30);
      
      // Upload document
      const uploadDocument = httpsCallable(functions, 'uploadDocument');
      const uploadResult: any = await uploadDocument({
        personId,
        fileName: selectedFile.name,
        fileData,
        fileType: selectedFile.type,
        folder: 'Sonstiges', // Will be updated after analysis
      });
      
      setDocumentId(uploadResult.data.id);
      setUploadProgress(60);
      setIsUploading(false);
      
      // Analyze document
      setIsAnalyzing(true);
      
      const analyzeDocument = httpsCallable(functions, 'analyzeDocument');
      const analysisResponse: any = await analyzeDocument({
        documentId: uploadResult.data.id,
        personId,
        fileData,
        fileType: selectedFile.type,
      });
      
      setUploadProgress(100);
      setAnalysisResult(analysisResponse.data);
      
      // Check user settings for auto-confirm
      const getUserSettings = httpsCallable(functions, 'getUserSettings');
      const settingsResult: any = await getUserSettings({});
      const autoConfirm = settingsResult.data?.autoConfirmDocuments;
      
      // Prepare confirmation data
      const result = analysisResponse.data;
      const newConfirmData = {
        type: result.type || 'sonstiges',
        folder: result.type === 'rechnung' ? 'Rechnungen' : 
                result.type === 'termin' ? 'Termine' : 
                result.type === 'vertrag' ? 'Verträge' : 'Sonstiges',
        amount: result.extractedData?.amount || 0,
        currency: result.extractedData?.currency || 'CHF',
        dueDate: result.extractedData?.dueDate || '',
        iban: result.extractedData?.iban || '',
        description: result.extractedData?.description || selectedFile.name,
        direction: 'outgoing',
        title: result.extractedData?.title || selectedFile.name,
        date: result.extractedData?.date || '',
        time: result.extractedData?.time || '',
        location: result.extractedData?.location || '',
      };
      
      setConfirmData(newConfirmData);
      
      if (autoConfirm && result.confidence > 70) {
        // Auto-process
        await handleConfirmProcess(uploadResult.data.id, newConfirmData);
      } else {
        // Show confirmation dialog
        setShowConfirmDialog(true);
      }
      
    } catch (error: any) {
      toast.error(t('common.error') + ': ' + (error.message || t('common.unknownError')));
    } finally {
      setIsUploading(false);
      setIsAnalyzing(false);
    }
  };

  const handleConfirmProcess = async (docId?: string, data?: typeof confirmData) => {
    const targetDocId = docId || documentId;
    const targetData = data || confirmData;
    
    if (!targetDocId) return;
    
    try {
      if (targetData.type === 'rechnung' || targetData.type === 'termin') {
        const processDocument = httpsCallable(functions, 'processDocument');
        const result: any = await processDocument({
          documentId: targetDocId,
          personId,
          type: targetData.type,
          data: targetData.type === 'rechnung' ? {
            amount: targetData.amount,
            currency: targetData.currency,
            dueDate: targetData.dueDate,
            iban: targetData.iban,
            description: targetData.description,
            direction: targetData.direction,
          } : {
            title: targetData.title,
            date: targetData.date,
            time: targetData.time,
            location: targetData.location,
            description: targetData.description,
          },
        });
        
        if (targetData.type === 'rechnung') {
          toast.success(t('documents.invoiceCreated'));
          onInvoiceCreated?.(result.data.invoiceId);
        } else {
          toast.success(t('documents.appointmentCreated'));
          onReminderCreated?.(result.data.reminderId);
        }
      } else {
        // Just update the folder
        const updateDocument = httpsCallable(functions, 'updateDocument');
        await updateDocument({
          documentId: targetDocId,
          personId,
          folder: targetData.folder,
          status: 'processed',
        });
        toast.success(t('documents.documentSaved'));
      }
      
      // Reset state
      setSelectedFile(null);
      setFilePreview(null);
      setAnalysisResult(null);
      setShowConfirmDialog(false);
      setDocumentId(null);
      setUploadProgress(0);
      
      onUploadComplete?.();
      
    } catch (error: any) {
      toast.error(t('documents.processingError') + ': ' + error.message);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setAnalysisResult(null);
    setShowConfirmDialog(false);
    setDocumentId(null);
    setUploadProgress(0);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'rechnung': return <Receipt className="w-5 h-5" />;
      case 'termin': return <Calendar className="w-5 h-5" />;
      case 'vertrag': return <FileText className="w-5 h-5" />;
      default: return <FileQuestion className="w-5 h-5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'rechnung': return t('documents.invoice');
      case 'termin': return t('documents.appointment');
      case 'vertrag': return t('documents.contract');
      case 'sonstiges': return t('documents.other');
      default: return t('documents.unknown');
    }
  };

  return (
    <>
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
        />
        
        {!selectedFile ? (
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Upload className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">{t('documents.uploadDocument')}</p>
              <p className="text-sm text-muted-foreground">
                {t('documents.dragOrClickToSelect')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('documents.allowedFormats')}
              </p>
            </div>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              {t('documents.selectFile')}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* File Preview */}
            <div className="flex items-center justify-center gap-4">
              {filePreview ? (
                <img src={filePreview} alt={t('documents.previewAlt', 'Vorschau')} className="max-h-32 rounded-lg shadow-md" />
              ) : (
                <div className="w-24 h-32 bg-muted rounded-lg flex items-center justify-center">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
            </div>
            
            <div>
              <p className="font-medium truncate max-w-xs mx-auto">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            
            {/* Progress */}
            {(isUploading || isAnalyzing) && (
              <div className="space-y-2">
                <Progress value={uploadProgress} />
                <p className="text-sm text-muted-foreground">
                  {isUploading ? t('documents.uploading') : t('documents.analyzing')}
                </p>
              </div>
            )}
            
            {/* Actions */}
            {!isUploading && !isAnalyzing && (
              <div className="flex justify-center gap-2">
                <Button variant="outline" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-2" />
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleUploadAndAnalyze}>
                  <Upload className="w-4 h-4 mr-2" />
                  {t('documents.uploadAndAnalyze')}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {analysisResult && getTypeIcon(analysisResult.type)}
              {t('documents.documentRecognized')}
            </DialogTitle>
            <DialogDescription>
              {t('documents.reviewAndConfirm')}
            </DialogDescription>
          </DialogHeader>

          {analysisResult && (
            <div className="space-y-4">
              {/* Analysis Result */}
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Badge variant={analysisResult.confidence > 70 ? 'default' : 'secondary'}>
                  {analysisResult.confidence}% {t('documents.confidence')}
                </Badge>
                <span className="text-sm">
                  {t('documents.recognizedAs')}: <strong>{getTypeLabel(analysisResult.type)}</strong>
                </span>
              </div>

              {/* Type Selection */}
              <div className="space-y-2">
                <Label>{t('documents.documentType')}</Label>
                <Select 
                  value={confirmData.type} 
                  onValueChange={(v) => setConfirmData({ 
                    ...confirmData, 
                    type: v,
                    folder: v === 'rechnung' ? 'Rechnungen' : 
                            v === 'termin' ? 'Termine' : 
                            v === 'vertrag' ? 'Verträge' : 'Sonstiges'
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rechnung">{t('documents.invoice')}</SelectItem>
                    <SelectItem value="termin">{t('documents.appointment')}</SelectItem>
                    <SelectItem value="vertrag">{t('documents.contract')}</SelectItem>
                    <SelectItem value="sonstiges">{t('documents.other')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Invoice Fields */}
              {confirmData.type === 'rechnung' && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <h4 className="font-medium">{t('documents.invoiceData')}</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('finance.amount')}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={confirmData.amount}
                        onChange={(e) => setConfirmData({ ...confirmData, amount: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('documents.currency')}</Label>
                      <Select value={confirmData.currency} onValueChange={(v) => setConfirmData({ ...confirmData, currency: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CHF">CHF</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{t('people.dueDate')}</Label>
                    <Input
                      type="date"
                      value={confirmData.dueDate}
                      onChange={(e) => setConfirmData({ ...confirmData, dueDate: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{t('documents.iban')}</Label>
                    <Input
                      value={confirmData.iban}
                      onChange={(e) => setConfirmData({ ...confirmData, iban: e.target.value })}
                      placeholder={t('documents.ibanPlaceholder', 'CH...')}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{t('people.description')}</Label>
                    <Input
                      value={confirmData.description}
                      onChange={(e) => setConfirmData({ ...confirmData, description: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{t('people.direction')}</Label>
                    <Select value={confirmData.direction} onValueChange={(v) => setConfirmData({ ...confirmData, direction: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="outgoing">{t('documents.iOwe')}</SelectItem>
                        <SelectItem value="incoming">{t('documents.owedToMe')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Appointment Fields */}
              {confirmData.type === 'termin' && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <h4 className="font-medium">{t('documents.appointmentData')}</h4>
                  
                  <div className="space-y-2">
                    <Label>{t('calendar.title')}</Label>
                    <Input
                      value={confirmData.title}
                      onChange={(e) => setConfirmData({ ...confirmData, title: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('common.date')}</Label>
                      <Input
                        type="date"
                        value={confirmData.date}
                        onChange={(e) => setConfirmData({ ...confirmData, date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('calendar.time')}</Label>
                      <Input
                        type="time"
                        value={confirmData.time}
                        onChange={(e) => setConfirmData({ ...confirmData, time: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{t('calendar.location')}</Label>
                    <Input
                      value={confirmData.location}
                      onChange={(e) => setConfirmData({ ...confirmData, location: e.target.value })}
                      placeholder={t('common.optional')}
                    />
                  </div>
                </div>
              )}

              {/* Folder Selection for other types */}
              {(confirmData.type === 'vertrag' || confirmData.type === 'sonstiges') && (
                <div className="space-y-2">
                  <Label>{t('documents.folder')}</Label>
                  <Select value={confirmData.folder} onValueChange={(v) => setConfirmData({ ...confirmData, folder: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FOLDERS.map((folder) => (
                        <SelectItem key={folder.id} value={folder.id}>
                          {folder.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCancel}>
              {t('common.cancel')}
            </Button>
            <Button onClick={() => handleConfirmProcess()}>
              <CheckCircle className="w-4 h-4 mr-2" />
              {t('documents.confirmAndSave')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

