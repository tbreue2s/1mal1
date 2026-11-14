# Mission Specification: v3 Didactic Rework (ZahlenBlitz 3.0)

**Mission Branch**: `v3-didactic-rework`  
**Created**: 2026-11-14  
**Status**: Approved / In Execution  
**Scope**: Vollständiges Re-Engineering von Zahlen-Held (+/-) und 1×1 Meister in einer autarken Multi-Page `/v3/` Umgebung mit Faktenfamilien-Datenmodell, didaktischer Vollständigkeit und transparentem Fehler-Feedback.

---

## 1. Problemstellung & Zielsetzung

1. **Didaktische Fehlannahme in v2 geheilt**:
   - In v2 wurden 600 isolierte Karteikarten generiert (Mal, Geteilt, 4× Lücken). Kinder lernten Division und Lücken als getrennte Vokabeln statt als Umkehroperationen.
   - In v3 operiert das System auf **100 vernetzten Fakten-Familien** ($a \in [1..10], b \in [1..10]$).
   - Division und Lücken sind dynamische Abfrage- und Prüfungsformen derselben Familie.
2. **Lückenlose Aufgaben-Abdeckung in Zahlen-Held**:
   - In v2 fehlten 24 von 100 Aufgaben (24%), z. B. $3+1, 4+1, 5+2, 5+3, 6+3$, in allen Rechenwelten.
   - In v3 sind alle 100 Fakten lückenlos den 3 didaktischen Welten zugeordnet.
3. **Didaktisch sauberes Fehler-Feedback**:
   - In v2 wurde bei Fehlern nach 2,2s ohne Lösung weitergeschaltet.
   - In v3 stoppt die App bei Fehlern, zeigt die richtige Gleichung und den konkreten Denkweg (z. B. Zehnerstopp) und schaltet erst auf Klick von `Verstanden – Weiter →` weiter.
4. **Isolierte Multi-Page Umgebung `/v3/`**:
   - v3 läuft parallel unter `/v3/index.html`.
   - v1 (`/v1/`) und v2 (`/`) bleiben 100% unberührt.
   - Automatischer First-Run-Dialog fragt nach Übernahme der v2-Daten (mit „Ja“, „Später“, „Nein“), ohne je v2-Daten zu überschreiben.

---

## 2. Work Packages (Arbeitspakete)

- **WP1: Multi-Page Build `/v3/`, Typsystem & Migration**
  - `vite.config.ts` Multi-Page Entry `v3`.
  * `v3/index.html`, `src/v3/main.ts`, `src/v3/App.svelte`.
  * `src/v3/lib/types.ts`: FactFamily Datenmodell.
  * `src/v3/lib/migration.ts`: Verlustfreier, nicht-destruktiver v2-Import & First-Run-Check.

- **WP2: Didaktischer Core & Spaced Repetition Engine**
  * `src/v3/lib/generator.ts`: 100 Fakten für `plusminus` (inkl. 24 fehlende), 100 Fakten für `mult`.
  * `src/v3/lib/chapters.ts`: 3 Welten je Modus mit 3-Stufen-Progression.
  * `src/v3/lib/sm2.ts`: Kindgerechte Schwellen ($\le 6s$ Blitz, $\le 12s$ gut, $> 12s$ ohne Ease-Strafe).
  * `src/v3/lib/storage.ts`: Isolierter Speicher `v3_profiles`, Smart-Shuffle.

- **WP3: Übungs- und Feedback-Engine**
  * `src/v3/components/Keypad.svelte`: Touch- & Tastatur-Bedienung.
  * `src/v3/components/PracticeView.svelte`:
    * Stiller Timer im Hintergrund.
    * Fehlerpause mit Lösungsanzeige und Denkweg.
    * `Verstanden – Weiter →` Bestätigung.
    * In-Session Wiederholung am Rundenende.

- **WP4: UI, Navigation & 10×10 Wissensmatrix**
  * `src/v3/components/HomeView.svelte`: 1-Klick-Moduswechsel (Zahlen-Held $\leftrightarrow$ 1×1 Meister).
  * `src/v3/components/Heatmap.svelte`: 10×10 Übersicht.
  * `src/v3/components/MatrixView.svelte`: Interaktive Wissenskarte mit Fakten-Detaildialog.
  * `src/v3/components/UserModal.svelte`: Profilverwaltung & manueller v2-Import-Button.
  * First-Run Onboarding Modal mit 3 Optionen.

- **WP5: Verifikation & Quality Gate**
  * Automatisierte Test-Suite (`src/v3/lib/__tests__/didactic.test.ts`).
  * `npm run check` (0 Fehler).
  * `npm run build` (Erzeugt `dist/v3/index.html` neben v1 und v2).
