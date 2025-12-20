import { useEffect, useState, useCallback } from 'react';
import { X, ArrowRight, MessageSquare } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

const TUTORIAL_STORAGE_KEY = 'nexo_tutorial_highlight';

export interface TutorialStep {
  selector: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface TutorialHighlightProps {
  onComplete?: () => void;
  onOpenChat?: () => void;
}

export function TutorialHighlight({ onComplete, onOpenChat }: TutorialHighlightProps) {
  const [steps, setSteps] = useState<TutorialStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Lade Tutorial-Schritte aus LocalStorage
  useEffect(() => {
    const stored = localStorage.getItem(TUTORIAL_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as TutorialStep[];
        if (parsed.length > 0) {
          setSteps(parsed);
          setIsVisible(true);
          setCurrentStep(0);
        }
      } catch (e) {
        console.error('Fehler beim Laden des Tutorials:', e);
      }
    }
  }, []);

  // Finde das Ziel-Element und positioniere das Highlight
  useEffect(() => {
    if (!isVisible || steps.length === 0) return;

    const step = steps[currentStep];
    if (!step) return;

    const findElement = () => {
      const element = document.querySelector(step.selector);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);
        
        // Scrolle zum Element
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    // Kurze Verzögerung für DOM-Updates
    const timer = setTimeout(findElement, 300);
    
    // Aktualisiere bei Resize
    window.addEventListener('resize', findElement);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', findElement);
    };
  }, [isVisible, steps, currentStep]);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleClose();
    }
  }, [currentStep, steps.length]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setSteps([]);
    setTargetRect(null);
    localStorage.removeItem(TUTORIAL_STORAGE_KEY);
    onComplete?.();
  }, [onComplete]);

  const handleOpenChat = useCallback(() => {
    handleClose();
    onOpenChat?.();
  }, [handleClose, onOpenChat]);

  if (!isVisible || steps.length === 0 || !targetRect) {
    return null;
  }

  const step = steps[currentStep];
  const padding = 8;

  // Berechne Position für das Tooltip
  const getTooltipStyle = () => {
    const tooltipWidth = 320;
    const tooltipHeight = 150;
    const margin = 16;

    let top = targetRect.bottom + margin;
    let left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);

    // Korrigiere Position wenn ausserhalb des Viewports
    if (left < margin) left = margin;
    if (left + tooltipWidth > window.innerWidth - margin) {
      left = window.innerWidth - tooltipWidth - margin;
    }
    if (top + tooltipHeight > window.innerHeight - margin) {
      top = targetRect.top - tooltipHeight - margin;
    }

    return { top, left, width: tooltipWidth };
  };

  const tooltipStyle = getTooltipStyle();

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 9998 }}>
      {/* Overlay mit Loch für das Ziel-Element */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <mask id="tutorial-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect
              x={targetRect.left - padding}
              y={targetRect.top - padding}
              width={targetRect.width + padding * 2}
              height={targetRect.height + padding * 2}
              rx="8"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.6)"
          mask="url(#tutorial-mask)"
        />
      </svg>

      {/* Highlight-Rahmen um das Ziel-Element */}
      <div
        className="absolute border-2 border-primary rounded-lg animate-pulse pointer-events-none"
        style={{
          left: targetRect.left - padding,
          top: targetRect.top - padding,
          width: targetRect.width + padding * 2,
          height: targetRect.height + padding * 2,
          boxShadow: '0 0 0 4px rgba(var(--primary-rgb), 0.3), 0 0 20px rgba(var(--primary-rgb), 0.4)',
        }}
      />

      {/* Tooltip */}
      <div
        className="absolute bg-white rounded-xl shadow-2xl p-4 pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-300"
        style={tooltipStyle}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500">
            Schritt {currentStep + 1} von {steps.length}
          </span>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Inhalt */}
        <h3 className="font-semibold text-gray-900 mb-1">{step.title}</h3>
        <p className="text-sm text-gray-600 mb-4">{step.description}</p>

        {/* Buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenChat}
            className="text-gray-500"
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            Zum Chat
          </Button>

          <Button
            size="sm"
            onClick={handleNext}
            className="bg-primary text-white"
          >
            {currentStep < steps.length - 1 ? (
              <>
                Weiter
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            ) : (
              'Fertig'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Hilfsfunktion zum Starten eines Tutorials
export function startTutorial(steps: TutorialStep[]) {
  localStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify(steps));
  // Trigger ein Custom-Event für die Komponente
  window.dispatchEvent(new CustomEvent('nexo-tutorial-start'));
}

// Vordefinierte Tutorial-Schritte für verschiedene Seiten
export const TUTORIAL_PRESETS = {
  finances: [
    {
      selector: '[data-tutorial="add-entry"]',
      title: 'Eintrag hinzufügen',
      description: 'Klicke hier, um eine neue Einnahme oder Ausgabe zu erfassen.',
    },
    {
      selector: '[data-tutorial="total-income"]',
      title: 'Gesamteinnahmen',
      description: 'Hier siehst du die Summe aller deiner Einnahmen.',
    },
    {
      selector: '[data-tutorial="total-expenses"]',
      title: 'Gesamtausgaben',
      description: 'Hier siehst du die Summe aller deiner Ausgaben.',
    },
  ],
  bills: [
    {
      selector: '[data-tutorial="add-bill"]',
      title: 'Rechnung hinzufügen',
      description: 'Klicke hier, um eine neue Rechnung zu erstellen.',
    },
    {
      selector: '[data-tutorial="scan-bill"]',
      title: 'Rechnung scannen',
      description: 'Scanne eine Rechnung mit deiner Kamera für automatische Erkennung.',
    },
  ],
  reminders: [
    {
      selector: '[data-tutorial="add-reminder"]',
      title: 'Erinnerung erstellen',
      description: 'Klicke hier, um eine neue Erinnerung zu erstellen.',
    },
  ],
};

