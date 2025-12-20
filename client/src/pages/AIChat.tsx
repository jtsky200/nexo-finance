import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { AIChatBox, type Message } from '@/components/AIChatBox';
import Layout from '@/components/Layout';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { RotateCcw, History, X, UserPlus, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChatHistory, getChatConversation, createNewChat, saveChatConversation, clearAllChatHistory } from '@/lib/chatHistory';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const SYSTEM_MESSAGE: Message = {
  role: 'system',
  content: 'Du bist ein hilfreicher Assistent für die Nexo-Anwendung. Du hilfst Benutzern bei Fragen zu Finanzen, Rechnungen, Terminen und anderen Funktionen der App.',
};

export default function AIChat() {
  const { t } = useTranslation();
  const [chatHistoryOpen, setChatHistoryOpen] = useState(false);
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const { data: chatHistory, refetch: refetchHistory } = useChatHistory();
  const chatHistoryRef = useRef<HTMLDivElement>(null);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  
  // Initialize messages from Firebase Chat History only (no localStorage)
  const [messages, setMessages] = useState<Message[]>([SYSTEM_MESSAGE]);

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

  // Save messages to Firebase Chat History only (debounced to avoid too many writes)
  useEffect(() => {
    if (currentChatId && messages.length > 1) { // More than just system message
      const timeoutId = setTimeout(async () => {
        try {
          const chat = getChatConversation(currentChatId, chatHistory);
          // If chat exists in history, update it; otherwise create a new one
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
          } else {
            // Chat doesn't exist in history yet, create it
            const newChat = {
              id: currentChatId,
              userId: '',
              title: messages.find(m => m.role === 'user')?.content.substring(0, 50) + (messages.find(m => m.role === 'user')?.content.length && messages.find(m => m.role === 'user')!.content.length > 50 ? '...' : '') || 'Neue Konversation',
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
          // Refetch to get updated data
          await refetchHistory();
        } catch (err) {
          console.error('Error saving chat to Firebase:', err);
        }
      }, 1000); // Debounce by 1 second
      
      return () => clearTimeout(timeoutId);
    }
  }, [messages, currentChatId, chatHistory, refetchHistory]);

  // Neue Konversation starten
  const handleNewConversation = useCallback(async () => {
    const newChat = createNewChat();
    try {
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
          await saveChatConversation(newChat);
          // saveChatConversation updates newChat.id with the Firebase ID
          setCurrentChatId(newChat.id);
          await refetchHistory();
        } catch (error) {
          console.error('Error creating new chat:', error);
          toast.error('Fehler beim Erstellen der Konversation');
          return; // Don't continue if chat creation failed
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

  const handleClearAllChats = async () => {
    if (chatHistory.length === 0) {
      toast.info('Keine Chats zum Löschen vorhanden');
      setShowClearAllDialog(false);
      return;
    }

    setIsClearing(true);
    try {
      const result = await clearAllChatHistory();
      toast.success(`${result.deletedCount} Chat${result.deletedCount !== 1 ? 's' : ''} gelöscht`);
      setShowClearAllDialog(false);
      setChatHistoryOpen(false);
      await refetchHistory();
      // Reset to new chat
      handleNewConversation();
    } catch (error) {
      console.error('Fehler beim Löschen aller Chats:', error);
      toast.error('Fehler beim Löschen der Chats');
    } finally {
      setIsClearing(false);
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
                {chatHistory.length > 0 && (
                  <div className="p-3 border-t border-border">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowClearAllDialog(true)}
                      className="w-full flex items-center justify-center gap-2"
                      disabled={isClearing}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Alle löschen</span>
                    </Button>
                  </div>
                )}
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

      {/* Clear All Chats Confirmation Dialog */}
      <AlertDialog open={showClearAllDialog} onOpenChange={setShowClearAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Alle Chats löschen?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Alle {chatHistory.length} Chat{chatHistory.length !== 1 ? 's' : ''} werden permanent gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isClearing}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAllChats}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isClearing}
            >
              {isClearing ? 'Löschen...' : 'Ja, alle löschen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
