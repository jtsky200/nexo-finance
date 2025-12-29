import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, BookOpen, HelpCircle, MessageSquare, FileText, Video, ArrowRight } from 'lucide-react';
import { Link } from 'wouter';

interface HelpCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  articles: {
    id: string;
    title: string;
    description: string;
    content?: string;
  }[];
}

export default function Help() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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
        {
          id: 'budgets',
          title: t('help.articles.budgets.title', 'Budgets erstellen'),
          description: t('help.articles.budgets.description', 'Planen Sie Ihre Ausgaben mit Budgets'),
        },
      ],
    },
    {
      id: 'taxes',
      title: t('help.categories.taxes', 'Steuern'),
      icon: <FileText className="w-5 h-5" />,
      articles: [
        {
          id: 'tax-profile',
          title: t('help.articles.taxProfile.title', 'Steuerprofil erstellen'),
          description: t('help.articles.taxProfile.description', 'Richten Sie Ihr Steuerprofil ein'),
        },
        {
          id: 'tax-calculations',
          title: t('help.articles.taxCalculations.title', 'Steuerberechnungen'),
          description: t('help.articles.taxCalculations.description', 'Wie Nexo Ihre Steuern berechnet'),
        },
      ],
    },
    {
      id: 'people',
      title: t('help.categories.people', 'Personen'),
      icon: <HelpCircle className="w-5 h-5" />,
      articles: [
        {
          id: 'add-person',
          title: t('help.articles.addPerson.title', 'Personen hinzufügen'),
          description: t('help.articles.addPerson.description', 'Haushaltsmitglieder und externe Personen verwalten'),
        },
        {
          id: 'invoices',
          title: t('help.articles.invoices.title', 'Rechnungen erstellen'),
          description: t('help.articles.invoices.description', 'Rechnungen für Personen erstellen'),
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

  const selectedArticle = selectedCategory
    ? filteredCategories
        .find(cat => cat.id === selectedCategory)
        ?.articles.find(art => art.id === selectedCategory)
    : null;

  return (
    <Layout title={t('help.title', 'Hilfe & Support')}>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{t('help.title', 'Hilfe & Support')}</h1>
          <p className="text-muted-foreground">
            {t('help.subtitle', 'Finden Sie Antworten auf Ihre Fragen')}
          </p>
        </div>

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => setSelectedCategory('getting-started')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                {t('help.quickActions.tutorial', 'Tutorial starten')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t('help.quickActions.tutorialDescription', 'Lernen Sie die Grundfunktionen kennen')}
              </p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-accent transition-colors" asChild>
            <Link href="/faq">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  {t('help.quickActions.faq', 'FAQ')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t('help.quickActions.faqDescription', 'Häufig gestellte Fragen')}
                </p>
              </CardContent>
            </Link>
          </Card>
          <Card className="cursor-pointer hover:bg-accent transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                {t('help.quickActions.contact', 'Kontakt')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t('help.quickActions.contactDescription', 'Kontaktieren Sie unseren Support')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Categories */}
        <div className="space-y-6">
          {filteredCategories.map((category) => (
            <Card key={category.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {category.icon}
                  {category.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {category.articles.map((article) => (
                    <div
                      key={article.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => setSelectedCategory(`${category.id}-${article.id}`)}
                    >
                      <div>
                        <h4 className="font-medium">{article.title}</h4>
                        <p className="text-sm text-muted-foreground">{article.description}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}

