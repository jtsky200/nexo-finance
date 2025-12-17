import { trpc } from '@/lib/trpc';
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { MessageSquare, RotateCcw, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { AIChatBox, type Message } from './AIChatBox';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { useChatReminders, markChatReminderAsRead, type ChatReminder } from '@/lib/firebaseHooks';
import { eventBus, Events } from '@/lib/eventBus';
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
  const { data: chatReminders, refetch } = useChatReminders(true);
  const processedRemindersRef = useRef<Set<string>>(new Set());
  const { data: chatHistory, refetch: refetchHistory } = useChatHistory();
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

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
          if (process.env.NODE_ENV === 'development') {
            console.error('Error initializing chat:', error);
          }
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

  useEffect(() => {
    if (open && pendingReminder && pendingReminder.message) {
      const reminderAlreadyAdded = messages.some(
        m => m.role === 'assistant' && m.content.includes(pendingReminder.reminderTitle)
      );
      
      if (!reminderAlreadyAdded) {
        const reminderMessage: Message = {
          role: 'assistant',
          content: pendingReminder.message,
        };
        
        setMessages(prev => {
          const systemMsg = prev.find(m => m.role === 'system') || SYSTEM_MESSAGE;
          const otherMessages = prev.filter(m => m.role !== 'system');
          return [systemMsg, ...otherMessages, reminderMessage];
        });
        
        if (onReminderProcessed) {
          onReminderProcessed();
        }
      }
    }
  }, [open, pendingReminder, messages, onReminderProcessed]);

  useEffect(() => {
    if (chatReminders.length > 0) {
      const newestReminder = chatReminders
        .filter(r => r.shouldOpenDialog && !r.isRead && !processedRemindersRef.current.has(r.id))
        .sort((a, b) => {
          const aTime = new Date(a.createdAt).getTime();
          const bTime = new Date(b.createdAt).getTime();
          return bTime - aTime;
        })[0];
      
      if (newestReminder) {
        processedRemindersRef.current.add(newestReminder.id);
        markChatReminderAsRead(newestReminder.id).catch((error) => {
          if (process.env.NODE_ENV === 'development') {
            console.error('Error marking reminder as read:', error);
          }
        });
        eventBus.emit(Events.CHAT_REMINDER_RECEIVED, newestReminder);
        setTimeout(() => {
          onOpenChange(true);
          eventBus.emit(Events.CHAT_DIALOG_OPEN, { reminder: newestReminder });
          toast.info('Neue Erinnerung', {
            description: newestReminder.reminderTitle,
            duration: 3000,
          });
        }, 500);
        setTimeout(() => refetch(), 1000);
      }
    }
  }, [chatReminders, refetch, onOpenChange]);

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
          if (process.env.NODE_ENV === 'development') {
            console.error('Error saving chat to Firebase:', err);
          }
        }
      }, 1000); // Debounce by 1 second
      
      return () => clearTimeout(timeoutId);
    }
  }, [messages, currentChatId, chatHistory, refetchHistory]);

  const handleNewConversation = useCallback(async () => {
    try {
      const newChat = createNewChat();
      await saveChatConversation(newChat);
      setCurrentChatId(newChat.id);
      setMessages([SYSTEM_MESSAGE]);
      await refetchHistory();
      toast.success('Neue Konversation gestartet');
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error creating new chat:', error);
      }
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
      setMessages((prev) => {
        const filtered = prev.filter((msg, index) => {
          if (index === prev.length - 1 && msg.role === 'user') {
            return false;
          }
          return true;
        });
        return [...filtered, errorResponse];
      });
      toast.error('Fehler beim Senden der Nachricht');
      
      if (process.env.NODE_ENV === 'development') {
        console.error('AI Chat Error:', {
          message: error.message,
          code: error.data?.code,
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
    },
  });

  const handleSendMessage = useCallback((content: string) => {
    if (content.length > 10000) {
      toast.error('Nachricht ist zu lang. Bitte kürze sie auf maximal 10.000 Zeichen.');
      return;
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
      if (process.env.NODE_ENV === 'development') {
        console.error('Error in handleSendMessage:', error);
      }
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        showCloseButton={false}
        className="max-w-full w-full h-full max-h-[100vh] m-0 p-0 flex flex-col gap-0 rounded-none sm:rounded-lg sm:max-w-lg sm:h-[90vh] sm:m-4 safe-area-inset"
      >
        <DialogDescription className="sr-only">
          Chat-Assistent Dialog für Konversationen mit dem KI-Assistenten
        </DialogDescription>
        <DialogHeader className="px-4 py-4 border-b border-border safe-top flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-6 h-6 text-primary" />
              <DialogTitle className="text-lg">Assistent</DialogTitle>
            </div>
            <div className="flex items-center gap-3">
              {hasUserMessages && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNewConversation}
                  className="h-10 text-sm gap-2 px-4 min-h-[44px]"
                >
                  <RotateCcw className="h-4 w-4" />
                  Neu
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-10 w-10 p-0 min-h-[44px] min-w-[44px]"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-hidden min-h-0">
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
      </DialogContent>
    </Dialog>
  );
}

