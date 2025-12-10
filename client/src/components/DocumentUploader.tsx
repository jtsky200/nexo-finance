import { functions } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

import { useState, useRef, useCallback } from 'react';

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

const FOLDERS = [
  { id: 'Rechnungen', label: 'Rechnungen', icon: Receipt },
  { id: 'Termine', label: 'Termine', icon: Calendar },
  { id: 'Verträge', label: 'Verträge', icon: FileText },
  { id: 'Sonstiges', label: 'Sonstiges', icon: FolderOpen },
];

export default function DocumentUploader({
  personId,
  personName,
  onUploadComplete,
  onInvoiceCreated,
  onReminderCreated,
}: DocumentUploaderProps) {
  const { t } = useTranslation();
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
      toast.error('Nur Bilder (JPG, PNG, GIF, WebP) und PDFs erlaubt');
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Datei zu gross (max. 10MB)');
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
      toast.error('Fehler: ' + (error.message || 'Unbekannter Fehler'));
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
          toast.success('Rechnung erstellt');
          onInvoiceCreated?.(result.data.invoiceId);
        } else {
          toast.success('Termin erstellt');
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
        toast.success('Dokument gespeichert');
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
      toast.error('Fehler beim Verarbeiten: ' + error.message);
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
      case 'rechnung': return 'Rechnung';
      case 'termin': return 'Termin';
      case 'vertrag': return 'Vertrag';
      case 'sonstiges': return 'Sonstiges';
      default: return 'Unbekannt';
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
              <p className="font-medium">Dokument hochladen</p>
              <p className="text-sm text-muted-foreground">
                Ziehe eine Datei hierher oder klicke zum Auswählen
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                JPG, PNG, GIF, WebP oder PDF (max. 10MB)
              </p>
            </div>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              Datei auswählen
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* File Preview */}
            <div className="flex items-center justify-center gap-4">
              {filePreview ? (
                <img src={filePreview} alt="Preview" className="max-h-32 rounded-lg shadow-md" />
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
                  {isUploading ? 'Wird hochgeladen...' : 'Wird analysiert...'}
                </p>
              </div>
            )}
            
            {/* Actions */}
            {!isUploading && !isAnalyzing && (
              <div className="flex justify-center gap-2">
                <Button variant="outline" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-2" />
                  Abbrechen
                </Button>
                <Button onClick={handleUploadAndAnalyze}>
                  <Upload className="w-4 h-4 mr-2" />
                  Hochladen & Analysieren
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
              Dokument erkannt
            </DialogTitle>
            <DialogDescription>
              Überprüfe und bestätige die erkannten Daten
            </DialogDescription>
          </DialogHeader>

          {analysisResult && (
            <div className="space-y-4">
              {/* Analysis Result */}
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Badge variant={analysisResult.confidence > 70 ? 'default' : 'secondary'}>
                  {analysisResult.confidence}% Sicherheit
                </Badge>
                <span className="text-sm">
                  Erkannt als: <strong>{getTypeLabel(analysisResult.type)}</strong>
                </span>
              </div>

              {/* Type Selection */}
              <div className="space-y-2">
                <Label>Dokumenttyp</Label>
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
                    <SelectItem value="rechnung">Rechnung</SelectItem>
                    <SelectItem value="termin">Termin</SelectItem>
                    <SelectItem value="vertrag">Vertrag</SelectItem>
                    <SelectItem value="sonstiges">Sonstiges</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Invoice Fields */}
              {confirmData.type === 'rechnung' && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <h4 className="font-medium">Rechnungsdaten</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Betrag</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={confirmData.amount}
                        onChange={(e) => setConfirmData({ ...confirmData, amount: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Währung</Label>
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
                    <Label>Fälligkeitsdatum</Label>
                    <Input
                      type="date"
                      value={confirmData.dueDate}
                      onChange={(e) => setConfirmData({ ...confirmData, dueDate: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>IBAN</Label>
                    <Input
                      value={confirmData.iban}
                      onChange={(e) => setConfirmData({ ...confirmData, iban: e.target.value })}
                      placeholder="CH..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Beschreibung</Label>
                    <Input
                      value={confirmData.description}
                      onChange={(e) => setConfirmData({ ...confirmData, description: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Richtung</Label>
                    <Select value={confirmData.direction} onValueChange={(v) => setConfirmData({ ...confirmData, direction: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="outgoing">Ich schulde (ausgehend)</SelectItem>
                        <SelectItem value="incoming">Mir geschuldet (eingehend)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Appointment Fields */}
              {confirmData.type === 'termin' && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <h4 className="font-medium">Termindaten</h4>
                  
                  <div className="space-y-2">
                    <Label>Titel</Label>
                    <Input
                      value={confirmData.title}
                      onChange={(e) => setConfirmData({ ...confirmData, title: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Datum</Label>
                      <Input
                        type="date"
                        value={confirmData.date}
                        onChange={(e) => setConfirmData({ ...confirmData, date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Uhrzeit</Label>
                      <Input
                        type="time"
                        value={confirmData.time}
                        onChange={(e) => setConfirmData({ ...confirmData, time: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Ort</Label>
                    <Input
                      value={confirmData.location}
                      onChange={(e) => setConfirmData({ ...confirmData, location: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                </div>
              )}

              {/* Folder Selection for other types */}
              {(confirmData.type === 'vertrag' || confirmData.type === 'sonstiges') && (
                <div className="space-y-2">
                  <Label>Ordner</Label>
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
              Abbrechen
            </Button>
            <Button onClick={() => handleConfirmProcess()}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Bestätigen & Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

