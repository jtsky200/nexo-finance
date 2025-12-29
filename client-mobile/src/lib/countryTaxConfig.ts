export interface TaxClass {
  value: string;
  label: string;
}

export interface TaxAdditionalField {
  key: string;
  label: string;
  type: 'text' | 'select';
  options?: Array<{ value: string; label: string }>;
  required: boolean;
  placeholder?: string;
}

export interface TaxConfig {
  regionLabel: string;
  taxClasses: TaxClass[];
  additionalFields?: TaxAdditionalField[];
}

export const countryTaxConfig: Record<string, TaxConfig> = {
  CH: {
    regionLabel: 'Kanton',
    taxClasses: [
      { value: 'single', label: 'Ledig' },
      { value: 'married', label: 'Verheiratet' },
      { value: 'married_separated', label: 'Verheiratet getrennt' },
      { value: 'widowed', label: 'Verwitwet' },
    ],
    additionalFields: [
      {
        key: 'municipality',
        label: 'Gemeinde',
        type: 'text',
        required: false,
        placeholder: 'Gemeinde (optional)',
      },
    ],
  },
  DE: {
    regionLabel: 'Bundesland',
    taxClasses: [
      { value: 'class1', label: 'Steuerklasse I (Ledig)' },
      { value: 'class2', label: 'Steuerklasse II (Alleinerziehend)' },
      { value: 'class3', label: 'Steuerklasse III (Verheiratet, höheres Einkommen)' },
      { value: 'class4', label: 'Steuerklasse IV (Verheiratet, gleiches Einkommen)' },
      { value: 'class5', label: 'Steuerklasse V (Verheiratet, niedrigeres Einkommen)' },
      { value: 'class6', label: 'Steuerklasse VI (Nebentätigkeit)' },
    ],
    additionalFields: [
      {
        key: 'religion',
        label: 'Konfession (für Kirchensteuer)',
        type: 'select',
        required: false,
        options: [
          { value: 'none', label: 'Keine' },
          { value: 'catholic', label: 'Katholisch' },
          { value: 'protestant', label: 'Evangelisch' },
          { value: 'other', label: 'Andere' },
        ],
      },
    ],
  },
  AT: {
    regionLabel: 'Bundesland',
    taxClasses: [
      { value: 'single', label: 'Ledig' },
      { value: 'married', label: 'Verheiratet' },
      { value: 'married_separated', label: 'Verheiratet getrennt' },
      { value: 'widowed', label: 'Verwitwet' },
    ],
    additionalFields: [
      {
        key: 'religion',
        label: 'Konfession (für Kirchensteuer)',
        type: 'select',
        required: false,
        options: [
          { value: 'none', label: 'Keine' },
          { value: 'catholic', label: 'Katholisch' },
          { value: 'protestant', label: 'Evangelisch' },
          { value: 'other', label: 'Andere' },
        ],
      },
    ],
  },
  GB: {
    regionLabel: 'Region',
    taxClasses: [
      { value: 'single', label: 'Single' },
      { value: 'married_joint', label: 'Married (Joint)' },
      { value: 'married_separate', label: 'Married (Separate)' },
      { value: 'widowed', label: 'Widowed' },
    ],
    additionalFields: [
      {
        key: 'postcode',
        label: 'Postcode',
        type: 'text',
        required: false,
        placeholder: 'Postcode (für lokale Steuern)',
      },
      {
        key: 'councilTaxBand',
        label: 'Council Tax Band',
        type: 'select',
        required: false,
        options: [
          { value: 'A', label: 'Band A' },
          { value: 'B', label: 'Band B' },
          { value: 'C', label: 'Band C' },
          { value: 'D', label: 'Band D' },
          { value: 'E', label: 'Band E' },
          { value: 'F', label: 'Band F' },
          { value: 'G', label: 'Band G' },
          { value: 'H', label: 'Band H' },
        ],
      },
    ],
  },
  NL: {
    regionLabel: 'Provincie',
    taxClasses: [
      { value: 'single', label: 'Alleenstaand' },
      { value: 'married', label: 'Gehuwd' },
      { value: 'partner', label: 'Partnerschap' },
    ],
    additionalFields: [
      {
        key: 'gemeente',
        label: 'Gemeente',
        type: 'text',
        required: false,
        placeholder: 'Gemeente (optional)',
      },
    ],
  },
  FR: {
    regionLabel: 'Region',
    taxClasses: [
      { value: 'single', label: 'Célibataire' },
      { value: 'married', label: 'Marié(e)' },
      { value: 'divorced', label: 'Divorcé(e)' },
      { value: 'widowed', label: 'Veuf(ve)' },
    ],
  },
  US: {
    regionLabel: 'State',
    taxClasses: [
      { value: 'single', label: 'Single' },
      { value: 'married_joint', label: 'Married Filing Jointly' },
      { value: 'married_separate', label: 'Married Filing Separately' },
      { value: 'head_of_household', label: 'Head of Household' },
      { value: 'qualifying_widow', label: 'Qualifying Widow(er)' },
    ],
    additionalFields: [
      {
        key: 'county',
        label: 'County',
        type: 'text',
        required: false,
        placeholder: 'County (optional)',
      },
    ],
  },
  IT: {
    regionLabel: 'Regione',
    taxClasses: [
      { value: 'single', label: 'Celibe/Nubile' },
      { value: 'married', label: 'Coniugato/a' },
      { value: 'divorced', label: 'Divorziato/a' },
      { value: 'widowed', label: 'Vedovo/a' },
    ],
    additionalFields: [
      {
        key: 'comune',
        label: 'Comune',
        type: 'text',
        required: false,
        placeholder: 'Comune (optional)',
      },
    ],
  },
  ES: {
    regionLabel: 'Comunidad Autónoma',
    taxClasses: [
      { value: 'single', label: 'Soltero/a' },
      { value: 'married', label: 'Casado/a' },
      { value: 'divorced', label: 'Divorciado/a' },
      { value: 'widowed', label: 'Viudo/a' },
    ],
    additionalFields: [
      {
        key: 'provincia',
        label: 'Provincia',
        type: 'text',
        required: false,
        placeholder: 'Provincia (optional)',
      },
    ],
  },
  BE: {
    regionLabel: 'Regio',
    taxClasses: [
      { value: 'single', label: 'Alleenstaand' },
      { value: 'married', label: 'Gehuwd' },
      { value: 'divorced', label: 'Gescheiden' },
      { value: 'widowed', label: 'Weduwe/Weduwnaar' },
    ],
    additionalFields: [
      {
        key: 'gemeente',
        label: 'Gemeente',
        type: 'text',
        required: false,
        placeholder: 'Gemeente (optional)',
      },
    ],
  },
};

export function getTaxConfig(countryCode: string): TaxConfig {
  return countryTaxConfig[countryCode] || countryTaxConfig['CH']; // Fallback zu CH
}

