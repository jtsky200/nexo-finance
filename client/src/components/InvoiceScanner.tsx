import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, Upload, FileText, QrCode, Check, Copy, CreditCard, Building2, Loader2, ScanLine } from 'lucide-react';
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
    if (lines[0] !== 'SPC' && !lines[0]?.startsWith('SPC')) {
      return null;
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
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, []);

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
            toast.info(t('invoice.noQrFound', 'Kein QR-Code gefunden. Bitte versuchen Sie es erneut.'));
            setScannedData({ imageUrl: imageData });
          }
        } catch (err) {
          console.error('Barcode detection error:', err);
          setScannedData({ imageUrl: imageData });
        }
      } else {
        // Fallback: No BarcodeDetector support
        toast.info(t('invoice.browserNotSupported', 'QR-Code-Erkennung wird in diesem Browser nicht unterstützt. Bitte verwenden Sie Chrome oder Edge.'));
        setScannedData({ imageUrl: imageData });
      }
    } catch (error) {
      console.error('Image processing error:', error);
      toast.error(t('invoice.processingError', 'Fehler bei der Bildverarbeitung.'));
    } finally {
      setIsProcessing(false);
    }
  };

  // Start camera with auto-scanning
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
        
        // Start auto-scanning after video is ready
        videoRef.current.onloadedmetadata = () => {
          startAutoScan();
        };
      }
    } catch (error) {
      console.error('Camera error:', error);
      toast.error(t('invoice.cameraError', 'Kamera konnte nicht gestartet werden.'));
    }
  };

  // Auto-scan for QR codes
  const startAutoScan = () => {
    if (!('BarcodeDetector' in window)) {
      toast.info(t('invoice.browserNotSupported', 'Automatische QR-Erkennung nicht verfügbar.'));
      return;
    }

    setIsScanning(true);
    
    // @ts-ignore
    const barcodeDetector = new BarcodeDetector({ formats: ['qr_code'] });
    
    scanIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current || !cameraActive) return;
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx || video.readyState !== 4) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      try {
        const barcodes = await barcodeDetector.detect(canvas);
        
        if (barcodes.length > 0) {
          const qrData = barcodes[0].rawValue;
          const parsed = parseSwissQRCode(qrData);
          
          if (parsed) {
            // Stop scanning and show results
            stopAutoScan();
            const imageData = canvas.toDataURL('image/jpeg');
            parsed.imageUrl = imageData;
            setImagePreview(imageData);
            setScannedData(parsed);
            stopCamera();
            setActiveTab('upload');
            toast.success(t('invoice.qrDetected', 'QR-Code automatisch erkannt!'));
          }
        }
      } catch (err) {
        // Silently ignore scan errors
      }
    }, 500); // Scan every 500ms
  };

  // Stop auto-scanning
  const stopAutoScan = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setIsScanning(false);
  };

  // Stop camera
  const stopCamera = () => {
    stopAutoScan();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Manual capture from camera
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
            {t('invoice.scanDescription', 'Laden Sie ein Bild der Rechnung hoch oder scannen Sie den QR-Code mit der Kamera.')}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              {t('invoice.upload', 'Hochladen')}
            </TabsTrigger>
            <TabsTrigger value="camera" className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              {t('invoice.camera', 'Kamera')}
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
                <Loader2 className="w-4 h-4 animate-spin" />
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
                  {/* Scanning overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-56 h-56 border-2 border-white/70 rounded-lg relative">
                      {isScanning && (
                        <>
                          <div className="absolute inset-0 bg-primary/10 animate-pulse" />
                          <ScanLine className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-white animate-bounce" />
                        </>
                      )}
                    </div>
                  </div>
                  {/* Scanning status */}
                  {isScanning && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('invoice.autoScanning', 'Automatische Erkennung aktiv...')}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-white gap-4">
                  <Camera className="w-16 h-16 opacity-50" />
                  <p className="text-sm opacity-70">{t('invoice.cameraInactive', 'Kamera nicht aktiv')}</p>
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
                    {t('invoice.capture', 'Manuell aufnehmen')}
                  </Button>
                  <Button onClick={stopCamera} variant="outline">
                    {t('common.cancel', 'Abbrechen')}
                  </Button>
                </>
              )}
            </div>
            
            <p className="text-xs text-muted-foreground text-center">
              {t('invoice.autoScanHint', 'Der QR-Code wird automatisch erkannt, sobald er im Kamerabild erscheint.')}
            </p>
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
