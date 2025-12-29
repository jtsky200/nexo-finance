import { trpc } from '@/lib/trpc';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';

import { RotateCcw, X, GripVertical, Pin, PinOff, History } from 'lucide-react';

import { useTranslation } from 'react-i18next';

import { toast } from 'sonner';

import { AIChatBox, type Message } from './AIChatBox';

import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { createPortal } from 'react-dom';
import { useChatHistory, createNewChat, saveChatConversation, getChatConversation, deleteChatConversationById } from '@/lib/chatHistory';

// SYSTEM_MESSAGE wird jetzt innerhalb der Komponente erstellt, um t() verwenden zu können

interface AIChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingReminder?: { message: string; reminderTitle: string } | null;
  onReminderProcessed?: () => void;
}

export default function AIChatDialog({ open, onOpenChange, pendingReminder, onReminderProcessed }: AIChatDialogProps) {
  const { t, i18n } = useTranslation();
  const { data: chatHistory, refetch: refetchHistory } = useChatHistory();
  
  // Persist currentChatId in localStorage to survive page reloads
  const [currentChatId, setCurrentChatId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('nexo_current_chat_id');
    } catch {
      return null;
    }
  });
  
  // Save currentChatId to localStorage whenever it changes
  useEffect(() => {
    try {
      if (currentChatId) {
        localStorage.setItem('nexo_current_chat_id', currentChatId);
      }
    } catch {
      // localStorage not available
    }
  }, [currentChatId]);
  
  // SYSTEM_MESSAGE mit Übersetzung und Sprache
  const SYSTEM_MESSAGE: Message = useMemo(() => {
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
  
  // Refs für flüssige Drag-Performance (direkte DOM-Manipulation)
  const dialogRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef({ x: 0, y: 0 });
  const dragDataRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

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

  // Sync header background with dialog container - ensure it always matches
  useEffect(() => {
    if (open && dialogRef.current && headerRef.current) {
      const syncBackground = () => {
        if (dialogRef.current && headerRef.current) {
          // Force exact white background - no CSS variables, no computed styles
          const exactWhite = '#ffffff';
          
          // Apply directly to both header and main content area
          headerRef.current.style.setProperty('background-color', exactWhite, 'important');
          headerRef.current.style.setProperty('background', exactWhite, 'important');
          headerRef.current.style.setProperty('background-image', 'none', 'important');
          
          // Also set the main content area to the same color
          const mainContentArea = dialogRef.current.querySelector('[class*="flex-1"][class*="overflow-hidden"]') as HTMLElement;
          if (mainContentArea) {
            mainContentArea.style.setProperty('background-color', exactWhite, 'important');
            mainContentArea.style.setProperty('background', exactWhite, 'important');
          }
          
          // Remove any conflicting classes
          headerRef.current.classList.remove('bg-muted', 'bg-muted/50', 'bg-background', 'bg-card');
        }
      };
      
      // Sync immediately
      syncBackground();
      
      // Use requestAnimationFrame to ensure DOM is fully rendered
      requestAnimationFrame(() => {
        syncBackground();
        // Also sync after delays to catch any late-rendering or CSS transitions
        setTimeout(syncBackground, 50);
        setTimeout(syncBackground, 100);
        setTimeout(syncBackground, 200);
      });
      
      // Set up a MutationObserver to watch for any style changes
      // Use a flag to prevent infinite loops
      let isSyncing = false;
      const observer = new MutationObserver((mutations) => {
        // Only sync if we're not already syncing and if the mutation is not from our own style change
        if (!isSyncing) {
          const shouldSync = mutations.some(mutation => {
            // Only sync if class changed, not style (to avoid infinite loop)
            return mutation.type === 'attributes' && mutation.attributeName === 'class';
          });
          if (shouldSync) {
            isSyncing = true;
            syncBackground();
            // Reset flag after a short delay
            setTimeout(() => { isSyncing = false; }, 100);
          }
        }
      });
      
      observer.observe(headerRef.current, {
        attributes: true,
        attributeFilter: ['class'], // Only watch class, not style to avoid loops
        subtree: false
      });
      
      // Also watch the dialog for class changes
      const dialogObserver = new MutationObserver((mutations) => {
        if (!isSyncing) {
          const shouldSync = mutations.some(mutation => {
            return mutation.type === 'attributes' && mutation.attributeName === 'class';
          });
          if (shouldSync) {
            isSyncing = true;
            syncBackground();
            setTimeout(() => { isSyncing = false; }, 100);
          }
        }
      });
      
      dialogObserver.observe(dialogRef.current, {
        attributes: true,
        attributeFilter: ['class'], // Only watch class, not style
        subtree: false
      });
      
      return () => {
        observer.disconnect();
        dialogObserver.disconnect();
      };
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

  // ESC-Taste zum Schliessen
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

  // Load existing chat or create new one when dialog opens
  useEffect(() => {
    if (open && chatHistory) {
      const initializeChat = async () => {
        try {
          // If we have a currentChatId, check if it exists in history
          if (currentChatId) {
            const existingChat = getChatConversation(currentChatId, chatHistory);
            if (existingChat) {
              // Chat exists, load it
              if (existingChat.messages && existingChat.messages.length > 0) {
                setMessages(existingChat.messages);
              } else {
                setMessages([SYSTEM_MESSAGE]);
              }
              return;
            }
          }
          
          // No currentChatId or chat not found - load the most recent chat or create new
          if (chatHistory.length > 0) {
            // Sort by updatedAt and get the most recent
            const sortedHistory = [...chatHistory].sort((a, b) => 
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );
            const mostRecentChat = sortedHistory[0];
            setCurrentChatId(mostRecentChat.id);
            if (mostRecentChat.messages && mostRecentChat.messages.length > 0) {
              setMessages(mostRecentChat.messages);
            } else {
              setMessages([SYSTEM_MESSAGE]);
            }
          } else {
            // No chat history, create a new one
            const newChat = createNewChat();
            await saveChatConversation(newChat);
            setCurrentChatId(newChat.id);
            setMessages([SYSTEM_MESSAGE]);
            await refetchHistory();
          }
        } catch (error) {
          console.error('Error initializing chat:', error);
          // Fallback: still allow chat to work without Firebase
          setMessages([SYSTEM_MESSAGE]);
        }
      };
      initializeChat();
    }
  }, [open, chatHistory?.length]);

  // Load chat from Firebase when currentChatId changes (e.g., from chat switcher)
  const prevChatIdRef = useRef<string | null>(null);
  useEffect(() => {
    // Only react to manual chat switches, not initial load
    if (currentChatId && currentChatId !== prevChatIdRef.current && prevChatIdRef.current !== null) {
      const chat = getChatConversation(currentChatId, chatHistory || []);
      if (chat && chat.messages && chat.messages.length > 0) {
        setMessages(chat.messages);
      } else {
        setMessages([SYSTEM_MESSAGE]);
      }
    }
    prevChatIdRef.current = currentChatId;
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
            if (firstUserMessage && (chat.title === t('aiChat.newConversation') || !chat.title)) {
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
      setShowHistory(false);
      await refetchHistory();
      toast.success(t('aiChat.newConversationStarted'));
    } catch (error) {
      console.error('Error creating new chat:', error);
      toast.error(t('aiChat.errorCreatingConversation'));
    }
  }, [refetchHistory]);

  // Chat aus Verlauf auswählen
  const handleSelectChat = useCallback((chatId: string) => {
    const chat = getChatConversation(chatId, chatHistory || []);
    if (chat) {
      setCurrentChatId(chatId);
      if (chat.messages && chat.messages.length > 0) {
        setMessages(chat.messages);
      } else {
        setMessages([SYSTEM_MESSAGE]);
      }
      setShowHistory(false);
    }
  }, [chatHistory, SYSTEM_MESSAGE]);

  // Chat löschen
  const handleDeleteChat = useCallback(async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteChatConversationById(chatId);
      await refetchHistory();
      
      // Wenn der gelöschte Chat der aktuelle ist, neuen Chat erstellen
      if (chatId === currentChatId) {
        const newChat = createNewChat();
        await saveChatConversation(newChat);
        setCurrentChatId(newChat.id);
        setMessages([SYSTEM_MESSAGE]);
      }
      
      toast.success(t('aiChat.chatDeleted', 'Chat gelöscht'));
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error(t('aiChat.errorDeletingChat', 'Fehler beim Löschen'));
    }
  }, [currentChatId, refetchHistory, SYSTEM_MESSAGE]);

  // Sortierte Chat-Historie (neueste zuerst)
  const sortedChatHistory = useMemo(() => {
    if (!chatHistory) return [];
    return [...chatHistory].sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
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
      // Better error handling for different error types
      let errorMessage = t('aiChat.errors.unknown');
      
      // Netzwerk-Fehler
      if (error.message.includes('<!doctype') || error.message.includes('Unexpected token') || error.message.includes('Failed to fetch')) {
        errorMessage = t('aiChat.errors.serverUnreachable');
      } else if (error.message.includes('Unable to transform') || error.message.includes('NetworkError')) {
        errorMessage = t('aiChat.errors.dataTransfer');
      } 
      // Authentifizierungs-Fehler
      else if (error.data?.code === 'UNAUTHORIZED' || error.message.includes('unauthenticated')) {
        errorMessage = t('aiChat.errors.unauthorized');
      } 
      // Server-Fehler
      else if (error.data?.code === 'INTERNAL_SERVER_ERROR' || error.message.includes('500')) {
        errorMessage = t('aiChat.errors.serverError');
      } 
      // Timeout-Fehler
      else if (error.message.includes('timeout') || error.message.includes('Timeout')) {
        errorMessage = t('aiChat.errors.timeout');
      }
      // Rate-Limiting
      else if (error.message.includes('rate limit') || error.message.includes('429')) {
        errorMessage = t('aiChat.errors.rateLimit');
      }
      // Andere Fehler
      else {
        errorMessage = error.message || t('aiChat.errors.generic');
      }
      
      const errorResponse: Message = {
        role: 'assistant',
        content: `**${t('aiChat.errors.occurred')}**\n\n${errorMessage}\n\n${t('aiChat.errors.tryAgain')}`,
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
      toast.error(t('aiChat.errors.sendError'));
      
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
      toast.error(t('aiChat.messageTooLong'));
      return;
    }
    
    // Validierung: Maximal 50 Nachrichten in der Historie
    const userMessages = messages.filter(m => m.role === 'user');
    if (userMessages.length >= 50) {
      toast.warning(t('aiChat.tooManyMessages', 'Zu viele Nachrichten in dieser Konversation. Bitte starte eine neue Konversation.'));
      return;
    }
    
    try {
      const userMessage: Message = { role: 'user', content };
      const newMessages: Message[] = [...messages, userMessage];
      setMessages(newMessages);

      chatMutation.mutate({
        messages: newMessages,
        language: i18n.language,
      });
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      toast.error(t('aiChat.errors.sendErrorRetry'));
    }
  }, [messages, chatMutation]);

  const hasUserMessages = messages.some(m => m.role === 'user');

  const suggestedPrompts = useMemo(() => [
    { text: t('aiChat.suggestedPrompts.howInvoiceManagement'), icon: 'receipt' as const },
    { text: t('aiChat.suggestedPrompts.howCreateReminder'), icon: 'bell' as const },
    { text: t('aiChat.suggestedPrompts.howManageFinances'), icon: 'wallet' as const },
    { text: t('aiChat.suggestedPrompts.whatCanShoppingList'), icon: 'shoppingCart' as const },
    { text: t('aiChat.suggestedPrompts.howInstallmentSystem'), icon: 'calendar' as const },
    { text: t('aiChat.suggestedPrompts.howScanBill'), icon: 'scan' as const },
  ], [t, i18n.language]);

  // Nicht rendern wenn nicht offen
  if (!open) return null;

  return createPortal(
    <>
      {/* Background overlay - transparent when pinned, allows click-through */}
      <div 
        className={`fixed inset-0 z-50 animate-in fade-in-0 ${isPinned ? 'pointer-events-none' : 'bg-black/50'}`}
        onClick={() => !isPinned && onOpenChange(false)}
      />
      {/* Draggable Dialog Container */}
      <div
        ref={dialogRef}
        data-ai-chat-dialog
        className="fixed z-50 rounded-lg border max-w-3xl w-[95vw] sm:w-[85vw] md:w-[75vw] h-[85vh] flex flex-col p-0 gap-0 overflow-hidden animate-in fade-in-0 zoom-in-95"
        style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          willChange: isDragging ? 'left, top' : 'auto',
          backgroundColor: '#ffffff',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)' // Explicit shadow instead of shadow-lg class
        }}
      >
        {/* Header - Draggable */}
        <div 
          ref={headerRef}
          data-ai-chat-dialog-header
          className={`flex items-center justify-between px-4 py-3 select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          style={{
            backgroundColor: 'rgb(255, 255, 255)',
            background: 'rgb(255, 255, 255)',
            backgroundImage: 'none',
            backgroundClip: 'border-box',
            backgroundOrigin: 'padding-box',
            filter: 'none',
            backdropFilter: 'none',
            opacity: 1,
            boxShadow: 'none',
            border: 'none',
            borderBottom: 'none',
            transform: 'none',
            willChange: 'auto',
            isolation: 'isolate',
          }}
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2 min-w-0">
            <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="font-semibold text-foreground">{t('nav.assistant')}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            <button
              onClick={(e) => { e.stopPropagation(); setShowHistory(!showHistory); }}
              onMouseDown={(e) => e.stopPropagation()}
              className={`rounded-full p-2 transition-colors ${showHistory ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
              aria-label={t('aiChat.chatHistory', 'Verlauf')}
              title={t('aiChat.chatHistory', 'Verlauf')}
            >
              <History className="h-4 w-4" />
            </button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => { e.stopPropagation(); handleNewConversation(); }}
              onMouseDown={(e) => e.stopPropagation()}
              className="h-8 text-xs gap-1.5 px-3"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t('aiChat.newConversation')}
            </Button>
            <button
              onClick={(e) => { e.stopPropagation(); setIsPinned(!isPinned); }}
              onMouseDown={(e) => e.stopPropagation()}
              className={`rounded-full p-2 transition-colors ${isPinned ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
              aria-label={isPinned ? t('common.unpin', 'Lösen') : t('common.pin', 'Anpinnen')}
              title={isPinned ? t('common.unpin', 'Lösen') : t('common.pin', 'Anpinnen')}
            >
              {isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onOpenChange(false); }}
              onMouseDown={(e) => e.stopPropagation()}
              className="rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label={t('common.close')}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div 
          className="flex-1 flex overflow-hidden"
          style={{ 
            backgroundColor: '#ffffff',
            background: '#ffffff',
            backgroundImage: 'none'
          }}
        >
          {/* Chat History Sidebar */}
          {showHistory && (
            <div className="w-64 border-r border-border bg-muted/30 flex flex-col animate-in slide-in-from-left-2 duration-200">
              <div className="p-3 border-b border-border">
                <h3 className="text-sm font-medium text-foreground">{t('aiChat.chatHistory', 'Verlauf')}</h3>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {sortedChatHistory.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      {t('aiChat.noChatsYet', 'Noch keine Chats')}
                    </p>
                  ) : (
                    sortedChatHistory.map((chat) => (
                      <div
                        key={chat.id}
                        onClick={() => handleSelectChat(chat.id)}
                        className={`group flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                          chat.id === currentChatId 
                            ? 'bg-primary/10 text-primary' 
                            : 'hover:bg-muted text-foreground'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p 
                            className="text-sm leading-snug break-words"
                            style={{ 
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}
                          >
                            {chat.title || t('aiChat.newConversation')}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(chat.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={(e) => handleDeleteChat(chat.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-destructive/10 hover:text-destructive transition-all flex-shrink-0"
                          title={t('common.delete')}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Chat Bereich */}
          <div 
            className="flex-1 overflow-hidden [&_*]:[-ms-overflow-style:none] [&_*]:[scrollbar-width:none]"
            style={{ 
              backgroundColor: '#ffffff',
              background: '#ffffff',
              backgroundImage: 'none'
            }}
          >
            <AIChatBox
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={chatMutation.isPending}
              placeholder={t('common.typeMessage')}
              height="100%"
              emptyStateMessage={t('aiChat.emptyStateMessage')}
              suggestedPrompts={hasUserMessages ? [] : suggestedPrompts}
            />
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
