import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { AIChatBox, type Message } from '@/components/AIChatBox';
import Layout from '@/components/Layout';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { RotateCcw, History, X, UserPlus, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChatHistory, getChatConversation, createNewChat, saveChatConversation, clearAllChatHistory, deleteChatConversationById } from '@/lib/chatHistory';
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

// SYSTEM_MESSAGE wird jetzt innerhalb der Komponente erstellt, um t() verwenden zu können

export default function AIChat() {
  const { t, i18n } = useTranslation();
  const [chatHistoryOpen, setChatHistoryOpen] = useState(false);
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const { data: chatHistory = [], refetch: refetchHistory } = useChatHistory();
  const chatHistoryRef = useRef<HTMLDivElement>(null);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const previousChatIdRef = useRef<string | null>(null);
  
  // SYSTEM_MESSAGE mit Übersetzung und Sprache
  const getSystemMessage = useCallback((): Message => {
    const language = i18n.language || 'de';
    const languageName = language === 'de' ? t('common.german', 'Deutsch') : 
                        language === 'en' ? t('common.english', 'English') :
                        language === 'es' ? t('common.spanish', 'Español') :
                        language === 'nl' ? t('common.dutch', 'Nederlands') :
                        language === 'it' ? t('common.italian', 'Italiano') :
                        language === 'fr' ? t('common.french', 'Français') : t('common.german', 'Deutsch');
    
    return {
      role: 'system' as const,
      content: `${t('aiChat.systemMessage')}\n\n${t('aiChat.languageInstruction', 'WICHTIG: Du musst IMMER in {{language}} antworten. Alle Antworten müssen in der Sprache {{language}} sein, die der Benutzer ausgewählt hat.', { language: languageName })}`,
    };
  }, [t, i18n.language]);
  
  // Initialize messages from Firebase Chat History only (no localStorage)
  // Use a function to initialize to avoid issues with useMemo dependencies
  const [messages, setMessages] = useState<Message[]>(() => [getSystemMessage()]);

  // Load chat from Firebase ONLY when currentChatId changes (not when chatHistory updates)
  // This prevents race conditions where refetching chatHistory overwrites new messages
  useEffect(() => {
    // Only load if chatId actually changed, not just when chatHistory updates
    if (currentChatId === previousChatIdRef.current) {
      return; // Don't reload if it's the same chat
    }
    
    previousChatIdRef.current = currentChatId;
    
    const systemMessage = getSystemMessage();
    
    // If no chatId, reset to system message only
    if (!currentChatId) {
      setMessages([systemMessage]);
      return;
    }
    
    // Try to load from chatHistory if available
    if (chatHistory && chatHistory.length > 0) {
      const chat = getChatConversation(currentChatId, chatHistory);
      if (chat && chat.messages && chat.messages.length > 0) {
        // Replace system message with current language version
        const updatedMessages = chat.messages.map((msg: Message) => 
          msg.role === 'system' ? systemMessage : msg
        );
        setMessages(updatedMessages);
        return;
      }
    }
    
    // If chat not found in history yet, just set system message
    // (messages will be added when user sends first message)
    setMessages([systemMessage]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChatId, getSystemMessage]); // chatHistory intentionally excluded to prevent race conditions

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
            if (firstUserMessage && (chat.title === t('aiChat.newConversation') || !chat.title)) {
              updatedChat.title = firstUserMessage.content.substring(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '');
            }
            await saveChatConversation(updatedChat);
          } else {
            // Chat doesn't exist in history yet, create it
            const newChat = {
              id: currentChatId,
              userId: '',
              title: messages.find(m => m.role === 'user')?.content.substring(0, 50) + (messages.find(m => m.role === 'user')?.content.length && messages.find(m => m.role === 'user')!.content.length > 50 ? '...' : '') || t('aiChat.newConversation'),
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
      setMessages([getSystemMessage()]);
      await refetchHistory();
      toast.success(t('aiChat.newConversationStarted'));
    } catch (error) {
      console.error('Error creating new chat:', error);
      toast.error(t('aiChat.errorCreatingConversation'));
    }
  }, [refetchHistory, getSystemMessage, t]);

  const chatMutation = trpc.ai.chat.useMutation({
    onSuccess: (data) => {
      try {
        if (!data || !data.content) {
          console.error('Invalid response from AI:', data);
          throw new Error('Invalid response from AI');
        }
        
        const aiResponse: Message = {
          role: 'assistant',
          content: data.content,
        };
        setMessages((prev) => {
          const systemMessage = getSystemMessage();
          if (!prev || prev.length === 0) {
            return [systemMessage, aiResponse];
          }
          return [...prev, aiResponse];
        });
      } catch (error) {
        console.error('Error processing AI response:', error);
        toast.error(t('aiChat.errors.sendErrorRetry'));
      }
    },
    onError: (error) => {
      try {
        // Better error handling for different error types
        let errorMessage = t('aiChat.errors.unknown');
        
        // Netzwerk-Fehler
        if (error.message?.includes('<!doctype') || error.message?.includes('Unexpected token') || error.message?.includes('Failed to fetch')) {
          errorMessage = t('aiChat.errors.serverUnreachable');
        } else if (error.message?.includes('Unable to transform') || error.message?.includes('NetworkError')) {
          errorMessage = t('aiChat.errors.dataTransfer');
        } 
        // Authentifizierungs-Fehler
        else if (error.data?.code === 'UNAUTHORIZED' || error.message?.includes('unauthenticated')) {
          errorMessage = t('aiChat.errors.unauthorized');
        } 
        // Server-Fehler
        else if (error.data?.code === 'INTERNAL_SERVER_ERROR' || error.message?.includes('500')) {
          errorMessage = t('aiChat.errors.serverError');
        } 
        // Timeout-Fehler
        else if (error.message?.includes('timeout') || error.message?.includes('Timeout')) {
          errorMessage = t('aiChat.errors.timeout');
        }
        // Rate-Limiting
        else if (error.message?.includes('rate limit') || error.message?.includes('429')) {
          errorMessage = t('aiChat.errors.rateLimit');
        }
        // Andere Fehler
        else {
          errorMessage = error.message || t('aiChat.errors.generic');
        }
        
        // Entferne die letzte User-Nachricht nicht, sondern füge eine Fehlermeldung hinzu
        const errorResponse: Message = {
          role: 'assistant',
          content: `**${t('aiChat.errors.occurred')}**\n\n${errorMessage}\n\n${t('aiChat.errors.tryAgain')}`,
        };
        
        setMessages((prev) => {
          const systemMessage = getSystemMessage();
          if (!prev || prev.length === 0) {
            return [systemMessage, errorResponse];
          }
          return [...prev, errorResponse];
        });
        
        toast.error(t('aiChat.errors.sendError'));
        
        // Log für Debugging
        console.error('AI Chat Error:', {
          message: error.message,
          code: error.data?.code,
          stack: error instanceof Error ? error.stack : undefined,
        });
      } catch (handlerError) {
        console.error('Error in error handler:', handlerError);
        toast.error(t('aiChat.errors.sendErrorRetry'));
      }
    },
  });
  
  // Update system message when language changes
  useEffect(() => {
    const systemMessage = getSystemMessage();
    setMessages((prev) => {
      if (!prev || prev.length === 0) {
        return [systemMessage];
      }
      // Replace system message if it exists
      const hasSystemMessage = prev.some(m => m.role === 'system');
      if (hasSystemMessage) {
        return prev.map(msg => msg.role === 'system' ? systemMessage : msg);
      }
      // Add system message if it doesn't exist
      return [systemMessage, ...prev];
    });
  }, [getSystemMessage]);

  const handleSendMessage = useCallback(async (content: string) => {
    // Validierung: Maximal 10000 Zeichen pro Nachricht
    if (content.length > 10000) {
      toast.error(t('aiChat.messageTooLong'));
      return;
    }
    
    // Validierung: Maximal 50 Nachrichten in der Historie
    const userMessages = messages.filter(m => m.role === 'user');
    if (userMessages.length >= 50) {
      toast.warning(t('aiChat.tooManyMessages'));
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
          toast.error(t('aiChat.errorCreatingConversation'));
          return; // Don't continue if chat creation failed
        }
      }

      // Add user message
      const userMessage: Message = { role: 'user', content };
      
      // Ensure messages array is valid and has system message
      const systemMessage = getSystemMessage();
      const currentMessages = messages && messages.length > 0 ? messages : [systemMessage];
      const newMessages: Message[] = [...currentMessages, userMessage];
      
      // Ensure we have a system message at the beginning
      if (!newMessages.some(m => m.role === 'system')) {
        newMessages.unshift(systemMessage);
      }
      
      // Validate messages before sending
      if (!newMessages || newMessages.length === 0) {
        console.error('Invalid messages array:', newMessages);
        toast.error(t('aiChat.errors.sendErrorRetry'));
        return;
      }
      
      setMessages(newMessages);

      // Call tRPC mutation with error handling
      try {
        chatMutation.mutate({
          messages: newMessages,
          language: i18n.language,
        });
      } catch (mutationError) {
        console.error('Error in chatMutation.mutate:', mutationError);
        toast.error(t('aiChat.errors.sendErrorRetry'));
        // Revert messages on error
        setMessages(currentMessages);
      }
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      toast.error(t('aiChat.errors.sendErrorRetry'));
    }
  }, [messages, chatMutation, currentChatId, refetchHistory, t, getSystemMessage]);

  // Suggested prompts with context-appropriate icons
  const suggestedPrompts = useMemo(() => [
    { text: t('aiChat.suggestedPrompts.howInvoiceManagement'), icon: 'receipt' as const },
    { text: t('aiChat.suggestedPrompts.howCreateReminder'), icon: 'bell' as const },
    { text: t('aiChat.suggestedPrompts.howManageFinances'), icon: 'wallet' as const },
    { text: t('aiChat.suggestedPrompts.whatCanShoppingList'), icon: 'shoppingCart' as const },
    { text: t('aiChat.suggestedPrompts.howInstallmentSystem'), icon: 'calendar' as const },
    { text: t('aiChat.suggestedPrompts.howScanBill'), icon: 'scan' as const },
  ], [t]);
  
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
      return t('aiChat.dateToday');
    } else if (days === 1) {
      return t('aiChat.dateYesterday');
    } else if (days < 7) {
      return t('aiChat.dateDaysAgo', { days });
    } else {
      return date.toLocaleDateString(i18n.language, { day: '2-digit', month: '2-digit' });
    }
  };

  const handleClearAllChats = async () => {
    if (chatHistory.length === 0) {
      toast.info(t('aiChat.noChatsToDelete'));
      setShowClearAllDialog(false);
      return;
    }

    setIsClearing(true);
    try {
      const result = await clearAllChatHistory();
      toast.success(
        result.deletedCount !== 1 
          ? t('aiChat.deleted', { count: result.deletedCount, plural: 's' })
          : t('aiChat.deletedSingular', { count: result.deletedCount })
      );
      setShowClearAllDialog(false);
      setChatHistoryOpen(false);
      await refetchHistory();
      // Reset to new chat
      handleNewConversation();
    } catch (error) {
      console.error('Fehler beim Löschen aller Chats:', error);
      toast.error(t('aiChat.deleteError'));
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <Layout title={t('aiChat.title')}>
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
            <span className="hidden sm:inline">{t('aiChat.newConversation')}</span>
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
              <span className="hidden sm:inline">{t('aiChat.history')}</span>
            </Button>

            {/* Chat History Dropdown */}
            {chatHistoryOpen && (
              <div className="absolute top-full right-0 mt-2 w-72 bg-background border border-border rounded-lg shadow-lg z-50 overflow-hidden max-h-[60vh] flex flex-col">
                <div className="p-3 border-b border-border flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{t('aiChat.chatHistory')}</h3>
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
                      {t('aiChat.noConversations')}
                    </p>
                  ) : (
                    <div className="p-2 space-y-1">
                      {chatHistory.map((chat) => {
                        const isActive = currentChatId === chat.id;
                        return (
                          <div
                            key={chat.id}
                            className={cn(
                              "group w-full flex items-start gap-2 px-3 py-2 rounded-lg transition-colors",
                              isActive
                                ? "bg-primary/10"
                                : "hover:bg-muted"
                            )}
                          >
                            <button
                              onClick={() => {
                                setCurrentChatId(chat.id);
                                setChatHistoryOpen(false);
                              }}
                              className="flex-1 min-w-0 text-left"
                            >
                              <p className={cn(
                                "text-sm leading-snug break-words",
                                isActive ? "font-medium text-primary" : "text-foreground"
                              )}
                              style={{ 
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}
                              >
                                {chat.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDate(chat.updatedAt)}
                              </p>
                            </button>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  await deleteChatConversationById(chat.id);
                                  if (currentChatId === chat.id) {
                                    setCurrentChatId(null);
                                    setMessages([getSystemMessage()]);
                                  }
                                  await refetchHistory();
                                  toast.success(t('aiChat.chatDeleted'));
                                } catch (error) {
                                  toast.error(t('aiChat.errorDeletingChat'));
                                }
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-destructive/10 rounded transition-all flex-shrink-0"
                              title={t('common.delete')}
                            >
                              <X className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                            </button>
                          </div>
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
                      <span>{t('aiChat.clearAll')}</span>
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
            emptyStateMessage={t('aiChat.emptyStateMessage')}
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
              {t('aiChat.clearAllConfirm')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {chatHistory.length !== 1 
                ? t('aiChat.clearAllDescription', { count: chatHistory.length, plural: 's' })
                : t('aiChat.clearAllDescriptionSingular', { count: chatHistory.length })
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isClearing}>{t('aiChat.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAllChats}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isClearing}
            >
              {isClearing ? t('aiChat.deleting') : t('aiChat.confirmDelete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
