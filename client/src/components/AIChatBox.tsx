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
import DOMPurify from "dompurify";

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
  const { t } = useTranslation();
  
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
        let textBefore = safeContent.slice(lastIndex, matchInfo.index);
        
        // Entferne Bullet Points vor Navigation-Buttons
        // Prüfe ob es ein Navigation-Button ist und ob der Text davor mit einem Bullet Point endet
        if (matchInfo.type === 'nav') {
          // Entferne Bullet Points am Ende (z.B. "- " oder "• " am Zeilenende oder am Ende des Textes)
          // Prüfe ob die letzte Zeile nur aus einem Bullet Point besteht
          const lines = textBefore.split('\n');
          if (lines.length > 0) {
            const lastLine = lines[lines.length - 1];
            // Wenn die letzte Zeile nur ein Bullet Point ist, entferne sie
            if (/^[-*•]\s*$/.test(lastLine.trim())) {
              lines.pop();
              textBefore = lines.join('\n');
            } else {
              // Entferne Bullet Point am Ende der letzten Zeile
              lines[lines.length - 1] = lines[lines.length - 1].replace(/([-*•])\s*$/, '').trim();
              textBefore = lines.join('\n');
            }
          }
        }
        
        if (textBefore.trim()) {
          const markdownHtml = formatMarkdown(textBefore);
          const sanitizedHtml = DOMPurify.sanitize(markdownHtml, {
            ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'hr', 'code', 'pre', 'blockquote', 'a'],
            ALLOWED_ATTR: ['href', 'class', 'target', 'rel'],
            ALLOW_DATA_ATTR: false
          });
          segments.push(<span key={`text-${keyIndex++}`} dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />);
        }
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
              title={t('aiChat.navigateTo', { label })}
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
      const markdownHtml = formatMarkdown(textAfter);
      const sanitizedHtml = DOMPurify.sanitize(markdownHtml, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'hr', 'code', 'pre', 'blockquote', 'a'],
        ALLOWED_ATTR: ['href', 'class', 'target', 'rel'],
        ALLOW_DATA_ATTR: false
      });
      segments.push(<span key={`text-${keyIndex++}`} dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />);
    }
    
    // Sanitize final content if no segments
    const finalContent = segments.length > 0 
      ? segments 
      : (() => {
          const markdownHtml = formatMarkdown(safeContent);
          const sanitizedHtml = DOMPurify.sanitize(markdownHtml, {
            ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'hr', 'code', 'pre', 'blockquote', 'a'],
            ALLOWED_ATTR: ['href', 'class', 'target', 'rel'],
            ALLOW_DATA_ATTR: false
          });
          return [<span key="full" dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />];
        })();
    
    return finalContent;
  }, [content, onNavigate, t]);

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

// Markdown-Formatierer mit Header-, Listen- und Trennlinien-Unterstützung
function formatMarkdown(text: string): string {
  // Zuerst HTML escapen für Sicherheit
  const escaped = escapeHtml(text);
  
  // Zeile für Zeile verarbeiten
  const lines = escaped.split('\n');
  const htmlLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Trennlinie: --- oder ___
    if (/^-{3,}$/.test(line.trim()) || /^_{3,}$/.test(line.trim())) {
      htmlLines.push('<hr class="my-3 border-t border-border" />');
      continue;
    }
    
    // Nummerierte Überschriften: "1. TEXT" wo TEXT grossgeschrieben ist
    const numberedHeader = line.match(/^(\d+)\.\s+([A-ZÄÖÜÀ-Ž].*)$/);
    if (numberedHeader && numberedHeader[2] === numberedHeader[2].toUpperCase()) {
      const headerText = applyInlineStyles(numberedHeader[0]);
      htmlLines.push(`<div class="font-bold text-foreground mt-4 mb-2">${headerText}</div>`);
      continue;
    }
    
    // Nummerierte Listen: "1. Text", "2. Text" etc. (nicht nur Überschriften)
    const numberedList = line.match(/^(\d+)\.\s+(.+)$/);
    if (numberedList) {
      const number = numberedList[1];
      const itemText = numberedList[2];
      const styledText = applyInlineStyles(itemText);
      htmlLines.push(`<div class="flex items-start gap-2 ml-2 mb-1"><span class="text-muted-foreground font-medium">${number}.</span><span>${styledText}</span></div>`);
      continue;
    }
    
    // Listen-Items: - Text oder * Text
    if (/^[-*•]\s+/.test(line)) {
      const itemText = line.replace(/^[-*•]\s+/, '');
      const styledText = applyInlineStyles(itemText);
      htmlLines.push(`<div class="flex items-start gap-2 ml-2 mb-1"><span class="text-muted-foreground mt-0.5">•</span><span>${styledText}</span></div>`);
      continue;
    }
    
    // Normale Zeile mit Inline-Styles
    const styledLine = applyInlineStyles(line);
    
    if (styledLine.trim() === '') {
      htmlLines.push('<div class="h-2"></div>');
    } else {
      htmlLines.push(`<div class="mb-1">${styledLine}</div>`);
    }
  }
  
  return htmlLines.join('');
}

// Inline-Styles anwenden (Bold, Italic, Code)
function applyInlineStyles(text: string): string {
  let result = text;
  
  // Bold: **text** oder __text__
  result = result
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>');
  
  // Italic: *text* (nur einzelne Sternchen)
  result = result.replace(/(?<!\*)\*(?!\*)([^*]+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  
  // Inline code: `code`
  result = result.replace(/`([^`]+?)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');
  
  return result;
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
  placeholder,
  className,
  height = "600px",
  emptyStateMessage,
  suggestedPrompts,
}: AIChatBoxProps) {
  const { t, i18n } = useTranslation();
  const [, setLocation] = useLocation();
  const [input, setInput] = useState("");
  
  // Fallbacks für placeholder und emptyStateMessage
  const placeholderText = placeholder || t('common.typeMessage');
  const emptyStateText = emptyStateMessage || t('aiChat.emptyStateMessage');
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

  // Auto-scroll when new messages arrive or content changes (streaming)
  useEffect(() => {
    if (displayMessages.length > 0) {
      scrollToBottom();
    }
  }, [displayMessages.length, scrollToBottom]);

  // Auto-scroll during streaming (when last message content changes)
  const lastMessageContent = displayMessages[displayMessages.length - 1]?.content;
  useEffect(() => {
    if (displayMessages.length > 0 && lastMessageContent) {
      scrollToBottom();
    }
  }, [lastMessageContent, displayMessages.length, scrollToBottom]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    
    // Validierung: Maximal 10000 Zeichen
    if (!trimmedInput || isLoading) return;
    
    if (trimmedInput.length > 10000) {
      toast.error(t('aiChat.messageTooLong'));
      return;
    }
    
    // Verhindere zu schnelle aufeinanderfolgende Anfragen
    if (isLoading) {
      toast.info(t('aiChat.waitForResponse'));
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
      toast.error(t('aiChat.errors.sendErrorRetry'));
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
      toast.error(t('aiChat.fileTooLarge', { maxSize: (MAX_FILE_SIZE / 1024 / 1024).toFixed(0) }));
      return;
    }
    
    // Validierung: Dateiname
    if (!file.name || file.name.length > 255) {
      toast.error(t('aiChat.invalidFilename'));
      return;
    }

    const loadingToast = toast.loading(t('aiChat.uploadingFile'));
    
    try {
      // Timeout für FileReader (30 Sekunden)
      const base64 = await Promise.race<string>([
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            if (!result || !result.includes(',')) {
              reject(new Error(t('aiChat.invalidFileFormat')));
              return;
            }
            resolve(result.split(',')[1]);
          };
          reader.onerror = () => reject(new Error(t('aiChat.fileReadError')));
          reader.readAsDataURL(file);
        }),
        new Promise<string>((_, reject) => 
          setTimeout(() => reject(new Error(t('aiChat.uploadTimeout'))), 30000)
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
          setTimeout(() => reject(new Error(t('aiChat.uploadConnectionTimeout'))), 60000)
        ),
      ]) as any;

      if (!result?.data) {
        throw new Error(t('aiChat.noServerResponse'));
      }

      const data = result.data as { fileUrl: string; fileName: string };
      if (!data.fileUrl || !data.fileName) {
        throw new Error(t('aiChat.invalidServerResponse'));
      }

      toast.dismiss(loadingToast);
      onSendMessage(`[Datei: ${data.fileName}](${data.fileUrl})`);
      toast.success(t('aiChat.fileUploadSuccess'));
    } catch (error: any) {
      toast.dismiss(loadingToast);
      const errorMsg = error.message || t('aiChat.unknownError');
      console.error('File upload error:', error);
      toast.error(t('aiChat.uploadError', { error: errorMsg }));
    }
  }, [onSendMessage]);

  // Image upload handler
  const handleImageUpload = useCallback(async (file: File) => {
    // Validierung: Nur Bilder
    if (!file.type.startsWith('image/')) {
      toast.error(t('aiChat.selectImage'));
      return;
    }
    
    // Validierung: Maximal 5MB für Bilder
    const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error(t('aiChat.imageTooLarge', { maxSize: (MAX_IMAGE_SIZE / 1024 / 1024).toFixed(0) }));
      return;
    }
    
    // Validierung: Dateiname
    if (!file.name || file.name.length > 255) {
      toast.error(t('aiChat.invalidFilename'));
      return;
    }

    const loadingToast = toast.loading(t('aiChat.uploadingImage'));

    try {
      // Timeout für FileReader (30 Sekunden)
      const base64 = await Promise.race<string>([
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            if (!result || !result.includes(',')) {
              reject(new Error(t('aiChat.invalidImageFormat')));
              return;
            }
            resolve(result.split(',')[1]);
          };
          reader.onerror = () => reject(new Error(t('aiChat.imageReadError')));
          reader.readAsDataURL(file);
        }),
        new Promise<string>((_, reject) => 
          setTimeout(() => reject(new Error(t('aiChat.imageUploadTimeout'))), 30000)
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
          setTimeout(() => reject(new Error(t('aiChat.uploadConnectionTimeout'))), 60000)
        ),
      ]) as any;

      if (!result?.data) {
        throw new Error(t('aiChat.noServerResponse'));
      }

      const data = result.data as { imageUrl: string; fileName: string };
      if (!data.imageUrl || !data.fileName) {
        throw new Error(t('aiChat.invalidServerResponse'));
      }

      toast.dismiss(loadingToast);
      onSendMessage(`![${data.fileName}](${data.imageUrl})`);
      toast.success(t('aiChat.imageUploadSuccess'));
    } catch (error: any) {
      toast.dismiss(loadingToast);
      const errorMsg = error.message || t('aiChat.unknownError');
      console.error('Image upload error:', error);
      toast.error(t('aiChat.uploadError', { error: errorMsg }));
    }
  }, [onSendMessage]);

  // Voice recording handler
  const handleVoiceRecording = useCallback(async () => {
    if (isRecording && mediaRecorder) {
      // Stop recording
      try {
        mediaRecorder.stop();
        setIsRecording(false);
        toast.info(t('aiChat.processingRecording'));
      } catch (error) {
        console.error('Error stopping recording:', error);
        setIsRecording(false);
        toast.error(t('aiChat.stopRecordingError'));
      }
      return;
    }

    try {
      // Prüfe ob Mikrofon verfügbar ist
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error(t('aiChat.microphoneNotSupported'));
        return;
      }

      const stream = await Promise.race([
        navigator.mediaDevices.getUserMedia({ audio: true }),
        new Promise<MediaStream>((_, reject) => 
          setTimeout(() => reject(new Error(t('aiChat.microphoneTimeout'))), 10000)
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
          toast.error(t('aiChat.audioTooLarge'));
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        const loadingToast = toast.loading(t('aiChat.transcribingAudio'));

        try {
          const base64 = await Promise.race<string>([
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                const result = reader.result as string;
                if (!result || !result.includes(',')) {
                  reject(new Error(t('aiChat.invalidAudioFormat')));
                  return;
                }
                resolve(result.split(',')[1]);
              };
              reader.onerror = () => reject(new Error(t('aiChat.audioReadError')));
              reader.readAsDataURL(blob);
            }),
            new Promise<string>((_, reject) => 
              setTimeout(() => reject(new Error(t('aiChat.audioProcessingTimeout'))), 30000)
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
              setTimeout(() => reject(new Error(t('aiChat.transcriptionTimeout'))), 60000)
            ),
          ]) as any;

          if (!result?.data) {
            throw new Error(t('aiChat.noServerResponse'));
          }

          const data = result.data as { transcription: string };
          if (data.transcription && data.transcription.trim()) {
            setInput(data.transcription.trim());
            textareaRef.current?.focus();
            toast.dismiss(loadingToast);
            toast.success(t('aiChat.voiceInputSuccess'));
          } else {
            throw new Error(t('aiChat.noTranscription'));
          }
        } catch (error: any) {
          toast.dismiss(loadingToast);
          const errorMsg = error.message || t('aiChat.unknownError');
          console.error('Transcription error:', error);
          toast.error(t('aiChat.transcriptionError', { error: errorMsg }));
        } finally {
          stream.getTracks().forEach(track => track.stop());
        }
      };

      recorder.onerror = (event: any) => {
        console.error('MediaRecorder error:', event);
        toast.error(t('aiChat.recordingError'));
        setIsRecording(false);
        stream.getTracks().forEach(track => track.stop());
      };

      // Maximal 5 Minuten Aufnahme
      recordingTimeout = setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
          toast.warning(t('aiChat.maxRecordingTime'));
        }
      }, 5 * 60 * 1000);

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      toast.info(t('aiChat.recordingStarted'));
    } catch (error: any) {
      setIsRecording(false);
      const errorMsg = error.message || t('aiChat.unknownError');
      console.error('Microphone access error:', error);
      
      if (errorMsg.includes('permission') || errorMsg.includes('denied')) {
        toast.error(t('aiChat.microphonePermissionDenied'));
      } else if (errorMsg.includes('not found') || errorMsg.includes('not available')) {
        toast.error(t('aiChat.microphoneNotFound'));
      } else {
        toast.error(t('aiChat.microphoneError', { error: errorMsg }));
      }
    }
  }, [isRecording, mediaRecorder]);

  // Language selection handler
  const handleLanguageToggle = useCallback(() => {
    const currentLang = i18n.language;
    const newLang = currentLang === 'de' ? 'en' : 'de';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
    toast.success(t('aiChat.languageChanged', { lang: newLang === 'de' ? t('common.german') : t('common.english') }));
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
              aria-label={t('aiChat.attachFile')}
              disabled={isLoading}
            >
              <Paperclip className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all duration-150"
              aria-label={t('aiChat.addImage')}
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
            placeholder={placeholderText}
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
              aria-label={t('aiChat.changeLanguage')}
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
              aria-label={t('aiChat.voiceInput')}
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
              aria-label={isLoading ? t('aiChat.sending') : t('aiChat.sendMessage')}
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
        /* Empty State - Vertikal zentriert */
        <div className="flex flex-col flex-1 justify-center p-4 animate-in fade-in duration-300">
          {/* Suggested Prompts */}
          {normalizedPrompts.length > 0 && (
            <div className="w-full max-w-2xl mx-auto mb-4">
              <p className="text-sm text-muted-foreground text-center mb-4">{emptyStateText}</p>
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
                          ? "bg-primary text-primary-foreground rounded-lg px-4 py-3"
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
