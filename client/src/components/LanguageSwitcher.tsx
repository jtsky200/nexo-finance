import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'de' ? 'en' : 'de';
    i18n.changeLanguage(newLang);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="font-semibold"
    >
      {i18n.language === 'de' ? 'EN' : 'DE'}
    </Button>
  );
}
