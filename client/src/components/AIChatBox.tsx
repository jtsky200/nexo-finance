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
  'dashboard': { path: '/dashboard', icon: LayoutDashboard },
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
    // Regex für [nav:route|Label] Syntax
    const navRegex = /\[nav:([a-z-]+)\|([^\]]+)\]/g;
    // Regex für [icon:name] Syntax (fallback für einfache Icons)
    const iconRegex = /\[icon:([a-z-]+)\]/g;
    
    let lastIndex = 0;
    let keyIndex = 0;
    
    // Kombinierte Regex für beide Syntaxen - mit flexibleren Zeichen
    const combinedRegex = /\[nav:([a-zA-Z0-9_-]+)[|｜]([^\]]+)\]|\[icon:([a-zA-Z0-9_-]+)\]/g;
    let match;

    while ((match = combinedRegex.exec(content)) !== null) {
      // Text vor dem Match
      if (match.index > lastIndex) {
        const textBefore = content.slice(lastIndex, match.index);
        segments.push(<span key={`text-${keyIndex++}`} dangerouslySetInnerHTML={{ __html: formatMarkdown(textBefore) }} />);
      }
      
      if (match[1] && match[2]) {
        // [nav:route|Label] Syntax
        const routeKey = match[1];
        const label = match[2];
        const navInfo = navRouteMap[routeKey];
        
        if (navInfo && onNavigate) {
          const IconComponent = navInfo.icon;
          segments.push(
            <button
              key={`nav-${keyIndex++}`}
              onClick={() => onNavigate(navInfo.path)}
              className="inline-flex items-center gap-1.5 px-2 py-1 mx-0.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-medium text-sm transition-all duration-200 cursor-pointer border border-primary/20 hover:border-primary/40 hover:shadow-sm"
              title={`Zu ${label} navigieren`}
            >
              <IconComponent className="size-4" />
              <span className="underline decoration-dotted underline-offset-2">{label}</span>
            </button>
          );
        } else {
          // Fallback wenn Route nicht gefunden
          segments.push(<span key={`nav-text-${keyIndex++}`} className="font-medium text-primary">{label}</span>);
        }
      } else if (match[3]) {
        // [icon:name] Syntax (einfaches Icon)
        const iconName = match[3];
        const IconComponent = aiIconMap[iconName];
        
        if (IconComponent) {
          segments.push(
            <IconComponent 
              key={`icon-${keyIndex++}`} 
              className="inline-block size-4 mx-0.5 align-text-bottom text-primary" 
            />
          );
        } else {
          segments.push(<span key={`unknown-${keyIndex++}`}>[{iconName}]</span>);
        }
      }
      
      lastIndex = combinedRegex.lastIndex;
    }
    
    // Restlicher Text
    if (lastIndex < content.length) {
      const textAfter = content.slice(lastIndex);
      segments.push(<span key={`text-${keyIndex++}`} dangerouslySetInnerHTML={{ __html: formatMarkdown(textAfter) }} />);
    }
    
    return segments.length > 0 ? segments : [<span key="full" dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }} />];
  }, [content, onNavigate]);

  return (
    <div className="prose prose-sm max-w-none">
      {renderedContent}
    </div>
  );
}

// Einfacher Markdown-Formatierer
function formatMarkdown(text: string): string {
  return text
    // Bold: **text** oder __text__
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    // Italic: *text* oder _text_
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
    // Inline code: `code`
    .replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1 rounded text-sm">$1</code>')
    // Line breaks
    .replace(/\n/g, '<br />');
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

  // Navigation Handler - speichert Nachrichten und öffnet Popup nach Navigation
  const handleNavigate = useCallback((route: string, tutorialSteps?: Array<{ selector: string; title: string; description: string }>) => {
    // Speichere aktuelle Nachrichten im localStorage für Popup-Kontinuität
    localStorage.setItem('nexo_chat_messages', JSON.stringify(messages));
    localStorage.setItem('nexo_chat_open_popup', 'true');
    localStorage.setItem('nexo_chat_from_route', route);
    
    // Optional: Tutorial-Schritte speichern
    if (tutorialSteps && tutorialSteps.length > 0) {
      localStorage.setItem('nexo_tutorial_highlight', JSON.stringify(tutorialSteps));
    }
    
    // Navigiere zur Zielseite
    setLocation(route);
  }, [messages, setLocation]);

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
    if (!trimmedInput || isLoading) return;

    onSendMessage(trimmedInput);
    setInput("");

    // Scroll immediately after sending
    scrollToBottom();

    // Keep focus on input
    textareaRef.current?.focus();
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
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const uploadAIChatFile = httpsCallable(functions, 'uploadAIChatFile');
      const result = await uploadAIChatFile({
        fileName: file.name,
        fileData: base64,
        fileType: file.type,
      });

      const data = result.data as { fileUrl: string; fileName: string };
      onSendMessage(`[Datei: ${data.fileName}](${data.fileUrl})`);
      toast.success('Datei erfolgreich hochgeladen');
    } catch (error: any) {
      toast.error('Fehler beim Hochladen: ' + (error.message || 'Unbekannter Fehler'));
    }
  }, [onSendMessage]);

  // Image upload handler
  const handleImageUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Bitte wähle ein Bild aus');
      return;
    }

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const uploadAIChatImage = httpsCallable(functions, 'uploadAIChatImage');
      const result = await uploadAIChatImage({
        fileName: file.name,
        fileData: base64,
        fileType: file.type,
      });

      const data = result.data as { imageUrl: string; fileName: string };
      onSendMessage(`![${data.fileName}](${data.imageUrl})`);
      toast.success('Bild erfolgreich hochgeladen');
    } catch (error: any) {
      toast.error('Fehler beim Hochladen: ' + (error.message || 'Unbekannter Fehler'));
    }
  }, [onSendMessage]);

  // Voice recording handler
  const handleVoiceRecording = useCallback(async () => {
    if (isRecording && mediaRecorder) {
      // Stop recording
      mediaRecorder.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        try {
          const transcribeAudio = httpsCallable(functions, 'transcribeAIChatAudio');
          const result = await transcribeAudio({
            audioData: base64,
            mimeType: 'audio/webm',
          });

          const data = result.data as { transcription: string };
          if (data.transcription) {
            setInput(data.transcription);
            textareaRef.current?.focus();
          }
          toast.success('Spracheingabe erfolgreich');
        } catch (error: any) {
          toast.error('Fehler bei der Transkription: ' + (error.message || 'Unbekannter Fehler'));
        }

        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      toast.info('Aufnahme gestartet...');
    } catch (error: any) {
      toast.error('Mikrofon-Zugriff verweigert: ' + (error.message || 'Unbekannter Fehler'));
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
        <div className="relative flex items-center rounded-2xl border-2 border-gray-200 bg-white shadow-sm transition-all duration-200 py-1 focus-within:border-gray-400">
          {/* Left Icons */}
          <div className="flex items-center gap-1 pl-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-150"
              aria-label="Datei anhängen"
              disabled={isLoading}
            >
              <Paperclip className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-150"
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
            className="flex-1 resize-none border-0 bg-transparent py-2.5 px-2 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:outline-none min-h-[44px] max-h-[150px] transition-all duration-200"
            rows={1}
            disabled={isLoading}
            style={{ height: 'auto' }}
          />

          {/* Right Icons */}
          <div className="flex items-center gap-1 pr-2">
            <button
              type="button"
              onClick={handleLanguageToggle}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-150"
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
                  ? "text-red-500 bg-red-50 hover:bg-red-100"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
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
                  ? "bg-primary text-white hover:bg-primary/90 shadow-sm"
                  : "text-gray-300 cursor-not-allowed"
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
        "flex flex-col bg-white text-gray-900",
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
              <p className="text-sm text-gray-500 text-center mb-4">{emptyStateMessage}</p>
              <div className="grid grid-cols-2 gap-2.5">
                {normalizedPrompts.map((prompt, index) => {
                  const IconComponent = iconMap[prompt.icon as keyof typeof iconMap];
                  return (
                    <button
                      key={index}
                      onClick={() => handleSuggestedPromptClick(prompt.text)}
                      disabled={isLoading}
                      className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 px-3 py-2.5 text-sm text-gray-700 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm hover:shadow text-left"
                      type="button"
                    >
                      {IconComponent && <IconComponent className="size-4 text-gray-500 flex-shrink-0" />}
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
                          ? "bg-gray-900 text-white rounded-2xl px-4 py-3"
                          : "text-gray-900"
                      )}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
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
                    <div className="rounded-lg bg-gray-100 px-4 py-3">
                      <Loader2 className="size-4 animate-spin text-gray-500" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Input Area - Am unteren Rand */}
          <div className="px-4 py-3 bg-white border-t border-gray-100">
            {renderInputForm()}
          </div>
        </>
      )}
    </div>
  );
}
