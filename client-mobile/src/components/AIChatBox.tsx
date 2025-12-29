import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { 
  Loader2, Send, Paperclip, Image, Globe, Mic, Tag, FileText, Zap, ArrowUp, 
  ClipboardList, Bell, Wallet, ShoppingCart, Calendar, ScanLine,
  LayoutDashboard, Users, Settings, Check, Plus, Search, Edit, Trash,
  Clock, Euro, TrendingUp, TrendingDown, Info, AlertCircle, X, Play, Pause, type LucideIcon
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
  subtitle?: string; // Optional subtitle for ChatGPT-style cards
  icon?: 'tag' | 'fileText' | 'zap' | 'receipt' | 'bell' | 'wallet' | 'shoppingCart' | 'calendar' | 'scan';
};

export type AIChatBoxProps = {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
  height?: string | number;
  emptyStateMessage?: string;
  suggestedPrompts?: string[] | SuggestedPrompt[];
};

// Icon mapping
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

// Icon mapping für AI-Antworten
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
  const renderedContent = useMemo(() => {
    const segments: React.ReactNode[] = [];
    const safeContent = content.length > 10000 ? content.substring(0, 10000) + '...' : content;
    
    let lastIndex = 0;
    let keyIndex = 0;
    
    const combinedRegex = /\[(nav|icon):([a-zA-Z0-9_-]+)(?:[|｜]([^\]]+))?\]/g;
    let match;
    const matches: Array<{ index: number; type: string; key: string; label?: string; endIndex: number }> = [];
    
    while ((match = combinedRegex.exec(safeContent)) !== null) {
      matches.push({
        index: match.index,
        type: match[1],
        key: match[2],
        label: match[3],
        endIndex: match.index + match[0].length,
      });
    }

    for (const matchInfo of matches) {
      if (matchInfo.index > lastIndex) {
        const textBefore = safeContent.slice(lastIndex, matchInfo.index);
        segments.push(<span key={`text-${keyIndex++}`} dangerouslySetInnerHTML={{ __html: formatMarkdown(textBefore) }} />);
      }
      
      if (matchInfo.type === 'nav' && matchInfo.label) {
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
                  if (process.env.NODE_ENV === 'development') {
                    console.error('Navigation error:', error);
                  }
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
          segments.push(<span key={`nav-text-${keyIndex++}`} className="font-medium text-primary">{escapeHtml(label)}</span>);
        }
      } else if (matchInfo.type === 'icon') {
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

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatMarkdown(text: string): string {
  let escaped = escapeHtml(text);
  escaped = escaped
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>');
  escaped = escaped.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  escaped = escaped.replace(/`(.+?)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');
  escaped = escaped.replace(/\n/g, '<br />');
  return escaped;
}

/**
 * Mobile-optimized AI chat box component
 */
export function AIChatBox({
  messages,
  onSendMessage,
  isLoading = false,
  placeholder = "Nachricht eingeben...",
  className,
  height = "100%",
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
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const plusMenuRef = useRef<HTMLDivElement>(null);
  const plusButtonRef = useRef<HTMLButtonElement>(null);
  const plusMenuDropdownRef = useRef<HTMLDivElement>(null);
  
  // Preview states
  const [filePreview, setFilePreview] = useState<{ file: File; url: string; type: 'file' | 'image' } | null>(null);
  const [audioPreview, setAudioPreview] = useState<{ blob: Blob; url: string } | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  
  // Progress states
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleNavigate = useCallback(async (route: string) => {
    setLocation(route);
    // Öffne den Chat-Dialog nach Navigation via Event Bus
    const { eventBus, Events } = await import('@/lib/eventBus');
    setTimeout(() => {
      eventBus.emit(Events.CHAT_DIALOG_OPEN);
    }, 300); // Kurze Verzögerung für sanfte Animation
  }, [setLocation]);

  const displayMessages = useMemo(() => 
    messages.filter((msg) => msg.role !== "system"), 
    [messages]
  );

  const normalizedPrompts = useMemo(() => {
    if (!suggestedPrompts) return [];
    return suggestedPrompts.map(prompt => 
      typeof prompt === 'string' 
        ? { text: prompt, icon: 'tag' as const }
        : prompt
    );
  }, [suggestedPrompts]);

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

  useEffect(() => {
    if (displayMessages.length > 0) {
      scrollToBottom();
    }
  }, [displayMessages.length, scrollToBottom]);

  // Calculate menu position based on button position
  const [menuPosition, setMenuPosition] = useState({ bottom: 0, left: 0 });
  
  useEffect(() => {
    if (plusMenuOpen && plusButtonRef.current) {
      const rect = plusButtonRef.current.getBoundingClientRect();
      setMenuPosition({
        bottom: window.innerHeight - rect.top + 8, // 8px margin above button
        left: rect.left
      });
    }
  }, [plusMenuOpen]);

  // Close plus menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      const isClickOnMenu = plusMenuDropdownRef.current?.contains(target);
      const isClickOnButton = plusButtonRef.current?.contains(target);
      const isClickOnMenuRef = plusMenuRef.current?.contains(target);
      
      // Close menu if click is outside menu, button, and menu ref container
      if (!isClickOnMenu && !isClickOnButton && !isClickOnMenuRef) {
        setPlusMenuOpen(false);
      }
    };

    if (plusMenuOpen) {
      // Listen to both mouse and touch events for better mobile support
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      };
    }
  }, [plusMenuOpen]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    
    if (!trimmedInput || isLoading) return;
    
    if (trimmedInput.length > 10000) {
      toast.error(t('aiChat.messageTooLong'));
      return;
    }
    
    if (isLoading) {
      toast.info(t('aiChat.waitForResponse'));
      return;
    }

    try {
      onSendMessage(trimmedInput);
      setInput("");

      scrollToBottom();
      textareaRef.current?.focus();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error sending message:', error);
      }
      toast.error(t('aiChat.unknownError'));
    }
  }, [input, isLoading, onSendMessage, scrollToBottom, t]);

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

  const handleFileSelect = useCallback((file: File) => {
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      toast.error(t('aiChat.fileTooLarge', { maxSize: (MAX_FILE_SIZE / 1024 / 1024).toFixed(0) }));
      return;
    }
    
    if (!file.name || file.name.length > 255) {
      toast.error(t('aiChat.invalidFilename'));
      return;
    }

    // Show preview instead of uploading immediately
    const url = URL.createObjectURL(file);
    setFilePreview({ file, url, type: file.type.startsWith('image/') ? 'image' : 'file' });
  }, [t]);

  const handleFileUpload = useCallback(async () => {
    if (!filePreview) return;

    setIsUploading(true);
    setUploadProgress(0);
    const loadingToast = toast.loading(t('aiChat.uploadingFile'));
    
    try {
      // Simulate progress for file reading
      const base64 = await Promise.race<string>([
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onprogress = (e) => {
            if (e.lengthComputable) {
              setUploadProgress(Math.round((e.loaded / e.total) * 30)); // 30% for reading
            }
          };
          reader.onload = () => {
            const result = reader.result as string;
            if (!result || !result.includes(',')) {
              reject(new Error(t('aiChat.invalidFileFormat')));
              return;
            }
            setUploadProgress(30);
            resolve(result.split(',')[1]);
          };
          reader.onerror = () => reject(new Error(t('aiChat.fileReadError')));
          reader.readAsDataURL(filePreview.file);
        }),
        new Promise<string>((_, reject) => 
          setTimeout(() => reject(new Error(t('aiChat.uploadTimeout'))), 30000)
        ),
      ]);

      setUploadProgress(40);
      const uploadAIChatFile = httpsCallable(functions, 'uploadAIChatFile');
      
      // Simulate progress for upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev < 90) return prev + 5;
          return prev;
        });
      }, 200);

      const result = await Promise.race([
        uploadAIChatFile({
          fileName: filePreview.file.name,
          fileData: base64,
          fileType: filePreview.file.type,
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(t('aiChat.uploadConnectionTimeout'))), 60000)
        ),
      ]) as any;

      clearInterval(progressInterval);
      setUploadProgress(100);

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
      setFilePreview(null);
      URL.revokeObjectURL(filePreview.url);
    } catch (error: any) {
      toast.dismiss(loadingToast);
      const errorMsg = error.message || t('aiChat.unknownError');
      if (process.env.NODE_ENV === 'development') {
        console.error('File upload error:', error);
      }
      toast.error(t('aiChat.uploadError', { error: errorMsg }));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [filePreview, onSendMessage, t]);

  const handleImageSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error(t('aiChat.selectImage'));
      return;
    }
    
    const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error(t('aiChat.imageTooLarge', { maxSize: (MAX_IMAGE_SIZE / 1024 / 1024).toFixed(0) }));
      return;
    }
    
    if (!file.name || file.name.length > 255) {
      toast.error(t('aiChat.invalidFilename'));
      return;
    }

    // Show preview instead of uploading immediately
    const url = URL.createObjectURL(file);
    setFilePreview({ file, url, type: 'image' });
  }, [t]);

  const handleImageUpload = useCallback(async () => {
    if (!filePreview || filePreview.type !== 'image') return;

    setIsUploading(true);
    setUploadProgress(0);
    const loadingToast = toast.loading(t('aiChat.uploadingImage'));

    try {
      // Simulate progress for image reading
      const base64 = await Promise.race<string>([
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onprogress = (e) => {
            if (e.lengthComputable) {
              setUploadProgress(Math.round((e.loaded / e.total) * 30)); // 30% for reading
            }
          };
          reader.onload = () => {
            const result = reader.result as string;
            if (!result || !result.includes(',')) {
              reject(new Error(t('aiChat.invalidImageFormat')));
              return;
            }
            setUploadProgress(30);
            resolve(result.split(',')[1]);
          };
          reader.onerror = () => reject(new Error(t('aiChat.imageReadError')));
          reader.readAsDataURL(filePreview.file);
        }),
        new Promise<string>((_, reject) => 
          setTimeout(() => reject(new Error(t('aiChat.imageUploadTimeout'))), 30000)
        ),
      ]);

      setUploadProgress(40);
      const uploadAIChatImage = httpsCallable(functions, 'uploadAIChatImage');
      
      // Simulate progress for upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev < 90) return prev + 5;
          return prev;
        });
      }, 200);
      
      const result = await Promise.race([
        uploadAIChatImage({
          fileName: filePreview.file.name,
          fileData: base64,
          fileType: filePreview.file.type,
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(t('aiChat.uploadConnectionTimeout'))), 60000)
        ),
      ]) as any;

      clearInterval(progressInterval);
      setUploadProgress(100);

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
      setFilePreview(null);
      URL.revokeObjectURL(filePreview.url);
    } catch (error: any) {
      toast.dismiss(loadingToast);
      const errorMsg = error.message || t('aiChat.unknownError');
      if (process.env.NODE_ENV === 'development') {
        console.error('Image upload error:', error);
      }
      toast.error(t('aiChat.uploadError', { error: errorMsg }));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [filePreview, onSendMessage, t]);

  const handleVoiceRecording = useCallback(async () => {
    if (isRecording && mediaRecorder) {
      try {
        mediaRecorder.stop();
        setIsRecording(false);
        toast.info(t('aiChat.processingRecording'));
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error stopping recording:', error);
        }
        setIsRecording(false);
        toast.error(t('aiChat.stopRecordingError'));
      }
      return;
    }

    try {
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
      let recordingTimeout: ReturnType<typeof setTimeout> | null = null;

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
        
        const MAX_AUDIO_SIZE = 10 * 1024 * 1024;
        if (blob.size > MAX_AUDIO_SIZE) {
          toast.error(t('aiChat.audioTooLarge'));
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        // Show audio preview instead of immediately transcribing
        const url = URL.createObjectURL(blob);
        setAudioPreview({ blob, url });
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.onerror = (event: any) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('MediaRecorder error:', event);
        }
        toast.error(t('aiChat.recordingError'));
        setIsRecording(false);
        stream.getTracks().forEach(track => track.stop());
      };

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
      if (process.env.NODE_ENV === 'development') {
        console.error('Microphone access error:', error);
      }
      
      if (errorMsg.includes('permission') || errorMsg.includes('denied')) {
        toast.error(t('aiChat.microphonePermissionDenied'));
      } else if (errorMsg.includes('not found') || errorMsg.includes('not available')) {
        toast.error(t('aiChat.microphoneNotFound'));
      } else {
        toast.error(t('aiChat.microphoneError', { error: errorMsg }));
      }
    }
  }, [isRecording, mediaRecorder, t]);

  // Transcribe audio when user confirms
  const handleTranscribeAudio = useCallback(async () => {
    if (!audioPreview) return;

    setIsUploading(true);
    setUploadProgress(0);
    const loadingToast = toast.loading(t('aiChat.transcribingAudio'));

    try {
      // Simulate progress for audio reading
      const base64 = await Promise.race<string>([
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onprogress = (e) => {
            if (e.lengthComputable) {
              setUploadProgress(Math.round((e.loaded / e.total) * 20)); // 20% for reading
            }
          };
          reader.onload = () => {
            const result = reader.result as string;
            if (!result || !result.includes(',')) {
              reject(new Error(t('aiChat.invalidAudioFormat')));
              return;
            }
            setUploadProgress(20);
            resolve(result.split(',')[1]);
          };
          reader.onerror = () => reject(new Error(t('aiChat.audioReadError')));
          reader.readAsDataURL(audioPreview.blob);
        }),
        new Promise<string>((_, reject) => 
          setTimeout(() => reject(new Error(t('aiChat.audioProcessingTimeout'))), 30000)
        ),
      ]);

      setUploadProgress(30);
      const transcribeAudio = httpsCallable(functions, 'transcribeAIChatAudio');
      
      // Simulate progress for transcription
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev < 90) return prev + 5;
          return prev;
        });
      }, 300);
      
      const result = await Promise.race([
        transcribeAudio({
          audioData: base64,
          mimeType: 'audio/webm',
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(t('aiChat.transcriptionTimeout'))), 60000)
        ),
      ]) as any;

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!result?.data) {
        throw new Error(t('aiChat.noServerResponse'));
      }

      const data = result.data as { transcription: string };
      if (data.transcription && data.transcription.trim()) {
        setInput(data.transcription.trim());
        textareaRef.current?.focus();
        toast.dismiss(loadingToast);
        toast.success(t('aiChat.voiceInputSuccess'));
        setAudioPreview(null);
        URL.revokeObjectURL(audioPreview.url);
      } else {
        throw new Error(t('aiChat.noTranscription'));
      }
    } catch (error: any) {
      toast.dismiss(loadingToast);
      const errorMsg = error.message || t('aiChat.unknownError');
      if (process.env.NODE_ENV === 'development') {
        console.error('Transcription error:', error);
      }
      toast.error(t('aiChat.transcriptionError', { error: errorMsg }));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [audioPreview, t]);

  // Audio playback handlers
  const handlePlayAudio = useCallback(() => {
    if (!audioPreview) return;
    
    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new Audio(audioPreview.url);
      audioPlayerRef.current.onended = () => setIsPlayingAudio(false);
      audioPlayerRef.current.onpause = () => setIsPlayingAudio(false);
    }
    
    if (isPlayingAudio) {
      audioPlayerRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlayingAudio(true);
    }
  }, [audioPreview, isPlayingAudio]);

  // Cleanup audio preview
  useEffect(() => {
    return () => {
      if (audioPreview) {
        URL.revokeObjectURL(audioPreview.url);
      }
      if (filePreview) {
        URL.revokeObjectURL(filePreview.url);
      }
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
    };
  }, [audioPreview, filePreview]);

  const handleLanguageToggle = useCallback(() => {
    const currentLang = i18n.language;
    const newLang = currentLang === 'de' ? 'en' : 'de';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
    toast.success(t('aiChat.languageChanged', { lang: newLang === 'de' ? t('common.german') : t('common.english') }));
  }, [i18n, t]);

  const renderInputForm = () => (
    <form
      ref={inputAreaRef}
      onSubmit={handleSubmit}
      className="w-full space-y-2"
    >
      {/* File/Image Preview */}
      {filePreview && (
        <Card className="p-3">
          <CardContent className="p-0 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {filePreview.type === 'image' ? t('aiChat.previewImage') : t('aiChat.previewFile')}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilePreview(null);
                  URL.revokeObjectURL(filePreview.url);
                }}
                className="h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            {filePreview.type === 'image' ? (
              <img src={filePreview.url} alt="Preview" className="w-full rounded-lg max-h-48 object-contain" />
            ) : (
              <div className="flex items-center gap-2">
                <FileText className="w-8 h-8 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{filePreview.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(filePreview.file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
            )}
            {isUploading ? (
              <div className="space-y-1">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">
                  {filePreview.type === 'image' 
                    ? t('aiChat.imageUploadProgress', { percent: uploadProgress })
                    : t('aiChat.uploadProgress', { percent: uploadProgress })}
                </p>
              </div>
            ) : (
              <Button
                type="button"
                onClick={filePreview.type === 'image' ? handleImageUpload : handleFileUpload}
                className="w-full"
                size="sm"
              >
                {filePreview.type === 'image' ? t('aiChat.sendImage') : t('aiChat.sendFile')}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Audio Preview */}
      {audioPreview && (
        <Card className="p-3">
          <CardContent className="p-0 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t('aiChat.previewAudio')}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAudioPreview(null);
                  URL.revokeObjectURL(audioPreview.url);
                  if (audioPlayerRef.current) {
                    audioPlayerRef.current.pause();
                    audioPlayerRef.current = null;
                  }
                }}
                className="h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePlayAudio}
                className="flex-shrink-0"
              >
                {isPlayingAudio ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    {t('aiChat.pauseAudio')}
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    {t('aiChat.playAudio')}
                  </>
                )}
              </Button>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">{t('aiChat.previewAudio')}</p>
              </div>
            </div>
            {isUploading ? (
              <div className="space-y-1">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">
                  {t('aiChat.transcriptionProgress', { percent: uploadProgress })}
                </p>
              </div>
            ) : (
              <Button
                type="button"
                onClick={handleTranscribeAudio}
                className="w-full"
                size="sm"
              >
                {t('aiChat.sendTranscription')}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upload Progress Bar */}
      {isUploading && !filePreview && !audioPreview && (
        <Card className="p-2">
          <CardContent className="p-0 space-y-1">
            <Progress value={uploadProgress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              {t('aiChat.uploadProgress', { percent: uploadProgress })}
            </p>
          </CardContent>
        </Card>
      )}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
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
          if (file) {
            handleImageSelect(file);
            setPlusMenuOpen(false);
          }
          e.target.value = '';
        }}
        accept="image/*"
      />

      <div className="w-full max-w-full mx-auto">
        {/* ChatGPT-style Input Bar */}
        <div className="flex items-center gap-2 px-2" style={{ alignItems: 'center' }}>

          {/* Position 6: Input Field - ChatGPT Style with Plus Button inside */}
          <div className="flex-1 relative">
            {/* Plus Button inside input (left side) */}
            <button
              ref={plusButtonRef}
              type="button"
              onClick={() => setPlusMenuOpen(!plusMenuOpen)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-transparent hover:bg-muted/50 transition-colors flex items-center justify-center active:scale-95 z-10"
              aria-label="Mehr Optionen"
              disabled={isLoading}
            >
              <Plus className="w-4 h-4 text-muted-foreground" />
            </button>
            
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={1}
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-muted border-0 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none overflow-y-auto min-h-[44px] max-h-[120px] leading-relaxed"
              style={{
                height: 'auto',
                minHeight: '44px',
              }}
              disabled={isLoading}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
              }}
            />
          </div>

          {/* Voice/Submit Button - Right */}
          {input.trim() ? (
            <button
              type="submit"
              disabled={isLoading}
              className="w-10 h-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center active:scale-95 shadow-md self-center"
              aria-label={isLoading ? "Wird gesendet..." : "Nachricht senden"}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ArrowUp className="w-5 h-5" />
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleVoiceRecording}
              className={cn(
                "transition-colors flex items-center justify-center active:scale-95 self-center p-2",
                isRecording ? "text-red-500 hover:text-red-600" : "text-foreground hover:text-foreground/80"
              )}
              aria-label="Spracheingabe"
              disabled={isLoading}
            >
              <Mic className={cn(
                "w-7 h-7",
                isRecording ? "text-red-500" : "text-foreground"
              )} />
            </button>
          )}
        </div>
      </div>
    </form>
  );

  return (
    <>
      {/* Plus Menu Dropdown - rendered outside form to avoid stacking context issues */}
      {plusMenuOpen && (
        <div 
          ref={plusMenuDropdownRef}
          className="fixed bg-background border border-border rounded-lg shadow-2xl z-[99999] min-w-[200px] overflow-hidden" 
          style={{
            bottom: `${menuPosition.bottom}px`,
            left: `${menuPosition.left}px`
          }}
        >
          <button
            type="button"
            onClick={() => {
              fileInputRef.current?.click();
              setPlusMenuOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left"
          >
            <Paperclip className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm">Datei anhängen</span>
          </button>
          <button
            type="button"
            onClick={() => {
              imageInputRef.current?.click();
              setPlusMenuOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left"
          >
            <Image className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm">Bild hinzufügen</span>
          </button>
        </div>
      )}
      <div
        ref={containerRef}
        className={cn(
          "flex flex-col bg-background text-foreground",
          className
        )}
        style={{ height }}
      >
      {displayMessages.length === 0 ? (
        <div className="flex flex-col h-full animate-in fade-in duration-300 pb-20">
          {/* Main Content Area - Empty */}
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="w-full max-w-2xl">
              {/* Empty space - messages would go here */}
            </div>
          </div>

          {/* Suggested Prompts - Fixed above Input (like ChatGPT) */}
          {normalizedPrompts.length > 0 && (
            <div className="fixed bottom-24 left-0 right-0 px-4 pb-2 z-[1] pointer-events-none">
              <div className="w-full max-w-2xl mx-auto">
                <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 pointer-events-auto">
                  <div className="flex gap-3" style={{ width: 'max-content' }}>
                    {normalizedPrompts.map((prompt, index) => {
                      const hasSubtitle = prompt.subtitle && prompt.subtitle.trim().length > 0;
                      return (
                        <button
                          key={index}
                          onClick={() => handleSuggestedPromptClick(prompt.text)}
                          disabled={isLoading}
                          className="flex-shrink-0 w-[calc(40vw-1rem)] min-w-[140px] max-w-[160px] rounded-xl bg-muted hover:bg-muted/80 active:bg-muted/70 px-2.5 py-2 text-left transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
                          type="button"
                        >
                          <p className="font-medium text-xs text-foreground mb-0.5 line-clamp-2 leading-tight">
                            {prompt.text}
                          </p>
                          {hasSubtitle && (
                            <p className="text-[10px] text-muted-foreground line-clamp-2 leading-tight">
                              {prompt.subtitle}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Input Form - Fixed at bottom */}
          <div className="fixed bottom-0 left-0 right-0 w-full bg-background px-4 py-3 safe-bottom" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
            <div className="w-full max-w-2xl mx-auto">
              {renderInputForm()}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div ref={scrollAreaRef} className="flex-1 overflow-hidden pb-32">
            <ScrollArea className="h-full [&>div>div]:!overflow-y-auto [&>div>div]:[-ms-overflow-style:none] [&>div>div]:[scrollbar-width:none] [&>div>div::-webkit-scrollbar]:hidden">
              <div className="flex flex-col p-4 space-y-4 pb-6">
                {displayMessages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
                      message.role === "user"
                        ? "justify-end"
                        : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] select-text",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground rounded-2xl px-4 py-3 text-base"
                          : "text-foreground text-base"
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
                        <p className="whitespace-pre-wrap leading-relaxed">
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

          {/* Suggested Prompts - Fixed above Input when messages exist (like ChatGPT) */}
          {normalizedPrompts.length > 0 && (
            <div className="fixed bottom-24 left-0 right-0 px-4 pb-2 z-[1] pointer-events-none">
              <div className="w-full max-w-2xl mx-auto">
                <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 pointer-events-auto">
                  <div className="flex gap-3" style={{ width: 'max-content' }}>
                    {normalizedPrompts.map((prompt, index) => {
                      const hasSubtitle = prompt.subtitle && prompt.subtitle.trim().length > 0;
                      return (
                        <button
                          key={index}
                          onClick={() => handleSuggestedPromptClick(prompt.text)}
                          disabled={isLoading}
                          className="flex-shrink-0 w-[calc(40vw-1rem)] min-w-[140px] max-w-[160px] rounded-xl bg-muted hover:bg-muted/80 active:bg-muted/70 px-2.5 py-2 text-left transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
                          type="button"
                        >
                          <p className="font-medium text-xs text-foreground mb-0.5 line-clamp-2 leading-tight">
                            {prompt.text}
                          </p>
                          {hasSubtitle && (
                            <p className="text-[10px] text-muted-foreground line-clamp-2 leading-tight">
                              {prompt.subtitle}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Input Form - Fixed at bottom */}
          <div className="fixed bottom-0 left-0 right-0 w-full bg-background/95 backdrop-blur-sm px-4 py-3 safe-bottom flex-shrink-0 z-30" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
            <div className="w-full max-w-2xl mx-auto">
              {renderInputForm()}
            </div>
          </div>
        </>
      )}
      </div>
    </>
  );
}

