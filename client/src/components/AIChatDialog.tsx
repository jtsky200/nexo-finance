import { trpc } from '@/lib/trpc';

import { useState, useCallback, useMemo } from 'react';

import { MessageSquare, X } from 'lucide-react';

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

  const chatMutation = trpc.ai.chat.useMutation({
    onSuccess: (data) => {
      const aiResponse: Message = {
        role: 'assistant',
        content: data.content,
      };
      setMessages((prev) => [...prev, aiResponse]);
    },
    onError: (error) => {
      const errorResponse: Message = {
        role: 'assistant',
        content: `Entschuldigung, es ist ein Fehler aufgetreten: ${error.message}. Bitte versuche es später erneut.`,
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
            isLoading={chatMutation.isPending}
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

