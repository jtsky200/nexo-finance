import { useTranslation } from 'react-i18next';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Settings() {
  const { t } = useTranslation();

  const swissCantons = [
    { code: 'ZH', name: 'Zürich' },
    { code: 'BE', name: 'Bern' },
    { code: 'LU', name: 'Luzern' },
    { code: 'UR', name: 'Uri' },
    { code: 'SZ', name: 'Schwyz' },
    { code: 'OW', name: 'Obwalden' },
    { code: 'NW', name: 'Nidwalden' },
    { code: 'GL', name: 'Glarus' },
    { code: 'ZG', name: 'Zug' },
    { code: 'FR', name: 'Freiburg' },
    { code: 'SO', name: 'Solothurn' },
    { code: 'BS', name: 'Basel-Stadt' },
    { code: 'BL', name: 'Basel-Landschaft' },
    { code: 'SH', name: 'Schaffhausen' },
    { code: 'AR', name: 'Appenzell Ausserrhoden' },
    { code: 'AI', name: 'Appenzell Innerrhoden' },
    { code: 'SG', name: 'St. Gallen' },
    { code: 'GR', name: 'Graubünden' },
    { code: 'AG', name: 'Aargau' },
    { code: 'TG', name: 'Thurgau' },
    { code: 'TI', name: 'Tessin' },
    { code: 'VD', name: 'Waadt' },
    { code: 'VS', name: 'Wallis' },
    { code: 'NE', name: 'Neuenburg' },
    { code: 'GE', name: 'Genf' },
    { code: 'JU', name: 'Jura' },
  ];

  return (
    <Layout title={t('settings.title')}>
      <div className="max-w-2xl space-y-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.profile')}</CardTitle>
            <CardDescription>
              {t('settings.profileDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Ihr Name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input id="email" type="email" placeholder="ihre.email@beispiel.ch" />
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.preferences')}</CardTitle>
            <CardDescription>
              {t('settings.preferencesDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="language">{t('settings.language')}</Label>
              <Select defaultValue="de">
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">{t('settings.currency')}</Label>
              <Select defaultValue="CHF">
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CHF">CHF (Schweizer Franken)</SelectItem>
                  <SelectItem value="EUR">EUR (Euro)</SelectItem>
                  <SelectItem value="USD">USD (US Dollar)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="canton">{t('settings.canton')}</Label>
              <Select>
                <SelectTrigger id="canton">
                  <SelectValue placeholder="Wählen Sie Ihren Kanton" />
                </SelectTrigger>
                <SelectContent>
                  {swissCantons.map((canton) => (
                    <SelectItem key={canton.code} value={canton.code}>
                      {canton.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button>{t('settings.save')}</Button>
        </div>
      </div>
    </Layout>
  );
}
