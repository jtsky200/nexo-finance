import { useState, useCallback, useMemo } from 'react';
import { AIChatBox, type Message } from '@/components/AIChatBox';
import Layout from '@/components/Layout';
import { MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AIChat() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'system',
      content: 'Du bist ein hilfreicher Assistent für die Nexo-Anwendung. Du hilfst Benutzern bei Fragen zu Finanzen, Rechnungen, Terminen und anderen Funktionen der App.',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = useCallback(async (content: string) => {
    // Add user message
    const newMessages: Message[] = [...messages, { role: 'user', content }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // TODO: Replace with actual tRPC call or API endpoint
      // For now, simulate AI response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const aiResponse: Message = {
        role: 'assistant',
        content: `Ich habe deine Nachricht erhalten: "${content}".\n\nDies ist eine Demo-Antwort. In der finalen Version wird hier eine echte AI-Antwort über tRPC oder eine API angezeigt.\n\nDu kannst mich fragen:\n- Wie funktioniert die Rechnungsverwaltung?\n- Wie erstelle ich eine Erinnerung?\n- Wie verwalte ich meine Finanzen?`,
      };
      
      setMessages([...newMessages, aiResponse]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorResponse: Message = {
        role: 'assistant',
        content: 'Entschuldigung, es ist ein Fehler aufgetreten. Bitte versuche es später erneut.',
      };
      setMessages([...newMessages, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

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
            isLoading={isLoading}
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

