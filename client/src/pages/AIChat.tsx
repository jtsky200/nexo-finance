import { useState, useCallback, useMemo } from 'react';
import { AIChatBox, type Message } from '@/components/AIChatBox';
import Layout from '@/components/Layout';
import { MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export default function AIChat() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'system',
      content: 'Du bist ein hilfreicher Assistent für die Nexo-Anwendung. Du hilfst Benutzern bei Fragen zu Finanzen, Rechnungen, Terminen und anderen Funktionen der App.',
    },
  ]);

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

  const suggestedPrompts = useMemo(() => [
    'Wie funktioniert die Rechnungsverwaltung?',
    'Wie erstelle ich eine Erinnerung?',
    'Wie verwalte ich meine Finanzen?',
    'Was kann ich mit der Einkaufsliste machen?',
    'Wie funktioniert das Raten-System?',
    'Wie scanne ich eine Rechnung?',
  ], []);

  return (
    <Layout title={t('common.aiAssistant', 'AI Assistent')}>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-lg">
            <MessageSquare className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{t('common.aiAssistant', 'AI Assistent')}</h2>
            <p className="text-muted-foreground">
              {t('common.aiAssistantDescription', 'Stelle Fragen und erhalte Hilfe zu allen Funktionen der Nexo-App')}
            </p>
          </div>
        </div>

        <div className="bg-card rounded-lg border shadow-sm">
          <AIChatBox
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={chatMutation.isPending}
            placeholder={t('common.typeMessage', 'Nachricht eingeben...')}
            height="calc(100vh - 300px)"
            emptyStateMessage={t('common.startConversation', 'Beginne eine Unterhaltung mit dem AI Assistenten')}
            suggestedPrompts={suggestedPrompts}
          />
        </div>
      </div>
    </Layout>
  );
}

