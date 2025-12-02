import { useTranslation } from 'react-i18next';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function Taxes() {
  const { t } = useTranslation();

  return (
    <Layout title={t('taxes.title')}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">
            Verwalten Sie Ihre Steuerprofile für verschiedene Jahre
          </p>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Neues Steuerprofil
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Steuerprofile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              Noch keine Steuerprofile vorhanden
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
