import { useEffect, useState, useCallback } from 'react';
import { X, ArrowRight, MessageSquare } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const [steps, setSteps] = useState<TutorialStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Lade Tutorial-Schritte aus LocalStorage und höre auf Custom-Event
  useEffect(() => {
    const loadTutorial = () => {
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
    };

    // Lade sofort beim Mount
    loadTutorial();

    // Höre auf Custom-Event für Tutorial-Start
    const handleTutorialStart = () => {
      // Kurze Verzögerung, damit DOM bereit ist
      setTimeout(loadTutorial, 100);
    };

    window.addEventListener('nexo-tutorial-start', handleTutorialStart);

    return () => {
      window.removeEventListener('nexo-tutorial-start', handleTutorialStart);
    };
  }, []);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setSteps([]);
    setTargetRect(null);
    localStorage.removeItem(TUTORIAL_STORAGE_KEY);
    onComplete?.();
  }, [onComplete]);

  // Finde das Ziel-Element und positioniere das Highlight
  useEffect(() => {
    if (!isVisible || steps.length === 0) return;

    const step = steps[currentStep];
    if (!step) return;

    let retryCount = 0;
    const maxRetries = 10;

    const findElement = () => {
      const element = document.querySelector(step.selector);
      if (element) {
        const rect = element.getBoundingClientRect();
        // Prüfe ob Element sichtbar ist (nicht 0x0)
        if (rect.width > 0 && rect.height > 0) {
          setTargetRect(rect);
          
          // Scrolle zum Element
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return true;
        }
      }
      return false;
    };

    const tryFindElement = () => {
      if (findElement()) {
        return; // Element gefunden
      }

      // Retry wenn Element noch nicht im DOM ist
      if (retryCount < maxRetries) {
        retryCount++;
        setTimeout(tryFindElement, 200);
      } else {
        console.warn(`Tutorial-Element nicht gefunden: ${step.selector}`);
        // Überspringe diesen Schritt
        if (currentStep < steps.length - 1) {
          setTimeout(() => {
            setCurrentStep(prev => prev + 1);
          }, 100);
        } else {
          setTimeout(() => {
            handleClose();
          }, 100);
        }
      }
    };

    // Starte Suche mit initialer Verzögerung
    const timer = setTimeout(tryFindElement, 300);
    
    // Aktualisiere bei Resize und Scroll
    const handleResize = () => {
      findElement();
    };
    const handleScroll = () => {
      findElement();
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true); // true = capture phase für alle Scroll-Events
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isVisible, steps, currentStep, handleClose]);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleClose();
    }
  }, [currentStep, steps.length, handleClose]);

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
    const tooltipHeight = 180; // Etwas größer für bessere Sichtbarkeit
    const margin = 16;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Berechne verfügbaren Platz oben und unten
    const spaceAbove = targetRect.top - margin;
    const spaceBelow = viewportHeight - targetRect.bottom - margin;
    
    // Entscheide, ob Tooltip oben oder unten platziert werden soll
    let top: number;
    let preferBottom = spaceBelow >= tooltipHeight || spaceBelow >= spaceAbove;
    
    if (preferBottom && spaceBelow >= tooltipHeight) {
      // Platziere unten
      top = targetRect.bottom + margin;
    } else if (spaceAbove >= tooltipHeight) {
      // Platziere oben
      top = targetRect.top - tooltipHeight - margin;
    } else {
      // Nicht genug Platz oben oder unten - platziere in der Mitte des Viewports
      top = Math.max(margin, (viewportHeight - tooltipHeight) / 2);
    }

    // Stelle sicher, dass top innerhalb des Viewports ist
    top = Math.max(margin, Math.min(top, viewportHeight - tooltipHeight - margin));

    // Berechne horizontale Position (zentriert am Element)
    let left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);

    // Korrigiere horizontale Position wenn ausserhalb des Viewports
    if (left < margin) {
      left = margin;
    } else if (left + tooltipWidth > viewportWidth - margin) {
      left = viewportWidth - tooltipWidth - margin;
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
            {t('tutorial.step', 'Schritt {{current}} von {{total}}', { current: currentStep + 1, total: steps.length })}
          </span>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            aria-label={t('common.close', 'Schliessen')}
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
            disabled={!onOpenChat}
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            {t('tutorial.toChat', 'Zum Chat')}
          </Button>

          <Button
            size="sm"
            onClick={handleNext}
            className="bg-primary text-white"
          >
            {currentStep < steps.length - 1 ? (
              <>
                {t('common.next', 'Weiter')}
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            ) : (
              t('common.finish', 'Fertig')
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
// NOTE: Diese Presets werden nicht direkt verwendet, da sie hardcodierte deutsche Strings enthalten.
// Tutorial-Schritte sollten immer mit t() erstellt werden, z.B. in Layout.tsx oder Topbar.tsx
export const TUTORIAL_PRESETS = {
  finances: [
    {
      selector: '[data-tutorial="add-entry"]',
      title: '', // Wird nicht verwendet - muss mit t() erstellt werden
      description: '', // Wird nicht verwendet - muss mit t() erstellt werden
    },
    {
      selector: '[data-tutorial="total-income"]',
      title: '', // Wird nicht verwendet - muss mit t() erstellt werden
      description: '', // Wird nicht verwendet - muss mit t() erstellt werden
    },
    {
      selector: '[data-tutorial="total-expenses"]',
      title: '', // Wird nicht verwendet - muss mit t() erstellt werden
      description: '', // Wird nicht verwendet - muss mit t() erstellt werden
    },
  ],
  bills: [
    {
      selector: '[data-tutorial="add-bill"]',
      title: '', // Wird nicht verwendet - muss mit t() erstellt werden
      description: '', // Wird nicht verwendet - muss mit t() erstellt werden
    },
    {
      selector: '[data-tutorial="scan-bill"]',
      title: '', // Wird nicht verwendet - muss mit t() erstellt werden
      description: '', // Wird nicht verwendet - muss mit t() erstellt werden
    },
  ],
  reminders: [
    {
      selector: '[data-tutorial="add-reminder"]',
      title: '', // Wird nicht verwendet - muss mit t() erstellt werden
      description: '', // Wird nicht verwendet - muss mit t() erstellt werden
    },
  ],
};

