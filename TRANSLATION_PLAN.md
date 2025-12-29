# Übersetzungsplan für Nexo - Vollständige Internationalisierung

## Ziel

Alle Texte der Anwendung sollen in Deutsch (de) und Englisch (en) verfügbar sein. Zukünftige Elemente und Seiten müssen direkt in allen verfügbaren Sprachen übersetzt werden, um Konsistenz zu gewährleisten.

## Aktueller Status

- ✅ i18n-System ist bereits implementiert (react-i18next)
- ✅ Viele Übersetzungen existieren bereits, aber unvollständig
- ❌ Onboarding-Seite hat noch viel hardcoded deutschen Text
- ❌ Login/Register-Seiten haben hardcoded Text
- ❌ Viele Komponenten haben noch hardcoded Text
- ❌ Fehlermeldungen und Toasts sind teilweise hardcoded

## Phasen-Plan

### Phase 1: Onboarding-Seite (HÖCHSTE PRIORITÄT)

**Grund:** Wird direkt nach der Registrierung verwendet, erste Interaktion mit der App

**Zu übersetzende Elemente:**

- [ ] Titel: "Willkommen bei Nexo"
- [ ] Schritt-Indikator: "Schritt X von 5: Richten Sie Ihr Konto ein"
- [ ] Alle Formularfelder:
  - [ ] "Ihr Name"
  - [ ] "Währung"
  - [ ] "Telefonnummer (optional)"
  - [ ] "Geburtsdatum (optional)"
  - [ ] "Land"
  - [ ] Adressfelder (dynamisch je nach Land)
  - [ ] "Kanton/Bundesland/Region" (Schritt 2)
  - [ ] Steuerinformationen (Schritt 2)
  - [ ] Kinder-Felder (Schritt 3)
  - [ ] Haushaltsmitglieder (Schritt 4)
  - [ ] Einstellungen (Schritt 5)
- [ ] Buttons: "Überspringen", "Weiter", "Zurück"
- [ ] Validierungsmeldungen
- [ ] Erfolgsmeldungen

**Dateien:**

- `client/src/pages/Onboarding.tsx`
- `client-mobile/src/pages/Onboarding.tsx`
- `client/src/lib/i18n.ts` (neue Keys hinzufügen)
- `client-mobile/src/lib/i18n.ts` (neue Keys hinzufügen)

---

### Phase 2: Authentifizierung (Login/Register)

**Grund:** Erste Seiten, die Benutzer sehen

**Zu übersetzende Elemente:**

- [ ] Login-Seite:
  - [ ] Titel, Beschreibung
  - [ ] Formularfelder (Email, Passwort)
  - [ ] Buttons ("Anmelden", "Registrieren")
  - [ ] Fehlermeldungen
- [ ] Register-Seite:
  - [ ] Titel, Beschreibung
  - [ ] Formularfelder (Name, Email, Passwort, Passwort bestätigen)
  - [ ] Buttons
  - [ ] Validierungsmeldungen

**Dateien:**

- `client/src/pages/Login.tsx`
- `client/src/pages/Register.tsx`
- `client-mobile/src/pages/Login.tsx`
- `client-mobile/src/pages/Register.tsx`
- `client/src/lib/i18n.ts`
- `client-mobile/src/lib/i18n.ts`

---

### Phase 3: Hauptseiten (Dashboard, Finance, Bills, etc.)

**Grund:** Kernfunktionalität der App

**Zu übersetzende Seiten:**

- [ ] Dashboard (`Dashboard.tsx`)
- [ ] Finance (`Finance.tsx`)
- [ ] Bills (`Bills.tsx`)
- [ ] Shopping (`Shopping.tsx`)
- [ ] Reminders (`Reminders.tsx`)
- [ ] Calendar (`Calendar.tsx`)
- [ ] Taxes (`Taxes.tsx`)
- [ ] People (`People.tsx`)
- [ ] Documents (`Documents.tsx`)
- [ ] Settings (`Settings.tsx`)
- [ ] AIChat (`AIChat.tsx`)

**Für jede Seite:**

- [ ] Titel und Beschreibung
- [ ] Alle Buttons und Aktionen
- [ ] Tabellen-Header
- [ ] Filter und Sortieroptionen
- [ ] Leere Zustände
- [ ] Fehlermeldungen
- [ ] Erfolgsmeldungen

**Dateien:**

- Alle Dateien in `client/src/pages/`
- Alle Dateien in `client-mobile/src/pages/`
- `client/src/lib/i18n.ts`
- `client-mobile/src/lib/i18n.ts`

---

### Phase 4: Komponenten

**Grund:** Wiederverwendbare UI-Elemente

**Zu übersetzende Komponenten:**

- [ ] `AddReminderDialog.tsx`
- [ ] `AddFinanceEntryDialog.tsx`
- [ ] `AddTaxProfileDialog.tsx`
- [ ] `ShoppingListModal.tsx`
- [ ] `PersonInvoicesDialog.tsx`
- [ ] `DocumentUploader.tsx`
- [ ] `InvoiceScanner.tsx`
- [ ] `AIChatBox.tsx`
- [ ] `AIChatDialog.tsx`
- [ ] `Topbar.tsx`
- [ ] `Sidebar.tsx`
- [ ] `LanguageSwitcher.tsx`
- [ ] Alle anderen Dialoge und Modals

**Dateien:**

- Alle Dateien in `client/src/components/`
- Alle Dateien in `client-mobile/src/components/`
- `client/src/lib/i18n.ts`
- `client-mobile/src/lib/i18n.ts`

---

### Phase 5: Fehlermeldungen, Toasts und Validierungen

**Grund:** Konsistente Benutzer-Feedback

**Zu übersetzende Elemente:**

- [ ] Alle `toast.error()`, `toast.success()`, `toast.info()` Aufrufe
- [ ] Validierungsmeldungen in Formularen
- [ ] Fehlermeldungen aus Firebase Functions
- [ ] Systemmeldungen
- [ ] Bestätigungsdialoge

**Dateien:**

- Alle Dateien mit `toast.` Aufrufen
- `client/src/lib/validation.ts`
- `client-mobile/src/lib/validation.ts`
- `client/src/lib/errorHandler.ts`
- `client-mobile/src/lib/errorHandler.ts`
- `client/src/lib/i18n.ts`
- `client-mobile/src/lib/i18n.ts`

---

### Phase 6: Dokumentation und Entwickler-Richtlinien

**Grund:** Sicherstellen, dass zukünftige Entwicklung automatisch übersetzt wird

**Zu erstellende Dokumentation:**

- [ ] Entwickler-Richtlinien für neue Features
- [ ] Checkliste für neue Seiten/Komponenten
- [ ] Template für neue i18n-Keys
- [ ] Best Practices für Übersetzungen
- [ ] Update der `.cursorrules` mit Übersetzungsregeln

**Dateien:**

- `nexo-export/TRANSLATION_GUIDELINES.md` (neu)
- `nexo-export/.cursorrules` (update)

---

## i18n-Struktur

### Empfohlene Struktur für neue Keys

```typescript
{
  de: {
    translation: {
      // Onboarding
      onboarding: {
        title: "Willkommen bei Nexo",
        stepIndicator: "Schritt {{step}} von {{total}}: {{description}}",
        steps: {
          personalData: "Richten Sie Ihr Konto ein",
          taxInfo: "Steuerinformationen",
          children: "Kinder",
          household: "Haushaltsmitglieder",
          preferences: "Einstellungen"
        },
        fields: {
          name: "Ihr Name",
          currency: "Währung",
          phone: "Telefonnummer (optional)",
          birthDate: "Geburtsdatum (optional)",
          country: "Land",
          address: "Adresse",
          // ... weitere Felder
        },
        buttons: {
          skip: "Überspringen",
          next: "Weiter",
          back: "Zurück",
          complete: "Abschliessen"
        },
        validation: {
          nameRequired: "Bitte geben Sie Ihren Namen ein",
          addressRequired: "Bitte geben Sie Ihre vollständige Adresse ein",
          // ... weitere Validierungen
        }
      },
      // Auth
      auth: {
        login: {
          title: "Anmelden",
          description: "Melden Sie sich bei Ihrem Konto an",
          email: "E-Mail",
          password: "Passwort",
          submit: "Anmelden",
          register: "Jetzt registrieren",
          // ...
        },
        register: {
          // ...
        }
      },
      // ... weitere Bereiche
    }
  },
  en: {
    translation: {
      // Gleiche Struktur auf Englisch
    }
  }
}
```

---

## Implementierungsrichtlinien

### 1. Verwendung von `useTranslation` Hook

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('onboarding.title')}</h1>
      <p>{t('onboarding.stepIndicator', { step: 1, total: 5, description: t('onboarding.steps.personalData') })}</p>
    </div>
  );
}
```

### 2. Interpolation für dynamische Werte

```typescript
// ✅ RICHTIG
t('onboarding.stepIndicator', { step: currentStep, total: 5 })

// ❌ FALSCH
`Schritt ${currentStep} von 5`
```

### 3. Pluralisierung (falls benötigt)

```typescript
t('items.count', { count: items.length })
// Automatisch: "1 item" vs "2 items"
```

### 4. Konsistente Key-Namen

```typescript
// ✅ RICHTIG: Hierarchisch und beschreibend
'onboarding.fields.name'
'onboarding.buttons.next'
'onboarding.validation.nameRequired'

// ❌ FALSCH: Zu generisch
'name'
'button'
'error'
```

---

## Checkliste für neue Features

Wenn du eine neue Seite oder Komponente erstellst:

- [ ] Alle Texte verwenden `t('key')` statt hardcoded Strings
- [ ] Neue Keys werden zu `i18n.ts` hinzugefügt (DE + EN)
- [ ] Keys folgen der hierarchischen Struktur
- [ ] Dynamische Werte verwenden Interpolation
- [ ] Fehlermeldungen sind übersetzt
- [ ] Toasts sind übersetzt
- [ ] Validierungsmeldungen sind übersetzt
- [ ] Tooltips und Placeholder sind übersetzt
- [ ] Getestet in beiden Sprachen

---

## Nächste Schritte

1. **Phase 1 starten:** Onboarding-Seite vollständig übersetzen
2. **Nach jeder Phase testen:** Beide Sprachen prüfen
3. **Konsistenz prüfen:** Alle ähnlichen Texte verwenden die gleichen Keys
4. **Dokumentation aktualisieren:** Neue Keys dokumentieren

---

## Zeitplan (geschätzt)

- **Phase 1:** 2-3 Stunden
- **Phase 2:** 1-2 Stunden
- **Phase 3:** 4-6 Stunden
- **Phase 4:** 3-4 Stunden
- **Phase 5:** 2-3 Stunden
- **Phase 6:** 1 Stunde

**Gesamt:** ~13-19 Stunden

---

## Wichtige Hinweise

1. **Schweizer Grammatik:** Immer "ss" statt "ß" verwenden
2. **Formelles "Sie":** In deutschen Texten immer "Sie" verwenden (nicht "du")
3. **Konsistenz:** Ähnliche Texte sollten die gleichen Keys verwenden
4. **Fallback:** Wenn eine Übersetzung fehlt, wird Deutsch als Fallback verwendet
5. **Testen:** Nach jeder Phase in beiden Sprachen testen
