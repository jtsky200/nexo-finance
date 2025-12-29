# NEXO Brand Assets

Dieser Ordner enthält alle Brand-Assets (Logo, Mascot, etc.) für die NEXO-Anwendung.

## Dateien

### Logo

#### `logo-icon.svg`

- **Beschreibung:** Süßer kleiner Ninja Icon im minimalistischen, modernen Stil
- **ViewBox:** `0 0 100 100`
- **Farbe:** Verwendet `currentColor` für Dark/Light Mode Anpassung
- **Größen:**
  - Small (sm): 24x24px (w-6 h-6)
  - Medium (md): 32x32px (w-8 h-8) - Standard
  - Large (lg): 48x48px (w-12 h-12)
- **Verwendung:** Sidebar, Navigation, Favicon
- **Features:**
  - Professionelles, organisches Design mit geschwungenen Linien
  - Organische Kopf-Form mit Bezier-Kurven (nicht einfache geometrische Formen)
  - Große, freundliche Augen sichtbar durch Ninja-Maske
  - Ninja-Maske/Turban mit organischer Form, um den Kopf gewickelt
  - Masken-Öffnung zeigt Gesicht (organische Form)
  - Süßes Lächeln sichtbar durch Maske
  - Freundliche Wangenröte (organische Ellipsen)
  - Masken-Band am Hinterkopf (organische Form)

### Mascot

#### `mascot.svg`

- **Beschreibung:** Süßer kleiner Ninja Mascot für Hintergrund-Dekoration
- **ViewBox:** `0 0 200 200`
- **Farbe:** Verwendet `currentColor` für Dark/Light Mode Anpassung
- **Standard-Größen:**
  - Small: 150px
  - Medium: 200px (Standard)
  - Large: 250px
  - Extra Large: 300px
- **Standard-Opazität:**
  - Background: 0.05-0.08 (5-8%)
  - Foreground: 0.1-0.15 (10-15%)
- **Verwendung:** Onboarding-Hintergrund, dekorative Elemente
- **Features:**
  - Professionelles, organisches Design mit geschwungenen Linien
  - Organische Kopf-Form mit Bezier-Kurven (nicht einfache geometrische Formen)
  - Große, freundliche Augen sichtbar durch Ninja-Maske
  - Ninja-Maske/Turban mit organischer Form, um den Kopf gewickelt
  - Masken-Öffnung zeigt Gesicht (organische Form)
  - Süßes Lächeln sichtbar durch Maske
  - Freundliche Wangenröte (organische Ellipsen)
  - Masken-Band am Hinterkopf (organische Form)
  - Subtiler Körper-Hinweis und Arme (Ninja-Outfit, organische Formen)

## Text Logo

- **Text:** "NEXO" (immer in Großbuchstaben)
- **Schriftart:** System Font (Bold)
- **Größen:**
  - Small (sm): text-base (16px)
  - Medium (md): text-xl (20px) - Standard
  - Large (lg): text-2xl (24px)

## Farben

- **Light Mode:**
  - Primary: Schwarz (#000000)
  - Secondary: Weiß (#ffffff)
  
- **Dark Mode:**
  - Primary: Weiß (#ffffff)
  - Secondary: Schwarz (#000000)

## Verwendung

### Logo-Varianten

1. **Full Logo** (Icon + Text): `variant="full"`
   - Verwendung: Sidebar, Header

2. **Icon Only**: `variant="icon"`
   - Verwendung: Favicon, kleine Bereiche

3. **Text Only**: `variant="text"`
   - Verwendung: Text-basierte Bereiche

### Mascot-Varianten

- **Background Decoration**: Niedrige Opazität (0.05-0.08)
- **Foreground Element**: Höhere Opazität (0.1-0.15)

## Neue Assets hinzufügen

Wenn Sie neue Logo- oder Mascot-Dateien hinzufügen möchten:

1. **SVG-Datei hier speichern** mit beschreibendem Namen
2. **Diese README.md aktualisieren** mit:
   - Dateiname
   - Beschreibung
   - ViewBox/Größen
   - Verwendungszweck
   - Farbinformationen
3. **Die React-Komponenten aktualisieren** (`NexoLogo.tsx`, `NexoMascot.tsx`) um die neuen Assets zu verwenden

## Technische Details

- **Format:** SVG (skalierbar, vektorbasiert)
- **Farben:** `currentColor` für Theme-Anpassung
- **Responsive:** Automatisch skalierbar
- **Performance:** Optimiert für Web (keine unnötigen Elemente)

## Design-Prinzipien

- **Minimalistisch:** Klare, einfache Formen
- **Modern:** Zeitgemäßes Design
- **Freundlich:** Einladend und zugänglich
- **Professionell:** Seriös und vertrauenswürdig
- **Schwarz/Weiß:** Klassisches, zeitloses Farbschema