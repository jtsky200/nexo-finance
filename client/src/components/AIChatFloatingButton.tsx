import { useState, useEffect, useRef } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { Button } from './ui/button';
import AIChatDialog from './AIChatDialog';
import { cn } from '@/lib/utils';
import { useChatReminders, markChatReminderAsRead, type ChatReminder } from '@/lib/firebaseHooks';
import { toast } from 'sonner';
import { eventBus, Events } from '@/lib/eventBus';

export default function AIChatFloatingButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingReminder, setPendingReminder] = useState<ChatReminder | null>(null);
  const processedRemindersRef = useRef<Set<string>>(new Set());
  const { data: chatReminders, refetch } = useChatReminders(true);

  // Auto-open dialog when new reminder arrives
  useEffect(() => {
    if (chatReminders.length > 0) {
      // Find the newest unread reminder that should open dialog
      const newestReminder = chatReminders
        .filter(r => r.shouldOpenDialog && !r.isRead && !processedRemindersRef.current.has(r.id))
        .sort((a, b) => {
          const aTime = new Date(a.createdAt).getTime();
          const bTime = new Date(b.createdAt).getTime();
          return bTime - aTime;
        })[0];
      
      if (newestReminder) {
        // Mark as processed immediately to prevent duplicate opens
        processedRemindersRef.current.add(newestReminder.id);
        
        // Mark as read
        markChatReminderAsRead(newestReminder.id).catch(console.error);
        
        // Set pending reminder to be added to chat
        setPendingReminder(newestReminder);
        
        // Emit event for workflow orchestrator
        eventBus.emit(Events.CHAT_REMINDER_RECEIVED, newestReminder);
        
        // Open dialog after a short delay to ensure UI is ready
        setTimeout(() => {
          setIsOpen(true);
          eventBus.emit(Events.CHAT_DIALOG_OPEN, { reminder: newestReminder });
          // Show a subtle notification
          toast.info('Neue Erinnerung', {
            description: newestReminder.reminderTitle,
            duration: 3000,
          });
        }, 500);
        
        // Refetch to update the list
        setTimeout(() => refetch(), 1000);
      }
    }
  }, [chatReminders, refetch]);

  // Listen to event bus for chat dialog open requests
  useEffect(() => {
    const unsubscribe = eventBus.on(Events.CHAT_DIALOG_OPEN, (data: { reminder?: ChatReminder }) => {
      if (data?.reminder && !processedRemindersRef.current.has(data.reminder.id)) {
        setPendingReminder(data.reminder);
        setIsOpen(true);
      }
    });

    return unsubscribe;
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
      <AIChatDialog 
        open={isOpen} 
        onOpenChange={(open) => {
          setIsOpen(open);
          // Emit event
          if (open) {
            eventBus.emit(Events.CHAT_DIALOG_OPEN);
          } else {
            eventBus.emit(Events.CHAT_DIALOG_CLOSE);
          }
          // Clear pending reminder when dialog closes
          if (!open && pendingReminder) {
            setPendingReminder(null);
          }
        }}
        pendingReminder={pendingReminder}
        onReminderProcessed={() => setPendingReminder(null)}
      />
    </>
  );
}
