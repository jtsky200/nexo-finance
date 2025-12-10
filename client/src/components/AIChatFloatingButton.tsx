import { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { Button } from './ui/button';
import AIChatDialog from './AIChatDialog';
import { cn } from '@/lib/utils';

export default function AIChatFloatingButton() {
  const [isOpen, setIsOpen] = useState(false);

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
        aria-label="AI Assistent öffnen"
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

