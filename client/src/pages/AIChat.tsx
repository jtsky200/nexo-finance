import { useState, useCallback, useMemo, useEffect } from 'react';
import { AIChatBox, type Message } from '@/components/AIChatBox';
import Layout from '@/components/Layout';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CHAT_STORAGE_KEY = 'nexo_chat_messages';
const SYSTEM_MESSAGE: Message = {
  role: 'system',
  content: 'Du bist ein hilfreicher Assistent für die Nexo-Anwendung. Du hilfst Benutzern bei Fragen zu Finanzen, Rechnungen, Terminen und anderen Funktionen der App.',
};

export default function AIChat() {
  const { t } = useTranslation();
  
  // Lade gespeicherte Nachrichten aus LocalStorage beim Start
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
      // Better error handling for different error types
      let errorMessage = 'Ein unbekannter Fehler ist aufgetreten.';
      
      if (error.message.includes('<!doctype') || error.message.includes('Unexpected token')) {
        errorMessage = 'Der Server ist nicht erreichbar oder gibt eine ungültige Antwort zurück. Bitte stelle sicher, dass der Server läuft.';
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
    // Add user message
    const userMessage: Message = { role: 'user', content };
    const newMessages: Message[] = [...messages, userMessage];
    setMessages(newMessages);

    // Call tRPC mutation
    chatMutation.mutate({
      messages: newMessages,
    });
  }, [messages, chatMutation]);

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

  return (
    <Layout title="Assistent">
      <div className="min-h-[calc(100vh-200px)] flex flex-col bg-white">
        {/* Header Section */}
        <div className="flex items-center justify-between py-4 px-4 max-w-4xl mx-auto w-full">
          {/* Titel - Nur anzeigen wenn noch keine Nachrichten */}
          {!hasUserMessages ? (
            <div className="text-center flex-1 animate-in fade-in duration-300">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Assistent
              </h1>
              <p className="text-sm text-gray-500">
                Stelle Fragen und erhalte Hilfe zu allen Funktionen der Nexo-App
              </p>
            </div>
          ) : (
            <div className="flex-1" />
          )}
          
          {/* Neue Konversation Button - Nur anzeigen wenn Nachrichten vorhanden */}
          {hasUserMessages && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewConversation}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <RotateCcw className="size-4" />
              <span className="hidden sm:inline">Neue Konversation</span>
            </Button>
          )}
        </div>

        {/* Chat Box */}
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 pb-4">
          <AIChatBox
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={chatMutation.isPending}
            placeholder={t('common.typeMessage', 'Nachricht eingeben...')}
            height="calc(100vh - 300px)"
            emptyStateMessage="Beginne eine Unterhaltung mit dem Assistenten"
            suggestedPrompts={hasUserMessages ? [] : suggestedPrompts}
          />
        </div>
      </div>
    </Layout>
  );
}
