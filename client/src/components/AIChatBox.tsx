import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { 
  Loader2, Send, Paperclip, Image, Globe, Mic, Tag, FileText, Zap, ArrowUp, 
  ClipboardList, Bell, Wallet, ShoppingCart, Calendar, ScanLine,
  // Icons für AI-Antworten
  LayoutDashboard, Users, Settings, Check, Plus, Search, Edit, Trash,
  Clock, Euro, TrendingUp, TrendingDown, Info, AlertCircle, type LucideIcon
} from "lucide-react";
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Streamdown } from "streamdown";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";

/**
 * Message type matching server-side LLM Message interface
 */
export type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type SuggestedPrompt = {
  text: string;
  icon: 'tag' | 'fileText' | 'zap' | 'receipt' | 'bell' | 'wallet' | 'shoppingCart' | 'calendar' | 'scan';
};

export type AIChatBoxProps = {
  /**
   * Messages array to display in the chat.
   * Should match the format used by invokeLLM on the server.
   */
  messages: Message[];

  /**
   * Callback when user sends a message.
   * Typically you'll call a tRPC mutation here to invoke the LLM.
   */
  onSendMessage: (content: string) => void;

  /**
   * Whether the AI is currently generating a response
   */
  isLoading?: boolean;

  /**
   * Placeholder text for the input field
   */
  placeholder?: string;

  /**
   * Custom className for the container
   */
  className?: string;

  /**
   * Height of the chat box (default: 600px)
   */
  height?: string | number;

  /**
   * Empty state message to display when no messages
   */
  emptyStateMessage?: string;

  /**
   * Suggested prompts to display (always visible at top)
   * Can be array of strings or objects with text and icon
   */
  suggestedPrompts?: string[] | SuggestedPrompt[];
};

// Icon mapping - passend zum Kontext (für Bubbles)
const iconMap = {
  tag: Tag,
  fileText: FileText,
  zap: Zap,
  receipt: ClipboardList,
  bell: Bell,
  wallet: Wallet,
  shoppingCart: ShoppingCart,
  calendar: Calendar,
  scan: ScanLine,
};

// Icon mapping für AI-Antworten - [icon:name] Syntax
const aiIconMap: Record<string, LucideIcon> = {
  'layout-dashboard': LayoutDashboard,
  'calendar': Calendar,
  'bell': Bell,
  'wallet': Wallet,
  'users': Users,
  'file-text': FileText,
  'folder': ScanLine,
  'scan-line': ScanLine,
  'shopping-cart': ShoppingCart,
  'receipt': ClipboardList,
  'clipboard-list': ClipboardList,
  'settings': Settings,
  'check': Check,
  'plus': Plus,
  'search': Search,
  'edit': Edit,
  'trash': Trash,
  'clock': Clock,
  'euro': Euro,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  'info': Info,
  'alert-circle': AlertCircle,
};

// Route Mapping für Navigation Links [nav:route|Label]
const navRouteMap: Record<string, { path: string; icon: LucideIcon }> = {
  'dashboard': { path: '/', icon: LayoutDashboard },
  'calendar': { path: '/calendar', icon: Calendar },
  'reminders': { path: '/reminders', icon: Bell },
  'finances': { path: '/finance', icon: Wallet },
  'finance': { path: '/finance', icon: Wallet },
  'finanzen': { path: '/finance', icon: Wallet },
  'people': { path: '/people', icon: Users },
  'personen': { path: '/people', icon: Users },
  'invoices': { path: '/bills', icon: ClipboardList },
  'bills': { path: '/bills', icon: ClipboardList },
  'rechnungen': { path: '/bills', icon: ClipboardList },
  'documents': { path: '/documents', icon: ScanLine },
  'dokumente': { path: '/documents', icon: ScanLine },
  'shopping': { path: '/shopping', icon: ShoppingCart },
  'einkaufsliste': { path: '/shopping', icon: ShoppingCart },
  'settings': { path: '/settings', icon: Settings },
  'einstellungen': { path: '/settings', icon: Settings },
};

// Komponente für AI-Nachrichten mit Navigation-Link-Support
function AIMessageContent({ content, onNavigate }: { content: string; onNavigate?: (route: string) => void }) {
  // Parse den Content und ersetze [nav:route|Label] durch anklickbare Links
  const renderedContent = useMemo(() => {
    const segments: React.ReactNode[] = [];
    
    // Sicherheitscheck: Maximal 10000 Zeichen verarbeiten
    const safeContent = content.length > 10000 ? content.substring(0, 10000) + '...' : content;
    
    let lastIndex = 0;
    let keyIndex = 0;
    
    // Verbesserte Regex für beide Syntaxen - robuster gegen verschachtelte Brackets
    // Unterstützt sowohl | als auch ｜ (Unicode pipe)
    const combinedRegex = /\[(nav|icon):([a-zA-Z0-9_-]+)(?:[|｜]([^\]]+))?\]/g;
    let match;
    const matches: Array<{ index: number; type: string; key: string; label?: string; endIndex: number }> = [];
    
    // Sammle alle Matches zuerst
    while ((match = combinedRegex.exec(safeContent)) !== null) {
      matches.push({
        index: match.index,
        type: match[1],
        key: match[2],
        label: match[3],
        endIndex: match.index + match[0].length,
      });
    }

    // Verarbeite Matches in Reihenfolge
    for (const matchInfo of matches) {
      // Text vor dem Match
      if (matchInfo.index > lastIndex) {
        const textBefore = safeContent.slice(lastIndex, matchInfo.index);
        segments.push(<span key={`text-${keyIndex++}`} dangerouslySetInnerHTML={{ __html: formatMarkdown(textBefore) }} />);
      }
      
      if (matchInfo.type === 'nav' && matchInfo.label) {
        // [nav:route|Label] Syntax
        const routeKey = matchInfo.key;
        const label = matchInfo.label;
        const navInfo = navRouteMap[routeKey];
        
        if (navInfo && onNavigate) {
          const IconComponent = navInfo.icon;
          segments.push(
            <button
              key={`nav-${keyIndex++}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                  onNavigate(navInfo.path);
                } catch (error) {
                  console.error('Navigation error:', error);
                }
              }}
              className="inline-flex items-center gap-1.5 px-2 py-1 mx-0.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-medium text-sm transition-all duration-200 cursor-pointer border border-primary/20 hover:border-primary/40 hover:shadow-sm"
              title={`Zu ${label} navigieren`}
            >
              <IconComponent className="size-4" />
              <span className="underline decoration-dotted underline-offset-2">{escapeHtml(label)}</span>
            </button>
          );
        } else {
          // Fallback wenn Route nicht gefunden
          segments.push(<span key={`nav-text-${keyIndex++}`} className="font-medium text-primary">{escapeHtml(label)}</span>);
        }
      } else if (matchInfo.type === 'icon') {
        // [icon:name] Syntax (einfaches Icon)
        const iconName = matchInfo.key;
        const IconComponent = aiIconMap[iconName];
        
        if (IconComponent) {
          segments.push(
            <IconComponent 
              key={`icon-${keyIndex++}`} 
              className="inline-block size-4 mx-0.5 align-text-bottom text-primary" 
            />
          );
        } else {
          segments.push(<span key={`unknown-${keyIndex++}`}>[{escapeHtml(iconName)}]</span>);
        }
      }
      
      lastIndex = matchInfo.endIndex;
    }
    
    // Restlicher Text
    if (lastIndex < safeContent.length) {
      const textAfter = safeContent.slice(lastIndex);
      segments.push(<span key={`text-${keyIndex++}`} dangerouslySetInnerHTML={{ __html: formatMarkdown(textAfter) }} />);
    }
    
    return segments.length > 0 ? segments : [<span key="full" dangerouslySetInnerHTML={{ __html: formatMarkdown(safeContent) }} />];
  }, [content, onNavigate]);

  return (
    <div className="prose prose-sm max-w-none">
      {renderedContent}
    </div>
  );
}

// HTML-Escape-Funktion für Sicherheit
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Einfacher Markdown-Formatierer mit XSS-Schutz
function formatMarkdown(text: string): string {
  // Zuerst HTML escapen für Sicherheit
  let escaped = escapeHtml(text);
  
  // Dann Markdown-Formatierungen anwenden (nach dem Escaping)
  // Bold: **text** oder __text__
  escaped = escaped
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>');
  
  // Italic: *text* oder _text_ (nur wenn nicht Teil von **)
  escaped = escaped.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  
  // Inline code: `code`
  escaped = escaped.replace(/`(.+?)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');
  
  // Line breaks
  escaped = escaped.replace(/\n/g, '<br />');
  
  return escaped;
}

/**
 * Modern AI chat box component matching the Cadillac EV design exactly.
 * Features:
 * - Suggested prompts with icons at top (Tag, FileText, Zap)
 * - Icons INSIDE the input field (left: Paperclip, Image; right: Globe, Mic, ArrowUp)
 * - Clean, minimal white background design
 * - Markdown rendering with Streamdown
 * - Auto-scrolls to latest message
 * - Loading states
 * - Non-clickable message bubbles (prevents accidental logout)
 * - Functional icons: File upload, Image upload, Voice transcription, Language selection
 */
export function AIChatBox({
  messages,
  onSendMessage,
  isLoading = false,
  placeholder = "Nachricht eingeben...",
  className,
  height = "600px",
  emptyStateMessage = "Beginne eine Unterhaltung mit dem Assistenten",
  suggestedPrompts,
}: AIChatBoxProps) {
  const { t, i18n } = useTranslation();
  const [, setLocation] = useLocation();
  const [input, setInput] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputAreaRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  // Navigation Handler - öffnet Popup nach Navigation via Event Bus
  const handleNavigate = useCallback(async (route: string, tutorialSteps?: Array<{ selector: string; title: string; description: string }>) => {
    // Navigiere zur Zielseite
    setLocation(route);
    
    // Optional: Tutorial-Schritte speichern (kann später zu Firebase migriert werden)
    if (tutorialSteps && tutorialSteps.length > 0) {
      localStorage.setItem('nexo_tutorial_highlight', JSON.stringify(tutorialSteps));
    }
    
    // Öffne den Chat-Dialog nach Navigation via Event Bus
    const { eventBus, Events } = await import('@/lib/eventBus');
    setTimeout(() => {
      eventBus.emit(Events.CHAT_DIALOG_OPEN);
    }, 300); // Kurze Verzögerung für sanfte Animation
  }, [setLocation]);

  // Filter out system messages
  const displayMessages = useMemo(() => 
    messages.filter((msg) => msg.role !== "system"), 
    [messages]
  );

  // Normalize suggested prompts
  const normalizedPrompts = useMemo(() => {
    if (!suggestedPrompts) return [];
    return suggestedPrompts.map(prompt => 
      typeof prompt === 'string' 
        ? { text: prompt, icon: 'tag' as const }
        : prompt
    );
  }, [suggestedPrompts]);

  // Scroll to bottom helper function with smooth animation
  const scrollToBottom = useCallback(() => {
    const viewport = scrollAreaRef.current?.querySelector(
      '[data-radix-scroll-area-viewport]'
    ) as HTMLDivElement;

    if (viewport) {
      requestAnimationFrame(() => {
        viewport.scrollTo({
          top: viewport.scrollHeight,
          behavior: 'smooth'
        });
      });
    }
  }, []);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (displayMessages.length > 0) {
      scrollToBottom();
    }
  }, [displayMessages.length, scrollToBottom]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    
    // Validierung: Maximal 10000 Zeichen
    if (!trimmedInput || isLoading) return;
    
    if (trimmedInput.length > 10000) {
      toast.error('Nachricht ist zu lang. Bitte kürze sie auf maximal 10.000 Zeichen.');
      return;
    }
    
    // Verhindere zu schnelle aufeinanderfolgende Anfragen
    if (isLoading) {
      toast.info('Bitte warte auf die Antwort...');
      return;
    }

    try {
      onSendMessage(trimmedInput);
      setInput("");

      // Scroll immediately after sending
      scrollToBottom();

      // Keep focus on input
      textareaRef.current?.focus();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Fehler beim Senden der Nachricht. Bitte versuche es erneut.');
    }
  }, [input, isLoading, onSendMessage, scrollToBottom]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  const handleSuggestedPromptClick = useCallback((prompt: string) => {
    if (isLoading) return;
    onSendMessage(prompt);
    scrollToBottom();
  }, [isLoading, onSendMessage, scrollToBottom]);

  // File upload handler
  const handleFileUpload = useCallback(async (file: File) => {
    // Validierung: Maximal 10MB
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`Datei ist zu gross. Maximal ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB erlaubt.`);
      return;
    }
    
    // Validierung: Dateiname
    if (!file.name || file.name.length > 255) {
      toast.error('Ungültiger Dateiname.');
      return;
    }

    const loadingToast = toast.loading('Datei wird hochgeladen...');
    
    try {
      // Timeout für FileReader (30 Sekunden)
      const base64 = await Promise.race<string>([
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            if (!result || !result.includes(',')) {
              reject(new Error('Ungültiges Dateiformat'));
              return;
            }
            resolve(result.split(',')[1]);
          };
          reader.onerror = () => reject(new Error('Fehler beim Lesen der Datei'));
          reader.readAsDataURL(file);
        }),
        new Promise<string>((_, reject) => 
          setTimeout(() => reject(new Error('Upload-Timeout: Die Datei ist zu gross oder die Verbindung zu langsam.')), 30000)
        ),
      ]);

      const uploadAIChatFile = httpsCallable(functions, 'uploadAIChatFile');
      
      // Timeout für Upload (60 Sekunden)
      const result = await Promise.race([
        uploadAIChatFile({
          fileName: file.name,
          fileData: base64,
          fileType: file.type,
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Upload-Timeout: Die Verbindung ist zu langsam.')), 60000)
        ),
      ]) as any;

      if (!result?.data) {
        throw new Error('Keine Antwort vom Server erhalten');
      }

      const data = result.data as { fileUrl: string; fileName: string };
      if (!data.fileUrl || !data.fileName) {
        throw new Error('Ungültige Server-Antwort');
      }

      toast.dismiss(loadingToast);
      onSendMessage(`[Datei: ${data.fileName}](${data.fileUrl})`);
      toast.success('Datei erfolgreich hochgeladen');
    } catch (error: any) {
      toast.dismiss(loadingToast);
      const errorMsg = error.message || 'Unbekannter Fehler';
      console.error('File upload error:', error);
      toast.error(`Fehler beim Hochladen: ${errorMsg}`);
    }
  }, [onSendMessage]);

  // Image upload handler
  const handleImageUpload = useCallback(async (file: File) => {
    // Validierung: Nur Bilder
    if (!file.type.startsWith('image/')) {
      toast.error('Bitte wähle ein Bild aus (JPG, PNG, GIF, etc.)');
      return;
    }
    
    // Validierung: Maximal 5MB für Bilder
    const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error(`Bild ist zu gross. Maximal ${(MAX_IMAGE_SIZE / 1024 / 1024).toFixed(0)}MB erlaubt.`);
      return;
    }
    
    // Validierung: Dateiname
    if (!file.name || file.name.length > 255) {
      toast.error('Ungültiger Dateiname.');
      return;
    }

    const loadingToast = toast.loading('Bild wird hochgeladen...');

    try {
      // Timeout für FileReader (30 Sekunden)
      const base64 = await Promise.race<string>([
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            if (!result || !result.includes(',')) {
              reject(new Error('Ungültiges Bildformat'));
              return;
            }
            resolve(result.split(',')[1]);
          };
          reader.onerror = () => reject(new Error('Fehler beim Lesen des Bildes'));
          reader.readAsDataURL(file);
        }),
        new Promise<string>((_, reject) => 
          setTimeout(() => reject(new Error('Upload-Timeout: Das Bild ist zu gross oder die Verbindung zu langsam.')), 30000)
        ),
      ]);

      const uploadAIChatImage = httpsCallable(functions, 'uploadAIChatImage');
      
      // Timeout für Upload (60 Sekunden)
      const result = await Promise.race([
        uploadAIChatImage({
          fileName: file.name,
          fileData: base64,
          fileType: file.type,
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Upload-Timeout: Die Verbindung ist zu langsam.')), 60000)
        ),
      ]) as any;

      if (!result?.data) {
        throw new Error('Keine Antwort vom Server erhalten');
      }

      const data = result.data as { imageUrl: string; fileName: string };
      if (!data.imageUrl || !data.fileName) {
        throw new Error('Ungültige Server-Antwort');
      }

      toast.dismiss(loadingToast);
      onSendMessage(`![${data.fileName}](${data.imageUrl})`);
      toast.success('Bild erfolgreich hochgeladen');
    } catch (error: any) {
      toast.dismiss(loadingToast);
      const errorMsg = error.message || 'Unbekannter Fehler';
      console.error('Image upload error:', error);
      toast.error(`Fehler beim Hochladen: ${errorMsg}`);
    }
  }, [onSendMessage]);

  // Voice recording handler
  const handleVoiceRecording = useCallback(async () => {
    if (isRecording && mediaRecorder) {
      // Stop recording
      try {
        mediaRecorder.stop();
        setIsRecording(false);
        toast.info('Aufnahme wird verarbeitet...');
      } catch (error) {
        console.error('Error stopping recording:', error);
        setIsRecording(false);
        toast.error('Fehler beim Stoppen der Aufnahme');
      }
      return;
    }

    try {
      // Prüfe ob Mikrofon verfügbar ist
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Mikrofon-Zugriff wird von diesem Browser nicht unterstützt.');
        return;
      }

      const stream = await Promise.race([
        navigator.mediaDevices.getUserMedia({ audio: true }),
        new Promise<MediaStream>((_, reject) => 
          setTimeout(() => reject(new Error('Mikrofon-Zugriff-Timeout')), 10000)
        ),
      ]);

      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      let recordingTimeout: NodeJS.Timeout | null = null;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        if (recordingTimeout) {
          clearTimeout(recordingTimeout);
        }

        const blob = new Blob(chunks, { type: 'audio/webm' });
        
        // Validierung: Maximal 10MB Audio
        const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10MB
        if (blob.size > MAX_AUDIO_SIZE) {
          toast.error('Audio-Aufnahme ist zu gross. Bitte kürze die Aufnahme.');
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        const loadingToast = toast.loading('Audio wird transkribiert...');

        try {
          const base64 = await Promise.race<string>([
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                const result = reader.result as string;
                if (!result || !result.includes(',')) {
                  reject(new Error('Ungültiges Audioformat'));
                  return;
                }
                resolve(result.split(',')[1]);
              };
              reader.onerror = () => reject(new Error('Fehler beim Lesen der Audio-Datei'));
              reader.readAsDataURL(blob);
            }),
            new Promise<string>((_, reject) => 
              setTimeout(() => reject(new Error('Audio-Verarbeitung-Timeout')), 30000)
            ),
          ]);

          const transcribeAudio = httpsCallable(functions, 'transcribeAIChatAudio');
          
          // Timeout für Transkription (60 Sekunden)
          const result = await Promise.race([
            transcribeAudio({
              audioData: base64,
              mimeType: 'audio/webm',
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Transkription-Timeout: Die Verbindung ist zu langsam.')), 60000)
            ),
          ]) as any;

          if (!result?.data) {
            throw new Error('Keine Antwort vom Server erhalten');
          }

          const data = result.data as { transcription: string };
          if (data.transcription && data.transcription.trim()) {
            setInput(data.transcription.trim());
            textareaRef.current?.focus();
            toast.dismiss(loadingToast);
            toast.success('Spracheingabe erfolgreich');
          } else {
            throw new Error('Keine Transkription erhalten');
          }
        } catch (error: any) {
          toast.dismiss(loadingToast);
          const errorMsg = error.message || 'Unbekannter Fehler';
          console.error('Transcription error:', error);
          toast.error(`Fehler bei der Transkription: ${errorMsg}`);
        } finally {
          stream.getTracks().forEach(track => track.stop());
        }
      };

      recorder.onerror = (event: any) => {
        console.error('MediaRecorder error:', event);
        toast.error('Fehler bei der Aufnahme');
        setIsRecording(false);
        stream.getTracks().forEach(track => track.stop());
      };

      // Maximal 5 Minuten Aufnahme
      recordingTimeout = setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
          toast.warning('Maximale Aufnahmezeit erreicht (5 Minuten)');
        }
      }, 5 * 60 * 1000);

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      toast.info('Aufnahme gestartet... (Klicke erneut zum Stoppen)');
    } catch (error: any) {
      setIsRecording(false);
      const errorMsg = error.message || 'Unbekannter Fehler';
      console.error('Microphone access error:', error);
      
      if (errorMsg.includes('permission') || errorMsg.includes('denied')) {
        toast.error('Mikrofon-Zugriff wurde verweigert. Bitte erlaube den Zugriff in den Browser-Einstellungen.');
      } else if (errorMsg.includes('not found') || errorMsg.includes('not available')) {
        toast.error('Kein Mikrofon gefunden. Bitte verbinde ein Mikrofon.');
      } else {
        toast.error(`Mikrofon-Fehler: ${errorMsg}`);
      }
    }
  }, [isRecording, mediaRecorder]);

  // Language selection handler
  const handleLanguageToggle = useCallback(() => {
    const currentLang = i18n.language;
    const newLang = currentLang === 'de' ? 'en' : 'de';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
    toast.success(newLang === 'de' ? 'Sprache auf Deutsch geändert' : 'Language changed to English');
  }, [i18n]);

  // Render input form - wird in beiden Zuständen verwendet
  const renderInputForm = () => (
    <form
      ref={inputAreaRef}
      onSubmit={handleSubmit}
      className="w-full"
    >
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
          e.target.value = '';
        }}
        accept="*/*"
      />
      <input
        ref={imageInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageUpload(file);
          e.target.value = '';
        }}
        accept="image/*"
      />

      <div className="max-w-3xl mx-auto">
        <div className="relative flex items-center rounded-2xl border-2 border-border bg-card shadow-sm transition-all duration-200 py-1 focus-within:border-primary/50">
          {/* Left Icons */}
          <div className="flex items-center gap-1 pl-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all duration-150"
              aria-label="Datei anhängen"
              disabled={isLoading}
            >
              <Paperclip className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all duration-150"
              aria-label="Bild hinzufügen"
              disabled={isLoading}
            >
              <Image className="size-5" />
            </button>
          </div>

          {/* Dynamisches Textarea */}
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              // Auto-resize
              if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
                textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 resize-none border-0 bg-transparent py-2.5 px-2 text-sm text-foreground placeholder:text-muted-foreground focus:ring-0 focus:outline-none min-h-[44px] max-h-[150px] transition-all duration-200"
            rows={1}
            disabled={isLoading}
            style={{ height: 'auto' }}
          />

          {/* Right Icons */}
          <div className="flex items-center gap-1 pr-2">
            <button
              type="button"
              onClick={handleLanguageToggle}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all duration-150"
              aria-label="Sprache wechseln"
              disabled={isLoading}
            >
              <Globe className="size-5" />
            </button>
            <button
              type="button"
              onClick={handleVoiceRecording}
              className={cn(
                "p-2 rounded-lg transition-all duration-150",
                isRecording
                  ? "text-red-500 bg-red-500/10 hover:bg-red-500/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              aria-label="Spracheingabe"
              disabled={isLoading}
            >
              <Mic className="size-5" />
            </button>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={cn(
                "p-2 rounded-lg transition-all duration-200",
                input.trim() && !isLoading
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                  : "text-muted-foreground/50 cursor-not-allowed"
              )}
              aria-label={isLoading ? "Wird gesendet..." : "Nachricht senden"}
            >
              {isLoading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <ArrowUp className="size-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-col bg-background text-foreground",
        className
      )}
      style={{ height }}
    >
      {displayMessages.length === 0 ? (
        /* Empty State - Alles kompakt zusammen oben */
        <div className="flex flex-col p-4 animate-in fade-in duration-300">
          {/* Suggested Prompts */}
          {normalizedPrompts.length > 0 && (
            <div className="w-full max-w-2xl mx-auto mb-4">
              <p className="text-sm text-muted-foreground text-center mb-4">{emptyStateMessage}</p>
              <div className="grid grid-cols-2 gap-2.5">
                {normalizedPrompts.map((prompt, index) => {
                  const IconComponent = iconMap[prompt.icon as keyof typeof iconMap];
                  return (
                    <button
                      key={index}
                      onClick={() => handleSuggestedPromptClick(prompt.text)}
                      disabled={isLoading}
                      className="flex items-center gap-2 rounded-xl border border-border bg-card hover:bg-muted hover:border-border px-3 py-2.5 text-sm text-foreground transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm hover:shadow text-left"
                      type="button"
                    >
                      {IconComponent && <IconComponent className="size-4 text-muted-foreground flex-shrink-0" />}
                      <span>{prompt.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Input direkt unter den Prompts */}
          <div className="w-full max-w-2xl mx-auto px-0">
            {renderInputForm()}
          </div>
        </div>
      ) : (
        /* Chat Mode - Messages und Input getrennt */
        <>
          {/* Messages Area */}
          <div ref={scrollAreaRef} className="flex-1 overflow-hidden">
            <ScrollArea className="h-full [&>div>div]:!overflow-y-auto [&>div>div]:[-ms-overflow-style:none] [&>div>div]:[scrollbar-width:none] [&>div>div::-webkit-scrollbar]:hidden">
              <div className="flex flex-col p-4 space-y-4">
                {displayMessages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
                      message.role === "user"
                        ? "justify-end"
                        : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] select-text",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground rounded-2xl px-4 py-3"
                          : "text-foreground"
                      )}
                      onClick={(e) => {
                        // Allow clicks on buttons and links to work
                        const target = e.target as HTMLElement;
                        if (target.closest('button, a')) {
                          return; // Don't stop propagation for buttons/links
                        }
                        e.stopPropagation();
                      }}
                      onMouseDown={(e) => {
                        // Allow clicks on buttons and links to work
                        const target = e.target as HTMLElement;
                        if (target.closest('button, a')) {
                          return; // Don't stop propagation for buttons/links
                        }
                        e.stopPropagation();
                      }}
                    >
                      {message.role === "assistant" ? (
                        <AIMessageContent content={message.content} onNavigate={handleNavigate} />
                      ) : (
                        <p className="whitespace-pre-wrap text-sm">
                          {message.content}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-start gap-4 justify-start animate-in fade-in duration-200">
                    <div className="rounded-lg bg-muted px-4 py-3">
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Input Area - Am unteren Rand */}
          <div className="px-4 py-3 bg-background border-t border-border">
            {renderInputForm()}
          </div>
        </>
      )}
    </div>
  );
}
