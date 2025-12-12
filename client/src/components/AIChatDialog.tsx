import { trpc } from '@/lib/trpc';

import { useState, useCallback, useMemo, useEffect } from 'react';

import { MessageSquare, X, RotateCcw } from 'lucide-react';

import { useTranslation } from 'react-i18next';

import { toast } from 'sonner';

import { AIChatBox, type Message } from './AIChatBox';

import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

const CHAT_STORAGE_KEY = 'nexo_chat_messages';
const SYSTEM_MESSAGE: Message = {
  role: 'system',
  content: 'Du bist ein hilfreicher Assistent für die Nexo-Anwendung. Du hilfst Benutzern bei Fragen zu Finanzen, Rechnungen, Terminen und anderen Funktionen der App.',
};

interface AIChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AIChatDialog({ open, onOpenChange }: AIChatDialogProps) {
  const { t } = useTranslation();
  
  // Lade gespeicherte Nachrichten aus LocalStorage
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Message[];
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

  // Synchronisiere mit LocalStorage wenn Dialog geöffnet wird
  useEffect(() => {
    if (open) {
      try {
        const saved = localStorage.getItem(CHAT_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as Message[];
          if (!parsed.some(m => m.role === 'system')) {
            setMessages([SYSTEM_MESSAGE, ...parsed]);
          } else {
            setMessages(parsed);
          }
        }
      } catch (e) {
        console.error('Fehler beim Laden der Chat-Historie:', e);
      }
    }
  }, [open]);

  // Speichere Nachrichten in LocalStorage bei jeder Änderung
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.error('Fehler beim Speichern der Chat-Historie:', e);
    }
  }, [messages]);

  // Neue Konversation starten
  const handleNewConversation = useCallback(() => {
    setMessages([SYSTEM_MESSAGE]);
    localStorage.removeItem(CHAT_STORAGE_KEY);
    toast.success('Neue Konversation gestartet');
  }, []);

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
      
      if (error.message.includes('<!doctype') || error.message.includes('Unexpected token')) {
        errorMessage = 'Der Server ist nicht erreichbar oder gibt eine ungültige Antwort zurück.';
      } else if (error.message.includes('Unable to transform')) {
        errorMessage = 'Fehler bei der Datenübertragung. Bitte versuche es erneut.';
      } else if (error.data?.code === 'UNAUTHORIZED') {
        errorMessage = 'Du bist nicht angemeldet. Bitte melde dich an.';
      } else if (error.data?.code === 'INTERNAL_SERVER_ERROR') {
        errorMessage = 'Ein Serverfehler ist aufgetreten. Bitte versuche es später erneut.';
      } else {
        errorMessage = error.message || 'Ein Fehler ist aufgetreten.';
      }
      
      const errorResponse: Message = {
        role: 'assistant',
        content: `Entschuldigung, es ist ein Fehler aufgetreten: ${errorMessage}`,
      };
      setMessages((prev) => [...prev, errorResponse]);
      toast.error('Fehler beim Senden der Nachricht');
    },
  });

  const handleSendMessage = useCallback((content: string) => {
    const userMessage: Message = { role: 'user', content };
    const newMessages: Message[] = [...messages, userMessage];
    setMessages(newMessages);

    chatMutation.mutate({
      messages: newMessages,
    });
  }, [messages, chatMutation]);

  const hasUserMessages = messages.some(m => m.role === 'user');

  const suggestedPrompts = useMemo(() => [
    { text: 'Wie funktioniert die Rechnungsverwaltung?', icon: 'receipt' as const },
    { text: 'Wie verwalte ich meine Finanzen?', icon: 'wallet' as const },
    { text: 'Wie erstelle ich eine Erinnerung?', icon: 'bell' as const },
    { text: 'Was kann ich mit der Einkaufsliste machen?', icon: 'shoppingCart' as const },
  ], []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <DialogTitle>Assistent</DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              {hasUserMessages && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNewConversation}
                  className="h-8 text-gray-500 hover:text-gray-700"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Neu</span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-hidden px-6 pb-6">
          <AIChatBox
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={chatMutation.isPending}
            placeholder={t('common.typeMessage', 'Nachricht eingeben...')}
            height="100%"
            emptyStateMessage="Beginne eine Unterhaltung mit dem Assistenten"
            suggestedPrompts={hasUserMessages ? [] : suggestedPrompts}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
