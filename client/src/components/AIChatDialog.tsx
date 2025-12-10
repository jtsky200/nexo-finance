import { useState, useCallback, useMemo } from 'react';
import { AIChatBox, type Message } from './AIChatBox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { MessageSquare, X } from 'lucide-react';
import { Button } from './ui/button';
import { useTranslation } from 'react-i18next';

interface AIChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AIChatDialog({ open, onOpenChange }: AIChatDialogProps) {
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
  ], []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <DialogTitle>{t('common.aiAssistant', 'AI Assistent')}</DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-hidden px-6 pb-6">
          <AIChatBox
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            placeholder={t('common.typeMessage', 'Nachricht eingeben...')}
            height="100%"
            emptyStateMessage={t('common.startConversation', 'Beginne eine Unterhaltung mit dem AI Assistenten')}
            suggestedPrompts={suggestedPrompts}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

