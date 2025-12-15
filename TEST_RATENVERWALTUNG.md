# Test-Anleitung: Ratenverwaltung

## Test-Szenario: Frau Müller - Rechnung mit Ratenplan

### Voraussetzungen:
1. Anwendung ist unter https://nexo-jtsky100.web.app erreichbar
2. Benutzer ist angemeldet
3. Person "Frau Müller" existiert
4. Rechnung "Reinigungsarbeiten" mit Ratenplan (4 Raten à CHF 50.00) existiert

### Test-Schritte:

#### 1. Rechnung öffnen
- Navigiere zu Personen
- Öffne "Frau Müller"
- Öffne die Rechnung "Reinigungsarbeiten"

#### 2. Prüfe Initial-Zustand
**Erwartetes Ergebnis:**
- Gesamtbetrag: CHF 200.00
- Offen: CHF 200.00
- Bezahlt: CHF 0.00
- Ratenvereinbarung: 0/4 bezahlt
- Progress-Balken: 0%
- "Bezahlt: CHF 0.00" wird angezeigt

#### 3. Erste Rate bezahlen
- Klicke auf "Ratenverwaltung öffnen"
- Wähle die erste Rate aus
- Gib den Betrag ein (z.B. CHF 50.00)
- Klicke auf "Zahlung erfassen"

#### 4. Prüfe nach Zahlung
**Erwartetes Ergebnis:**
- Ratenvereinbarung: 1/4 bezahlt
- Progress-Balken: 25% (CHF 50.00 von CHF 200.00)
- "Bezahlt: CHF 50.00" wird angezeigt
- "Noch offen: CHF 150.00" wird angezeigt
- Die bezahlte Rate zeigt Status "Bezahlt"

#### 5. Zweite Rate bezahlen
- Wähle die zweite Rate aus
- Gib den Betrag ein (z.B. CHF 50.00)
- Klicke auf "Zahlung erfassen"

#### 6. Prüfe nach zweiter Zahlung
**Erwartetes Ergebnis:**
- Ratenvereinbarung: 2/4 bezahlt
- Progress-Balken: 50% (CHF 100.00 von CHF 200.00)
- "Bezahlt: CHF 100.00" wird angezeigt
- "Noch offen: CHF 100.00" wird angezeigt

#### 7. Prüfe Statistik-Karten
**Erwartetes Ergebnis:**
- Gesamt: CHF 200.00
- Offen: CHF 100.00 (sollte sich aktualisieren)
- Bezahlt: CHF 100.00 (sollte sich aktualisieren)

### Bekannte Probleme (behoben):
✅ `totalPaid` wird jetzt korrekt berechnet
✅ Fallback-Berechnung aus installments, falls `totalPaid` fehlt
✅ Progress-Balken zeigt korrekten Fortschritt
✅ "Bezahlt"-Betrag wird korrekt angezeigt
✅ Daten werden nach Zahlung automatisch aktualisiert

### Debug-Informationen:
Falls Probleme auftreten, prüfe in der Browser-Konsole:
- Werden die Daten nach `refreshData()` korrekt geladen?
- Ist `totalPaid` in der Datenbank vorhanden?
- Werden die `installments` korrekt geladen?

