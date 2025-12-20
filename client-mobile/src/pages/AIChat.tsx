import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { AIChatBox, type Message } from '@/components/AIChatBox';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Bell, ScanLine, Wallet, ShoppingCart, LayoutGrid, Camera, X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { createReminder, createFinanceEntry, createShoppingItem } from '@/lib/firebaseHooks';
import { formatErrorForDisplay } from '@/lib/errorHandler';
import { hapticSuccess, hapticError } from '@/lib/hapticFeedback';
import { formatDateLocal, formatDateGerman, parseDateGerman, formatDateTimeGerman, parseDateTimeGerman, dateToDateTimeLocal } from '@/lib/dateTimeUtils';
import { 
  useChatHistory,
  saveChatConversation, 
  getChatConversation,
  createNewChat,
  generateChatTitle,
  type ChatConversation
} from '@/lib/chatHistory';
import PageHeader from '@/components/PageHeader';

const SYSTEM_MESSAGE: Message = {
  role: 'system',
  content: 'Du bist ein hilfreicher Assistent für die Nexo-Anwendung. Du hilfst Benutzern bei Fragen zu Finanzen, Rechnungen, Terminen und anderen Funktionen der App. WICHTIG: Verwende IMMER "ss" statt "ß" in allen deutschen Texten (Schweizer Grammatik).',
};

export default function AIChat() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { data: chatHistory, isLoading: isLoadingHistory, refetch: refetchHistory } = useChatHistory();
  
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Modal states
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [showFinanceModal, setShowFinanceModal] = useState(false);
  const [showShoppingModal, setShowShoppingModal] = useState(false);
  
  // Scanner states
  const [showCamera, setShowCamera] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Reminder form state - store date in YYYY-MM-DDTHH:mm format internally for datetime-local input
  const [reminderForm, setReminderForm] = useState({
    title: '',
    type: 'termin' as 'termin' | 'zahlung' | 'aufgabe',
    dueDate: '', // Empty by default - user must select date/time
    isAllDay: false,
    amount: '',
    currency: 'CHF',
    notes: '',
  });
  const [isSubmittingReminder, setIsSubmittingReminder] = useState(false);
  
  // Finance form state - store date in YYYY-MM-DD format internally, display as DD.MM.YYYY
  const [financeForm, setFinanceForm] = useState({
    type: 'ausgabe' as 'einnahme' | 'ausgabe',
    amount: '',
    category: '',
    description: '',
    date: formatDateLocal(new Date()), // Internal format: YYYY-MM-DD
    paymentMethod: 'Karte',
  });
  
  // Display date in German format (DD.MM.YYYY)
  const [financeDateDisplay, setFinanceDateDisplay] = useState(formatDateGerman(new Date()));
  const [isSubmittingFinance, setIsSubmittingFinance] = useState(false);
  
  // Shopping form state
  const [shoppingForm, setShoppingForm] = useState({
    name: '',
    quantity: '1',
    category: 'Lebensmittel',
    store: '',
  });
  const [isSubmittingShopping, setIsSubmittingShopping] = useState(false);
  
  const shoppingCategories = [
    'Lebensmittel',
    'Getränke',
    'Haushalt',
    'Hygiene',
    'Tierbedarf',
    'Sonstiges'
  ];
  
  const handleCreateShoppingItem = async () => {
    if (!shoppingForm.name) {
      toast.error('Bitte Artikelname eingeben');
      return;
    }
    
    setIsSubmittingShopping(true);
    try {
      await createShoppingItem({
        item: shoppingForm.name,
        quantity: parseInt(shoppingForm.quantity) || 1,
        category: shoppingForm.category,
        estimatedPrice: 0,
        currency: 'EUR',
        unit: null,
      });
      
      toast.success('Artikel zur Einkaufsliste hinzugefügt');
      setShowShoppingModal(false);
      setShoppingForm({
        name: '',
        quantity: '1',
        category: 'Lebensmittel',
        store: '',
      });
    } catch (error) {
      toast.error('Fehler beim Hinzufügen des Artikels');
      console.error(error);
    } finally {
      setIsSubmittingShopping(false);
    }
  };
  
  const financeCategories = {
    income: ['Gehalt', 'Freelance', 'Investitionen', 'Geschenk', 'Sonstiges'],
    expense: ['Lebensmittel', 'Transport', 'Wohnen', 'Unterhaltung', 'Gesundheit', 'Kleidung', 'Bildung', 'Rechnung', 'Sonstiges']
  };
  
  const handleCreateFinanceEntry = async () => {
    if (!financeForm.amount || !financeForm.category) {
      toast.error('Bitte Betrag und Kategorie eingeben');
      return;
    }
    
    setIsSubmittingFinance(true);
    try {
      await createFinanceEntry({
        type: financeForm.type,
        category: financeForm.category,
        amount: Math.round(parseFloat(financeForm.amount) * 100),
        currency: 'CHF',
        date: new Date(financeForm.date),
        paymentMethod: financeForm.paymentMethod,
        notes: financeForm.description || '',
        status: financeForm.type === 'ausgabe' ? 'open' : undefined,
      } as any);
      
      toast.success(financeForm.type === 'einnahme' ? 'Einnahme hinzugefügt' : 'Ausgabe hinzugefügt');
      const today = formatDateLocal(new Date());
      setShowFinanceModal(false);
      setFinanceForm({
        type: 'ausgabe',
        amount: '',
        category: '',
        description: '',
        date: today,
        paymentMethod: 'Karte',
      });
      setFinanceDateDisplay(formatDateGerman(today));
    } catch (error) {
      toast.error('Fehler beim Erstellen des Eintrags');
      console.error(error);
    } finally {
      setIsSubmittingFinance(false);
    }
  };
  
  // Initialize with most recent chat (don't create new one automatically)
  useEffect(() => {
    if (!isLoadingHistory && chatHistory.length > 0 && !currentChatId) {
      // Load the most recent chat if available
      setCurrentChatId(chatHistory[0].id);
    }
    // Don't create a new chat automatically - only when user sends a message or clicks "New Conversation"
  }, [isLoadingHistory, chatHistory, currentChatId]);
  
  const [messages, setMessages] = useState<Message[]>([SYSTEM_MESSAGE]);
  const lastChatIdRef = useRef<string | null>(null);
  const isSavingRef = useRef(false);

  // Load messages when chat changes (only when currentChatId changes, not when chatHistory updates)
  useEffect(() => {
    // Only reload messages if the chat ID actually changed
    if (currentChatId && currentChatId !== lastChatIdRef.current) {
      lastChatIdRef.current = currentChatId;
      
      if (chatHistory.length > 0) {
        const chat = getChatConversation(currentChatId, chatHistory);
        if (chat && chat.messages.length > 0) {
          setMessages(chat.messages);
        } else {
          setMessages([SYSTEM_MESSAGE]);
        }
      } else {
        setMessages([SYSTEM_MESSAGE]);
      }
    }
  }, [currentChatId, chatHistory]); // Include chatHistory but only reload if chatId changed

  // Save messages to chat history (debounced)
  useEffect(() => {
    // Don't save if we're currently saving (to avoid race conditions)
    if (isSavingRef.current) return;
    
    if (currentChatId && messages.length > 1) { // More than just system message
      const timeoutId = setTimeout(async () => {
        isSavingRef.current = true;
        try {
          const chat = getChatConversation(currentChatId, chatHistory);
          // If chat exists in history, update it; otherwise create a new one
          if (chat) {
            // Generate title from first user message if not set
            const firstUserMessage = messages.find(m => m.role === 'user');
            if (firstUserMessage && chat.title === 'Neue Konversation') {
              chat.title = generateChatTitle(firstUserMessage.content);
            }
            
            chat.messages = messages;
            chat.updatedAt = new Date().toISOString();
            
            await saveChatConversation(chat);
          } else {
            // Chat doesn't exist in history yet, create it
            const firstUserMessage = messages.find(m => m.role === 'user');
            const newChat: ChatConversation = {
              id: currentChatId,
              userId: '',
              title: firstUserMessage ? generateChatTitle(firstUserMessage.content) : 'Neue Konversation',
              messages: messages,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await saveChatConversation(newChat);
            // Update currentChatId with the Firebase ID if it was a temporary ID
            if (newChat.id.startsWith('chat_')) {
              // The ID will be updated by saveChatConversation
              setCurrentChatId(newChat.id);
            }
          }
          // Don't refetch immediately - let it happen naturally or on next interaction
          // refetchHistory(); // Removed to prevent race condition
        } catch (error) {
          const isDev = typeof (globalThis as any).process !== 'undefined' && (globalThis as any).process?.env?.NODE_ENV === 'development';
          if (isDev) {
            console.error('Error saving chat:', error);
          }
        } finally {
          isSavingRef.current = false;
        }
      }, 1000); // Debounce by 1 second
      
      return () => clearTimeout(timeoutId);
    }
  }, [messages, currentChatId, chatHistory]);

  const handleNewConversation = useCallback(async () => {
    try {
      const newChat = createNewChat();
      // Save to Firebase - this will update newChat.id with Firebase ID
      await saveChatConversation(newChat);
      // Set the current chat ID to the Firebase ID
      setCurrentChatId(newChat.id);
      setMessages([SYSTEM_MESSAGE]);
      await refetchHistory();
      toast.success('Neue Konversation gestartet');
    } catch (error: any) {
      console.error('Error creating new chat:', error);
      // Better error handling
      let errorMessage = 'Fehler beim Erstellen der neuen Konversation';
      if (error?.code === 'unauthenticated' || error?.message?.includes('unauthenticated')) {
        errorMessage = 'Bitte melde dich an, um eine neue Konversation zu erstellen';
      } else if (error?.code === 'permission-denied' || error?.message?.includes('permission')) {
        errorMessage = 'Keine Berechtigung zum Erstellen einer Konversation';
      } else if (error?.message) {
        errorMessage = `Fehler: ${error.message}`;
      } else if (typeof error === 'string') {
        errorMessage = `Fehler: ${error}`;
      }
      toast.error(errorMessage);
    }
  }, [refetchHistory]);

  const handleSelectChat = useCallback((chatId: string) => {
    setCurrentChatId(chatId);
    const chat = getChatConversation(chatId, chatHistory);
    if (chat && chat.messages.length > 0) {
      setMessages(chat.messages);
    } else {
      setMessages([SYSTEM_MESSAGE]);
    }
  }, [chatHistory]);

  const chatMutation = trpc.ai.chat.useMutation({
    onSuccess: (data) => {
      const aiResponse: Message = {
        role: 'assistant',
        content: data.content,
      };
      setMessages((prev) => [...prev, aiResponse]);
    },
    onError: (error) => {
      let errorMessage = 'Ein unbekannter Fehler ist aufgetreten.';
      
      if (error.message.includes('<!doctype') || error.message.includes('Unexpected token') || error.message.includes('Failed to fetch')) {
        errorMessage = 'Der Server ist nicht erreichbar oder gibt eine ungültige Antwort zurück. Bitte stelle sicher, dass der Server läuft und du eine Internetverbindung hast.';
      } else if (error.message.includes('Unable to transform') || error.message.includes('NetworkError')) {
        errorMessage = 'Fehler bei der Datenübertragung. Bitte überprüfe deine Internetverbindung und versuche es erneut.';
      } else if (error.data?.code === 'UNAUTHORIZED' || error.message.includes('unauthenticated')) {
        errorMessage = 'Du bist nicht angemeldet. Bitte melde dich an.';
      } else if (error.data?.code === 'INTERNAL_SERVER_ERROR' || error.message.includes('500')) {
        errorMessage = 'Ein Serverfehler ist aufgetreten. Bitte versuche es später erneut.';
      } else if (error.message.includes('timeout') || error.message.includes('Timeout')) {
        errorMessage = 'Die Anfrage hat zu lange gedauert. Bitte versuche es erneut.';
      } else if (error.message.includes('rate limit') || error.message.includes('429')) {
        errorMessage = 'Zu viele Anfragen. Bitte warte einen Moment und versuche es erneut.';
      } else {
        errorMessage = error.message || 'Ein Fehler ist aufgetreten.';
      }
      
      const errorResponse: Message = {
        role: 'assistant',
        content: `**Fehler aufgetreten**\n\n${errorMessage}\n\nBitte versuche es erneut oder starte eine neue Konversation.`,
      };
      setMessages((prev) => [...prev, errorResponse]);
      toast.error('Fehler beim Senden der Nachricht');
      
      const isDev = typeof (globalThis as any).process !== 'undefined' && (globalThis as any).process?.env?.NODE_ENV === 'development';
      if (isDev) {
        console.error('AI Chat Error:', {
          message: error.message,
          code: error.data?.code,
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
    },
  });

  const handleSendMessage = useCallback(async (content: string) => {
    if (content.length > 10000) {
      toast.error('Nachricht ist zu lang. Bitte kürze sie auf maximal 10.000 Zeichen.');
      return;
    }
    
    // Create a new chat if none exists
    if (!currentChatId) {
      try {
        const newChat = createNewChat();
        await saveChatConversation(newChat);
        // saveChatConversation updates newChat.id with the Firebase ID
        setCurrentChatId(newChat.id);
        await refetchHistory();
      } catch (error) {
        toast.error('Fehler beim Erstellen der Konversation');
        return;
      }
    }
    
    const userMessages = messages.filter(m => m.role === 'user');
    if (userMessages.length >= 50) {
      toast.warning('Zu viele Nachrichten in dieser Konversation. Bitte starte eine neue Konversation.');
      return;
    }
    
    try {
      const userMessage: Message = { role: 'user', content };
      const newMessages: Message[] = [...messages, userMessage];
      setMessages(newMessages);

      chatMutation.mutate({
        messages: newMessages,
      });
    } catch (error) {
      const isDev = typeof (globalThis as any).process !== 'undefined' && (globalThis as any).process?.env?.NODE_ENV === 'development';
      if (isDev) {
        console.error('Error in handleSendMessage:', error);
      }
      toast.error('Fehler beim Senden der Nachricht. Bitte versuche es erneut.');
    }
  }, [messages, chatMutation, currentChatId, refetchHistory]);

  const suggestedPrompts = useMemo(() => [
    { 
      text: 'Wie funktioniert die Rechnungsverwaltung?', 
      subtitle: 'Lerne die Rechnungsverwaltung kennen',
      icon: 'receipt' as const 
    },
    { 
      text: 'Wie erstelle ich eine Erinnerung?', 
      subtitle: 'Erstelle Termine und Erinnerungen',
      icon: 'bell' as const 
    },
    { 
      text: 'Wie verwalte ich meine Finanzen?', 
      subtitle: 'Verwalte Einnahmen und Ausgaben',
      icon: 'wallet' as const 
    },
    { 
      text: 'Was kann ich mit der Einkaufsliste machen?', 
      subtitle: 'Verwalte deine Einkaufsliste',
      icon: 'shoppingCart' as const 
    },
    { 
      text: 'Wie funktioniert das Raten-System?', 
      subtitle: 'Lerne Ratenzahlungen zu verwalten',
      icon: 'calendar' as const 
    },
    { 
      text: 'Wie scanne ich eine Rechnung?', 
      subtitle: 'Erfasse Rechnungen automatisch',
      icon: 'scan' as const 
    },
  ], []);
  
  const hasUserMessages = messages.some(m => m.role === 'user');

  const getCurrentChatTitle = () => {
    if (currentChatId && chatHistory.length > 0) {
      const chat = chatHistory.find(c => c.id === currentChatId);
      return chat?.title || 'Assistent';
    }
    return 'Assistent';
  };

  // Quick Actions für den Header
  const quickActions = useMemo(() => [
    { 
      id: 'reminder', 
      label: 'Erinnerung erstellen',
      path: '#',
      icon: Bell,
      onClick: () => setShowReminderModal(true)
    },
    { 
      id: 'scan', 
      label: 'Rechnung scannen',
      path: '#',
      icon: ScanLine,
      onClick: () => {
        setShowBillModal(true);
        setScannedImage(null);
      }
    },
    { 
      id: 'finance', 
      label: 'Finanzübersicht',
      path: '#',
      icon: Wallet,
      onClick: () => setShowFinanceModal(true)
    },
    { 
      id: 'shopping', 
      label: 'Einkaufsliste',
      path: '#',
      icon: ShoppingCart,
      onClick: () => setShowShoppingModal(true)
    },
  ], []);
  
  const handleCreateReminder = async () => {
    if (!reminderForm.title || !reminderForm.dueDate) {
      toast.error('Bitte füllen Sie Titel und Datum aus');
      return;
    }
    
    setIsSubmittingReminder(true);
    try {
      const amount = reminderForm.amount ? Math.round(parseFloat(reminderForm.amount) * 100) : undefined;
      await createReminder({
        title: reminderForm.title,
        type: reminderForm.type,
        dueDate: new Date(reminderForm.dueDate),
        isAllDay: reminderForm.isAllDay,
        amount,
        currency: reminderForm.currency,
        notes: reminderForm.notes || '',
      });
      toast.success('Erinnerung erstellt');
      setShowReminderModal(false);
      setReminderForm({
        title: '',
        type: 'termin',
        dueDate: '', // Empty - user must select
        isAllDay: false,
        amount: '',
        currency: 'CHF',
        notes: '',
      });
    } catch (error) {
      toast.error('Fehler beim Erstellen der Erinnerung');
      console.error(error);
    } finally {
      setIsSubmittingReminder(false);
    }
  };
  
  // Scanner functions
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
      hapticSuccess();
    } catch (error) {
      toast.error(formatErrorForDisplay(error));
      hapticError();
      const isDev = typeof (globalThis as any).process !== 'undefined' && (globalThis as any).process?.env?.NODE_ENV === 'development';
      if (isDev) {
        console.error(error);
      }
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
        const imageData = canvas.toDataURL('image/jpeg');
        setScannedImage(imageData);
        stopCamera();
        hapticSuccess();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target?.result as string;
        setScannedImage(imageData);
        hapticSuccess();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddScanToChat = async () => {
    if (scannedImage) {
      // Send image as markdown image link
      const message: Message = {
        role: 'user',
        content: `![Gescanntes Bild](${scannedImage})`
      };
      setMessages((prev) => [...prev, message]);
      setScannedImage(null);
      setShowBillModal(false);
      toast.success('Scan zum Chat hinzugefügt');
      
      // Trigger AI response
      try {
        chatMutation.mutate({
          messages: [...messages, message],
        });
      } catch (error) {
        console.error('Error sending scan to chat:', error);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (!showBillModal) {
        stopCamera();
      }
    };
  }, [showBillModal]);

  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-inset">
      {/* Unified Header for AI Chat - konsistent mit anderen Seiten */}
      <PageHeader
        title={getCurrentChatTitle()}
        showSidebar={true}
        showQuickActions={true}
        quickActions={quickActions}
        currentChatId={currentChatId || undefined}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewConversation}
        sidebarOpen={sidebarOpen}
        onSidebarToggle={setSidebarOpen}
      />

      {/* Fixed Quick Actions at Top */}
      {quickActions.length > 0 && (
        <div className="fixed top-14 left-0 right-0 z-30 px-4 py-3 flex flex-row gap-3 justify-center safe-top" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
          {/* Hamburger Menu as first icon */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-12 h-12 rounded-full bg-background hover:bg-muted border border-border transition-colors flex items-center justify-center active:scale-95 shadow-sm"
            aria-label="Menü öffnen"
            aria-expanded={sidebarOpen}
            aria-controls="sidebar-menu"
            title="Menü öffnen"
          >
            <LayoutGrid className="w-5 h-5 text-foreground" />
          </button>
          {quickActions.map((action) => {
            const IconComponent = action.icon;
            return (
              <button
                key={action.id}
                onClick={action.onClick}
                className="w-12 h-12 rounded-full bg-background hover:bg-muted border border-border transition-colors flex items-center justify-center active:scale-95 shadow-sm"
                aria-label={action.label}
                title={action.label}
              >
                {IconComponent && <IconComponent className="w-5 h-5 text-foreground" />}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex-1 overflow-hidden flex flex-col bg-background" style={{ paddingTop: quickActions.length > 0 ? '7rem' : '3.5rem' }}>

        <div className="flex-1 flex flex-col w-full overflow-hidden min-h-0">
          <AIChatBox
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={chatMutation.isPending}
            placeholder={t('common.typeMessage', 'Nachricht eingeben...')}
            height="100%"
            emptyStateMessage="Wähle eine Frage oder stelle deine eigene"
            suggestedPrompts={hasUserMessages ? [] : suggestedPrompts}
          />
        </div>
      </div>
      
      {/* Reminder Modal */}
      <Dialog open={showReminderModal} onOpenChange={(open) => {
        setShowReminderModal(open);
        if (!open) {
          // Reset form when closing
          setReminderForm({
            title: '',
            type: 'termin',
            dueDate: '', // Empty - user must select
            isAllDay: false,
            amount: '',
            currency: 'CHF',
            notes: '',
          });
        }
      }}>
        <DialogContent className="!fixed !top-[50%] !left-[50%] !right-auto !bottom-auto !translate-x-[-50%] !translate-y-[-50%] !w-[85vw] !max-w-sm !max-h-fit !rounded-3xl !m-0 !overflow-visible !shadow-2xl">
          <DialogHeader className="px-5 pt-5 pb-3">
            <DialogTitle className="text-lg font-semibold">Erinnerung erstellen</DialogTitle>
            <DialogDescription className="sr-only">
              Erstellen Sie eine neue Erinnerung basierend auf der Chat-Konversation
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 px-5 pb-2">
            <div className="w-full">
              <Label className="text-sm font-medium">Titel *</Label>
              <Input
                value={reminderForm.title}
                onChange={(e) => setReminderForm({ ...reminderForm, title: e.target.value })}
                placeholder="Titel"
                className="h-11 min-h-[44px] mt-1.5 rounded-xl w-full"
              />
            </div>
            
            <div className="w-full">
              <Label className="text-sm font-medium">Typ *</Label>
              <Select
                value={reminderForm.type}
                onValueChange={(value: 'termin' | 'zahlung' | 'aufgabe') => 
                  setReminderForm({ ...reminderForm, type: value })
                }
              >
                <SelectTrigger className="h-11 min-h-[44px] mt-1.5 rounded-xl w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="termin">Termin</SelectItem>
                  <SelectItem value="zahlung">Zahlung</SelectItem>
                  <SelectItem value="aufgabe">Aufgabe</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full">
              <Label className="text-sm font-medium">Datum & Uhrzeit *</Label>
              <div className="relative w-full mt-1.5">
                <Input
                  type="datetime-local"
                  placeholder="Datum & Uhrzeit auswählen"
                  value={reminderForm.dueDate}
                  onChange={(e) => {
                    setReminderForm({ ...reminderForm, dueDate: e.target.value });
                  }}
                  className="h-11 min-h-[44px] rounded-xl w-full"
                  style={{
                    boxSizing: 'border-box',
                    fontSize: '16px', // Prevents zoom on iOS
                    height: '44px',
                    minHeight: '44px',
                    maxHeight: '44px',
                    padding: '0.5rem 0.75rem',
                    lineHeight: '1.5rem',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    MozAppearance: 'textfield',
                  }}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Switch
                checked={reminderForm.isAllDay}
                onCheckedChange={(checked) => setReminderForm({ ...reminderForm, isAllDay: checked })}
              />
              <Label className="text-sm font-medium">Ganztägig</Label>
            </div>
            
            {reminderForm.type === 'zahlung' && (
              <>
                <div className="w-full">
                  <Label className="text-sm font-medium">Betrag</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={reminderForm.amount}
                    onChange={(e) => setReminderForm({ ...reminderForm, amount: e.target.value })}
                    placeholder="0.00"
                    className="h-11 min-h-[44px] mt-1.5 rounded-xl w-full"
                  />
                </div>
                
                <div className="w-full">
                  <Label className="text-sm font-medium">Währung</Label>
                  <Select
                    value={reminderForm.currency}
                    onValueChange={(value) => setReminderForm({ ...reminderForm, currency: value })}
                  >
                    <SelectTrigger className="h-11 min-h-[44px] mt-1.5 rounded-xl w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CHF">CHF</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            
            <div className="w-full">
              <Label className="text-sm font-medium">Notizen</Label>
              <Textarea
                value={reminderForm.notes}
                onChange={(e) => setReminderForm({ ...reminderForm, notes: e.target.value })}
                placeholder="Notizen..."
                className="mt-1.5 min-h-[80px] rounded-xl w-full"
              />
            </div>
          </div>
          
          <DialogFooter className="px-5 pb-3 pt-2 gap-2.5">
            <Button variant="outline" onClick={() => setShowReminderModal(false)} className="h-11 min-h-[44px] flex-1 rounded-xl text-sm font-medium">
              Abbrechen
            </Button>
            <Button 
              onClick={handleCreateReminder} 
              disabled={isSubmittingReminder}
              className="h-11 min-h-[44px] flex-1 rounded-xl text-sm font-medium"
            >
              {isSubmittingReminder ? 'Speichert...' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Bill Scan Modal */}
      <Dialog open={showBillModal} onOpenChange={(open) => {
        setShowBillModal(open);
        if (!open) {
          stopCamera();
          setScannedImage(null);
        }
      }}>
        <DialogContent className="!fixed !top-[50%] !left-[50%] !right-auto !bottom-auto !translate-x-[-50%] !translate-y-[-50%] !w-[85vw] !max-w-sm !max-h-fit !rounded-3xl !m-0 !overflow-visible !shadow-2xl">
          <DialogHeader className="px-5 pt-5 pb-3">
            <DialogTitle className="text-lg font-semibold">Rechnung scannen</DialogTitle>
            <DialogDescription className="sr-only">
              Scannen Sie eine Rechnung mit der Kamera oder laden Sie ein Bild hoch
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 px-5 pb-2">
            {!showCamera && !scannedImage && (
              <div className="space-y-2.5">
                <Button
                  onClick={startCamera}
                  className="w-full h-11 flex items-center justify-center gap-2 rounded-xl text-sm font-medium"
                >
                  <Camera className="w-4 h-4" />
                  Kamera öffnen
                </Button>
                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-11 flex items-center justify-center gap-2 rounded-xl text-sm font-medium"
                  >
                    <Upload className="w-4 h-4" />
                    Bild hochladen
                  </Button>
                </div>
              </div>
            )}
            
            {showCamera && (
              <div className="space-y-2.5">
                <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={stopCamera}
                    className="flex-1 h-11 rounded-xl text-sm font-medium"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Abbrechen
                  </Button>
                  <Button
                    onClick={capturePhoto}
                    className="flex-1 h-11 rounded-xl text-sm font-medium"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Aufnehmen
                  </Button>
                </div>
              </div>
            )}
            
            {scannedImage && (
              <div className="space-y-2.5">
                <div className="relative bg-black rounded-xl overflow-hidden">
                  <img
                    src={scannedImage}
                    alt="Gescanntes Bild"
                    className="w-full h-auto"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setScannedImage(null);
                      setShowCamera(false);
                    }}
                    className="flex-1 h-11 rounded-xl text-sm font-medium"
                  >
                    Neu scannen
                  </Button>
                  <Button
                    onClick={handleAddScanToChat}
                    className="flex-1 h-11 rounded-xl text-sm font-medium"
                  >
                    Zum Chat hinzufügen
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="px-5 pb-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowBillModal(false);
                stopCamera();
                setScannedImage(null);
              }}
              className="h-11 min-h-[44px] w-full rounded-xl text-sm font-medium"
            >
              Schliessen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Finance Modal */}
      <Dialog open={showFinanceModal} onOpenChange={(open) => {
        setShowFinanceModal(open);
        if (open) {
          // Update date when dialog opens to ensure correct date
          const today = formatDateLocal(new Date());
          setFinanceForm(prev => ({
            ...prev,
            date: today,
          }));
          setFinanceDateDisplay(formatDateGerman(today));
        } else {
          const today = formatDateLocal(new Date());
          setFinanceForm({
            type: 'ausgabe',
            amount: '',
            category: '',
            description: '',
            date: today,
            paymentMethod: 'Karte',
          });
          setFinanceDateDisplay(formatDateGerman(today));
        }
      }}>
        <DialogContent className="!fixed !top-[50%] !left-[50%] !right-auto !bottom-auto !translate-x-[-50%] !translate-y-[-50%] !w-[85vw] !max-w-sm !max-h-fit !rounded-3xl !m-0 !overflow-visible !shadow-2xl">
          <DialogHeader className="px-5 pt-5 pb-3">
            <DialogTitle className="text-lg font-semibold">Einnahme / Ausgabe</DialogTitle>
            <DialogDescription className="sr-only">
              Erstellen Sie einen neuen Finanz-Eintrag für Einnahmen oder Ausgaben
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 px-5 pb-2">
            <div>
              <Label className="text-sm font-medium">Typ *</Label>
              <Select
                value={financeForm.type}
                onValueChange={(value: 'einnahme' | 'ausgabe') => {
                  setFinanceForm({ ...financeForm, type: value, category: '' });
                }}
              >
                <SelectTrigger className="h-11 min-h-[44px] mt-1.5 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="einnahme">Einnahme</SelectItem>
                  <SelectItem value="ausgabe">Ausgabe</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Betrag *</Label>
              <Input
                type="number"
                step="0.01"
                value={financeForm.amount}
                onChange={(e) => setFinanceForm({ ...financeForm, amount: e.target.value })}
                placeholder="0.00"
                className="h-11 min-h-[44px] mt-1.5 rounded-xl"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium">Kategorie *</Label>
              <Select
                value={financeForm.category}
                onValueChange={(value) => setFinanceForm({ ...financeForm, category: value })}
              >
                <SelectTrigger className="h-11 min-h-[44px] mt-1.5 rounded-xl">
                  <SelectValue placeholder="Kategorie wählen" />
                </SelectTrigger>
                <SelectContent>
                  {(financeForm.type === 'einnahme' ? financeCategories.income : financeCategories.expense).map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Datum *</Label>
              <Input
                type="text"
                placeholder="DD.MM.YYYY"
                value={financeDateDisplay}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  setFinanceDateDisplay(inputValue);
                  
                  // Try to parse the German date format
                  const parsed = parseDateGerman(inputValue);
                  if (parsed) {
                    setFinanceForm({ ...financeForm, date: parsed });
                  }
                }}
                onBlur={(e) => {
                  // Validate and format on blur
                  const parsed = parseDateGerman(e.target.value);
                  if (parsed) {
                    setFinanceForm({ ...financeForm, date: parsed });
                    setFinanceDateDisplay(formatDateGerman(parsed));
                  } else if (e.target.value) {
                    // If invalid, try to keep current valid date
                    setFinanceDateDisplay(formatDateGerman(financeForm.date));
                  }
                }}
                className="h-11 min-h-[44px] mt-1.5 rounded-xl"
              />
            </div>
            
            <div>
              <Label>Zahlungsmethode</Label>
              <Select
                value={financeForm.paymentMethod}
                onValueChange={(value) => setFinanceForm({ ...financeForm, paymentMethod: value })}
              >
                <SelectTrigger className="h-11 min-h-[44px] mt-1.5 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Karte">Karte</SelectItem>
                  <SelectItem value="Bar">Bar</SelectItem>
                  <SelectItem value="Überweisung">Überweisung</SelectItem>
                  <SelectItem value="Andere">Andere</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Beschreibung</Label>
              <Textarea
                value={financeForm.description}
                onChange={(e) => setFinanceForm({ ...financeForm, description: e.target.value })}
                placeholder="Beschreibung..."
                className="mt-1 min-h-[80px]"
              />
            </div>
          </div>
          
          <DialogFooter className="px-5 pb-3 pt-2 gap-2.5">
            <Button variant="outline" onClick={() => setShowFinanceModal(false)} className="h-11 min-h-[44px] flex-1 rounded-xl text-sm font-medium">
              Abbrechen
            </Button>
            <Button 
              onClick={handleCreateFinanceEntry} 
              disabled={isSubmittingFinance}
              className="h-11 min-h-[44px] flex-1 rounded-xl text-sm font-medium"
            >
              {isSubmittingFinance ? 'Speichert...' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Shopping Modal */}
      <Dialog open={showShoppingModal} onOpenChange={(open) => {
        setShowShoppingModal(open);
        if (!open) {
          setShoppingForm({
            name: '',
            quantity: '1',
            category: 'Lebensmittel',
            store: '',
          });
        }
      }}>
        <DialogContent className="!fixed !top-[50%] !left-[50%] !right-auto !bottom-auto !translate-x-[-50%] !translate-y-[-50%] !w-[85vw] !max-w-sm !max-h-fit !rounded-3xl !m-0 !overflow-visible !shadow-2xl">
          <DialogHeader className="px-5 pt-5 pb-3">
            <DialogTitle className="text-lg font-semibold">Artikel zur Einkaufsliste hinzufügen</DialogTitle>
            <DialogDescription className="sr-only">
              Fügen Sie einen neuen Artikel zur Einkaufsliste hinzu
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 px-5 pb-2">
            <div>
              <Label className="text-sm font-medium">Artikelname *</Label>
              <Input
                value={shoppingForm.name}
                onChange={(e) => setShoppingForm({ ...shoppingForm, name: e.target.value })}
                placeholder="z.B. Milch"
                className="h-11 min-h-[44px] mt-1.5 rounded-xl"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium">Menge</Label>
              <Input
                type="number"
                min="1"
                value={shoppingForm.quantity}
                onChange={(e) => setShoppingForm({ ...shoppingForm, quantity: e.target.value })}
                placeholder="1"
                className="h-11 min-h-[44px] mt-1.5 rounded-xl"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium">Kategorie</Label>
              <Select
                value={shoppingForm.category}
                onValueChange={(value) => setShoppingForm({ ...shoppingForm, category: value })}
              >
                <SelectTrigger className="h-11 min-h-[44px] mt-1.5 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {shoppingCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Geschäft (optional)</Label>
              <Input
                value={shoppingForm.store}
                onChange={(e) => setShoppingForm({ ...shoppingForm, store: e.target.value })}
                placeholder="z.B. Migros"
                className="h-11 min-h-[44px] mt-1.5 rounded-xl"
              />
            </div>
          </div>
          
          <DialogFooter className="px-5 pb-3 pt-2 gap-2.5">
            <Button variant="outline" onClick={() => setShowShoppingModal(false)} className="h-11 min-h-[44px] flex-1 rounded-xl text-sm font-medium">
              Abbrechen
            </Button>
            <Button 
              onClick={handleCreateShoppingItem} 
              disabled={isSubmittingShopping}
              className="h-11 min-h-[44px] flex-1 rounded-xl text-sm font-medium"
            >
              {isSubmittingShopping ? 'Speichert...' : 'Hinzufügen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

