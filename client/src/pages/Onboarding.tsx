import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { createPerson } from '@/lib/firebaseHooks';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import OnboardingTheme, { getSeasonalCardClass } from '@/components/OnboardingTheme';
import { useTranslation } from 'react-i18next';
import { getSchoolGrades } from '@/lib/countrySchoolGrades';
import { getTaxConfig } from '@/lib/countryTaxConfig';

// Country and region data
const countries = [
  { code: 'CH', name: 'Schweiz', regionLabel: 'Kanton', regions: [
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
  ]},
  { code: 'DE', name: 'Deutschland', regionLabel: 'Bundesland', regions: [
    { code: 'BW', name: 'Baden-Württemberg' },
    { code: 'BY', name: 'Bayern' },
    { code: 'BE', name: 'Berlin' },
    { code: 'BB', name: 'Brandenburg' },
    { code: 'HB', name: 'Bremen' },
    { code: 'HH', name: 'Hamburg' },
    { code: 'HE', name: 'Hessen' },
    { code: 'MV', name: 'Mecklenburg-Vorpommern' },
    { code: 'NI', name: 'Niedersachsen' },
    { code: 'NW', name: 'Nordrhein-Westfalen' },
    { code: 'RP', name: 'Rheinland-Pfalz' },
    { code: 'SL', name: 'Saarland' },
    { code: 'SN', name: 'Sachsen' },
    { code: 'ST', name: 'Sachsen-Anhalt' },
    { code: 'SH', name: 'Schleswig-Holstein' },
    { code: 'TH', name: 'Thüringen' },
  ]},
  { code: 'AT', name: 'Österreich', regionLabel: 'Bundesland', regions: [
    { code: 'BG', name: 'Burgenland' },
    { code: 'KA', name: 'Kärnten' },
    { code: 'NO', name: 'Niederösterreich' },
    { code: 'OO', name: 'Oberösterreich' },
    { code: 'SB', name: 'Salzburg' },
    { code: 'ST', name: 'Steiermark' },
    { code: 'TI', name: 'Tirol' },
    { code: 'VB', name: 'Vorarlberg' },
    { code: 'WI', name: 'Wien' },
  ]},
  { code: 'FR', name: 'Frankreich', regionLabel: 'Region', regions: [
    { code: 'ARA', name: 'Auvergne-Rhône-Alpes' },
    { code: 'BFC', name: 'Bourgogne-Franche-Comté' },
    { code: 'BRE', name: 'Bretagne' },
    { code: 'CVL', name: 'Centre-Val de Loire' },
    { code: 'COR', name: 'Corse' },
    { code: 'GES', name: 'Grand Est' },
    { code: 'HDF', name: 'Hauts-de-France' },
    { code: 'IDF', name: 'Île-de-France' },
    { code: 'NOR', name: 'Normandie' },
    { code: 'NAQ', name: 'Nouvelle-Aquitaine' },
    { code: 'OCC', name: 'Occitanie' },
    { code: 'PDL', name: 'Pays de la Loire' },
    { code: 'PAC', name: "Provence-Alpes-Côte d'Azur" },
  ]},
  { code: 'GB', name: 'Vereinigtes Königreich', regionLabel: 'Region', regions: [
    { code: 'ENG', name: 'England' },
    { code: 'SCT', name: 'Schottland' },
    { code: 'WLS', name: 'Wales' },
    { code: 'NIR', name: 'Nordirland' },
  ]},
  { code: 'IT', name: 'Italien', regionLabel: 'Region', regions: [
    { code: 'ABR', name: 'Abruzzen' },
    { code: 'BAS', name: 'Basilikata' },
    { code: 'CAL', name: 'Kalabrien' },
    { code: 'CAM', name: 'Kampanien' },
    { code: 'EMR', name: 'Emilia-Romagna' },
    { code: 'FVG', name: 'Friaul-Julisch Venetien' },
    { code: 'LAZ', name: 'Latium' },
    { code: 'LIG', name: 'Ligurien' },
    { code: 'LOM', name: 'Lombardei' },
    { code: 'MAR', name: 'Marken' },
    { code: 'MOL', name: 'Molise' },
    { code: 'PIE', name: 'Piemont' },
    { code: 'PUG', name: 'Apulien' },
    { code: 'SAR', name: 'Sardinien' },
    { code: 'SIC', name: 'Sizilien' },
    { code: 'TOS', name: 'Toskana' },
    { code: 'TAA', name: 'Trentino-Südtirol' },
    { code: 'UMB', name: 'Umbrien' },
    { code: 'VAO', name: 'Aostatal' },
    { code: 'VEN', name: 'Venetien' },
  ]},
  { code: 'ES', name: 'Spanien', regionLabel: 'Autonome Gemeinschaft', regions: [
    { code: 'AND', name: 'Andalusien' },
    { code: 'ARA', name: 'Aragonien' },
    { code: 'AST', name: 'Asturien' },
    { code: 'BAL', name: 'Balearen' },
    { code: 'CAN', name: 'Kanarische Inseln' },
    { code: 'CANT', name: 'Kantabrien' },
    { code: 'CLM', name: 'Kastilien-La Mancha' },
    { code: 'CYL', name: 'Kastilien und León' },
    { code: 'CAT', name: 'Katalonien' },
    { code: 'EXT', name: 'Extremadura' },
    { code: 'GAL', name: 'Galicien' },
    { code: 'MAD', name: 'Madrid' },
    { code: 'MUR', name: 'Murcia' },
    { code: 'NAV', name: 'Navarra' },
    { code: 'PV', name: 'Baskenland' },
    { code: 'RIO', name: 'La Rioja' },
    { code: 'VAL', name: 'Valencia' },
  ]},
  { code: 'NL', name: 'Niederlande', regionLabel: 'Provinz', regions: [
    { code: 'DR', name: 'Drenthe' },
    { code: 'FL', name: 'Flevoland' },
    { code: 'FR', name: 'Friesland' },
    { code: 'GE', name: 'Gelderland' },
    { code: 'GR', name: 'Groningen' },
    { code: 'LI', name: 'Limburg' },
    { code: 'NB', name: 'Noord-Brabant' },
    { code: 'NH', name: 'Noord-Holland' },
    { code: 'OV', name: 'Overijssel' },
    { code: 'UT', name: 'Utrecht' },
    { code: 'ZE', name: 'Zeeland' },
    { code: 'ZH', name: 'Zuid-Holland' },
  ]},
  { code: 'BE', name: 'Belgien', regionLabel: 'Region', regions: [
    { code: 'BRU', name: 'Brüssel' },
    { code: 'VLG', name: 'Flandern' },
    { code: 'WAL', name: 'Wallonien' },
  ]},
  { code: 'US', name: 'Vereinigte Staaten', regionLabel: 'Bundesstaat', regions: [
    { code: 'AL', name: 'Alabama' },
    { code: 'AK', name: 'Alaska' },
    { code: 'AZ', name: 'Arizona' },
    { code: 'AR', name: 'Arkansas' },
    { code: 'CA', name: 'Kalifornien' },
    { code: 'CO', name: 'Colorado' },
    { code: 'CT', name: 'Connecticut' },
    { code: 'DE', name: 'Delaware' },
    { code: 'FL', name: 'Florida' },
    { code: 'GA', name: 'Georgia' },
    { code: 'HI', name: 'Hawaii' },
    { code: 'ID', name: 'Idaho' },
    { code: 'IL', name: 'Illinois' },
    { code: 'IN', name: 'Indiana' },
    { code: 'IA', name: 'Iowa' },
    { code: 'KS', name: 'Kansas' },
    { code: 'KY', name: 'Kentucky' },
    { code: 'LA', name: 'Louisiana' },
    { code: 'ME', name: 'Maine' },
    { code: 'MD', name: 'Maryland' },
    { code: 'MA', name: 'Massachusetts' },
    { code: 'MI', name: 'Michigan' },
    { code: 'MN', name: 'Minnesota' },
    { code: 'MS', name: 'Mississippi' },
    { code: 'MO', name: 'Missouri' },
    { code: 'MT', name: 'Montana' },
    { code: 'NE', name: 'Nebraska' },
    { code: 'NV', name: 'Nevada' },
    { code: 'NH', name: 'New Hampshire' },
    { code: 'NJ', name: 'New Jersey' },
    { code: 'NM', name: 'New Mexico' },
    { code: 'NY', name: 'New York' },
    { code: 'NC', name: 'North Carolina' },
    { code: 'ND', name: 'North Dakota' },
    { code: 'OH', name: 'Ohio' },
    { code: 'OK', name: 'Oklahoma' },
    { code: 'OR', name: 'Oregon' },
    { code: 'PA', name: 'Pennsylvania' },
    { code: 'RI', name: 'Rhode Island' },
    { code: 'SC', name: 'South Carolina' },
    { code: 'SD', name: 'South Dakota' },
    { code: 'TN', name: 'Tennessee' },
    { code: 'TX', name: 'Texas' },
    { code: 'UT', name: 'Utah' },
    { code: 'VT', name: 'Vermont' },
    { code: 'VA', name: 'Virginia' },
    { code: 'WA', name: 'Washington' },
    { code: 'WV', name: 'West Virginia' },
    { code: 'WI', name: 'Wisconsin' },
    { code: 'WY', name: 'Wyoming' },
  ]},
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

// Country to language and currency mapping
const countryConfig: Record<string, { language: string; currency: 'CHF' | 'EUR' | 'USD' | 'GBP' }> = {
  CH: { language: 'de', currency: 'CHF' },
  DE: { language: 'de', currency: 'EUR' },
  AT: { language: 'de', currency: 'EUR' },
  FR: { language: 'fr', currency: 'EUR' },
  GB: { language: 'en', currency: 'GBP' },
  IT: { language: 'it', currency: 'EUR' },
  ES: { language: 'es', currency: 'EUR' },
  NL: { language: 'nl', currency: 'EUR' },
  BE: { language: 'nl', currency: 'EUR' }, // Default to Dutch, user can change to French
  US: { language: 'en', currency: 'USD' },
};

// Available languages with display names
const availableLanguages: Array<{ code: string; name: string }> = [
  { code: 'de', name: 'Deutsch' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'nl', name: 'Nederlands' },
  { code: 'it', name: 'Italiano' },
  { code: 'fr', name: 'Français' },
];

// Address format configuration for each country
interface AddressField {
  key: string;
  label: string;
  placeholder: string;
  required: boolean;
  type: 'text' | 'select';
  options?: { value: string; label: string }[];
  validation?: (value: string) => boolean;
  maxLength?: number;
}

interface AddressFormat {
  street: AddressField;
  houseNumber: AddressField;
  postalCode: AddressField;
  city: AddressField;
  state?: AddressField; // For countries like USA
  county?: AddressField; // For countries like UK
  apartment?: AddressField; // For countries like USA
}

const addressFormats: Record<string, AddressFormat> = {
  CH: {
    street: { key: 'street', label: 'Strasse', placeholder: 'Musterstrasse', required: true, type: 'text' },
    houseNumber: { key: 'houseNumber', label: 'Hausnummer', placeholder: '12', required: true, type: 'text' },
    postalCode: { 
      key: 'postalCode', 
      label: 'PLZ', 
      placeholder: '8000', 
      required: true, 
      type: 'text',
      validation: (v) => /^\d{4}$/.test(v),
      maxLength: 4
    },
    city: { key: 'city', label: 'Ort', placeholder: 'Zürich', required: true, type: 'text' },
  },
  DE: {
    street: { key: 'street', label: 'Strasse', placeholder: 'Musterstrasse', required: true, type: 'text' },
    houseNumber: { key: 'houseNumber', label: 'Hausnummer', placeholder: '12', required: true, type: 'text' },
    postalCode: { 
      key: 'postalCode', 
      label: 'PLZ', 
      placeholder: '10115', 
      required: true, 
      type: 'text',
      validation: (v) => /^\d{5}$/.test(v),
      maxLength: 5
    },
    city: { key: 'city', label: 'Ort', placeholder: 'Berlin', required: true, type: 'text' },
  },
  AT: {
    street: { key: 'street', label: 'Strasse', placeholder: 'Musterstrasse', required: true, type: 'text' },
    houseNumber: { key: 'houseNumber', label: 'Hausnummer', placeholder: '12', required: true, type: 'text' },
    postalCode: { 
      key: 'postalCode', 
      label: 'PLZ', 
      placeholder: '1010', 
      required: true, 
      type: 'text',
      validation: (v) => /^\d{4}$/.test(v),
      maxLength: 4
    },
    city: { key: 'city', label: 'Ort', placeholder: 'Wien', required: true, type: 'text' },
  },
  FR: {
    street: { key: 'street', label: 'Rue', placeholder: 'Rue de la Paix', required: true, type: 'text' },
    houseNumber: { key: 'houseNumber', label: 'Numéro', placeholder: '12', required: true, type: 'text' },
    postalCode: { 
      key: 'postalCode', 
      label: 'Code postal', 
      placeholder: '75001', 
      required: true, 
      type: 'text',
      validation: (v) => /^\d{5}$/.test(v),
      maxLength: 5
    },
    city: { key: 'city', label: 'Ville', placeholder: 'Paris', required: true, type: 'text' },
  },
  GB: {
    street: { key: 'street', label: 'Street Address', placeholder: '10 Downing Street', required: true, type: 'text' },
    houseNumber: { key: 'houseNumber', label: 'House Number', placeholder: '10', required: false, type: 'text' },
    postalCode: { 
      key: 'postalCode', 
      label: 'Postcode', 
      placeholder: 'SW1A 2AA', 
      required: true, 
      type: 'text',
      validation: (v) => /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i.test(v)
    },
    city: { key: 'city', label: 'City/Town', placeholder: 'London', required: true, type: 'text' },
    county: { key: 'county', label: 'County (optional)', placeholder: 'Greater London', required: false, type: 'text' },
  },
  IT: {
    street: { key: 'street', label: 'Via', placeholder: 'Via Roma', required: true, type: 'text' },
    houseNumber: { key: 'houseNumber', label: 'Numero civico', placeholder: '12', required: true, type: 'text' },
    postalCode: { 
      key: 'postalCode', 
      label: 'CAP', 
      placeholder: '00118', 
      required: true, 
      type: 'text',
      validation: (v) => /^\d{5}$/.test(v),
      maxLength: 5
    },
    city: { key: 'city', label: 'Città', placeholder: 'Roma', required: true, type: 'text' },
  },
  ES: {
    street: { key: 'street', label: 'Calle', placeholder: 'Calle Mayor', required: true, type: 'text' },
    houseNumber: { key: 'houseNumber', label: 'Número', placeholder: '12', required: true, type: 'text' },
    postalCode: { 
      key: 'postalCode', 
      label: 'Código postal', 
      placeholder: '28001', 
      required: true, 
      type: 'text',
      validation: (v) => /^\d{5}$/.test(v),
      maxLength: 5
    },
    city: { key: 'city', label: 'Ciudad', placeholder: 'Madrid', required: true, type: 'text' },
  },
  NL: {
    street: { key: 'street', label: 'Straat', placeholder: 'Hoofdstraat', required: true, type: 'text' },
    houseNumber: { key: 'houseNumber', label: 'Huisnummer', placeholder: '12', required: true, type: 'text' },
    postalCode: { 
      key: 'postalCode', 
      label: 'Postcode', 
      placeholder: '1234 AB', 
      required: true, 
      type: 'text',
      validation: (v) => /^\d{4}\s?[A-Z]{2}$/i.test(v),
      maxLength: 7
    },
    city: { key: 'city', label: 'Plaats', placeholder: 'Amsterdam', required: true, type: 'text' },
  },
  BE: {
    street: { key: 'street', label: 'Rue/Straat', placeholder: 'Rue de la Loi', required: true, type: 'text' },
    houseNumber: { key: 'houseNumber', label: 'Numéro/Huisnummer', placeholder: '12', required: true, type: 'text' },
    postalCode: { 
      key: 'postalCode', 
      label: 'Code postal/Postcode', 
      placeholder: '1000', 
      required: true, 
      type: 'text',
      validation: (v) => /^\d{4}$/.test(v),
      maxLength: 4
    },
    city: { key: 'city', label: 'Ville/Stad', placeholder: 'Bruxelles', required: true, type: 'text' },
  },
  US: {
    street: { key: 'street', label: 'Street Address', placeholder: '123 Main Street', required: true, type: 'text' },
    houseNumber: { key: 'houseNumber', label: 'House Number (optional)', placeholder: '123', required: false, type: 'text' },
    apartment: { key: 'apartment', label: 'Apartment/Unit (optional)', placeholder: 'Apt 4B', required: false, type: 'text' },
    city: { key: 'city', label: 'City', placeholder: 'New York', required: true, type: 'text' },
    state: { 
      key: 'state', 
      label: 'State', 
      placeholder: 'Select State', 
      required: true, 
      type: 'select',
      options: countries.find(c => c.code === 'US')?.regions.map(r => ({ value: r.code, label: r.name })) || []
    },
    postalCode: { 
      key: 'postalCode', 
      label: 'ZIP Code', 
      placeholder: '10001', 
      required: true, 
      type: 'text',
      validation: (v) => /^\d{5}(-\d{4})?$/.test(v),
      maxLength: 10
    },
  },
};

// Format phone number with international support
function formatPhoneNumber(value: string): string {
  if (!value || value.trim() === '') return '';
  const cleaned = value.replace(/[^\d+]/g, '');
  if (!cleaned.startsWith('+')) {
    if (cleaned.length > 0) {
      return '+' + cleaned;
    }
    return cleaned;
  }
  
  // Known 2-digit country codes (check these first to avoid greedy matching)
  const twoDigitCodes = ['41', '49', '43', '33', '39', '34', '31', '32', '44', '45', '46', '47', '48', '30', '90', '91', '81', '82', '86'];
  const digitsOnly = cleaned.slice(1); // Remove the +
  
  let countryCode = '';
  let number = '';
  
  // Check for known 2-digit country codes first
  for (const code of twoDigitCodes) {
    if (digitsOnly.startsWith(code)) {
      countryCode = code;
      number = digitsOnly.slice(code.length);
      break;
    }
  }
  
  // If no known 2-digit code found, use generic matching
  if (!countryCode) {
    const match = cleaned.match(/^\+(\d{1,3})(.*)$/);
    if (!match) return cleaned;
    countryCode = match[1];
    number = match[2].replace(/\D/g, '');
  }
  
  if (number.length === 0) {
    return `+${countryCode}`;
  }
  
  let formatted = `+${countryCode}`;
  
  // Swiss format: +41 79 XXX XX XX
  if (countryCode === '41' && number.length > 0) {
    if (number.length <= 2) {
      formatted += ' ' + number;
    } else if (number.length <= 5) {
      formatted += ' ' + number.slice(0, 2) + ' ' + number.slice(2);
    } else if (number.length <= 7) {
      formatted += ' ' + number.slice(0, 2) + ' ' + number.slice(2, 5) + ' ' + number.slice(5);
    } else {
      formatted += ' ' + number.slice(0, 2) + ' ' + number.slice(2, 5) + ' ' + number.slice(5, 7) + ' ' + number.slice(7, 9);
    }
  } 
  // German format: +49 XXX XXXXXXX
  else if (countryCode === '49' && number.length > 0) {
    if (number.length <= 3) {
      formatted += ' ' + number;
    } else if (number.length <= 7) {
      formatted += ' ' + number.slice(0, 3) + ' ' + number.slice(3);
    } else {
      formatted += ' ' + number.slice(0, 3) + ' ' + number.slice(3, 7) + ' ' + number.slice(7);
    }
  }
  // Default format: groups of 3
  else if (number.length > 0) {
    const parts = number.match(/.{1,3}/g) || [];
    formatted += ' ' + parts.join(' ');
  }
  
  return formatted.trim();
}

interface Child {
  firstName: string;
  lastName: string;
  birthDate?: string;
  school?: string;
  schoolGrade?: string;
  gender?: string;
}

interface HouseholdMember {
  firstName: string;
  lastName: string;
  birthDate?: string;
  relationship?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { t, i18n: i18nHook } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);

  const { i18n } = useTranslation();

  // Step 1: Personal Data
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState<'CHF' | 'EUR' | 'USD' | 'GBP'>('CHF');
  const [phone, setPhone] = useState('');
  const [enablePhoneLogin, setEnablePhoneLogin] = useState(false);
  const [birthDate, setBirthDate] = useState('');
  const [country, setCountry] = useState('CH');
  const [street, setStreet] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [county, setCounty] = useState('');
  const [apartment, setApartment] = useState('');

  // Step 2: Tax Information
  const [region, setRegion] = useState('');
  const [taxClass, setTaxClass] = useState('');
  const [numberOfTaxpayers, setNumberOfTaxpayers] = useState(1);
  const [taxYear, setTaxYear] = useState(currentYear.toString());
  const [taxAdditionalFields, setTaxAdditionalFields] = useState<Record<string, string>>({});

  // Step 3: Children
  const [numberOfChildren, setNumberOfChildren] = useState(0);
  const [children, setChildren] = useState<Child[]>([]);

  // Step 4: Household Members
  const [numberOfHouseholdMembers, setNumberOfHouseholdMembers] = useState(0);
  const [householdMembers, setHouseholdMembers] = useState<HouseholdMember[]>([]);

  // Step 5: Preferences
  const [language, setLanguage] = useState<'de' | 'en' | 'es' | 'nl' | 'it' | 'fr'>('de');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [tutorialEnabled, setTutorialEnabled] = useState(true);

  // Check if user has already completed onboarding
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) {
        setLocation('/login');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().onboardingCompleted) {
          setLocation('/dashboard');
          return;
        }
        
        // Pre-fill name from user profile
        if (user.displayName) {
          setName(user.displayName);
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      } finally {
        setIsCheckingOnboarding(false);
      }
    };

    checkOnboardingStatus();
  }, [user, setLocation]);

  // Initialize children array when numberOfChildren changes
  useEffect(() => {
    if (numberOfChildren > 0) {
      setChildren(prev => {
        const newChildren = [...prev];
        while (newChildren.length < numberOfChildren) {
          newChildren.push({ firstName: '', lastName: '' });
        }
        while (newChildren.length > numberOfChildren) {
          newChildren.pop();
        }
        return newChildren;
      });
    } else {
      setChildren([]);
    }
  }, [numberOfChildren]);

  // Initialize household members array when numberOfHouseholdMembers changes
  useEffect(() => {
    if (numberOfHouseholdMembers > 0) {
      setHouseholdMembers(prev => {
        const newMembers = [...prev];
        while (newMembers.length < numberOfHouseholdMembers) {
          newMembers.push({ firstName: '', lastName: '', birthDate: '', relationship: '', email: '', phone: '', notes: '' });
        }
        while (newMembers.length > numberOfHouseholdMembers) {
          newMembers.pop();
        }
        return newMembers;
      });
    } else {
      setHouseholdMembers([]);
    }
  }, [numberOfHouseholdMembers]);

  // Get address format for current country with translated labels
  const getAddressFormat = (countryCode: string): AddressFormat | null => {
    const baseFormat = addressFormats[countryCode] || addressFormats['CH']; // Default to CH format
    if (!baseFormat) return null;
    
    // Get translated labels from i18n based on current language
    const addressFields = t(`onboarding.fields.addressFields.${countryCode}`, { returnObjects: true }) as Record<string, string> | string;
    
    // If translation not found, fallback to base format
    if (typeof addressFields === 'string' || !addressFields) {
      return baseFormat;
    }
    
    // Create new format with translated labels
    const translatedFormat: AddressFormat = {
      street: {
        ...baseFormat.street,
        label: addressFields.street || baseFormat.street.label,
      },
      houseNumber: {
        ...baseFormat.houseNumber,
        label: addressFields.houseNumber || baseFormat.houseNumber.label,
      },
      postalCode: {
        ...baseFormat.postalCode,
        label: addressFields.postalCode || baseFormat.postalCode.label,
      },
      city: {
        ...baseFormat.city,
        label: addressFields.city || baseFormat.city.label,
      },
    };
    
    // Add optional fields if they exist
    if (baseFormat.state) {
      translatedFormat.state = {
        ...baseFormat.state,
        label: addressFields.state || baseFormat.state.label,
      };
    }
    if (baseFormat.county) {
      translatedFormat.county = {
        ...baseFormat.county,
        label: addressFields.county || baseFormat.county.label,
      };
    }
    if (baseFormat.apartment) {
      translatedFormat.apartment = {
        ...baseFormat.apartment,
        label: addressFields.apartment || baseFormat.apartment.label,
      };
    }
    
    return translatedFormat;
  };

  // Validate address based on country
  const validateAddress = (countryCode: string): { valid: boolean; error?: string } => {
    const format = getAddressFormat(countryCode);
    if (!format) return { valid: false, error: t('onboarding.validation.countryInvalid') };

    // Validate required fields
    if (format.street.required && !street.trim()) {
      return { valid: false, error: t('onboarding.validation.streetRequired', { label: format.street.label }) };
    }
    if (format.houseNumber.required && !houseNumber.trim()) {
      return { valid: false, error: t('onboarding.validation.houseNumberRequired', { label: format.houseNumber.label }) };
    }
    if (format.postalCode.required && !postalCode.trim()) {
      return { valid: false, error: t('onboarding.validation.postalCodeRequired', { label: format.postalCode.label }) };
    }
    if (format.city.required && !city.trim()) {
      return { valid: false, error: t('onboarding.validation.cityRequired', { label: format.city.label }) };
    }
    if (format.state?.required && !state.trim()) {
      return { valid: false, error: t('onboarding.validation.stateRequired', { label: format.state.label }) };
    }

    // Validate postal code format if validation function exists
    if (format.postalCode.validation && postalCode.trim()) {
      if (!format.postalCode.validation(postalCode.trim())) {
        return { valid: false, error: t('onboarding.validation.postalCodeInvalid', { label: format.postalCode.label }) };
      }
    }

    return { valid: true };
  };

  // Get step description based on current step
  const getStepDescription = () => {
    switch (currentStep) {
      case 1:
        return t('onboarding.steps.personalData');
      case 2:
        return t('onboarding.steps.taxInfo');
      case 3:
        return t('onboarding.steps.children');
      case 4:
        return t('onboarding.steps.household');
      case 5:
        return t('onboarding.steps.preferences');
      default:
        return '';
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!name.trim()) {
        toast.error(t('onboarding.validation.nameRequired'));
        return;
      }
      const addressValidation = validateAddress(country);
      if (!addressValidation.valid) {
        toast.error(addressValidation.error || t('onboarding.validation.addressRequired'));
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Tax information is optional, can proceed
      setCurrentStep(3);
    } else if (currentStep === 3) {
      // Validate children if any
      if (numberOfChildren > 0) {
        const invalidChildren = children.filter(c => !c.firstName.trim() || !c.lastName.trim());
        if (invalidChildren.length > 0) {
          toast.error(t('onboarding.validation.childFirstNameRequired'));
          return;
        }
      }
      setCurrentStep(4);
    } else if (currentStep === 4) {
      // Validate household members if any
      if (numberOfHouseholdMembers > 0) {
        const invalidMembers = householdMembers.filter(m => !m.firstName.trim() || !m.lastName.trim());
        if (invalidMembers.length > 0) {
          toast.error(t('onboarding.validation.householdMemberNameRequired'));
          return;
        }
      }
      setCurrentStep(5);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Check if phone number exists (if provided and enabled)
      let phoneNumber = null;
      if (enablePhoneLogin && phone.trim()) {
        const cleanedPhone = phone.trim().replace(/\s/g, '');
        const checkPhone = httpsCallable(functions, 'checkPhoneNumberExists');
        const result = await checkPhone({ phoneNumber: cleanedPhone });
        
        if ((result.data as any).exists) {
          toast.error(t('onboarding.error.phoneNumberExists', 'Diese Telefonnummer ist bereits bei einem anderen Konto registriert.'));
          setIsLoading(false);
          return;
        }
        
        phoneNumber = cleanedPhone;
        
        // Save phone number to phoneNumbers collection
        await setDoc(doc(db, 'phoneNumbers', cleanedPhone), {
          userId: user.uid,
          phoneNumber: cleanedPhone,
          createdAt: new Date(),
        }, { merge: true });
      }
      
      // Mark onboarding as completed with minimal data
      await setDoc(doc(db, 'users', user.uid), {
        onboardingCompleted: true,
        name: name.trim() || user.displayName || user.email?.split('@')[0] || t('common.user', 'Benutzer'),
        currency,
        phone: phoneNumber,
        enablePhoneLogin: enablePhoneLogin && phoneNumber ? true : false,
        birthDate: birthDate || null,
        street: street.trim() || null,
        houseNumber: houseNumber.trim() || null,
        postalCode: postalCode.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        county: county.trim() || null,
        apartment: apartment.trim() || null,
        country: country || null,
        region: region || null,
        taxClass: taxClass || null,
        numberOfTaxpayers: numberOfTaxpayers || 1,
        taxYear: taxYear ? parseInt(taxYear, 10) : currentYear,
        language: language || 'de',
        theme: theme || 'system',
        notificationsEnabled: notificationsEnabled !== false,
        tutorialEnabled: tutorialEnabled !== false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }, { merge: true });

      toast.success(t('onboarding.success.completed'));
      setLocation('/dashboard');
    } catch (error: any) {
      toast.error(t('onboarding.error.saving', { message: error.message }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Check if phone number exists (if provided and enabled)
      let phoneNumber = null;
      if (enablePhoneLogin && phone.trim()) {
        const cleanedPhone = phone.trim().replace(/\s/g, '');
        const checkPhone = httpsCallable(functions, 'checkPhoneNumberExists');
        const result = await checkPhone({ phoneNumber: cleanedPhone });
        
        if ((result.data as any).exists) {
          toast.error(t('onboarding.error.phoneNumberExists', 'Diese Telefonnummer ist bereits bei einem anderen Konto registriert.'));
          setIsLoading(false);
          return;
        }
        
        phoneNumber = cleanedPhone;
        
        // Save phone number to phoneNumbers collection
        await setDoc(doc(db, 'phoneNumbers', cleanedPhone), {
          userId: user.uid,
          phoneNumber: cleanedPhone,
          createdAt: new Date(),
        }, { merge: true });
      }

      // Save user data with all fields
      await setDoc(doc(db, 'users', user.uid), {
        onboardingCompleted: true,
        name: name.trim() || user.displayName || user.email?.split('@')[0] || t('common.user', 'Benutzer'),
        currency,
        phone: phoneNumber,
        enablePhoneLogin: enablePhoneLogin && phoneNumber ? true : false,
        birthDate: birthDate || null,
        street: street.trim() || null,
        houseNumber: houseNumber.trim() || null,
        postalCode: postalCode.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        county: county.trim() || null,
        apartment: apartment.trim() || null,
        country: country || null,
        region: region || null,
        taxClass: taxClass || null,
        numberOfTaxpayers: numberOfTaxpayers || 1,
        taxYear: taxYear ? parseInt(taxYear, 10) : currentYear,
        language: language || 'de',
        theme: theme || 'system',
        notificationsEnabled: notificationsEnabled !== false,
        tutorialEnabled: tutorialEnabled !== false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }, { merge: true });

      // Create children
      if (numberOfChildren > 0) {
        const childrenPromises = children
          .filter(c => c.firstName.trim() && c.lastName.trim())
          .map(child => 
            createPerson({
              name: `${child.firstName.trim()} ${child.lastName.trim()}`,
              type: 'child',
              currency,
              notes: [
                child.birthDate ? `${t('onboarding.fields.childBirthDate')}: ${child.birthDate}` : null,
                child.school ? `${t('onboarding.fields.childSchool')}: ${child.school}` : null,
                child.schoolGrade ? `${t('onboarding.fields.childSchoolGrade')}: ${child.schoolGrade}` : null,
                child.gender ? `${t('onboarding.fields.childGender')}: ${child.gender === 'male' ? t('onboarding.fields.genderMale') : child.gender === 'female' ? t('onboarding.fields.genderFemale') : child.gender === 'diverse' ? t('onboarding.fields.genderDiverse') : t('onboarding.fields.genderOther')}` : null,
                `${t('onboarding.fields.address')}: ${[
                  street.trim(),
                  houseNumber.trim(),
                  apartment.trim() ? `${t('onboarding.fields.aptAbbrev')} ${apartment.trim()}` : null,
                  postalCode.trim(),
                  city.trim(),
                  state.trim() ? state.trim() : null,
                  county.trim() ? county.trim() : null,
                ].filter(Boolean).join(', ')}`,
              ].filter(Boolean).join(' | '),
            })
          );
        await Promise.all(childrenPromises);
      }

      // Create household members
      if (numberOfHouseholdMembers > 0) {
        const memberPromises = householdMembers
          .filter(m => m.firstName.trim() && m.lastName.trim())
          .map(member =>
            createPerson({
              name: `${member.firstName.trim()} ${member.lastName.trim()}`.trim(),
              email: member.email?.trim() || null,
              phone: member.phone?.trim() || null,
              type: 'household',
              currency,
              notes: member.notes?.trim() || member.relationship ? `${member.relationship}${member.notes ? ` - ${member.notes}` : ''}` : member.notes?.trim() || null,
            })
          );
        await Promise.all(memberPromises);
      }

      toast.success(t('onboarding.success.completed'));
      setLocation('/dashboard');
    } catch (error: any) {
      toast.error(t('onboarding.error.saving', { message: error.message }));
      console.error('Onboarding error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <OnboardingTheme>
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className={`w-full max-w-2xl ${getSeasonalCardClass()}`}>
          <CardHeader>
            <CardTitle className="text-2xl">{t('onboarding.title')}</CardTitle>
            <CardDescription>
              {t('onboarding.stepIndicator', { step: currentStep, total: 5, description: getStepDescription() })}
            </CardDescription>
            <div className="mt-4 w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 5) * 100}%` }}
              />
            </div>
          </CardHeader>
          <CardContent>
            {/* Step 1: Personal Data */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('onboarding.fields.name')}</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('onboarding.fields.namePlaceholder')}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">{t('onboarding.fields.currency')}</Label>
                  <Select value={currency} onValueChange={(value: 'CHF' | 'EUR' | 'USD' | 'GBP') => setCurrency(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CHF">CHF ({t('onboarding.fields.currencyNames.chf', 'Schweizer Franken')})</SelectItem>
                      <SelectItem value="EUR">EUR ({t('onboarding.fields.currencyNames.eur', 'Euro')})</SelectItem>
                      <SelectItem value="USD">USD ({t('onboarding.fields.currencyNames.usd', 'US-Dollar')})</SelectItem>
                      <SelectItem value="GBP">GBP ({t('onboarding.fields.currencyNames.gbp', 'Britisches Pfund')})</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t('onboarding.fields.phone')}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      const formatted = formatPhoneNumber(e.target.value);
                      setPhone(formatted);
                    }}
                    placeholder={t('onboarding.fields.phonePlaceholder')}
                  />
                  <div className="flex items-center space-x-2 mt-2">
                    <Switch
                      id="enablePhoneLogin"
                      checked={enablePhoneLogin}
                      onCheckedChange={setEnablePhoneLogin}
                      disabled={!phone.trim()}
                    />
                    <Label htmlFor="enablePhoneLogin" className="text-sm text-muted-foreground cursor-pointer">
                      {t('onboarding.fields.enablePhoneLogin', 'Telefonnummer für SMS-Anmeldung verwenden')}
                    </Label>
                  </div>
                  {enablePhoneLogin && phone.trim() && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('onboarding.fields.phoneLoginHint', 'Sie können sich später mit dieser Telefonnummer anmelden. Sie können dies jederzeit in den Einstellungen ändern.')}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthDate">{t('onboarding.fields.birthDate')}</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country">{t('onboarding.fields.country')}</Label>
                    <Select value={country} onValueChange={(value) => {
                      setCountry(value);
                      // Reset address fields when country changes
                      setStreet('');
                      setHouseNumber('');
                      setPostalCode('');
                      setCity('');
                      setState('');
                      setCounty('');
                      setApartment('');
                      
                    // Automatically set language and currency based on country
                    const config = countryConfig[value];
                    if (config) {
                      // Change language (both i18n and state)
                      const newLanguage = config.language as 'de' | 'en' | 'es' | 'nl' | 'it' | 'fr';
                      i18nHook.changeLanguage(newLanguage);
                      setLanguage(newLanguage);
                      // Change currency
                      setCurrency(config.currency);
                    }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('onboarding.fields.countryPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {t(`onboarding.countries.${c.code.toLowerCase()}`, c.name)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language">{t('onboarding.fields.language')}</Label>
                    <Select value={language} onValueChange={(value: 'de' | 'en' | 'es' | 'nl' | 'it' | 'fr') => {
                      setLanguage(value);
                      i18nHook.changeLanguage(value);
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableLanguages.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            {lang.code === 'de' ? t('common.german', 'Deutsch') :
                             lang.code === 'en' ? t('common.english', 'English') :
                             lang.code === 'es' ? t('common.spanish', 'Español') :
                             lang.code === 'nl' ? t('common.dutch', 'Nederlands') :
                             lang.code === 'it' ? t('common.italian', 'Italiano') :
                             lang.code === 'fr' ? t('common.french', 'Français') : lang.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {country && (() => {
                  const addressFormat = getAddressFormat(country);
                  if (!addressFormat) return null;

                  return (
                    <div className="space-y-4 pt-4 border-t">
                      <h3 className="text-lg font-semibold">{t('onboarding.fields.address')}</h3>
                      
                      {/* Street */}
                      <div className="space-y-2">
                        <Label htmlFor="street">{addressFormat.street.label} {addressFormat.street.required && '*'}</Label>
                        <Input
                          id="street"
                          type="text"
                          value={street}
                          onChange={(e) => setStreet(e.target.value)}
                          placeholder={addressFormat.street.placeholder}
                          required={addressFormat.street.required}
                        />
                      </div>

                      {/* House Number and Apartment (for USA) */}
                      <div className={addressFormat.apartment ? "grid grid-cols-2 gap-4" : ""}>
                        {addressFormat.houseNumber && (
                          <div className="space-y-2">
                            <Label htmlFor="houseNumber">{addressFormat.houseNumber.label} {addressFormat.houseNumber.required && '*'}</Label>
                            <Input
                              id="houseNumber"
                              type="text"
                              value={houseNumber}
                              onChange={(e) => setHouseNumber(e.target.value)}
                              placeholder={addressFormat.houseNumber.placeholder}
                              required={addressFormat.houseNumber.required}
                            />
                          </div>
                        )}
                        {addressFormat.apartment && (
                          <div className="space-y-2">
                            <Label htmlFor="apartment">{addressFormat.apartment.label}</Label>
                            <Input
                              id="apartment"
                              type="text"
                              value={apartment}
                              onChange={(e) => setApartment(e.target.value)}
                              placeholder={addressFormat.apartment.placeholder}
                              required={addressFormat.apartment.required}
                            />
                          </div>
                        )}
                      </div>

                      {/* City and State (for USA) or City and County (for UK) */}
                      <div className="grid grid-cols-2 gap-4">
                        {addressFormat.state ? (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor="city">{addressFormat.city.label} {addressFormat.city.required && '*'}</Label>
                              <Input
                                id="city"
                                type="text"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                placeholder={addressFormat.city.placeholder}
                                required={addressFormat.city.required}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="state">{addressFormat.state.label} {addressFormat.state.required && '*'}</Label>
                              <Select value={state} onValueChange={setState}>
                                <SelectTrigger>
                                  <SelectValue placeholder={addressFormat.state.placeholder} />
                                </SelectTrigger>
                                <SelectContent>
                                  {addressFormat.state.options?.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </>
                        ) : addressFormat.county ? (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor="city">{addressFormat.city.label} {addressFormat.city.required && '*'}</Label>
                              <Input
                                id="city"
                                type="text"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                placeholder={addressFormat.city.placeholder}
                                required={addressFormat.city.required}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="county">{addressFormat.county.label}</Label>
                              <Input
                                id="county"
                                type="text"
                                value={county}
                                onChange={(e) => setCounty(e.target.value)}
                                placeholder={addressFormat.county.placeholder}
                                required={addressFormat.county.required}
                              />
                            </div>
                          </>
                        ) : (
                          <div className="space-y-2">
                            <Label htmlFor="city">{addressFormat.city.label} {addressFormat.city.required && '*'}</Label>
                            <Input
                              id="city"
                              type="text"
                              value={city}
                              onChange={(e) => setCity(e.target.value)}
                              placeholder={addressFormat.city.placeholder}
                              required={addressFormat.city.required}
                            />
                          </div>
                        )}
                      </div>

                      {/* Postal Code */}
                      <div className="space-y-2">
                        <Label htmlFor="postalCode">{addressFormat.postalCode.label} {addressFormat.postalCode.required && '*'}</Label>
                        <Input
                          id="postalCode"
                          type="text"
                          value={postalCode}
                          onChange={(e) => {
                            let value = e.target.value;
                            if (addressFormat.postalCode.maxLength) {
                              value = value.slice(0, addressFormat.postalCode.maxLength);
                            }
                            setPostalCode(value);
                          }}
                          placeholder={addressFormat.postalCode.placeholder}
                          required={addressFormat.postalCode.required}
                          maxLength={addressFormat.postalCode.maxLength}
                        />
                        {addressFormat.postalCode.validation && postalCode && !addressFormat.postalCode.validation(postalCode) && (
                          <p className="text-xs text-destructive">{t('onboarding.validation.postalCodeInvalid', { label: addressFormat.postalCode.label })}</p>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Step 2: Tax Information */}
            {currentStep === 2 && (
              <div className="space-y-4">
                {country && (() => {
                  const selectedCountry = countries.find(c => c.code === country);
                  if (!selectedCountry || !selectedCountry.regions || selectedCountry.regions.length === 0) {
                    return (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          {t('onboarding.noRegions', { country: selectedCountry?.name || t('onboarding.fields.country') })}
                        </p>
                      </div>
                    );
                  }
                  const taxConfig = getTaxConfig(country);
                  return (
                    <div className="space-y-2">
                      <Label htmlFor="region">{t('onboarding.fields.region', taxConfig.regionLabel)} ({t('common.optional')})</Label>
                      <Select value={region} onValueChange={setRegion}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('onboarding.fields.selectRegion', '{{regionLabel}} wählen', { regionLabel: taxConfig.regionLabel })} />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedCountry.regions.map((r) => (
                            <SelectItem key={r.code} value={r.code}>
                              {r.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">{t('onboarding.fields.regionHint')}</p>
                    </div>
                  );
                })()}

                {(() => {
                  const taxConfig = getTaxConfig(country);
                  return (
                    <div className="space-y-2">
                      <Label htmlFor="taxClass">{t('onboarding.fields.taxClass')} ({t('common.optional')})</Label>
                      <Select value={taxClass} onValueChange={setTaxClass}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('onboarding.fields.taxClassPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {taxConfig.taxClasses.map((taxClassOption) => (
                            <SelectItem key={taxClassOption.value} value={taxClassOption.value}>
                              {taxClassOption.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })()}

                <div className="space-y-2">
                  <Label htmlFor="numberOfTaxpayers">{t('onboarding.fields.numberOfTaxpayers')}</Label>
                  <Select
                    value={numberOfTaxpayers.toString()}
                    onValueChange={(value) => setNumberOfTaxpayers(parseInt(value, 10))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxYear">{t('onboarding.fields.taxYear')}</Label>
                  <Select value={taxYear} onValueChange={setTaxYear}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Additional Tax Fields */}
                {(() => {
                  const taxConfig = getTaxConfig(country);
                  if (!taxConfig.additionalFields || taxConfig.additionalFields.length === 0) {
                    return null;
                  }
                  return (
                    <div className="space-y-4">
                      {taxConfig.additionalFields.map((field) => (
                        <div key={field.key} className="space-y-2">
                          <Label htmlFor={`tax-${field.key}`}>{field.label} {field.required ? '*' : `(${t('common.optional')})`}</Label>
                          {field.type === 'select' ? (
                            <Select
                              value={taxAdditionalFields[field.key] || ''}
                              onValueChange={(value) => {
                                setTaxAdditionalFields(prev => ({ ...prev, [field.key]: value }));
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
                              </SelectTrigger>
                              <SelectContent>
                                {field.options?.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              id={`tax-${field.key}`}
                              type="text"
                              value={taxAdditionalFields[field.key] || ''}
                              onChange={(e) => {
                                setTaxAdditionalFields(prev => ({ ...prev, [field.key]: e.target.value }));
                              }}
                              placeholder={field.placeholder || field.label}
                              required={field.required}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

          {/* Step 3: Children */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="numberOfChildren">{t('onboarding.fields.numberOfChildren')}</Label>
                <Select
                  value={numberOfChildren.toString()}
                  onValueChange={(value) => setNumberOfChildren(parseInt(value, 10))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {numberOfChildren > 0 && (
                <div className="space-y-4">
                  {children.map((child, index) => (
                    <div key={index} className="space-y-4 p-4 border rounded-lg">
                      <Label className="text-lg font-semibold">{t('onboarding.fields.numberOfChildren')} {index + 1}</Label>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`child-firstName-${index}`}>{t('onboarding.fields.childFirstName')} *</Label>
                          <Input
                            id={`child-firstName-${index}`}
                            type="text"
                            value={child.firstName}
                            onChange={(e) => {
                              const newChildren = [...children];
                              newChildren[index].firstName = e.target.value;
                              setChildren(newChildren);
                            }}
                            placeholder={t('onboarding.fields.childFirstName')}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`child-lastName-${index}`}>{t('onboarding.fields.childLastName')} *</Label>
                          <Input
                            id={`child-lastName-${index}`}
                            type="text"
                            value={child.lastName}
                            onChange={(e) => {
                              const newChildren = [...children];
                              newChildren[index].lastName = e.target.value;
                              setChildren(newChildren);
                            }}
                            placeholder={t('onboarding.fields.childLastName')}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`child-birthDate-${index}`}>{t('onboarding.fields.childBirthDate')} ({t('common.optional')})</Label>
                        <Input
                          id={`child-birthDate-${index}`}
                          type="date"
                          value={child.birthDate || ''}
                          onChange={(e) => {
                            const newChildren = [...children];
                            newChildren[index].birthDate = e.target.value;
                            setChildren(newChildren);
                          }}
                          max={new Date().toISOString().split('T')[0]}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`child-school-${index}`}>{t('onboarding.fields.childSchool')} ({t('common.optional')})</Label>
                          <Input
                            id={`child-school-${index}`}
                            type="text"
                            value={child.school || ''}
                            onChange={(e) => {
                              const newChildren = [...children];
                              newChildren[index].school = e.target.value;
                              setChildren(newChildren);
                            }}
                            placeholder={t('onboarding.fields.schoolNamePlaceholder')}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`child-schoolGrade-${index}`}>{t('onboarding.fields.childSchoolGrade')} ({t('common.optional')})</Label>
                          <Select
                            value={child.schoolGrade || ''}
                            onValueChange={(value) => {
                              const newChildren = [...children];
                              newChildren[index].schoolGrade = value;
                              setChildren(newChildren);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={t('onboarding.fields.schoolGradePlaceholder', 'Schulstufe wählen')} />
                            </SelectTrigger>
                            <SelectContent>
                              {getSchoolGrades(country).map((grade) => (
                                <SelectItem key={grade.value} value={grade.value}>
                                  {grade.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`child-gender-${index}`}>{t('onboarding.fields.childGender')} ({t('common.optional')})</Label>
                          <Select
                            value={child.gender || ''}
                            onValueChange={(value) => {
                              const newChildren = [...children];
                              newChildren[index].gender = value;
                              setChildren(newChildren);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={t('onboarding.fields.childGender')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">{t('onboarding.fields.genderMale')}</SelectItem>
                              <SelectItem value="female">{t('onboarding.fields.genderFemale')}</SelectItem>
                              <SelectItem value="diverse">{t('onboarding.fields.genderDiverse')}</SelectItem>
                              <SelectItem value="none">{t('onboarding.fields.genderOther')}</SelectItem>
                            </SelectContent>
                          </Select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Household Members */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="numberOfHouseholdMembers">{t('onboarding.fields.numberOfHouseholdMembers')}</Label>
                <Select
                  value={numberOfHouseholdMembers.toString()}
                  onValueChange={(value) => setNumberOfHouseholdMembers(parseInt(value, 10))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {numberOfHouseholdMembers > 0 && (
                <div className="space-y-4">
                  {householdMembers.map((member, index) => (
                    <div key={index} className="space-y-4 p-4 border rounded-lg">
                      <Label className="text-lg font-semibold">{t('onboarding.fields.householdMemberName')} {index + 1}</Label>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`household-member-firstName-${index}`}>{t('onboarding.fields.householdMemberFirstName')}</Label>
                          <Input
                            id={`household-member-firstName-${index}`}
                            type="text"
                            value={member.firstName}
                            onChange={(e) => {
                              const newMembers = [...householdMembers];
                              newMembers[index].firstName = e.target.value;
                              setHouseholdMembers(newMembers);
                            }}
                            placeholder={t('onboarding.fields.householdMemberFirstName')}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`household-member-lastName-${index}`}>{t('onboarding.fields.householdMemberLastName')}</Label>
                          <Input
                            id={`household-member-lastName-${index}`}
                            type="text"
                            value={member.lastName}
                            onChange={(e) => {
                              const newMembers = [...householdMembers];
                              newMembers[index].lastName = e.target.value;
                              setHouseholdMembers(newMembers);
                            }}
                            placeholder={t('onboarding.fields.householdMemberLastName')}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`household-member-birthDate-${index}`}>{t('onboarding.fields.householdMemberBirthDate')} ({t('common.optional')})</Label>
                          <Input
                            id={`household-member-birthDate-${index}`}
                            type="date"
                            value={member.birthDate || ''}
                            onChange={(e) => {
                              const newMembers = [...householdMembers];
                              newMembers[index].birthDate = e.target.value;
                              setHouseholdMembers(newMembers);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`household-member-relationship-${index}`}>{t('onboarding.fields.householdMemberRelationship')} ({t('common.optional')})</Label>
                          <Select
                            value={member.relationship || ''}
                            onValueChange={(value) => {
                              const newMembers = [...householdMembers];
                              newMembers[index].relationship = value;
                              setHouseholdMembers(newMembers);
                            }}
                          >
                            <SelectTrigger id={`household-member-relationship-${index}`}>
                              <SelectValue placeholder={t('onboarding.fields.householdMemberRelationshipPlaceholder')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="partner">{t('onboarding.fields.relationshipPartner')}</SelectItem>
                              <SelectItem value="spouse">{t('onboarding.fields.relationshipSpouse')}</SelectItem>
                              <SelectItem value="parent">{t('onboarding.fields.relationshipParent')}</SelectItem>
                              <SelectItem value="sibling">{t('onboarding.fields.relationshipSibling')}</SelectItem>
                              <SelectItem value="roommate">{t('onboarding.fields.relationshipRoommate')}</SelectItem>
                              <SelectItem value="other">{t('onboarding.fields.relationshipOther')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`household-member-email-${index}`}>{t('onboarding.fields.householdMemberEmail')}</Label>
                          <Input
                            id={`household-member-email-${index}`}
                            type="email"
                            value={member.email || ''}
                            onChange={(e) => {
                              const newMembers = [...householdMembers];
                              newMembers[index].email = e.target.value;
                              setHouseholdMembers(newMembers);
                            }}
                            placeholder={t('onboarding.fields.householdMemberEmail')}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`household-member-phone-${index}`}>{t('onboarding.fields.householdMemberPhone')}</Label>
                          <Input
                            id={`household-member-phone-${index}`}
                            type="tel"
                            value={member.phone || ''}
                            onChange={(e) => {
                              const newMembers = [...householdMembers];
                              const formatted = formatPhoneNumber(e.target.value);
                              newMembers[index].phone = formatted;
                              setHouseholdMembers(newMembers);
                            }}
                            placeholder={t('onboarding.fields.householdMemberPhone')}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`household-member-notes-${index}`}>{t('onboarding.fields.householdMemberNotes')} ({t('common.optional')})</Label>
                        <Input
                          id={`household-member-notes-${index}`}
                          type="text"
                          value={member.notes || ''}
                          onChange={(e) => {
                            const newMembers = [...householdMembers];
                            newMembers[index].notes = e.target.value;
                            setHouseholdMembers(newMembers);
                          }}
                          placeholder={t('onboarding.fields.householdMemberNotes')}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 5: Preferences */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="language">{t('onboarding.fields.language')}</Label>
                <Select value={language} onValueChange={(value: 'de' | 'en' | 'es' | 'nl' | 'it' | 'fr') => {
                  setLanguage(value);
                  i18nHook.changeLanguage(value);
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLanguages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.code === 'de' ? t('common.german', 'Deutsch') :
                         lang.code === 'en' ? t('common.english', 'English') :
                         lang.code === 'es' ? t('common.spanish', 'Español') :
                         lang.code === 'nl' ? t('common.dutch', 'Nederlands') :
                         lang.code === 'it' ? t('common.italian', 'Italiano') :
                         lang.code === 'fr' ? t('common.french', 'Français') : lang.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="theme">{t('onboarding.fields.theme')}</Label>
                <Select value={theme} onValueChange={(value: 'light' | 'dark' | 'system') => setTheme(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">{t('onboarding.fields.themeLight')}</SelectItem>
                    <SelectItem value="dark">{t('onboarding.fields.themeDark')}</SelectItem>
                    <SelectItem value="system">{t('onboarding.fields.themeSystem')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="notifications">{t('onboarding.fields.notifications')}</Label>
                <Switch
                  id="notifications"
                  checked={notificationsEnabled}
                  onCheckedChange={setNotificationsEnabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="tutorial">{t('onboarding.fields.tutorial')}</Label>
                <Switch
                  id="tutorial"
                  checked={tutorialEnabled}
                  onCheckedChange={setTutorialEnabled}
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            <div>
              {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={handleBack} disabled={isLoading}>
                  {t('onboarding.buttons.back')}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {currentStep < 5 && (
                <>
                  <Button type="button" variant="ghost" onClick={handleSkip} disabled={isLoading}>
                    {t('onboarding.buttons.skip')}
                  </Button>
                  <Button type="button" onClick={handleNext} disabled={isLoading}>
                    {t('onboarding.buttons.next')}
                  </Button>
                </>
              )}
              {currentStep === 5 && (
                <Button type="button" onClick={handleComplete} disabled={isLoading}>
                  {isLoading ? t('common.loading') : t('onboarding.buttons.complete')}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </OnboardingTheme>
  );
}

