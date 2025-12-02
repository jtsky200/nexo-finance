import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, Upload, FileText, QrCode, Check, AlertCircle, Copy, CreditCard, Building2 } from 'lucide-react';
import { toast } from 'sonner';

interface InvoiceScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvoiceScanned: (data: ScannedInvoiceData) => void;
}

export interface ScannedInvoiceData {
  amount?: number;
  currency?: string;
  iban?: string;
  reference?: string;
  creditorName?: string;
  creditorAddress?: string;
  message?: string;
  qrCodeData?: string;
  imageUrl?: string;
}

// Swiss QR-Code Parser (ISO 20022)
function parseSwissQRCode(qrData: string): ScannedInvoiceData | null {
  try {
    const lines = qrData.split('\n').map(l => l.trim());
    
    // Swiss QR Bill format validation
    if (lines[0] !== 'SPC' || lines[1] !== '0200') {
      // Try alternative format
      if (!lines[0]?.startsWith('SPC')) {
        return null;
      }
    }

    const data: ScannedInvoiceData = {
      qrCodeData: qrData,
    };

    // Parse according to Swiss QR-Bill specification
    // Line 3: IBAN
    if (lines[2]) {
      data.iban = lines[2].replace(/\s/g, '');
    }

    // Lines 4-9: Creditor information
    if (lines[4]) data.creditorName = lines[4];
    if (lines[5] && lines[6] && lines[7]) {
      data.creditorAddress = `${lines[5]}, ${lines[6]} ${lines[7]}`;
    }

    // Line 18: Amount
    if (lines[17] && lines[17] !== '') {
      const amount = parseFloat(lines[17]);
      if (!isNaN(amount)) {
        data.amount = amount;
      }
    }

    // Line 19: Currency
    if (lines[18]) {
      data.currency = lines[18];
    }

    // Line 28: Reference
    if (lines[27]) {
      data.reference = lines[27];
    }

    // Line 29: Additional information / Message
    if (lines[28]) {
      data.message = lines[28];
    }

    return data;
  } catch (error) {
    console.error('QR Code parsing error:', error);
    return null;
  }
}

export default function InvoiceScanner({ open, onOpenChange, onInvoiceScanned }: InvoiceScannerProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('upload');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scannedData, setScannedData] = useState<ScannedInvoiceData | null>(null);
  const [manualQrInput, setManualQrInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error(t('invoice.invalidFileType', 'Ungültiger Dateityp. Bitte laden Sie ein Bild oder PDF hoch.'));
      return;
    }

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
        processImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  // Process image for QR code
  const processImage = async (imageData: string) => {
    setIsProcessing(true);
    
    try {
      // Create image element
      const img = new Image();
      img.src = imageData;
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // Draw to canvas for processing
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Try to detect QR code using BarcodeDetector API (if available)
      if ('BarcodeDetector' in window) {
        try {
          // @ts-ignore - BarcodeDetector is not in TypeScript types yet
          const barcodeDetector = new BarcodeDetector({ formats: ['qr_code'] });
          const barcodes = await barcodeDetector.detect(canvas);
          
          if (barcodes.length > 0) {
            const qrData = barcodes[0].rawValue;
            const parsed = parseSwissQRCode(qrData);
            
            if (parsed) {
              parsed.imageUrl = imageData;
              setScannedData(parsed);
              toast.success(t('invoice.qrDetected', 'QR-Code erkannt!'));
            } else {
              toast.info(t('invoice.qrNotSwiss', 'QR-Code erkannt, aber kein Schweizer Zahlungs-QR.'));
              setScannedData({ qrCodeData: qrData, imageUrl: imageData });
            }
          } else {
            toast.info(t('invoice.noQrFound', 'Kein QR-Code gefunden. Sie können die Daten manuell eingeben.'));
            setScannedData({ imageUrl: imageData });
          }
        } catch (err) {
          console.error('Barcode detection error:', err);
          setScannedData({ imageUrl: imageData });
        }
      } else {
        // Fallback: No BarcodeDetector support
        toast.info(t('invoice.manualEntry', 'QR-Code-Erkennung nicht verfügbar. Bitte geben Sie die Daten manuell ein.'));
        setScannedData({ imageUrl: imageData });
      }
    } catch (error) {
      console.error('Image processing error:', error);
      toast.error(t('invoice.processingError', 'Fehler bei der Bildverarbeitung.'));
    } finally {
      setIsProcessing(false);
    }
  };

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
      }
    } catch (error) {
      console.error('Camera error:', error);
      toast.error(t('invoice.cameraError', 'Kamera konnte nicht gestartet werden.'));
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Capture from camera
  const captureFromCamera = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg');
    setImagePreview(imageData);
    processImage(imageData);
    stopCamera();
    setActiveTab('upload');
  };

  // Parse manual QR input
  const handleManualQrParse = () => {
    if (!manualQrInput.trim()) {
      toast.error(t('invoice.enterQrData', 'Bitte geben Sie die QR-Code-Daten ein.'));
      return;
    }

    const parsed = parseSwissQRCode(manualQrInput);
    if (parsed) {
      setScannedData(parsed);
      toast.success(t('invoice.qrParsed', 'QR-Code-Daten erfolgreich geparst!'));
    } else {
      toast.error(t('invoice.invalidQr', 'Ungültige QR-Code-Daten.'));
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} kopiert!`);
  };

  // Confirm and use scanned data
  const handleConfirm = () => {
    if (scannedData) {
      onInvoiceScanned(scannedData);
      handleClose();
    }
  };

  // Close and reset
  const handleClose = () => {
    stopCamera();
    setImagePreview(null);
    setScannedData(null);
    setManualQrInput('');
    setActiveTab('upload');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {t('invoice.scanTitle', 'Rechnung scannen')}
          </DialogTitle>
          <DialogDescription>
            {t('invoice.scanDescription', 'Laden Sie ein Bild der Rechnung hoch oder scannen Sie den QR-Code.')}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">{t('invoice.upload', 'Hochladen')}</span>
            </TabsTrigger>
            <TabsTrigger value="camera" className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">{t('invoice.camera', 'Kamera')}</span>
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">{t('invoice.manual', 'Manuell')}</span>
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-4">
            <div 
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              {imagePreview ? (
                <div className="space-y-4">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="max-h-64 mx-auto rounded-lg shadow-md"
                  />
                  <p className="text-sm text-muted-foreground">
                    {t('invoice.clickToChange', 'Klicken um ein anderes Bild zu wählen')}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                  <p className="font-medium">{t('invoice.dropOrClick', 'Bild hier ablegen oder klicken')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('invoice.supportedFormats', 'JPG, PNG oder PDF')}
                  </p>
                </div>
              )}
            </div>

            {isProcessing && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                {t('invoice.processing', 'Verarbeite...')}
              </div>
            )}
          </TabsContent>

          {/* Camera Tab */}
          <TabsContent value="camera" className="space-y-4">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              {cameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 border-2 border-white/50 rounded-lg" />
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-white">
                  <Camera className="w-16 h-16 opacity-50" />
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {!cameraActive ? (
                <Button onClick={startCamera} className="flex-1">
                  <Camera className="w-4 h-4 mr-2" />
                  {t('invoice.startCamera', 'Kamera starten')}
                </Button>
              ) : (
                <>
                  <Button onClick={captureFromCamera} className="flex-1">
                    <Check className="w-4 h-4 mr-2" />
                    {t('invoice.capture', 'Aufnehmen')}
                  </Button>
                  <Button onClick={stopCamera} variant="outline">
                    {t('common.cancel', 'Abbrechen')}
                  </Button>
                </>
              )}
            </div>
          </TabsContent>

          {/* Manual Tab */}
          <TabsContent value="manual" className="space-y-4">
            <div className="space-y-2">
              <Label>{t('invoice.qrCodeData', 'QR-Code Daten')}</Label>
              <textarea
                value={manualQrInput}
                onChange={(e) => setManualQrInput(e.target.value)}
                placeholder={t('invoice.pasteQrData', 'QR-Code Daten hier einfügen...')}
                className="w-full h-32 p-3 border rounded-lg resize-none font-mono text-sm"
              />
              <Button onClick={handleManualQrParse} className="w-full">
                <QrCode className="w-4 h-4 mr-2" />
                {t('invoice.parseQr', 'QR-Code parsen')}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Scanned Data Display */}
        {scannedData && (
          <Card className="mt-4 border-green-200 bg-green-50/50">
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center gap-2 text-green-700">
                <Check className="w-5 h-5" />
                <span className="font-medium">{t('invoice.dataExtracted', 'Daten extrahiert')}</span>
              </div>

              <div className="grid gap-3">
                {scannedData.amount !== undefined && (
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{t('invoice.amount', 'Betrag')}</span>
                    </div>
                    <span className="font-bold text-lg">
                      {scannedData.currency || 'CHF'} {scannedData.amount.toFixed(2)}
                    </span>
                  </div>
                )}

                {scannedData.iban && (
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <span className="text-sm text-muted-foreground block">IBAN</span>
                        <span className="font-mono text-sm">{scannedData.iban}</span>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => copyToClipboard(scannedData.iban!, 'IBAN')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {scannedData.creditorName && (
                  <div className="p-3 bg-white rounded-lg border">
                    <span className="text-sm text-muted-foreground block mb-1">{t('invoice.creditor', 'Empfänger')}</span>
                    <span className="font-medium">{scannedData.creditorName}</span>
                    {scannedData.creditorAddress && (
                      <span className="text-sm text-muted-foreground block">{scannedData.creditorAddress}</span>
                    )}
                  </div>
                )}

                {scannedData.reference && (
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div>
                      <span className="text-sm text-muted-foreground block">{t('invoice.reference', 'Referenz')}</span>
                      <span className="font-mono text-sm">{scannedData.reference}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => copyToClipboard(scannedData.reference!, 'Referenz')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {scannedData.message && (
                  <div className="p-3 bg-white rounded-lg border">
                    <span className="text-sm text-muted-foreground block mb-1">{t('invoice.message', 'Mitteilung')}</span>
                    <span className="text-sm">{scannedData.message}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} className="hidden" />

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleClose}>
            {t('common.cancel', 'Abbrechen')}
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!scannedData}
          >
            <Check className="w-4 h-4 mr-2" />
            {t('invoice.useData', 'Daten übernehmen')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

