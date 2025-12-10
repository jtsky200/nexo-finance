import { useState, useCallback, useMemo } from 'react';
import { AIChatBox, type Message } from '@/components/AIChatBox';
import Layout from '@/components/Layout';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

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

  // Suggested prompts with icons matching the image design
  const suggestedPrompts = useMemo(() => [
    { text: 'Wie funktioniert die Rechnungsverwaltung?', icon: 'tag' as const },
    { text: 'Wie erstelle ich eine Erinnerung?', icon: 'fileText' as const },
    { text: 'Wie verwalte ich meine Finanzen?', icon: 'zap' as const },
    { text: 'Was kann ich mit der Einkaufsliste machen?', icon: 'zap' as const },
    { text: 'Wie funktioniert das Raten-System?', icon: 'tag' as const },
    { text: 'Wie scanne ich eine Rechnung?', icon: 'fileText' as const },
  ], []);

  return (
    <Layout title={t('common.aiAssistant', 'AI Assistent')}>
      <div className="min-h-[calc(100vh-200px)] flex flex-col bg-white -mx-4 -mx-6 -mx-8">
        {/* Header Section - Centered like in the image */}
        <div className="text-center py-6 px-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t('common.aiAssistant', 'AI Assistent')}
          </h1>
          <p className="text-sm text-gray-500">
            {t('common.aiAssistantDescription', 'Stelle Fragen und erhalte Hilfe zu allen Funktionen der Nexo-App')}
          </p>
        </div>

        {/* Chat Box */}
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 pb-4">
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
