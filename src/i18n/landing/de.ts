import type { LandingDictionary } from '../landing';

const de: LandingDictionary<'de'> = {
  hubHeading: 'Anleitungen und Anwendungsfälle',
  homeLink: 'Markdown in PDF',
  pages: {
    'chatgpt-to-pdf': {
      title: 'ChatGPT als PDF speichern – kostenlos, ohne Erweiterung',
      description:
        'ChatGPT-Antwort kopieren, hier einfügen und als sauberes PDF speichern. Tabellen, Code und Formeln bleiben erhalten. Kostenlos, im Browser, ohne Upload.',
      h1: 'ChatGPT-Antworten als PDF speichern',
      lead: 'Antwort in ChatGPT kopieren, links einfügen und ein sauber gesetztes PDF herunterladen. Es wird nichts hochgeladen.',
      navLabel: 'ChatGPT als PDF speichern',
      navBlurb: 'ChatGPT-Antworten mit Tabellen, Code und Formeln als sauberes PDF speichern',
      intro: [
        'Der Kopieren-Button unter jeder ChatGPT-Antwort legt die Antwort als Markdown in die Zwischenablage – mit Überschriften, Listen, Tabellen, Codeblöcken und Formeln. Genau das verarbeitet diese Seite. Füge die Antwort oben in den Editor ein und klick auf <strong>PDF laden</strong>: Du bekommst ein Dokument mit echten Überschriften, Seitenzahlen und markierbarem Text statt eines Screenshots vom Chatfenster.',
        'Eingefügte Antworten werden automatisch aufgeräumt. ChatGPT schreibt Formeln als <code>\\(…\\)</code> und <code>\\[…\\]</code>; daraus wird die übliche Form <code>$…$</code> und <code>$$…$$</code>. Quellenmarker in eckigen Klammern, unsichtbare Nullbreitenzeichen und übrig gebliebene „Code kopieren“-Zeilen verschwinden. Codeblöcke werden nie angefasst, und ein Hinweis mit <strong>Rückgängig</strong> zeigt dir, wenn etwas geändert wurde.',
      ],
      howTo: {
        heading: 'So speicherst du eine ChatGPT-Antwort als PDF',
        steps: [
          { name: 'Antwort kopieren.', text: 'Klick auf das Kopieren-Symbol unter der ChatGPT-Antwort. Damit wird die Antwort als Markdown kopiert.' },
          { name: 'Hier einfügen.', text: 'Füge den Text in den Markdown-Editor auf dieser Seite ein. Die Vorschau rechts zeigt das Ergebnis sofort.' },
          { name: 'Layout anpassen, wenn du willst.', text: 'Unter Layout wählst du Papierformat, Ränder, Schriftgröße, Seitenzahlen oder ein Inhaltsverzeichnis.' },
          { name: 'PDF herunterladen.', text: 'Klick auf PDF laden. Die Datei wird in deinem Browser gesetzt und auf deinem Gerät gespeichert.' },
        ],
      },
      sections: [
        {
          heading: 'Tabellen, Code und Formeln bleiben erhalten',
          body: [
            'Tabellen bleiben Tabellen, samt Spaltenausrichtung. Codeblöcke behalten ihre Einrückung und bekommen Syntaxhervorhebung. Formeln werden als Mathematik gesetzt statt als Backslash-Wüste gedruckt. Druckst du dagegen die Chatseite aus dem Browser, bekommst du Seitenleiste, Buttons und unglückliche Seitenumbrüche gleich mit.',
          ],
        },
        {
          heading: 'Eine Antwort oder mehrere',
          body: [
            'Das hier ist kein Export für ganze Unterhaltungen: Es macht aus dem, was du einfügst, ein Dokument. Füge mehrere Antworten nacheinander ein, schreib eigene Überschriften oder Notizen dazwischen, und sie werden ein einziges PDF – auf Wunsch mit Inhaltsverzeichnis. Dein Text wird als Entwurf in deinem Browser gespeichert, du kannst also später weitermachen.',
          ],
        },
        {
          heading: 'Privat, weil es gar nicht anders geht',
          body: [
            'In ChatGPT-Antworten steckt oft Unfertiges: Code, Vertragsentwürfe, Lernzettel. Hier verlassen sie dein Gerät nie: Die Umwandlung passiert komplett in diesem Tab. Die Content Security Policy der Seite erlaubt Verbindungen nur zu dieser Seite und zum cookiefreien Besucherzähler von Cloudflare, der deinen Text nie sieht.',
          ],
        },
      ],
      faq: [
        {
          question: 'Wie kann ich einen ganzen ChatGPT-Chat als PDF speichern?',
          answer: [
            'Nicht automatisch – dieses Werkzeug liest keine Chats aus und keine geteilten Links. Kopiere die Antworten, die du behalten willst, der Reihe nach und füge sie hier ein; die Fragen kannst du selbst als Überschriften ergänzen. Ein vollständiges Archiv aller Chats liefert ChatGPT über <strong>Einstellungen → Datenkontrollen → Daten exportieren</strong>, allerdings als HTML und JSON, nicht als formatiertes PDF.',
          ],
        },
        {
          question: 'Warum funktioniert „PDF erstellen“ in ChatGPT nicht oder sieht schlecht aus?',
          answer: [
            'Wenn ChatGPT selbst ein PDF erzeugt, schreibt es dafür Code und führt ihn aus. Die Datei ist nur so gut wie dieses Skript: Das Layout ist meist schlicht, und die Schriften enthalten oft keine Zeichen für Chinesisch, Japanisch, Koreanisch oder andere Schriftsysteme – daher die leeren Kästchen. Bitte ChatGPT stattdessen um die Antwort in Markdown und wandle sie hier um: Du bekommst gesetzte Überschriften, Tabellen, hervorgehobenen Code und passende Schriften.',
          ],
        },
        {
          question: 'Wie kopiere ich eine ChatGPT-Antwort als Markdown?',
          answer: [
            'Nimm das Kopieren-Symbol unter der Antwort, statt den Text mit der Maus zu markieren. Der Button kopiert Markdown, Überschriften, Tabellen und Codeblöcke kommen also mit. Markierst du den dargestellten Text, landet nur einfacher Text in der Zwischenablage, und Struktur wie Überschriften und Tabellenränder geht verloren.',
          ],
        },
        {
          question: 'Geht das auch auf dem iPhone?',
          answer: [
            'Ja, in jedem aktuellen mobilen Browser, auch in Safari auf dem iPhone: Antwort in der ChatGPT-App kopieren, hier einfügen, PDF laden. Die Satz-Engine (etwa 7 MB) wird beim ersten Download geholt und danach zwischengespeichert. Eine App oder Browsererweiterung brauchst du nicht.',
          ],
        },
        {
          question: 'Ist das kostenlos? Wird mein Chat irgendwo hochgeladen?',
          answer: [
            'Kostenlos, ohne Anmeldung, ohne Wasserzeichen, ohne Limit. Und nein: Der Text wird in deinem Browser umgewandelt und an keinen Server geschickt, auch nicht an unseren. Er liegt nur als Entwurf in diesem Browser, und <strong>Neu</strong> löscht ihn.',
          ],
        },
        {
          question: 'Kann ich die automatische Bereinigung rückgängig machen?',
          answer: [
            'Ja. Wurde beim Einfügen etwas aufgeräumt, erscheint ein Hinweis mit <strong>Rückgängig</strong>, der genau das wiederherstellt, was du eingefügt hast. Strg+Z (⌘Z) funktioniert auch. Text, der nicht nach einer KI-Antwort aussieht, bleibt unverändert.',
          ],
        },
      ],
      sample: `# Annuitätendarlehen einfach erklärt

Bei einem Annuitätendarlehen zahlst du jeden Monat dieselbe Rate. Am Anfang besteht sie vor allem aus Zinsen, mit jeder Zahlung wächst der Tilgungsanteil. Die Monatsrate $A$ ergibt sich aus Darlehensbetrag $K$, Sollzins $z$ und anfänglicher Tilgung $t$:

$$
A = \\frac{K \\cdot (z + t)}{12}
$$

## Ein Rechenbeispiel

Angenommen, du finanzierst **300.000 €** zu **3,6 %** Sollzins mit **2 %** anfänglicher Tilgung. Die Monatsrate beträgt dann **1.400 €**.

| Nach Jahren | Restschuld | Gezahlte Zinsen gesamt |
|------------:|-----------:|-----------------------:|
| 5 | 267.184 € | 51.184 € |
| 10 | 227.907 € | 95.907 € |
| 15 | 180.897 € | 132.897 € |
| 20 | 124.630 € | 160.630 € |

Zwei Dinge fallen auf:

1. **Die ersten Jahre tilgen wenig.** Nach fünf Jahren sind erst rund 11 % der Schuld getilgt.
2. **Die Tilgung beschleunigt sich.** Weil die Zinsen auf eine kleinere Restschuld anfallen, fließt jedes Jahr mehr in die Tilgung.

## Selbst nachrechnen

\`\`\`python
def restschuld(kredit: float, zins: float, rate: float, jahre: int) -> float:
    """Restschuld nach monatlicher Zahlung einer festen Rate."""
    rest = kredit
    for _ in range(jahre * 12):
        rest -= rate - rest * zins / 12
    return rest

for jahre in (5, 10, 15, 20):
    print(jahre, round(restschuld(300_000, 0.036, 1_400, jahre)))
\`\`\`

> **Tipp:** Schon 1 % mehr Anfangstilgung verkürzt die Laufzeit um viele Jahre. Frag bei deiner Bank nach kostenlosen Sondertilgungen.

---

*Aus einer ChatGPT-Antwort eingefügt. Ersetze den Text durch deinen eigenen und klick auf **PDF laden**.*
`,
    },

    'claude-to-pdf': {
      title: 'Claude-Chat als PDF exportieren – kostenlos',
      description:
        'Claude-Antwort oder Markdown-Artefakt einfügen und als gesetztes PDF exportieren. Mermaid-Diagramme als Vektorgrafik, Code und Tabellen bleiben. Ohne Upload.',
      h1: 'Claude-Chats als PDF exportieren',
      lead: 'Claude-Antwort oder Markdown-Artefakt kopieren, links einfügen und ein sauberes PDF laden – Diagramme inklusive. Es wird nichts hochgeladen.',
      navLabel: 'Claude-Chat als PDF',
      navBlurb: 'Claude-Antworten und Markdown-Artefakte samt Mermaid-Diagrammen als PDF exportieren',
      intro: [
        'Der Kopieren-Button unter einer Claude-Antwort kopiert sie als Markdown, und ein Markdown-Artefakt – ein Bericht, ein Konzept, eine Dokumentation – lässt sich kopieren oder als <code>.md</code>-Datei herunterladen. Beides liest dieser Konverter direkt. Füge den Text ein oder zieh die Datei auf die Seite, dann klick auf <strong>PDF laden</strong>.',
        'Claude antwortet gern mit Mermaid-Diagrammen: Flussdiagramme, Sequenzdiagramme, Datenmodelle. Hier werden sie gerendert und als Vektorgrafik eingebettet. Sie werden scharf gedruckt, die Beschriftungen bleiben markierbar – statt als Block Diagramm-Quelltext im PDF zu landen.',
      ],
      howTo: {
        heading: 'So exportierst du eine Claude-Antwort als PDF',
        steps: [
          { name: 'Antwort oder Artefakt kopieren.', text: 'Nutze den Kopieren-Button unter der Claude-Antwort, oder kopiere ein Markdown-Artefakt bzw. lade es herunter.' },
          { name: 'Hier einfügen oder hineinziehen.', text: 'Füge den Text in den Editor auf dieser Seite ein oder zieh die heruntergeladene .md-Datei irgendwo auf die Seite.' },
          { name: 'Vorschau prüfen.', text: 'Überschriften, Tabellen, Code und Mermaid-Diagramme erscheinen beim Einfügen in der Vorschau rechts.' },
          { name: 'PDF herunterladen.', text: 'Klick auf PDF laden. Das Dokument wird in deinem Browser gesetzt und gespeichert.' },
        ],
      },
      sections: [
        {
          heading: 'Mermaid-Diagramme als echte Vektorgrafik',
          body: [
            'Jeder <code>```mermaid</code>-Block wird als SVG gezeichnet und als native Vektorgrafik ins PDF gesetzt. Du kannst beliebig weit hineinzoomen, alles bleibt scharf, und den Text darin kannst du durchsuchen und kopieren. Breite Diagramme werden auf die Seitenbreite verkleinert, hohe auf die Seitenhöhe, statt über den Rand hinauszulaufen.',
          ],
        },
        {
          heading: 'Aus langen Antworten werden richtige Dokumente',
          body: [
            'Claudes Antworten sind oft lang und gut gegliedert. Schalte unter <strong>Layout</strong> die Option <strong>Inhalt</strong> ein, und das PDF bekommt aus den Überschriften ein Inhaltsverzeichnis, Seitenzahlen und Lesezeichen – so bleibt auch ein Bericht mit vierzig Abschnitten in jedem PDF-Reader übersichtlich.',
          ],
        },
        {
          heading: 'Aufräumen ohne Überraschungen',
          body: [
            'Bringt ein eingefügter Text Chat-Reste mit, etwa Nullbreitenzeichen, eine verirrte „Kopieren“-Zeile oder Formeln in <code>\\(…\\)</code>-Klammern, wird das bereinigt, und ein Hinweis bietet <strong>Rückgängig</strong> an. Text, der wie gewöhnliches Markdown aussieht, bleibt genau so, wie er war.',
          ],
        },
      ],
      faq: [
        {
          question: 'Kann ich einen ganzen Claude-Chat exportieren?',
          answer: [
            'Nicht automatisch. Dieses Werkzeug liest keine Chats und keine geteilten Links aus, es wandelt um, was du einfügst. Kopiere die Antworten, die du brauchst, nacheinander in den Editor, ergänze deine Fragen als Überschriften und lade alles als ein PDF – mit <strong>Inhalt</strong> unter <strong>Layout</strong> auch mit Inhaltsverzeichnis.',
          ],
        },
        {
          question: 'Wie exportiere ich ein Claude-Artefakt als PDF?',
          answer: [
            'Kopiere den Inhalt des Artefakts oder lade es als Markdown-Datei herunter, füge den Text hier ein oder zieh die Datei auf die Seite und klick auf <strong>PDF laden</strong>. Artefakte, die Code oder Webseiten sind, speicherst du besser so, wie sie sind; dieses Werkzeug ist für Dokumente in Markdown gedacht.',
          ],
        },
        {
          question: 'Erscheinen die Mermaid-Diagramme von Claude im PDF?',
          answer: [
            'Ja. Mermaid-Blöcke werden in deinem Browser gerendert und als Vektorgrafik mit markierbarem Text eingebettet. Enthält ein Diagramm einen Syntaxfehler, zeigt die Vorschau den Fehler an – dann korrigierst du den Quelltext oder bittest Claude darum; das PDF behält in dem Fall den Quelltext.',
          ],
        },
        {
          question: 'Bleiben Formeln, Tabellen und Code erhalten?',
          answer: [
            'Ja. Formeln in <code>$…$</code> oder <code>$$…$$</code> werden gesetzt, <code>\\(…\\)</code> und <code>\\[…\\]</code> beim Einfügen in diese Form umgewandelt. Tabellen behalten ihre Spaltenausrichtung, Codeblöcke ihre Einrückung und bekommen Syntaxhervorhebung.',
          ],
        },
        {
          question: 'Wird etwas, das ich einfüge, an einen Server geschickt?',
          answer: [
            'Nein. Die Umwandlung läuft komplett in deinem Browser; die Seite sendet deinen Text nirgendwohin. Dein Entwurf liegt nur in diesem Browser. Kostenlos ist das Ganze auch – ohne Anmeldung und ohne Wasserzeichen.',
          ],
        },
      ],
      sample: `# Freigabeprozess für Eingangsrechnungen

Hier ist ein Vorschlag, wie ihr Eingangsrechnungen schneller freigebt, ohne das Vier-Augen-Prinzip aufzugeben. Ziel: Rechnungen innerhalb der Skontofrist bezahlen.

## Ablauf

\`\`\`mermaid
flowchart TD
  A[Rechnung geht ein] --> B[Erfassung in der Buchhaltung]
  B --> C{Bestellung vorhanden?}
  C -- ja --> D[Abgleich mit Wareneingang]
  C -- nein --> E[Rückfrage an Fachabteilung]
  E --> D
  D --> F{Betrag über 5.000 €?}
  F -- nein --> G[Freigabe Teamleitung]
  F -- ja --> H[Freigabe Teamleitung und Geschäftsführung]
  G --> I[Zahlung]
  H --> I
\`\`\`

## Freigabegrenzen

| Betrag | Freigabe durch | Frist |
|:-------|:---------------|------:|
| bis 1.000 € | Sachbearbeitung | 2 Tage |
| bis 5.000 € | Teamleitung | 3 Tage |
| über 5.000 € | Teamleitung und Geschäftsführung | 5 Tage |

## Warum sich Skonto lohnt

Wer 2 % Skonto bei Zahlung innerhalb von 10 Tagen statt nach 30 Tagen nutzt, erzielt umgerechnet einen Jahreszins von

$$
p = \\frac{2}{100 - 2} \\cdot \\frac{360}{30 - 10} \\cdot 100
$$

also rund **36,7 %** pro Jahr. Auf Skonto zu verzichten ist damit deutlich teurer als jeder Kontokorrentkredit – Skonto sollte also fast immer gezogen werden.

## Prüfung im Code

\`\`\`typescript
type Freigabe = 'Sachbearbeitung' | 'Teamleitung' | 'Geschäftsführung';

export function freigabeStufen(betrag: number): Freigabe[] {
  if (betrag <= 1000) return ['Sachbearbeitung'];
  if (betrag <= 5000) return ['Teamleitung'];
  return ['Teamleitung', 'Geschäftsführung'];
}
\`\`\`

## Nächste Schritte

- [ ] Freigabegrenzen mit der Geschäftsführung abstimmen
- [ ] Skontofristen im Buchhaltungssystem hinterlegen
- [ ] Vertretungsregel für Urlaubszeiten festlegen

---

*Aus einer Claude-Antwort eingefügt. Ersetze den Text durch deinen eigenen und klick auf **PDF laden**.*
`,
    },

    'gemini-to-pdf': {
      title: 'Gemini-Chat als PDF speichern – kostenlos, ohne Upload',
      description:
        'Gemini-Antwort kopieren, hier einfügen und als sauber gesetztes PDF speichern – mit Tabellen, Code und Formeln. Kostenlos, ohne Konto, alles im Browser.',
      h1: 'Gemini-Antworten als PDF speichern',
      lead: 'Antwort in Google Gemini kopieren, links einfügen und ein sauberes PDF mit Tabellen und Code laden. Es wird nichts hochgeladen.',
      navLabel: 'Gemini-Chat als PDF',
      navBlurb: 'Antworten aus Google Gemini als sauber gesetztes PDF speichern',
      intro: [
        'Gemini kann eine Antwort nach Google Docs exportieren und von dort als PDF, doch dafür brauchst du ein Google-Konto, einen Umweg über die Textverarbeitung und oft noch etwas Nacharbeit. Schneller geht es so: Die Kopieren-Funktion von Gemini liefert Markdown, und diese Seite macht daraus in einem Schritt ein richtig gesetztes PDF, direkt in deinem Browser.',
        'Tabellen behalten ihre Spalten, Codeblöcke ihre Einrückung und Hervorhebung, Formeln werden gesetzt. Chat-Reste wie Nullbreitenzeichen oder übrig gebliebene Button-Beschriftungen neben Codeblöcken werden beim Einfügen entfernt – mit <strong>Rückgängig</strong>, falls du das Original zurückhaben willst.',
      ],
      howTo: {
        heading: 'So speicherst du eine Gemini-Antwort als PDF',
        steps: [
          { name: 'Antwort kopieren.', text: 'Nutze die Kopieren-Funktion unter der Gemini-Antwort.' },
          { name: 'Hier einfügen.', text: 'Füge den Text in den Markdown-Editor auf dieser Seite ein und prüf die Vorschau rechts.' },
          { name: 'Layout festlegen.', text: 'Wähl unter Layout bei Bedarf Papierformat, Ränder, Seitenzahlen oder ein Inhaltsverzeichnis.' },
          { name: 'PDF herunterladen.', text: 'Klick auf PDF laden; die Datei wird in deinem Browser gesetzt.' },
        ],
      },
      sections: [
        {
          heading: 'Recherchen und Reisepläne, die sich gut drucken lassen',
          body: [
            'Gemini-Antworten sind oft lange Vergleiche und Pläne: Reiserouten, Produktvergleiche, Lernzusammenfassungen. Als PDF bekommen sie echte Überschriften, Seitenzahlen und auf Wunsch ein Inhaltsverzeichnis, und Tabellen werden auf die Seitenbreite gesetzt, statt abgeschnitten zu werden.',
          ],
        },
        {
          heading: 'Mehrere Antworten in einem Dokument',
          body: [
            'Füge mehr als eine Antwort in dasselbe Dokument ein, schreib eigene Notizen dazwischen und lade alles als eine Datei herunter. Dein Text bleibt als Entwurf in diesem Browser gespeichert, falls du den Tab schließt.',
          ],
        },
        {
          heading: 'Kein Konto, kein Upload',
          body: [
            'Hier gibt es nichts, wo du dich anmelden müsstest. Der Konverter läuft in deinem Browser, und die Seite schickt das, was du einfügst, an keinen Server.',
          ],
        },
      ],
      faq: [
        {
          question: 'Wie kann ich einen Gemini-Chat als PDF speichern?',
          answer: [
            'Kopiere die Antworten, die du brauchst, füge sie hier der Reihe nach ein und klick auf <strong>PDF laden</strong>. Einen ganzen Chat exportiert dieses Werkzeug nicht automatisch, und geteilte Links liest es nicht aus. Alternativ schickt „In Google Docs exportieren“ eine Antwort nach Google Docs, wo du sie als PDF herunterladen kannst – dafür brauchst du ein Google-Konto.',
          ],
        },
        {
          question: 'Warum zerfallen Gemini-Tabellen, wenn ich die Seite drucke?',
          answer: [
            'Beim Drucken einer Chatseite druckst du die Webseite – mit ihrem Layout, den Seitenleisten und scrollbaren Tabellen. Hier eingefügt, wird die Tabelle Teil eines Dokuments, das fürs Papier gesetzt ist.',
          ],
        },
        {
          question: 'Bleiben Code und Formeln aus Gemini erhalten?',
          answer: [
            'Ja. Codeblöcke werden hervorgehoben und von der Bereinigung nie verändert; Formeln in <code>$…$</code>, <code>\\(…\\)</code> oder <code>\\[…\\]</code> werden gesetzt.',
          ],
        },
        {
          question: 'Geht das auch auf dem Handy?',
          answer: [
            'Ja, in jedem aktuellen mobilen Browser: Antwort in der Gemini-App kopieren, hier einfügen, PDF laden. Die Satz-Engine (etwa 7 MB) wird beim ersten Download geladen und danach zwischengespeichert.',
          ],
        },
        {
          question: 'Ist das kostenlos?',
          answer: ['Ja: ohne Anmeldung, ohne Wasserzeichen und ohne Begrenzung der Anzahl der PDFs.'],
        },
      ],
      sample: `# Wärmepumpe oder Gasheizung: Was kostet der Betrieb?

Hier ein Vergleich der jährlichen Heizkosten für ein Einfamilienhaus mit einem Wärmebedarf von rund **20.000 kWh** pro Jahr.

## Auf einen Blick

| Heizung | Effizienz | Energiebedarf | Preis je kWh | Kosten pro Jahr |
|:--------|----------:|--------------:|-------------:|----------------:|
| Gas-Brennwert | 95 % | 21.053 kWh Gas | 0,11 € | 2.316 € |
| Wärmepumpe, JAZ 3 | 300 % | 6.667 kWh Strom | 0,28 € | 1.867 € |
| Wärmepumpe, JAZ 3,5 | 350 % | 5.714 kWh Strom | 0,28 € | 1.600 € |
| Wärmepumpe, JAZ 4 | 400 % | 5.000 kWh Strom | 0,28 € | 1.400 € |

Der Strombedarf einer Wärmepumpe ist der Wärmebedarf $Q$ geteilt durch die Jahresarbeitszahl $J$:

$$
E = \\frac{Q}{J}
$$

## Was das Ergebnis verändert

- **Die Jahresarbeitszahl.** Sie hängt stark von der Vorlauftemperatur ab – Fußbodenheizung hilft, alte kleine Heizkörper eher nicht.
- **Der Stromtarif.** Viele Versorger bieten günstigere Wärmepumpentarife an.
- **Die Dämmung.** Ein geringerer Wärmebedarf senkt die Kosten bei beiden Systemen.

## Für dein Haus abschätzen

\`\`\`javascript
function heizkosten({ waermebedarf, jaz, strompreis }) {
  return (waermebedarf / jaz) * strompreis;
}

console.log(heizkosten({ waermebedarf: 20000, jaz: 3.5, strompreis: 0.28 }).toFixed(0));
\`\`\`

> Bei einer Jahresarbeitszahl ab etwa 3 ist die Wärmepumpe im Betrieb meist günstiger als Gas – die Anschaffungskosten sind hier nicht eingerechnet.

---

*Aus einer Gemini-Antwort eingefügt. Ersetze den Text durch deinen eigenen und klick auf **PDF laden**.*
`,
    },

    'mermaid-to-pdf': {
      title: 'Mermaid-Diagramme als PDF exportieren – als Vektorgrafik',
      description:
        'Markdown mit Mermaid-Diagrammen in PDF umwandeln: Diagramme als scharfe Vektorgrafik mit markierbarem Text, passend zur Seitenbreite. Kostenlos, ohne Upload.',
      h1: 'Mermaid-Diagramme als PDF exportieren',
      lead: 'Markdown mit ```mermaid-Blöcken einfügen und ein PDF laden, in dem jedes Diagramm eine scharfe Vektorgrafik mit markierbarem Text ist.',
      navLabel: 'Mermaid-Diagramme als PDF',
      navBlurb: 'Diagramme als Vektorgrafik mit markierbarem Text im PDF',
      intro: [
        'Mermaid macht aus ein paar Zeilen Text Flussdiagramme, Sequenzdiagramme, Gantt-Diagramme und mehr. Schwierig wird es beim Weg ins PDF: Viele Online-Konverter für Markdown rendern Mermaid gar nicht und drucken den Quelltext, manche machen aus der ganzen Seite ein einziges großes Bild, und der Export aus einem Editor schneidet breite Diagramme mitunter ab oder hängt von den Schriften ab, die auf deinem Rechner installiert sind.',
        'Hier wird jeder <code>```mermaid</code>-Block in deinem Browser als SVG gerendert und als native Vektorgrafik ins PDF eingebettet. Das Diagramm bleibt bei jeder Vergrößerung scharf, die Beschriftungen lassen sich markieren, kopieren und per Suche finden, und Farben aus <code>classDef</code> oder <code>style</code> kommen genau so an, wie du sie geschrieben hast.',
      ],
      howTo: {
        heading: 'So exportierst du Mermaid-Diagramme als PDF',
        steps: [
          { name: 'Diagramme einfügen.', text: 'Füge dein Markdown ein oder schreib einen Codeblock mit der Sprachangabe mermaid.' },
          { name: 'Vorschau prüfen.', text: 'Jedes Diagramm erscheint beim Tippen in der Vorschau; Syntaxfehler werden direkt an der Stelle angezeigt.' },
          { name: 'PDF herunterladen.', text: 'Klick auf PDF laden. Die Diagramme landen als Vektorgrafik zwischen dem restlichen Text deines Dokuments.' },
        ],
      },
      sections: [
        {
          heading: 'Vektorgrafik mit markierbarem Text statt Screenshot',
          body: [
            'Weil die Diagramme als Vektorpfade und Text statt als Pixel eingebettet werden, drucken sie in jeder Größe gestochen scharf, und die Datei bleibt klein. Die Suche im PDF-Reader findet Wörter in den Diagrammen, und eine Beschriftung kannst du direkt aus dem Flussdiagramm kopieren.',
          ],
        },
        {
          heading: 'Passend zur Seite',
          body: [
            'Diagramme behalten ihre natürliche Größe, wenn sie auf die Seite passen; breite Diagramme werden auf die Breite des Textbereichs verkleinert, statt über den Rand zu laufen, und eines, das höher ist als eine Seite, wird auf eine Seite verkleinert. Beschriftungen werden als SVG-Text gezeichnet, nicht als eingebettetes HTML – genau daran liegt es, wenn andere Exporte leere Kästchen statt Beschriftungen zeigen.',
          ],
        },
        {
          heading: 'Alle gängigen Diagrammtypen',
          body: [
            'Flussdiagramme, Sequenzdiagramme, Klassendiagramme, Zustandsdiagramme, ER-Diagramme, Gantt-Diagramme, Kreisdiagramme, Mindmaps, Zeitleisten und die übrigen Typen, die Mermaid kennt, rendert Mermaid selbst. Die Syntax ist also genau die, die du von GitHub, GitLab, Obsidian oder Notion kennst.',
          ],
        },
      ],
      faq: [
        {
          question: 'Warum erscheint mein Mermaid-Diagramm im PDF als Code?',
          answer: [
            'Der Konverter, den du benutzt hast, rendert kein Mermaid und behandelt den Block wie gewöhnlichen Code. Hier wird jeder mit <code>mermaid</code> markierte Codeblock als Diagramm gerendert. Ist die Syntax fehlerhaft, zeigen Vorschau und PDF einen Kasten mit der Fehlermeldung von Mermaid, der Zeilennummer und der betroffenen Zeile; der Rest des Dokuments wird normal gesetzt.',
          ],
        },
        {
          question: 'Ist das Diagramm im PDF ein Bild?',
          answer: [
            'Es ist eine Vektorgrafik, keine Pixelgrafik. Sie bleibt beim Zoomen scharf, und der Text darin ist echter Text, den du markieren und durchsuchen kannst.',
          ],
        },
        {
          question: 'Bleiben Farben und eigene Stile erhalten?',
          answer: [
            'Ja. Füllfarben, Linienfarben und Linienstärken, die du mit <code>classDef</code>, <code>class</code> oder <code>style</code> festlegst, bleiben im PDF erhalten.',
          ],
        },
        {
          question: 'Kann ich nur ein Diagramm exportieren, ohne den Rest des Dokuments?',
          answer: [
            'Ja: Schreib nur den <code>```mermaid</code>-Block in den Editor und lade das PDF. Es enthält dann allein das Diagramm, in natürlicher Größe oder auf die Seite verkleinert. Brauchst du das Diagramm woanders, fahr in der Vorschau mit der Maus darüber: Du kannst es als SVG kopieren oder als SVG oder PNG herunterladen.',
          ],
        },
        {
          question: 'Wird mein Diagramm zum Rendern auf einen Server geladen?',
          answer: [
            'Nein. Mermaid läuft in deinem Browser, die PDF-Engine ebenfalls. Die Seite sendet dein Dokument nirgendwohin. Kostenlos ist es auch – ohne Anmeldung und ohne Wasserzeichen.',
          ],
        },
      ],
      sample: `# Mermaid-Diagramme im PDF

Jedes Diagramm unten wird in deinem Browser gerendert und als **Vektorgrafik** ins PDF eingebettet: Zoom so weit hinein, wie du willst, und markiere oder durchsuche den Text darin.

## Flussdiagramm

\`\`\`mermaid
flowchart LR
  A[Reklamation geht ein] --> B{Garantie gültig?}
  B -- ja --> C[Ersatz versenden]
  B -- nein --> D[Kostenvoranschlag]
  D --> E{Kunde stimmt zu?}
  E -- ja --> F[Reparatur]
  E -- nein --> G[Gerät zurücksenden]
  C --> H([Fall abgeschlossen])
  F --> H
  G --> H
  classDef erledigt fill:#e3f5e8,stroke:#1f8a4c,stroke-width:2px
  class H erledigt
\`\`\`

## Sequenzdiagramm

\`\`\`mermaid
sequenceDiagram
  participant K as Kundin
  participant S as Onlineshop
  participant B as Bank
  K->>S: Bestellung abschicken
  S->>B: Zahlung über 89,90 € anfragen
  B-->>K: Freigabe in der Banking-App
  K->>B: Zahlung bestätigen
  B-->>S: Zahlung genehmigt
  S-->>K: Bestellbestätigung per E-Mail
\`\`\`

## Gantt-Diagramm

\`\`\`mermaid
gantt
  title Badsanierung
  dateFormat YYYY-MM-DD
  section Rückbau
    Fliesen entfernen   :done, r1, 2026-10-05, 3d
    Leitungen prüfen    :done, r2, after r1, 2d
  section Neubau
    Installation        :active, n1, after r2, 5d
    Estrich trocknen    :n2, after n1, 10d
    Fliesen verlegen    :n3, after n2, 4d
    Abnahme             :milestone, after n3, 0d
\`\`\`

## Zustandsdiagramm

\`\`\`mermaid
stateDiagram-v2
  state "Offen" as offen
  state "In Bearbeitung" as arbeit
  state "Wartet auf Rückmeldung" as wartet
  state "Gelöst" as geloest
  [*] --> offen
  offen --> arbeit : zugewiesen
  arbeit --> wartet : Rückfrage
  wartet --> arbeit : Antwort erhalten
  arbeit --> geloest : behoben
  geloest --> [*]
\`\`\`

Bearbeite links einen beliebigen Block, die Vorschau zieht mit; mit **PDF laden** bekommst du die echte Datei.
`,
    },
  },
};

export default de;
