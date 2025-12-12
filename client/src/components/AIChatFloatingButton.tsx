import { useState, useEffect } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { Button } from './ui/button';
import AIChatDialog from './AIChatDialog';
import { cn } from '@/lib/utils';

const POPUP_FLAG_KEY = 'nexo_chat_open_popup';

export default function AIChatFloatingButton() {
  const [isOpen, setIsOpen] = useState(false);

  // Prüfe beim Mount ob der Popup automatisch geöffnet werden soll
  useEffect(() => {
    const shouldOpenPopup = localStorage.getItem(POPUP_FLAG_KEY);
    if (shouldOpenPopup === 'true') {
      // Entferne das Flag und öffne den Popup
      localStorage.removeItem(POPUP_FLAG_KEY);
      localStorage.removeItem('nexo_chat_from_route');
      // Kurze Verzögerung für sanfte Animation
      setTimeout(() => {
        setIsOpen(true);
      }, 300);
    }
  }, []);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50',
          'bg-primary text-primary-foreground hover:bg-primary/90',
          'transition-all duration-200 hover:scale-110'
        )}
        size="icon"
        aria-label="Assistent öffnen"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageSquare className="h-6 w-6" />
        )}
      </Button>
      <AIChatDialog open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}
