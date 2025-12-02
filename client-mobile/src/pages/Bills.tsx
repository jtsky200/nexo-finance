import { useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FileText,
  Plus,
  Check,
  Clock,
  AlertCircle,
  Camera,
  X,
  Upload,
  ScanLine
} from 'lucide-react';
import MobileLayout from '@/components/MobileLayout';
import { useReminders, createReminder, updateReminder } from '@/lib/firebaseHooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function MobileBills() {
  const { t } = useTranslation();
  const { data: allReminders = [], isLoading, refetch } = useReminders({});
  
  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
  // Form state
  const [newBill, setNewBill] = useState({
    title: '',
    amount: '',
    dueDate: '',
    iban: '',
    reference: ''
  });

  // Camera refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Filter only payment reminders
  const bills = useMemo(() => 
    allReminders.filter(r => r.type === 'zahlung'),
    [allReminders]
  );

  const openBills = bills.filter(b => b.status === 'offen');
  const paidBills = bills.filter(b => b.status === 'erledigt');

  const totalOpen = openBills.reduce((sum, b) => sum + (b.amount || 0), 0) / 100;

  const formatAmount = (amount: number) => `CHF ${(amount / 100).toFixed(2)}`;

  const formatDate = (date: any) => {
    try {
      const d = date?.toDate ? date.toDate() : new Date(date);
      return d.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit' });
    } catch {
      return 'N/A';
    }
  };

  const handleMarkAsPaid = async (billId: string) => {
    try {
      await updateReminder(billId, { status: 'erledigt' as any });
      toast.success('Als bezahlt markiert');
      await refetch();
    } catch (error: any) {
      toast.error('Fehler: ' + error.message);
    }
  };

  const isOverdue = (date: any) => {
    try {
      const d = date?.toDate ? date.toDate() : new Date(date);
      return d < new Date();
    } catch {
      return false;
    }
  };

  // Add new bill
  const handleAddBill = async () => {
    if (!newBill.title || !newBill.amount) {
      toast.error('Bitte Titel und Betrag eingeben');
      return;
    }

    try {
      await createReminder({
        title: newBill.title,
        type: 'zahlung',
        status: 'offen',
        amount: Math.round(parseFloat(newBill.amount) * 100),
        dueDate: newBill.dueDate ? new Date(newBill.dueDate) : new Date(),
        description: newBill.iban ? `IBAN: ${newBill.iban}` : '',
      });
      
      toast.success('Rechnung hinzugefügt');
      setShowAddDialog(false);
      setNewBill({ title: '', amount: '', dueDate: '', iban: '', reference: '' });
      await refetch();
    } catch (error: any) {
      toast.error('Fehler: ' + error.message);
    }
  };

  // Camera functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
    } catch (error) {
      toast.error('Kamera konnte nicht gestartet werden');
      console.error(error);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        processImage(canvas);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          if (canvasRef.current) {
            const canvas = canvasRef.current;
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              processImage(canvas);
            }
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async (canvas: HTMLCanvasElement) => {
    setIsScanning(true);
    try {
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['qr_code']
        });
        const barcodes = await barcodeDetector.detect(canvas);
        
        if (barcodes.length > 0) {
          const qrData = barcodes[0].rawValue;
          parseSwissQRCode(qrData);
          toast.success('QR-Code erkannt');
          stopCamera();
        } else {
          toast.error('Kein QR-Code gefunden');
        }
      } else {
        toast.error('QR-Code Erkennung nicht unterstützt');
      }
    } catch (error) {
      console.error('QR scan error:', error);
      toast.error('Fehler beim Scannen');
    } finally {
      setIsScanning(false);
    }
  };

  const parseSwissQRCode = (data: string) => {
    try {
      const lines = data.split('\n');
      if (lines.length > 10) {
        const iban = lines[3] || '';
        const amount = lines[18] || '';
        const reference = lines[28] || '';
        
        setNewBill(prev => ({
          ...prev,
          iban: iban,
          amount: amount,
          reference: reference,
          title: 'Gescannte Rechnung'
        }));
        setShowAddDialog(true);
      }
    } catch (error) {
      console.error('Parse error:', error);
    }
  };

  return (
    <MobileLayout title={t('nav.bills', 'Rechnungen')}>
      {/* Summary - Clean design */}
      <div className="mobile-card mb-4 bg-primary text-primary-foreground">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-5 h-5 opacity-70" />
          <p className="text-sm opacity-70">{t('bills.openAmount', 'Offene Rechnungen')}</p>
        </div>
        <p className="text-3xl font-semibold">CHF {totalOpen.toFixed(2)}</p>
        <p className="text-sm opacity-60 mt-1">
          {openBills.length} {t('bills.bills', 'Rechnungen')}
        </p>
      </div>

      {/* Quick Actions - Clean buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setShowAddDialog(true)}
          className="flex-1 mobile-card flex items-center justify-center gap-2 py-3 active:opacity-80 transition-opacity"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium text-sm">Manuell</span>
        </button>
        <button
          onClick={startCamera}
          className="flex-1 mobile-card flex items-center justify-center gap-2 py-3 active:opacity-80 transition-opacity"
        >
          <Camera className="w-5 h-5" />
          <span className="font-medium text-sm">Scannen</span>
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 mobile-card flex items-center justify-center gap-2 py-3 active:opacity-80 transition-opacity"
        >
          <Upload className="w-5 h-5" />
          <span className="font-medium text-sm">Bild</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>

      {/* Open Bills */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          {t('common.loading', 'Laden...')}
        </div>
      ) : openBills.length === 0 ? (
        <div className="mobile-card text-center py-8">
          <Check className="w-10 h-10 mx-auto status-success mb-2" />
          <p className="text-muted-foreground">{t('bills.allPaid', 'Alle Rechnungen bezahlt')}</p>
        </div>
      ) : (
        <div className="space-y-2 mb-4">
          {openBills.map((bill) => {
            const overdue = isOverdue(bill.dueDate);
            
            return (
              <div
                key={bill.id}
                className={`mobile-card flex items-center justify-between ${
                  overdue ? 'border-l-2 border-l-red-500' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    overdue ? 'bg-status-error' : 'bg-status-warning'
                  }`}>
                    {overdue ? (
                      <AlertCircle className="w-5 h-5 status-error" />
                    ) : (
                      <Clock className="w-5 h-5 status-warning" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{bill.title}</p>
                    <p className={`text-xs ${overdue ? 'status-error' : 'text-muted-foreground'}`}>
                      {overdue ? 'Überfällig • ' : ''}{formatDate(bill.dueDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold">
                    {formatAmount(bill.amount || 0)}
                  </p>
                  <button
                    onClick={() => handleMarkAsPaid(bill.id)}
                    className="w-10 h-10 rounded-lg bg-status-success flex items-center justify-center status-success active:opacity-80 transition-opacity"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Paid Bills */}
      {paidBills.length > 0 && (
        <>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
            {t('bills.paid', 'Bezahlt')} ({paidBills.length})
          </p>
          <div className="space-y-2 opacity-60">
            {paidBills.slice(0, 5).map((bill) => (
              <div
                key={bill.id}
                className="mobile-card flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-status-success flex items-center justify-center">
                    <Check className="w-5 h-5 status-success" />
                  </div>
                  <p className="font-medium line-through">{bill.title}</p>
                </div>
                <p className="text-muted-foreground">
                  {formatAmount(bill.amount || 0)}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Add Bill Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
          <div className="bg-background w-full rounded-t-2xl p-6 safe-bottom animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Neue Rechnung</h2>
              <button
                onClick={() => setShowAddDialog(false)}
                className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">Titel</Label>
                <Input
                  value={newBill.title}
                  onChange={(e) => setNewBill({ ...newBill, title: e.target.value })}
                  placeholder="z.B. Stromrechnung"
                  className="mobile-input mt-1"
                />
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">Betrag (CHF)</Label>
                <Input
                  type="number"
                  value={newBill.amount}
                  onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })}
                  placeholder="0.00"
                  className="mobile-input mt-1"
                  step="0.01"
                />
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">Fälligkeitsdatum</Label>
                <Input
                  type="date"
                  value={newBill.dueDate}
                  onChange={(e) => setNewBill({ ...newBill, dueDate: e.target.value })}
                  className="mobile-input mt-1"
                />
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">IBAN (optional)</Label>
                <Input
                  value={newBill.iban}
                  onChange={(e) => setNewBill({ ...newBill, iban: e.target.value })}
                  placeholder="CH..."
                  className="mobile-input mt-1"
                />
              </div>

              <Button
                onClick={handleAddBill}
                className="w-full mobile-btn bg-primary text-primary-foreground mt-4"
              >
                Rechnung hinzufügen
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Camera View */}
      {showCamera && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="flex items-center justify-between p-4">
            <h2 className="text-white font-medium">QR-Code scannen</h2>
            <button
              onClick={stopCamera}
              className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="flex-1 relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 border-2 border-white/50 rounded-lg relative">
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 flex justify-center safe-bottom">
            <button
              onClick={capturePhoto}
              disabled={isScanning}
              className="w-16 h-16 rounded-full bg-white flex items-center justify-center active:opacity-80 transition-opacity"
            >
              <ScanLine className="w-8 h-8 text-black" />
            </button>
          </div>
        </div>
      )}

      {/* FAB */}
      {!showAddDialog && !showCamera && (
        <button 
          onClick={() => setShowAddDialog(true)}
          className="fixed right-4 bottom-20 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:opacity-80 transition-opacity safe-bottom"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
    </MobileLayout>
  );
}
