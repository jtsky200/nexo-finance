import { trpc } from '@/lib/trpc';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';

import { MessageSquare, RotateCcw, X, GripVertical } from 'lucide-react';

import { useTranslation } from 'react-i18next';

import { toast } from 'sonner';

import { AIChatBox, type Message } from './AIChatBox';

import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
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
  
  // Drag state für bewegbaren Dialog
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);

  // Reset position when dialog opens
  useEffect(() => {
    if (open) {
      setPosition({ x: 0, y: 0 });
    }
  }, [open]);

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
    };
  }, [position]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragRef.current) return;
      
      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;
      
      setPosition({
        x: dragRef.current.initialX + deltaX,
        y: dragRef.current.initialY + deltaY,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragRef.current = null;
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

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
    { text: 'Wie erstelle ich eine Erinnerung?', icon: 'bell' as const },
    { text: 'Wie verwalte ich meine Finanzen?', icon: 'wallet' as const },
    { text: 'Was kann ich mit der Einkaufsliste machen?', icon: 'shoppingCart' as const },
    { text: 'Wie funktioniert das Raten-System?', icon: 'calendar' as const },
    { text: 'Wie scanne ich eine Rechnung?', icon: 'scan' as const },
  ], []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-3xl w-[95vw] sm:w-[85vw] md:w-[75vw] h-[85vh] flex flex-col p-0 gap-0 overflow-hidden [&_*]:!scrollbar-none [&_*]:[-ms-overflow-style:none] [&_*]:[scrollbar-width:none] [&_*::-webkit-scrollbar]:hidden" 
        showCloseButton={false}
        style={{
          transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
        }}
      >
        {/* Header - Draggable */}
        <div 
          className={`flex items-center justify-between px-4 py-3 border-b bg-gray-50/50 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2 min-w-0">
            <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <MessageSquare className="w-5 h-5 text-primary flex-shrink-0" />
            <span className="font-semibold text-gray-900 select-none">Assistent</span>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0 ml-4">
            {hasUserMessages && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => { e.stopPropagation(); handleNewConversation(); }}
                onMouseDown={(e) => e.stopPropagation()}
                className="h-8 text-xs text-gray-500 hover:text-gray-700 gap-1.5 px-3"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Neu
              </Button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onOpenChange(false); }}
              onMouseDown={(e) => e.stopPropagation()}
              className="rounded-full p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-colors"
              aria-label="Schließen"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Chat Bereich - mehr Platz, keine Scrollbar */}
        <div className="flex-1 overflow-hidden [&_*]:[-ms-overflow-style:none] [&_*]:[scrollbar-width:none]">
          <AIChatBox
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={chatMutation.isPending}
            placeholder={t('common.typeMessage', 'Nachricht eingeben...')}
            height="100%"
            emptyStateMessage="Wähle eine Frage oder starte eine eigene Unterhaltung"
            suggestedPrompts={hasUserMessages ? [] : suggestedPrompts}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
