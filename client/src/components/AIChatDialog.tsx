import { trpc } from '@/lib/trpc';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';

import { MessageSquare, RotateCcw, X, GripVertical } from 'lucide-react';

import { useTranslation } from 'react-i18next';

import { toast } from 'sonner';

import { AIChatBox, type Message } from './AIChatBox';

import { Button } from './ui/button';
import { createPortal } from 'react-dom';
import { useChatHistory, createNewChat, saveChatConversation, getChatConversation } from '@/lib/chatHistory';

const SYSTEM_MESSAGE: Message = {
  role: 'system',
  content: 'Du bist ein hilfreicher Assistent für die Nexo-Anwendung. Du hilfst Benutzern bei Fragen zu Finanzen, Rechnungen, Terminen und anderen Funktionen der App.',
};

interface AIChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingReminder?: { message: string; reminderTitle: string } | null;
  onReminderProcessed?: () => void;
}

export default function AIChatDialog({ open, onOpenChange, pendingReminder, onReminderProcessed }: AIChatDialogProps) {
  const { t } = useTranslation();
  const { data: chatHistory, refetch: refetchHistory } = useChatHistory();
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  
  // Refs für flüssige Drag-Performance (direkte DOM-Manipulation)
  const dialogRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef({ x: 0, y: 0 });
  const dragDataRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Reset position when dialog opens
  useEffect(() => {
    if (open) {
      positionRef.current = { x: 0, y: 0 };
      if (dialogRef.current) {
        dialogRef.current.style.left = '50%';
        dialogRef.current.style.top = '50%';
      }
    }
  }, [open]);

  // Drag handlers - direkte DOM-Manipulation für flüssige Bewegung
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragDataRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: positionRef.current.x,
      initialY: positionRef.current.y,
    };
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragDataRef.current || !dialogRef.current) return;
      
      const deltaX = e.clientX - dragDataRef.current.startX;
      const deltaY = e.clientY - dragDataRef.current.startY;
      
      const newX = dragDataRef.current.initialX + deltaX;
      const newY = dragDataRef.current.initialY + deltaY;
      
      // Direkte DOM-Manipulation - kein React re-render!
      dialogRef.current.style.left = `calc(50% + ${newX}px)`;
      dialogRef.current.style.top = `calc(50% + ${newY}px)`;
      
      positionRef.current = { x: newX, y: newY };
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragDataRef.current = null;
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove, { passive: true });
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // ESC-Taste zum Schließen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onOpenChange]);

  // Initialize messages from Firebase Chat History only (no localStorage)
  const [messages, setMessages] = useState<Message[]>([SYSTEM_MESSAGE]);

  // Create a new chat when dialog opens for the first time
  useEffect(() => {
    if (open && !currentChatId) {
      const initializeChat = async () => {
        try {
          const newChat = createNewChat();
          await saveChatConversation(newChat);
          setCurrentChatId(newChat.id);
          setMessages([SYSTEM_MESSAGE]);
          await refetchHistory();
        } catch (error) {
          console.error('Error initializing chat:', error);
          // Fallback: still allow chat to work without Firebase
          setMessages([SYSTEM_MESSAGE]);
        }
      };
      initializeChat();
    }
  }, [open, currentChatId, refetchHistory]);

  // Load chat from Firebase when currentChatId changes
  useEffect(() => {
    if (currentChatId && chatHistory.length > 0) {
      const chat = getChatConversation(currentChatId, chatHistory);
      if (chat && chat.messages && chat.messages.length > 0) {
        setMessages(chat.messages);
      } else {
        setMessages([SYSTEM_MESSAGE]);
      }
    } else if (!currentChatId) {
      setMessages([SYSTEM_MESSAGE]);
    }
  }, [currentChatId, chatHistory]);

  // Add pending reminder message when dialog opens with a reminder
  useEffect(() => {
    if (open && pendingReminder && pendingReminder.message) {
      // Check if this reminder message was already added
      const reminderAlreadyAdded = messages.some(
        m => m.role === 'assistant' && m.content.includes(pendingReminder.reminderTitle)
      );
      
      if (!reminderAlreadyAdded) {
        // Add the reminder as an assistant message
        const reminderMessage: Message = {
          role: 'assistant',
          content: pendingReminder.message,
        };
        
        setMessages(prev => {
          // Ensure system message is first
          const systemMsg = prev.find(m => m.role === 'system') || SYSTEM_MESSAGE;
          const otherMessages = prev.filter(m => m.role !== 'system');
          return [systemMsg, ...otherMessages, reminderMessage];
        });
        
        // Mark reminder as processed
        if (onReminderProcessed) {
          onReminderProcessed();
        }
      }
    }
  }, [open, pendingReminder, messages, onReminderProcessed]);

  // Save messages to Firebase Chat History only (debounced to avoid too many writes)
  useEffect(() => {
    if (currentChatId && messages.length > 1) { // More than just system message
      const timeoutId = setTimeout(async () => {
        try {
          const chat = getChatConversation(currentChatId, chatHistory);
          if (chat) {
            const updatedChat = {
              ...chat,
              messages: messages,
              updatedAt: new Date().toISOString(),
            };
            // Update title from first user message if it's still the default
            const firstUserMessage = messages.find(m => m.role === 'user');
            if (firstUserMessage && (chat.title === 'Neue Konversation' || !chat.title)) {
              updatedChat.title = firstUserMessage.content.substring(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '');
            }
            await saveChatConversation(updatedChat);
            // Refetch to get updated data
            await refetchHistory();
          }
        } catch (err) {
          console.error('Error saving chat to Firebase:', err);
        }
      }, 1000); // Debounce by 1 second
      
      return () => clearTimeout(timeoutId);
    }
  }, [messages, currentChatId, chatHistory, refetchHistory]);

  // Neue Konversation starten
  const handleNewConversation = useCallback(async () => {
    try {
      const newChat = createNewChat();
      await saveChatConversation(newChat);
      setCurrentChatId(newChat.id);
      setMessages([SYSTEM_MESSAGE]);
      await refetchHistory();
      toast.success('Neue Konversation gestartet');
    } catch (error) {
      console.error('Error creating new chat:', error);
      toast.error('Fehler beim Erstellen der neuen Konversation');
    }
  }, [refetchHistory]);

  const chatMutation = trpc.ai.chat.useMutation({
    onSuccess: (data) => {
      const aiResponse: Message = {
        role: 'assistant',
        content: data.content,
      };
      setMessages((prev) => [...prev, aiResponse]);
    },
    onError: (error) => {
      // Better error handling for different error types
      let errorMessage = 'Ein unbekannter Fehler ist aufgetreten.';
      
      // Netzwerk-Fehler
      if (error.message.includes('<!doctype') || error.message.includes('Unexpected token') || error.message.includes('Failed to fetch')) {
        errorMessage = 'Der Server ist nicht erreichbar oder gibt eine ungültige Antwort zurück. Bitte stelle sicher, dass der Server läuft und du eine Internetverbindung hast.';
      } else if (error.message.includes('Unable to transform') || error.message.includes('NetworkError')) {
        errorMessage = 'Fehler bei der Datenübertragung. Bitte überprüfe deine Internetverbindung und versuche es erneut.';
      } 
      // Authentifizierungs-Fehler
      else if (error.data?.code === 'UNAUTHORIZED' || error.message.includes('unauthenticated')) {
        errorMessage = 'Du bist nicht angemeldet. Bitte melde dich an.';
      } 
      // Server-Fehler
      else if (error.data?.code === 'INTERNAL_SERVER_ERROR' || error.message.includes('500')) {
        errorMessage = 'Ein Serverfehler ist aufgetreten. Bitte versuche es später erneut.';
      } 
      // Timeout-Fehler
      else if (error.message.includes('timeout') || error.message.includes('Timeout')) {
        errorMessage = 'Die Anfrage hat zu lange gedauert. Bitte versuche es erneut.';
      }
      // Rate-Limiting
      else if (error.message.includes('rate limit') || error.message.includes('429')) {
        errorMessage = 'Zu viele Anfragen. Bitte warte einen Moment und versuche es erneut.';
      }
      // Andere Fehler
      else {
        errorMessage = error.message || 'Ein Fehler ist aufgetreten.';
      }
      
      const errorResponse: Message = {
        role: 'assistant',
        content: `**Fehler aufgetreten**\n\n${errorMessage}\n\nBitte versuche es erneut oder starte eine neue Konversation.`,
      };
      // Remove the last user message since the request failed
      setMessages((prev) => {
        const filtered = prev.filter((msg, index) => {
          // Keep all messages except the last user message
          if (index === prev.length - 1 && msg.role === 'user') {
            return false;
          }
          return true;
        });
        return [...filtered, errorResponse];
      });
      toast.error('Fehler beim Senden der Nachricht');
      
      // Log für Debugging
      console.error('AI Chat Error:', {
        message: error.message,
        code: error.data?.code,
        stack: error instanceof Error ? error.stack : undefined,
      });
    },
  });

  const handleSendMessage = useCallback((content: string) => {
    // Validierung: Maximal 10000 Zeichen pro Nachricht
    if (content.length > 10000) {
      toast.error('Nachricht ist zu lang. Bitte kürze sie auf maximal 10.000 Zeichen.');
      return;
    }
    
    // Validierung: Maximal 50 Nachrichten in der Historie
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
      console.error('Error in handleSendMessage:', error);
      toast.error('Fehler beim Senden der Nachricht. Bitte versuche es erneut.');
    }
  }, [messages, chatMutation]);

  const hasUserMessages = messages.some(m => m.role === 'user');

  const suggestedPrompts = useMemo(() => [
    { text: 'Wie funktioniert die Rechnungsverwaltung?', icon: 'receipt' as const },
    { text: 'Wie erstelle ich eine Erinnerung?', icon: 'bell' as const },
    { text: 'Wie verwalte ich meine Finanzen?', icon: 'wallet' as const },
    { text: 'Was kann ich mit der Einkaufsliste machen?', icon: 'shoppingCart' as const },
    { text: 'Wie funktioniert das Raten-System?', icon: 'calendar' as const },
    { text: 'Wie scanne ich eine Rechnung?', icon: 'scan' as const },
  ], []);

  // Nicht rendern wenn nicht offen
  if (!open) return null;

  return createPortal(
    <>
      {/* Background overlay */}
      <div 
        className="fixed inset-0 z-50 bg-black/50 animate-in fade-in-0" 
        onClick={() => onOpenChange(false)}
      />
      {/* Draggable Dialog Container */}
      <div
        ref={dialogRef}
        className="fixed z-50 bg-background rounded-lg border shadow-lg max-w-3xl w-[95vw] sm:w-[85vw] md:w-[75vw] h-[85vh] flex flex-col p-0 gap-0 overflow-hidden animate-in fade-in-0 zoom-in-95"
        style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          willChange: isDragging ? 'left, top' : 'auto',
        }}
      >
        {/* Header - Draggable */}
        <div 
          className={`flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50 select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2 min-w-0">
            <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <MessageSquare className="w-5 h-5 text-primary flex-shrink-0" />
            <span className="font-semibold text-foreground">Assistent</span>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0 ml-4">
            {hasUserMessages && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => { e.stopPropagation(); handleNewConversation(); }}
                onMouseDown={(e) => e.stopPropagation()}
                className="h-8 text-xs gap-1.5 px-3"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Neu
              </Button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onOpenChange(false); }}
              onMouseDown={(e) => e.stopPropagation()}
              className="rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Schließen"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Chat Bereich - mehr Platz, keine Scrollbar */}
        <div className="flex-1 overflow-hidden [&_*]:[-ms-overflow-style:none] [&_*]:[scrollbar-width:none]">
          <AIChatBox
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={chatMutation.isPending}
            placeholder={t('common.typeMessage', 'Nachricht eingeben...')}
            height="100%"
            emptyStateMessage="Wähle eine Frage oder starte eine eigene Unterhaltung"
            suggestedPrompts={hasUserMessages ? [] : suggestedPrompts}
          />
        </div>
      </div>
    </>,
    document.body
  );
}
