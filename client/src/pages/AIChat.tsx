import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { AIChatBox, type Message } from '@/components/AIChatBox';
import Layout from '@/components/Layout';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { RotateCcw, History, X, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChatHistory, getChatConversation, createNewChat, saveChatConversation } from '@/lib/chatHistory';
import { cn } from '@/lib/utils';

const CHAT_STORAGE_KEY = 'nexo_chat_messages';
const SYSTEM_MESSAGE: Message = {
  role: 'system',
  content: 'Du bist ein hilfreicher Assistent für die Nexo-Anwendung. Du hilfst Benutzern bei Fragen zu Finanzen, Rechnungen, Terminen und anderen Funktionen der App.',
};

export default function AIChat() {
  const { t } = useTranslation();
  const [chatHistoryOpen, setChatHistoryOpen] = useState(false);
  const { data: chatHistory, refetch: refetchHistory } = useChatHistory();
  const chatHistoryRef = useRef<HTMLDivElement>(null);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  
  // Lade gespeicherte Nachrichten aus LocalStorage oder Chat History
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Message[];
        // Stelle sicher, dass System-Message vorhanden ist
        if (!parsed.some(m => m.role === 'system')) {
          return [SYSTEM_MESSAGE, ...parsed];
        }
        return parsed;
      }
    } catch (e) {
      console.error('Fehler beim Laden der Chat-Historie:', e);
    }
    return [SYSTEM_MESSAGE];
  });

  // Load chat from history when currentChatId changes
  useEffect(() => {
    if (currentChatId && chatHistory.length > 0) {
      const chat = getChatConversation(currentChatId, chatHistory);
      if (chat && chat.messages) {
        setMessages(chat.messages);
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chat.messages));
      }
    }
  }, [currentChatId, chatHistory]);

  // Speichere Nachrichten in LocalStorage und Chat History bei jeder Änderung
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
      
      // Save to chat history if we have a current chat
      if (currentChatId && chatHistory.length > 0 && messages.length > 1) {
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
          saveChatConversation(updatedChat).catch(err => {
            console.error('Error saving chat:', err);
          });
        }
      }
    } catch (e) {
      console.error('Fehler beim Speichern der Chat-Historie:', e);
    }
  }, [messages, currentChatId, chatHistory]);

  // Neue Konversation starten
  const handleNewConversation = useCallback(async () => {
    const newChat = createNewChat();
    try {
      await saveChatConversation(newChat);
      setCurrentChatId(newChat.id);
      await refetchHistory();
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
    setMessages([SYSTEM_MESSAGE]);
    localStorage.removeItem(CHAT_STORAGE_KEY);
    toast.success('Neue Konversation gestartet');
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
      
      // Entferne die letzte User-Nachricht, da sie nicht erfolgreich verarbeitet wurde
      setMessages((prev) => {
        const filtered = prev.filter((msg, index) => {
          // Behalte die letzte User-Nachricht, aber füge eine Fehlermeldung hinzu
          return true;
        });
        return filtered;
      });
      
      const errorResponse: Message = {
        role: 'assistant',
        content: `**Fehler aufgetreten**\n\n${errorMessage}\n\nBitte versuche es erneut oder starte eine neue Konversation.`,
      };
      setMessages((prev) => [...prev, errorResponse]);
      toast.error('Fehler beim Senden der Nachricht');
      
      // Log für Debugging
      console.error('AI Chat Error:', {
        message: error.message,
        code: error.data?.code,
        stack: error instanceof Error ? error.stack : undefined,
      });
    },
  });

  const handleSendMessage = useCallback(async (content: string) => {
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
      // Create new chat if we don't have one
      if (!currentChatId) {
        const newChat = createNewChat();
        newChat.title = content.substring(0, 50) + (content.length > 50 ? '...' : '');
        try {
          const result = await saveChatConversation(newChat);
          setCurrentChatId(newChat.id);
          await refetchHistory();
        } catch (error) {
          console.error('Error creating new chat:', error);
        }
      }

      // Add user message
      const userMessage: Message = { role: 'user', content };
      const newMessages: Message[] = [...messages, userMessage];
      setMessages(newMessages);

      // Call tRPC mutation
      chatMutation.mutate({
        messages: newMessages,
      });
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      toast.error('Fehler beim Senden der Nachricht. Bitte versuche es erneut.');
    }
  }, [messages, chatMutation, currentChatId, refetchHistory]);

  // Suggested prompts with context-appropriate icons
  const suggestedPrompts = useMemo(() => [
    { text: 'Wie funktioniert die Rechnungsverwaltung?', icon: 'receipt' as const },
    { text: 'Wie erstelle ich eine Erinnerung?', icon: 'bell' as const },
    { text: 'Wie verwalte ich meine Finanzen?', icon: 'wallet' as const },
    { text: 'Was kann ich mit der Einkaufsliste machen?', icon: 'shoppingCart' as const },
    { text: 'Wie funktioniert das Raten-System?', icon: 'calendar' as const },
    { text: 'Wie scanne ich eine Rechnung?', icon: 'scan' as const },
  ], []);
  
  // Prüfe ob bereits Nachrichten gesendet wurden (ausser System-Nachrichten)
  const hasUserMessages = messages.some(m => m.role === 'user');

  // Reload chat history when dropdown opens
  useEffect(() => {
    if (chatHistoryOpen) {
      refetchHistory();
    }
  }, [chatHistoryOpen, refetchHistory]);

  // Close chat history when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chatHistoryRef.current && !chatHistoryRef.current.contains(event.target as Node)) {
        setChatHistoryOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (timestamp: string | number | Date) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : 
                 typeof timestamp === 'number' ? new Date(timestamp) : timestamp;
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return 'Heute';
    } else if (days === 1) {
      return 'Gestern';
    } else if (days < 7) {
      return `vor ${days} Tagen`;
    } else {
      return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
    }
  };

  return (
    <Layout title="Assistent">
      <div className="h-[calc(100vh-140px)] flex flex-col bg-background">
        {/* Header with New Chat and History Buttons - Always visible */}
        <div className="flex items-center justify-end gap-2 py-2 px-4 max-w-4xl mx-auto w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={handleNewConversation}
            className="flex items-center gap-2"
            disabled={!hasUserMessages}
          >
            <UserPlus className="size-4" />
            <span className="hidden sm:inline">Neue Konversation</span>
          </Button>
          
          {/* Chat History Button */}
          <div className="relative" ref={chatHistoryRef}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setChatHistoryOpen(!chatHistoryOpen);
                if (!chatHistoryOpen) {
                  refetchHistory();
                }
              }}
              className="flex items-center gap-2"
            >
              <History className="size-4" />
              <span className="hidden sm:inline">Verlauf</span>
            </Button>

            {/* Chat History Dropdown */}
            {chatHistoryOpen && (
              <div className="absolute top-full right-0 mt-2 w-72 bg-background border border-border rounded-lg shadow-lg z-50 overflow-hidden max-h-[60vh] flex flex-col">
                <div className="p-3 border-b border-border flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Chat-Verlauf</h3>
                  <button
                    onClick={() => setChatHistoryOpen(false)}
                    className="p-1 hover:bg-muted rounded transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="overflow-y-auto">
                  {chatHistory.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 px-3 text-center">
                      Noch keine Konversationen
                    </p>
                  ) : (
                    <div className="p-2">
                      {chatHistory.map((chat) => {
                        const isActive = currentChatId === chat.id;
                        return (
                          <button
                            key={chat.id}
                            onClick={() => {
                              setCurrentChatId(chat.id);
                              setChatHistoryOpen(false);
                            }}
                            className={cn(
                              "w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg transition-colors text-left",
                              isActive
                                ? "bg-primary/10 text-primary"
                                : "hover:bg-muted"
                            )}
                          >
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                "text-sm truncate",
                                isActive && "font-medium"
                              )}>
                                {chat.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {formatDate(chat.updatedAt)}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chat Box - Nimmt den ganzen Platz */}
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 pb-4 overflow-hidden">
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
    </Layout>
  );
}
