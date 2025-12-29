import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import MobileLayout from '@/components/MobileLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, BookOpen, HelpCircle, MessageSquare, FileText, ArrowRight } from 'lucide-react';
import { Link, useLocation } from 'wouter';

interface HelpCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  articles: {
    id: string;
    title: string;
    description: string;
  }[];
}

export default function Help() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  const categories: HelpCategory[] = [
    {
      id: 'getting-started',
      title: t('help.categories.gettingStarted', 'Erste Schritte'),
      icon: <BookOpen className="w-5 h-5" />,
      articles: [
        {
          id: 'welcome',
          title: t('help.articles.welcome.title', 'Willkommen bei Nexo'),
          description: t('help.articles.welcome.description', 'Eine Einführung in die Grundfunktionen von Nexo'),
        },
        {
          id: 'onboarding',
          title: t('help.articles.onboarding.title', 'Onboarding abschliessen'),
          description: t('help.articles.onboarding.description', 'So richten Sie Ihr Konto ein'),
        },
        {
          id: 'dashboard',
          title: t('help.articles.dashboard.title', 'Dashboard verstehen'),
          description: t('help.articles.dashboard.description', 'Übersicht über Ihre Finanzen und Termine'),
        },
      ],
    },
    {
      id: 'finance',
      title: t('help.categories.finance', 'Finanzen'),
      icon: <FileText className="w-5 h-5" />,
      articles: [
        {
          id: 'add-entry',
          title: t('help.articles.addEntry.title', 'Einträge hinzufügen'),
          description: t('help.articles.addEntry.description', 'So erfassen Sie Einnahmen und Ausgaben'),
        },
        {
          id: 'bills',
          title: t('help.articles.bills.title', 'Rechnungen verwalten'),
          description: t('help.articles.bills.description', 'Rechnungen erstellen, scannen und verwalten'),
        },
      ],
    },
    {
      id: 'other',
      title: t('help.categories.other', 'Sonstiges'),
      icon: <MessageSquare className="w-5 h-5" />,
      articles: [
        {
          id: 'ai-assistant',
          title: t('help.articles.aiAssistant.title', 'KI-Assistent nutzen'),
          description: t('help.articles.aiAssistant.description', 'So nutzen Sie den KI-Assistenten'),
        },
        {
          id: 'backup',
          title: t('help.articles.backup.title', 'Daten sichern'),
          description: t('help.articles.backup.description', 'So erstellen Sie ein Backup Ihrer Daten'),
        },
      ],
    },
  ];

  const filteredCategories = categories.map(category => ({
    ...category,
    articles: category.articles.filter(article =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(category => category.articles.length > 0 || !searchQuery);

  return (
    <MobileLayout title={t('help.title', 'Hilfe & Support')} hideQuickActions>
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            type="text"
            placeholder={t('help.searchPlaceholder', 'Suchen Sie nach Hilfe...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setLocation('/faq')}
            className="mobile-card p-4 text-left"
          >
            <HelpCircle className="w-6 h-6 mb-2 text-primary" />
            <p className="font-medium text-sm">{t('help.quickActions.faq', 'FAQ')}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('help.quickActions.faqDescription', 'Häufig gestellte Fragen')}
            </p>
          </button>
          <button
            onClick={() => {/* TODO: Open contact */}}
            className="mobile-card p-4 text-left"
          >
            <MessageSquare className="w-6 h-6 mb-2 text-primary" />
            <p className="font-medium text-sm">{t('help.quickActions.contact', 'Kontakt')}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('help.quickActions.contactDescription', 'Kontaktieren Sie unseren Support')}
            </p>
          </button>
        </div>

        {/* Categories */}
        <div className="space-y-4">
          {filteredCategories.map((category) => (
            <div key={category.id} className="mobile-card">
              <div className="flex items-center gap-3 mb-3">
                {category.icon}
                <h3 className="font-semibold">{category.title}</h3>
              </div>
              <div className="space-y-2">
                {category.articles.map((article) => (
                  <button
                    key={article.id}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors text-left"
                    onClick={() => {/* TODO: Show article details */}}
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{article.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{article.description}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </MobileLayout>
  );
}

