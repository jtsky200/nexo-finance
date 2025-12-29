import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { createPerson } from '@/lib/firebaseHooks';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import OnboardingTheme from '@/components/OnboardingTheme';
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
  // Remove all non-digit characters except + at the start
  let cleaned = value.replace(/[^\d+]/g, '');
  
  // Ensure + is only at the start
  if (cleaned.includes('+')) {
    const plusIndex = cleaned.indexOf('+');
    if (plusIndex > 0) {
      cleaned = cleaned.replace(/\+/g, '');
      cleaned = '+' + cleaned;
    }
  }
  
  // Remove + if it's not at the start
  if (cleaned.length > 0 && cleaned[0] !== '+' && cleaned.includes('+')) {
    cleaned = cleaned.replace(/\+/g, '');
  }
  
  // Extract digits only
  const digits = cleaned.replace(/\D/g, '');
  const hasPlus = cleaned.startsWith('+');
  
  if (!digits) {
    return hasPlus ? '+' : '';
  }
  
  let formatted = hasPlus ? '+' : '';
  let remaining = digits;
  
  // Detect country code (1-3 digits after +)
  if (hasPlus && remaining.length > 0) {
    let countryCodeLength = 1;
    
    // Single digit country codes (1 = US/Canada)
    if (remaining.startsWith('1') && remaining.length > 1) {
      countryCodeLength = 1;
    }
    // Two digit country codes (most common: 20-99 range)
    else if (remaining.length >= 2) {
      const firstDigit = remaining[0];
      
      // Most European and other countries use 2-digit codes (20-99)
      if (firstDigit >= '2' && firstDigit <= '9') {
        countryCodeLength = 2;
      }
      // Three digit country codes (200-299 range, mostly African countries)
      else if (firstDigit === '2' && remaining.length >= 3) {
        const threeDigit = remaining.substring(0, 3);
        // Check if it's a valid 3-digit code (200-299)
        if (parseInt(threeDigit) >= 200 && parseInt(threeDigit) <= 299) {
          countryCodeLength = 3;
        } else {
          countryCodeLength = 2;
        }
      }
      // Default to 2 digits for unknown patterns
      else {
        countryCodeLength = 2;
      }
    }
    
    // Add country code
    formatted += remaining.substring(0, countryCodeLength);
    remaining = remaining.substring(countryCodeLength);
  }
  
  // Format remaining digits in groups
  if (remaining.length > 0) {
    formatted += ' ';
    
    // Format in groups: prefer 3-3-2-2 or 2-3-3-2 depending on length
    while (remaining.length > 0) {
      let groupSize = 3;
      
      // Adjust group size based on remaining length
      if (remaining.length <= 4) {
        groupSize = 2;
      } else if (remaining.length <= 6) {
        groupSize = 3;
      } else if (remaining.length <= 8) {
        // Alternate between 3 and 2
        const position = formatted.split(' ').length - 1; // Number of groups already added
        groupSize = position % 2 === 0 ? 3 : 2;
      } else {
        groupSize = 3;
      }
      
      // Take next group
      const group = remaining.substring(0, Math.min(groupSize, remaining.length));
      formatted += group;
      remaining = remaining.substring(group.length);
      
      // Add space if more digits remain
      if (remaining.length > 0) {
        formatted += ' ';
      }
    }
  }
  
  return formatted;
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

export default function MobileOnboarding() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);

  const { t, i18n: i18nHook } = useTranslation();
  
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

  // Step 1: Personal Data
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState<'CHF' | 'EUR' | 'USD' | 'GBP'>('CHF');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [street, setStreet] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [county, setCounty] = useState('');
  const [apartment, setApartment] = useState('');

  // Step 2: Tax Information
  const [country, setCountry] = useState('CH');
  const [region, setRegion] = useState('');
  const [taxClass, setTaxClass] = useState('');
  const [taxAdditionalFields, setTaxAdditionalFields] = useState<Record<string, string>>({});
  const [numberOfTaxpayers, setNumberOfTaxpayers] = useState(1);
  const [taxYear, setTaxYear] = useState(currentYear.toString());

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
          setLocation('/');
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
      // Mark onboarding as completed with minimal data
      await setDoc(doc(db, 'users', user.uid), {
        onboardingCompleted: true,
        name: name.trim() || user.displayName || user.email?.split('@')[0] || 'User',
        currency,
        phone: phone.trim() || null,
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

      toast.success('Onboarding abgeschlossen');
      setLocation('/');
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

      // Save user data with all fields
      await setDoc(doc(db, 'users', user.uid), {
        onboardingCompleted: true,
        name: name.trim() || user.displayName || user.email?.split('@')[0] || 'User',
        currency,
        phone: phone.trim() || null,
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
              currency,
              notes: [
                child.birthDate ? `Geburtsdatum: ${child.birthDate}` : null,
                child.school ? `Schule: ${child.school}` : null,
                child.schoolGrade ? `Schulstufe: ${child.schoolGrade}` : null,
                child.gender ? `Geschlecht: ${child.gender === 'male' ? 'Männlich' : child.gender === 'female' ? 'Weiblich' : child.gender === 'diverse' ? 'Divers' : 'Keine Angabe'}` : null,
                `Adresse: ${[
                  street.trim(),
                  houseNumber.trim(),
                  apartment.trim() ? `Apt ${apartment.trim()}` : null,
                  postalCode.trim(),
                  city.trim(),
                  state.trim() ? state.trim() : null,
                  county.trim() ? county.trim() : null,
                ].filter(Boolean).join(', ')}`,
              ].filter(Boolean).join(' | ') || null,
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
      setLocation('/');
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <OnboardingTheme>
      <div className="flex flex-col min-h-screen">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">{t('onboarding.title')}</h1>
          <p className="text-muted-foreground text-sm">
            {t('onboarding.stepIndicator', { step: currentStep, total: 5, description: getStepDescription() })}
          </p>
          <div className="mt-4 w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Personal Data */}
        {currentStep === 1 && (
          <div className="flex-1 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t('onboarding.fields.name')}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('onboarding.fields.namePlaceholder')}
                className="w-full h-12 px-4 rounded-lg text-base bg-background border border-border outline-none focus:border-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('onboarding.fields.currency')}</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as 'CHF' | 'EUR' | 'USD' | 'GBP')}
                className="w-full h-12 px-4 rounded-lg text-base bg-background border border-border outline-none focus:border-primary"
              >
                <option value="CHF">CHF (Schweizer Franken)</option>
                <option value="EUR">EUR (Euro)</option>
                <option value="USD">USD (US-Dollar)</option>
                <option value="GBP">GBP (Britisches Pfund)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('onboarding.fields.phone')}</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  const formatted = formatPhoneNumber(e.target.value);
                  setPhone(formatted);
                }}
                placeholder={t('onboarding.fields.phonePlaceholder')}
                className="w-full h-12 px-4 rounded-lg text-base bg-background border border-border outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Geburtsdatum (optional)</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full h-12 px-4 rounded-lg text-base bg-background border border-border outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t('onboarding.fields.country')}</label>
                <select
                  value={country}
                  onChange={(e) => {
                    const value = e.target.value;
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
                  }}
                  className="w-full h-12 px-4 rounded-lg text-base bg-background border border-border outline-none focus:border-primary"
                >
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('onboarding.fields.language')}</label>
                <select
                  value={language}
                  onChange={(e) => {
                    const value = e.target.value as 'de' | 'en' | 'es' | 'nl' | 'it' | 'fr';
                    setLanguage(value);
                    i18nHook.changeLanguage(value);
                  }}
                  className="w-full h-12 px-4 rounded-lg text-base bg-background border border-border outline-none focus:border-primary"
                >
                  {availableLanguages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {country && (() => {
              const addressFormat = getAddressFormat(country);
              if (!addressFormat) return null;

              return (
                <div className="pt-4 border-t space-y-4">
                  <h3 className="text-lg font-semibold">Adresse</h3>
                  
                  {/* Street */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {addressFormat.street.label} {addressFormat.street.required && '*'}
                    </label>
                    <input
                      type="text"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder={addressFormat.street.placeholder}
                      className="w-full h-12 px-4 rounded-lg text-base bg-background border border-border outline-none focus:border-primary"
                      required={addressFormat.street.required}
                    />
                  </div>

                  {/* House Number and Apartment (for USA) */}
                  <div className={addressFormat.apartment ? "grid grid-cols-2 gap-4" : ""}>
                    {addressFormat.houseNumber && (
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {addressFormat.houseNumber.label} {addressFormat.houseNumber.required && '*'}
                        </label>
                        <input
                          type="text"
                          value={houseNumber}
                          onChange={(e) => setHouseNumber(e.target.value)}
                          placeholder={addressFormat.houseNumber.placeholder}
                          className="w-full h-12 px-4 rounded-lg text-base bg-background border border-border outline-none focus:border-primary"
                          required={addressFormat.houseNumber.required}
                        />
                      </div>
                    )}
                    {addressFormat.apartment && (
                      <div>
                        <label className="block text-sm font-medium mb-2">{addressFormat.apartment.label}</label>
                        <input
                          type="text"
                          value={apartment}
                          onChange={(e) => setApartment(e.target.value)}
                          placeholder={addressFormat.apartment.placeholder}
                          className="w-full h-12 px-4 rounded-lg text-base bg-background border border-border outline-none focus:border-primary"
                          required={addressFormat.apartment.required}
                        />
                      </div>
                    )}
                  </div>

                  {/* City and State (for USA) or City and County (for UK) */}
                  <div className="grid grid-cols-2 gap-4">
                    {addressFormat.state ? (
                      <>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            {addressFormat.city.label} {addressFormat.city.required && '*'}
                          </label>
                          <input
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder={addressFormat.city.placeholder}
                            className="w-full h-12 px-4 rounded-lg text-base bg-background border border-border outline-none focus:border-primary"
                            required={addressFormat.city.required}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            {addressFormat.state.label} {addressFormat.state.required && '*'}
                          </label>
                          <select
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            className="w-full h-12 px-4 rounded-lg text-base bg-background border border-border outline-none focus:border-primary"
                            required={addressFormat.state.required}
                          >
                            <option value="">{addressFormat.state.placeholder}</option>
                            {addressFormat.state.options?.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </>
                    ) : addressFormat.county ? (
                      <>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            {addressFormat.city.label} {addressFormat.city.required && '*'}
                          </label>
                          <input
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder={addressFormat.city.placeholder}
                            className="w-full h-12 px-4 rounded-lg text-base bg-background border border-border outline-none focus:border-primary"
                            required={addressFormat.city.required}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">{addressFormat.county.label}</label>
                          <input
                            type="text"
                            value={county}
                            onChange={(e) => setCounty(e.target.value)}
                            placeholder={addressFormat.county.placeholder}
                            className="w-full h-12 px-4 rounded-lg text-base bg-background border border-border outline-none focus:border-primary"
                            required={addressFormat.county.required}
                          />
                        </div>
                      </>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {addressFormat.city.label} {addressFormat.city.required && '*'}
                        </label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder={addressFormat.city.placeholder}
                          className="w-full h-12 px-4 rounded-lg text-base bg-background border border-border outline-none focus:border-primary"
                          required={addressFormat.city.required}
                        />
                      </div>
                    )}
                  </div>

                  {/* Postal Code */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {addressFormat.postalCode.label} {addressFormat.postalCode.required && '*'}
                    </label>
                    <input
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
                      className="w-full h-12 px-4 rounded-lg text-base bg-background border border-border outline-none focus:border-primary"
                      required={addressFormat.postalCode.required}
                      maxLength={addressFormat.postalCode.maxLength}
                    />
                    {addressFormat.postalCode.validation && postalCode && !addressFormat.postalCode.validation(postalCode) && (
                      <p className="text-xs text-destructive mt-1">{t('onboarding.validation.postalCodeInvalid', { label: addressFormat.postalCode.label })}</p>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Step 2: Tax Information */}
        {currentStep === 2 && (
          <div className="flex-1 space-y-4">
            {country && (() => {
              const selectedCountry = countries.find(c => c.code === country);
              if (!selectedCountry || !selectedCountry.regions || selectedCountry.regions.length === 0) {
                return (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t('onboarding.noRegions', { country: selectedCountry?.name || t('onboarding.fields.country') })}
                    </p>
                  </div>
                );
              }
              const taxConfig = getTaxConfig(country);
              return (
                <div>
                  <label className="block text-sm font-medium mb-2">{taxConfig.regionLabel} (optional)</label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full h-12 px-4 rounded-lg text-base bg-background border border-border outline-none focus:border-primary"
                  >
                    <option value="">{t('onboarding.fields.selectRegion', '{{regionLabel}} wählen', { regionLabel: taxConfig.regionLabel })}</option>
                    {selectedCountry.regions.map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">{t('onboarding.fields.regionHint')}</p>
                </div>
              );
            })()}

            {(() => {
              const taxConfig = getTaxConfig(country);
              return (
                <div>
                  <label className="block text-sm font-medium mb-2">{t('onboarding.fields.taxClass')} (optional)</label>
                  <select
                    value={taxClass}
                    onChange={(e) => setTaxClass(e.target.value)}
                    className="w-full h-12 px-4 rounded-lg text-base bg-background border border-border outline-none focus:border-primary"
                  >
                    <option value="">{t('onboarding.fields.taxClassPlaceholder')}</option>
                    {taxConfig.taxClasses.map((taxClassOption) => (
                      <option key={taxClassOption.value} value={taxClassOption.value}>
                        {taxClassOption.label}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })()}

            <div>
              <label className="block text-sm font-medium mb-2">{t('onboarding.fields.numberOfTaxpayers')}</label>
              <select
                value={numberOfTaxpayers.toString()}
                onChange={(e) => setNumberOfTaxpayers(parseInt(e.target.value, 10))}
                className="w-full h-12 px-4 rounded-lg text-base bg-background border border-border outline-none focus:border-primary"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <option key={num} value={num.toString()}>
                    {num}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('onboarding.fields.taxYear')}</label>
              <select
                value={taxYear}
                onChange={(e) => setTaxYear(e.target.value)}
                className="w-full h-12 px-4 rounded-lg text-base bg-background border border-border outline-none focus:border-primary"
              >
                {years.map((year) => (
                  <option key={year} value={year.toString()}>
                    {year}
                  </option>
                ))}
              </select>
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
                    <div key={field.key}>
                      <label className="block text-sm font-medium mb-2">{field.label} {field.required ? '*' : '(optional)'}</label>
                      {field.type === 'select' ? (
                        <select
                          value={taxAdditionalFields[field.key] || ''}
                          onChange={(e) => {
                            setTaxAdditionalFields(prev => ({ ...prev, [field.key]: e.target.value }));
                          }}
                          className="w-full h-12 px-4 rounded-lg text-base bg-background border border-border outline-none focus:border-primary"
                        >
                          <option value="">{field.placeholder || `Select ${field.label}`}</option>
                          {field.options?.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={taxAdditionalFields[field.key] || ''}
                          onChange={(e) => {
                            setTaxAdditionalFields(prev => ({ ...prev, [field.key]: e.target.value }));
                          }}
                          placeholder={field.placeholder || field.label}
                          required={field.required}
                          className="w-full h-12 px-4 rounded-lg text-base bg-background border border-border outline-none focus:border-primary"
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
        <div className="flex-1 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">{t('onboarding.fields.numberOfChildren')}</label>
            <select
              value={numberOfChildren.toString()}
              onChange={(e) => setNumberOfChildren(parseInt(e.target.value, 10))}
              className="w-full h-12 px-4 rounded-lg text-base bg-background border border-border outline-none focus:border-primary"
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <option key={num} value={num.toString()}>
                  {num}
                </option>
              ))}
            </select>
          </div>

          {numberOfChildren > 0 && (
            <div className="space-y-4">
              {children.map((child, index) => (
                <div key={index} className="space-y-4 p-4 border rounded-lg">
                  <label className="block text-lg font-semibold">{t('onboarding.fields.numberOfChildren')} {index + 1}</label>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">{t('onboarding.fields.childFirstName')} *</label>
                      <input
                        type="text"
                        value={child.firstName}
                        onChange={(e) => {
                          const newChildren = [...children];
                          newChildren[index].firstName = e.target.value;
                          setChildren(newChildren);
                        }}
                        placeholder={t('onboarding.fields.childFirstName')}
                        className="w-full h-12 px-4 rounded-lg text-base bg-background border border-border outline-none focus:border-primary"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">{t('onboarding.fields.childLastName')} *</label>
                      <input
                        type="text"
                        value={child.lastName}
                        onChange={(e) => {
                          const newChildren = [...children];
                          newChildren[index].lastName = e.target.value;
                          setChildren(newChildren);
                        }}
                        placeholder={t('onboarding.fields.childLastName')}
                        className="w-full h-12 px-4 rounded-lg text-base bg-background border border-border outline-none focus:border-primary"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">{t('onboarding.fields.childBirthDate')} (optional)</label>
                    <input
                      type="date"
                      value={child.birthDate || ''}
                      onChange={(e) => {
                        const newChildren = [...children];
                        newChildren[index].birthDate = e.target.value;
                        setChildren(newChildren);
                      }}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full h-12 px-4 rounded-lg text-base bg-background border border-border outline-none focus:border-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">{t('onboarding.fields.childSchool')} (optional)</label>
                      <input
                        type="text"
                        value={child.school || ''}
                        onChange={(e) => {
                          const newChildren = [...children];
                          newChildren[index].school = e.target.value;
                          setChildren(newChildren);
                        }}
                        placeholder={t('onboarding.fields.schoolNamePlaceholder')}
                        className="w-full h-12 px-4 rounded-lg text-base bg-background border border-border outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">{t('onboarding.fields.childSchoolGrade')} (optional)</label>
                      <select
                        value={child.schoolGrade || ''}
                        onChange={(e) => {
                          const newChildren = [...children];
                          newChildren[index].schoolGrade = e.target.value;
                          setChildren(newChildren);
                        }}
                        className="w-full h-12 px-4 rounded-lg text-base bg-background border border-border outline-none focus:border-primary"
                      >
                        <option value="">{t('onboarding.fields.schoolGradePlaceholder', 'Schulstufe wählen')}</option>
                        {getSchoolGrades(country).map((grade) => (
                          <option key={grade.value} value={grade.value}>
                            {grade.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">{t('onboarding.fields.childGender')} (optional)</label>
                    <select
                      value={child.gender || ''}
                      onChange={(e) => {
                        const newChildren = [...children];
                        newChildren[index].gender = e.target.value;
                        setChildren(newChildren);
                      }}
                      className="w-full h-12 px-4 rounded-lg text-base bg-background border border-border outline-none focus:border-primary"
                    >
                      <option value="">{t('onboarding.fields.childGender')}</option>
                      <option value="male">{t('onboarding.fields.genderMale')}</option>
                      <option value="female">{t('onboarding.fields.genderFemale')}</option>
                      <option value="diverse">{t('onboarding.fields.genderDiverse')}</option>
                      <option value="none">{t('onboarding.fields.genderOther')}</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 4: Household Members */}
      {currentStep === 4 && (
        <div className="flex-1 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">{t('onboarding.fields.numberOfHouseholdMembers')}</label>
            <select
              value={numberOfHouseholdMembers.toString()}
              onChange={(e) => setNumberOfHouseholdMembers(parseInt(e.target.value, 10))}
              className="w-full h-12 px-4 rounded-lg text-base bg-background border border-border outline-none focus:border-primary"
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <option key={num} value={num.toString()}>
                  {num}
                </option>
              ))}
            </select>
          </div>

          {numberOfHouseholdMembers > 0 && (
            <div className="space-y-4">
              {householdMembers.map((member, index) => (
                <div key={index} className="space-y-3 p-4 border rounded-lg">
                  <label className="block text-base font-semibold">{t('onboarding.fields.householdMemberName')} {index + 1}</label>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">{t('onboarding.fields.householdMemberFirstName')}</label>
                      <input
                        type="text"
                        value={member.firstName}
                        onChange={(e) => {
                          const newMembers = [...householdMembers];
                          newMembers[index].firstName = e.target.value;
                          setHouseholdMembers(newMembers);
                        }}
                        placeholder={t('onboarding.fields.householdMemberFirstName')}
                        className="w-full h-12 px-4 rounded-lg text-base bg-background border border-border outline-none focus:border-primary"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">{t('onboarding.fields.householdMemberLastName')}</label>
                      <input
                        type="text"
                        value={member.lastName}
                        onChange={(e) => {
                          const newMembers = [...householdMembers];
                          newMembers[index].lastName = e.target.value;
                          setHouseholdMembers(newMembers);
                        }}
                        placeholder={t('onboarding.fields.householdMemberLastName')}
                        className="w-full h-12 px-4 rounded-lg text-base bg-background border border-border outline-none focus:border-primary"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">{t('onboarding.fields.householdMemberBirthDate')} (optional)</label>
                      <input
                        type="date"
                        value={member.birthDate || ''}
                        onChange={(e) => {
                          const newMembers = [...householdMembers];
                          newMembers[index].birthDate = e.target.value;
                          setHouseholdMembers(newMembers);
                        }}
                        className="w-full h-12 px-4 rounded-lg text-base bg-background border border-border outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">{t('onboarding.fields.householdMemberRelationship')} (optional)</label>
                      <select
                        value={member.relationship || ''}
                        onChange={(e) => {
                          const newMembers = [...householdMembers];
                          newMembers[index].relationship = e.target.value;
                          setHouseholdMembers(newMembers);
                        }}
                        className="w-full h-12 px-4 rounded-lg text-base bg-background border border-border outline-none focus:border-primary"
                      >
                        <option value="">{t('onboarding.fields.householdMemberRelationshipPlaceholder')}</option>
                        <option value="partner">{t('onboarding.fields.relationshipPartner')}</option>
                        <option value="spouse">{t('onboarding.fields.relationshipSpouse')}</option>
                        <option value="parent">{t('onboarding.fields.relationshipParent')}</option>
                        <option value="sibling">{t('onboarding.fields.relationshipSibling')}</option>
                        <option value="roommate">{t('onboarding.fields.relationshipRoommate')}</option>
                        <option value="other">{t('onboarding.fields.relationshipOther')}</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">{t('onboarding.fields.householdMemberEmail')}</label>
                      <input
                        type="email"
                        value={member.email || ''}
                        onChange={(e) => {
                          const newMembers = [...householdMembers];
                          newMembers[index].email = e.target.value;
                          setHouseholdMembers(newMembers);
                        }}
                        placeholder={t('onboarding.fields.householdMemberEmail')}
                        className="w-full h-12 px-4 rounded-lg text-base bg-background border border-border outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">{t('onboarding.fields.householdMemberPhone')}</label>
                      <input
                        type="tel"
                        value={member.phone || ''}
                        onChange={(e) => {
                          const newMembers = [...householdMembers];
                          const formatted = formatPhoneNumber(e.target.value);
                          newMembers[index].phone = formatted;
                          setHouseholdMembers(newMembers);
                        }}
                        placeholder={t('onboarding.fields.householdMemberPhone')}
                        className="w-full h-12 px-4 rounded-lg text-base bg-background border border-border outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">{t('onboarding.fields.householdMemberNotes')} (optional)</label>
                    <input
                      type="text"
                      value={member.notes || ''}
                      onChange={(e) => {
                        const newMembers = [...householdMembers];
                        newMembers[index].notes = e.target.value;
                        setHouseholdMembers(newMembers);
                      }}
                      placeholder={t('onboarding.fields.householdMemberNotes')}
                      className="w-full h-12 px-4 rounded-lg text-base bg-background border border-border outline-none focus:border-primary"
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
        <div className="flex-1 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">{t('onboarding.fields.language')}</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'de' | 'en')}
              className="w-full h-12 px-4 rounded-lg text-base bg-background border border-border outline-none focus:border-primary"
            >
              <option value="de">Deutsch</option>
              <option value="en">English</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('onboarding.fields.theme')}</label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
              className="w-full h-12 px-4 rounded-lg text-base bg-background border border-border outline-none focus:border-primary"
            >
              <option value="light">{t('onboarding.fields.themeLight')}</option>
              <option value="dark">{t('onboarding.fields.themeDark')}</option>
              <option value="system">{t('onboarding.fields.themeSystem')}</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <label className="block text-sm font-medium">{t('onboarding.fields.notifications')}</label>
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={(e) => setNotificationsEnabled(e.target.checked)}
              className="w-5 h-5"
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <label className="block text-sm font-medium">{t('onboarding.fields.tutorial')}</label>
            <input
              type="checkbox"
              checked={tutorialEnabled}
              onChange={(e) => setTutorialEnabled(e.target.checked)}
              className="w-5 h-5"
            />
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between gap-3 mt-6 pt-6 border-t">
        <div>
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handleBack}
              disabled={isLoading}
              className="h-12 px-6 rounded-lg font-medium text-base border border-border bg-background active:bg-muted disabled:opacity-50"
            >
              {t('onboarding.buttons.back')}
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {currentStep < 5 && (
            <>
              <button
                type="button"
                onClick={handleSkip}
                disabled={isLoading}
                className="h-12 px-6 rounded-lg font-medium text-base text-muted-foreground active:opacity-80 disabled:opacity-50"
              >
                {t('onboarding.buttons.skip')}
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={isLoading}
                className="h-12 px-6 rounded-lg font-medium text-base bg-primary text-primary-foreground active:opacity-80 disabled:opacity-50"
              >
                {t('onboarding.buttons.next')}
              </button>
            </>
          )}
          {currentStep === 5 && (
            <button
              type="button"
              onClick={handleComplete}
              disabled={isLoading}
              className="h-12 px-6 rounded-lg font-medium text-base bg-primary text-primary-foreground active:opacity-80 disabled:opacity-50"
            >
              {isLoading ? t('common.loading') : t('onboarding.buttons.complete')}
            </button>
          )}
        </div>
      </div>
      </div>
    </OnboardingTheme>
  );
}

