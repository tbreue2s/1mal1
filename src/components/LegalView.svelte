<script lang="ts">
  interface Props {
    onBack: () => void;
  }

  let { onBack }: Props = $props();
</script>

<section class="legal-view" aria-label="Impressum und Datenschutzerklärung">
  <div class="legal-header-card">
    <div class="legal-top-row">
      <h2>Impressum &amp; Datenschutz</h2>
      <button type="button" class="back-btn" onclick={onBack}>
        ← Zurück
      </button>
    </div>
  </div>

  <!-- Impressum -->
  <article class="legal-card">
    <h3>Impressum</h3>
    <p class="address-block">
      <strong>Thomas Breuer</strong><br />
      Zur Lüppich 5, 53773 Hennef<br />
      E-Mail: <a href="mailto:email.breuer@gmail.com">email.breuer@gmail.com</a>
    </p>
    <p>
      <strong>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV:</strong><br />
      Thomas Breuer, Zur Lüppich 5, 53773 Hennef.
    </p>
  </article>

  <!-- Datenschutzerklärung -->
  <article class="legal-card">
    <h3>Datenschutzerklärung</h3>

    <h4>1. Verantwortlicher</h4>
    <p>
      Verantwortlich für die Datenverarbeitung im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:
    </p>
    <p class="address-block">
      Thomas Breuer<br />
      Zur Lüppich 5<br />
      53773 Hennef<br /><br />
      E-Mail: <a href="mailto:email.breuer@gmail.com">email.breuer@gmail.com</a>
    </p>

    <h4>2. Grundlegendes zur Datenverarbeitung</h4>
    <p>
      Diese Anwendung wurde nach dem Prinzip der Datensparsamkeit und des „Privacy by Design“ entwickelt. Die Nutzung der Lern-App ist vollständig ohne Registrierung, ohne Angabe personenbezogener Daten und ohne Erstellung eines Benutzerkontos möglich.
    </p>

    <h4>3. Hosting und Bereitstellung über GitHub Pages</h4>
    <p>
      Diese Progressive Web App (PWA) wird als statische Webseite über den Dienst GitHub Pages bereitgestellt.
    </p>
    <p>
      <strong>Dienstanbieter:</strong><br />
      GitHub, Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, USA (Tochtergesellschaft der Microsoft Corp.).
    </p>
    <p>
      <strong>Erfasste Daten:</strong><br />
      Beim Aufruf der Web-App erfasst GitHub automatisch Informationen in Server-Logfiles, die dein Browser technisch bedingt übermittelt:
    </p>
    <ul>
      <li>IP-Adresse des anfragenden Geräts</li>
      <li>Datum und Uhrzeit des Zugriffs</li>
      <li>Browsertyp und Betriebssystem</li>
      <li>Referrer-URL (die zuvor besuchte Seite)</li>
    </ul>
    <p>
      <strong>Zweck &amp; Rechtsgrundlage:</strong><br />
      Die Erfassung dient der technischen Stabilität, der Bereitstellung der Inhalte sowie der Abwehr und Erkennung von Cyberangriffen. Die Verarbeitung erfolgt auf Grundlage unseres berechtigten Interesses an einer sicheren Bereitstellung der App gemäß Art. 6 Abs. 1 lit. f DSGVO.
    </p>
    <p>
      <strong>Drittlandübermittlung:</strong><br />
      GitHub, Inc. ist unter dem EU-U.S. Data Privacy Framework (DPF) zertifiziert. Für Datenübermittlungen in die USA gilt damit ein angemessenes Datenschutzniveau.
    </p>

    <h4>4. Lokale Speicherung auf dem Endgerät (LocalStorage &amp; Cache)</h4>
    <p>
      Die App arbeitet clientseitig direkt im Browser deines Endgeräts.
    </p>
    <p>
      <strong>Lernstände und Fortschritte:</strong><br />
      Alle Spaced-Repetition-Daten (z. B. fällige Aufgaben, Wiederholungsintervalle, gelöste Aufgaben und Reaktionszeiten) werden ausschließlich lokal im Speicher deines Browsers (<code>localStorage</code>) auf deinem eigenen Endgerät abgelegt.
    </p>
    <p>
      <strong>Keine Serverübertragung:</strong><br />
      Diese Daten verbleiben vollständig auf deinem Gerät. Es findet zu keinem Zeitpunkt eine Übertragung, Speicherung oder Analyse dieser Daten auf externen Servern statt.
    </p>
    <p>
      <strong>Löschung:</strong><br />
      Du kannst diese Daten jederzeit selbstständig löschen, indem du in den Browsereinstellungen die Website-Daten für diese App entfernst oder die PWA deinstallierst.
    </p>

    <h4>5. Service Worker &amp; Offline-Funktionalität</h4>
    <p>
      Um die App auch ohne aktive Internetverbindung lauffähig zu machen, nutzt sie einen Service Worker. Dieser lädt die technischen Programmdateien (HTML, JavaScript, CSS) in den browserinternen Cache deines Endgeräts. Dabei werden keine personenbezogenen Nutzerdaten erfasst oder ausgewertet.
    </p>

    <h4>6. Keine Cookies, kein Tracking, keine Werbung</h4>
    <ul>
      <li>
        <strong>Cookies:</strong> Diese Anwendung verwendet keine zustimmungspflichtigen Tracking-, Analyse- oder Marketing-Cookies.
      </li>
      <li>
        <strong>Tracking-Dienste:</strong> Es kommen keine Webanalyse-Tools (wie Google Analytics, Matomo etc.) zum Einsatz.
      </li>
      <li>
        <strong>Werbung:</strong> Die App ist vollständig werbefrei.
      </li>
    </ul>

    <h4>7. Audio-Ausgabe (Web Audio API)</h4>
    <p>
      Die akustischen Signaltöne bei richtiger oder falscher Antwort werden prozedural und in Echtzeit lokal über die Standard-Audio-Schnittstelle deines Browsers (Web Audio API) berechnet. Es werden keine Audiodaten gestreamt, aufgezeichnet oder nach außen übertragen.
    </p>

    <h4>8. Deine Rechte als betroffene Person</h4>
    <p>
      Soweit im Rahmen der Server-Logs personenbezogene Daten verarbeitet werden, stehen dir nach der DSGVO folgende Rechte gegenüber dem Verantwortlichen zu:
    </p>
    <ul>
      <li>
        <strong>Auskunft (Art. 15 DSGVO):</strong> Recht auf Auskunft über deine verarbeiteten Daten.
      </li>
      <li>
        <strong>Berichtigung (Art. 16 DSGVO):</strong> Recht auf Korrektur unrichtiger Daten.
      </li>
      <li>
        <strong>Löschung (Art. 17 DSGVO):</strong> Recht auf Löschung der gespeicherten Daten.
      </li>
      <li>
        <strong>Einschränkung der Verarbeitung (Art. 18 DSGVO):</strong> Recht auf Einschränkung der Verarbeitung.
      </li>
      <li>
        <strong>Widerspruch (Art. 21 DSGVO):</strong> Recht auf Widerspruch gegen die Verarbeitung auf Basis von Art. 6 Abs. 1 lit. f DSGVO.
      </li>
      <li>
        <strong>Beschwerderecht bei einer Aufsichtsbehörde (Art. 77 DSGVO):</strong> Du hast das Recht, dich bei einer Datenschutz-Aufsichtsbehörde (in der Regel die Landesbeauftragte für den Datenschutz deines Bundeslandes) zu beschweren, falls du der Ansicht bist, dass die Verarbeitung deiner Daten gegen die DSGVO verstößt.
      </li>
    </ul>

    <p class="legal-date">Stand: November 2026</p>
  </article>
</section>

<style>
  .legal-view {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding-bottom: 24px;
  }

  .legal-header-card,
  .legal-card {
    background: #ffffff;
    border-radius: 20px;
    padding: 16px 18px;
    border: 2px solid #e0e7ff;
    box-shadow: 0 4px 16px rgba(79, 70, 229, 0.06);
  }

  .legal-top-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  h2 {
    margin: 0;
    font-size: 1.25rem;
    color: #1e1b4b;
  }

  h3 {
    margin: 0 0 12px;
    font-size: 1.12rem;
    color: #312e81;
    border-bottom: 2px solid #eef2ff;
    padding-bottom: 6px;
  }

  h4 {
    margin: 16px 0 6px;
    font-size: 0.95rem;
    color: #1e1b4b;
  }

  p,
  li {
    font-size: 0.86rem;
    line-height: 1.55;
    color: #334155;
  }

  p {
    margin: 8px 0;
  }

  ul {
    margin: 6px 0 10px;
    padding-left: 20px;
  }

  li {
    margin-bottom: 4px;
  }

  a {
    color: #4f46e5;
    text-decoration: underline;
    font-weight: 700;
  }

  code {
    background: #f1f5f9;
    padding: 2px 5px;
    border-radius: 5px;
    font-size: 0.82rem;
  }

  .address-block {
    background: #f8fafc;
    border-left: 3px solid #6366f1;
    padding: 10px 12px;
    border-radius: 8px;
  }

  .legal-date {
    margin-top: 16px;
    font-size: 0.8rem;
    font-weight: 700;
    color: #64748b;
  }

  .back-btn {
    background: #eef2ff;
    color: #4338ca;
    border: 2px solid #c7d2fe;
    border-radius: 12px;
    padding: 8px 14px;
    font-weight: 800;
    font-size: 0.9rem;
    cursor: pointer;
    white-space: nowrap;
    font-family: inherit;
  }

  .back-btn:hover {
    background: #e0e7ff;
  }
</style>
