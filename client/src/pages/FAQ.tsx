import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
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
      category: 'general',
    },
    {
      id: 'how-to-add-entry',
      question: t('faq.items.howToAddEntry.question', 'Wie füge ich einen Eintrag hinzu?'),
      answer: t('faq.items.howToAddEntry.answer', 'Gehen Sie zur Finanzen-Seite und klicken Sie auf "Eintrag hinzufügen". Füllen Sie die erforderlichen Felder aus und speichern Sie.'),
      category: 'finance',
    },
    {
      id: 'how-to-scan-bill',
      question: t('faq.items.howToScanBill.question', 'Wie scanne ich eine Rechnung?'),
      answer: t('faq.items.howToScanBill.answer', 'Gehen Sie zur Rechnungen-Seite und klicken Sie auf "Rechnung scannen". Verwenden Sie Ihre Kamera, um die Rechnung zu fotografieren.'),
      category: 'bills',
    },
    {
      id: 'how-to-backup',
      question: t('faq.items.howToBackup.question', 'Wie erstelle ich ein Backup?'),
      answer: t('faq.items.howToBackup.answer', 'Gehen Sie zu Einstellungen > Backup oder verwenden Sie das User-Menü > Daten exportieren.'),
      category: 'settings',
    },
    {
      id: 'how-to-change-language',
      question: t('faq.items.howToChangeLanguage.question', 'Wie ändere ich die Sprache?'),
      answer: t('faq.items.howToChangeLanguage.answer', 'Klicken Sie auf das Sprach-Icon in der Topbar und wählen Sie Ihre gewünschte Sprache aus.'),
      category: 'settings',
    },
    {
      id: 'how-to-use-ai',
      question: t('faq.items.howToUseAI.question', 'Wie nutze ich den KI-Assistenten?'),
      answer: t('faq.items.howToUseAI.answer', 'Klicken Sie auf "Assistent" im User-Menü oder verwenden Sie das Chat-Icon. Stellen Sie Fragen zu Ihren Finanzen oder bitten Sie um Hilfe.'),
      category: 'ai',
    },
    {
      id: 'how-to-add-person',
      question: t('faq.items.howToAddPerson.question', 'Wie füge ich eine Person hinzu?'),
      answer: t('faq.items.howToAddPerson.answer', 'Gehen Sie zur Personen-Seite und klicken Sie auf "Person hinzufügen". Wählen Sie zwischen Haushaltsmitglied oder externer Person.'),
      category: 'people',
    },
    {
      id: 'how-to-create-tax-profile',
      question: t('faq.items.howToCreateTaxProfile.question', 'Wie erstelle ich ein Steuerprofil?'),
      answer: t('faq.items.howToCreateTaxProfile.answer', 'Gehen Sie zur Steuern-Seite und klicken Sie auf "Steuerprofil erstellen". Füllen Sie die erforderlichen Informationen aus.'),
      category: 'taxes',
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
    <Layout title={t('faq.title', 'Häufig gestellte Fragen')}>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{t('faq.title', 'Häufig gestellte Fragen')}</h1>
          <p className="text-muted-foreground">
            {t('faq.subtitle', 'Finden Sie schnelle Antworten auf häufige Fragen')}
          </p>
        </div>

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
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleItem(item.id)}
                >
                  <span>{item.question}</span>
                  {openItems.has(item.id) ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </CardTitle>
              </CardHeader>
              {openItems.has(item.id) && (
                <CardContent>
                  <p className="text-muted-foreground">{item.answer}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                {t('faq.noResults', 'Keine Ergebnisse gefunden')}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}

