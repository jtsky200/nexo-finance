import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import MobileLayout from '@/components/MobileLayout';
import { Input } from '@/components/ui/input';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export default function FAQ() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const faqItems: FAQItem[] = [
    {
      id: 'what-is-nexo',
      question: t('faq.items.whatIsNexo.question', 'Was ist Nexo?'),
      answer: t('faq.items.whatIsNexo.answer', 'Nexo ist eine umfassende Finanzverwaltungs-App, die Ihnen hilft, Ihre Finanzen, Rechnungen, Steuern und mehr zu verwalten.'),
    },
    {
      id: 'how-to-add-entry',
      question: t('faq.items.howToAddEntry.question', 'Wie füge ich einen Eintrag hinzu?'),
      answer: t('faq.items.howToAddEntry.answer', 'Gehen Sie zur Finanzen-Seite und klicken Sie auf "Eintrag hinzufügen". Füllen Sie die erforderlichen Felder aus und speichern Sie.'),
    },
    {
      id: 'how-to-scan-bill',
      question: t('faq.items.howToScanBill.question', 'Wie scanne ich eine Rechnung?'),
      answer: t('faq.items.howToScanBill.answer', 'Gehen Sie zur Rechnungen-Seite und klicken Sie auf "Rechnung scannen". Verwenden Sie Ihre Kamera, um die Rechnung zu fotografieren.'),
    },
    {
      id: 'how-to-backup',
      question: t('faq.items.howToBackup.question', 'Wie erstelle ich ein Backup?'),
      answer: t('faq.items.howToBackup.answer', 'Gehen Sie zu Einstellungen > Backup oder verwenden Sie das User-Menü > Daten exportieren.'),
    },
    {
      id: 'how-to-change-language',
      question: t('faq.items.howToChangeLanguage.question', 'Wie ändere ich die Sprache?'),
      answer: t('faq.items.howToChangeLanguage.answer', 'Klicken Sie auf das Sprach-Icon in der Topbar und wählen Sie Ihre gewünschte Sprache aus.'),
    },
    {
      id: 'how-to-use-ai',
      question: t('faq.items.howToUseAI.question', 'Wie nutze ich den KI-Assistenten?'),
      answer: t('faq.items.howToUseAI.answer', 'Klicken Sie auf "Assistent" im User-Menü oder verwenden Sie das Chat-Icon. Stellen Sie Fragen zu Ihren Finanzen oder bitten Sie um Hilfe.'),
    },
  ];

  const filteredItems = faqItems.filter(item =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleItem = (id: string) => {
    const newOpen = new Set(openItems);
    if (newOpen.has(id)) {
      newOpen.delete(id);
    } else {
      newOpen.add(id);
    }
    setOpenItems(newOpen);
  };

  return (
    <MobileLayout title={t('faq.title', 'Häufig gestellte Fragen')} hideQuickActions>
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            type="text"
            placeholder={t('faq.searchPlaceholder', 'Fragen durchsuchen...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* FAQ Items */}
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <div key={item.id} className="mobile-card">
              <button
                className="w-full flex items-center justify-between p-4"
                onClick={() => toggleItem(item.id)}
              >
                <span className="font-medium text-left flex-1 pr-4">{item.question}</span>
                {openItems.has(item.id) ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                )}
              </button>
              {openItems.has(item.id) && (
                <div className="px-4 pb-4">
                  <p className="text-sm text-muted-foreground">{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="mobile-card p-8 text-center">
            <p className="text-muted-foreground">
              {t('faq.noResults', 'Keine Ergebnisse gefunden')}
            </p>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}

