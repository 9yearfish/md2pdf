import type { Messages } from './types';
import { BRAND } from './constants';

const de: Messages = {
  locale: {
    code: 'de',
    lang: 'de',
    hreflang: 'de',
    ogLocale: 'de_DE',
    nativeName: 'Deutsch',
  },

  meta: {
    title: 'Markdown in PDF umwandeln – online, kostenlos, ohne Upload',
    description:
      'Markdown zu PDF direkt im Browser: Mermaid-Diagramme als Vektorgrafik mit markierbarem Text. Kein Upload, keine Anmeldung, kein Wasserzeichen – kostenlos.',
    ogTitle: 'Markdown in PDF umwandeln – im Browser, mit Mermaid als Vektorgrafik',
    ogDescription:
      'Wandle Markdown in ein sauber gesetztes PDF um, ohne etwas hochzuladen. Mermaid-Diagramme bleiben Vektorgrafik, Text bleibt durchsuchbar. Kostenlos, ohne Anmeldung.',
    appDescription:
      'Markdown-PDF-Konverter, der lokal im Browser läuft: Mermaid-Diagramme als Vektorgrafik und korrekter Satz für viele Schriftsysteme. Dokumente werden nie hochgeladen.',
    operatingSystem: 'Jeder moderne Browser mit WebAssembly',
    featureList: [
      'Mermaid-Diagramme als Vektorgrafik mit markierbarem Text',
      'Satz für lateinische Schrift mit Umlauten, Chinesisch, Japanisch, Koreanisch, Kyrillisch und Vietnamesisch',
      'Codeblöcke mit Syntaxhervorhebung',
      'Inhaltsverzeichnis, Seitenzahlen und PDF-Lesezeichen',
      'Live-Vorschau und automatisches Speichern des Entwurfs im Browser',
      'Läuft lokal – Dokumente werden nie hochgeladen',
    ],
  },

  page: {
    privacyBadge: 'Lokal · kein Upload · keine Anmeldung · kein Wasserzeichen · offline nutzbar',
    privacyTitle:
      'Einlesen, Satz und PDF-Erzeugung passieren komplett in diesem Tab. Dein Dokument verlässt nie dein Gerät.',
    newDoc: 'Neu',
    newDocTitle: 'Neues leeres Dokument (löscht auch den gespeicherten Entwurf)',
    open: 'Öffnen',
    openTitle: '.md-Datei öffnen',
    layout: 'Layout',
    layoutTitle: 'Seitenlayout',
    downloadTitle: 'PDF herunterladen (⌘/Strg + S)',
    printTitle: 'Das gesetzte PDF drucken (⌘/Strg + P)',
    language: 'Sprache',
    paper: 'Papier',
    margin: 'Ränder',
    fontSize: 'Schriftgröße',
    lineHeight: 'Zeilenabstand',
    pageNumbers: 'Seitenzahlen',
    toc: 'Inhalt',
    justify: 'Blocksatz',
    docLanguage: 'Dokumentsprache',
    template: 'Vorlage',
    templateDefault: 'Standard',
    templateReport: 'Bericht',
    templateAcademic: 'Wissenschaftlich',
    templateResume: 'Lebenslauf',
    templateLetter: 'Brief',
    cover: 'Titelseite',
    h1NewPage: 'Jede H1 auf neuer Seite',
    header: 'Kopfzeile',
    footer: 'Fußzeile',
    bandTitle: 'Platzhalter: {title} {page} {pages} {date} {author}. Mit | in links | Mitte | rechts teilen. Leer: Vorgabe der Vorlage; none: keine.',
    editorHint: '.md-Datei oder Bilder hierher ziehen',
    editorLabel: 'Markdown-Quelltext',
    editorPlaceholder: 'Markdown hier eingeben oder einfügen – oder eine .md-Datei hineinziehen …',
    preview: 'Vorschau',
    dropHint: 'Zum Importieren loslassen',
    source: 'Quelltext',
    proof: 'Andruck',
    live: 'Live',
    viewSwitch: 'Ansicht',
    fullscreen: 'Vollbild-Bearbeitung',
    heroTitle: 'Markdown zu PDF',
    heroTagline: ': gesetzt im Browser.',
    heroLead: 'Markdown einfügen oder hineinziehen und ein sauber gesetztes PDF herunterladen, mit Mermaid-Diagrammen als Vektorgrafik. Das Dokument verlässt den Browser nie.',
    aboutToggle: `Über ${BRAND}`,
    emptyTitle: 'Markdown einfügen, eine .md-Datei hierher ziehen oder eine öffnen',
    paste: 'Einfügen',
    pasteTitle: 'Markdown aus der Zwischenablage einfügen',
  },

  about: {
    heading: 'Markdown in PDF umwandeln – direkt im Browser',
    intro: [
      'Füge Markdown ein oder zieh eine Datei hinein, sieh der Vorschau beim Tippen zu und klick auf <strong>PDF laden</strong> – schon hast du ein sauber gesetztes PDF. Die Vorschau erscheint sofort; das PDF erzeugt eine echte Satz-Engine, mit Seitenumbrüchen, Seitenzahlen und auf Wunsch einem Inhaltsverzeichnis.',
      'Ein Server ist an keiner Stelle beteiligt. Einlesen, Diagramme, Satz und PDF-Erzeugung laufen vollständig in diesem Tab. Keine Anmeldung, kein Wasserzeichen, keine Begrenzung. Was du schreibst, wird automatisch in deinem eigenen Browser gespeichert, sodass beim Schließen des Tabs nichts verloren geht. Es wird nie hochgeladen; <strong>Neu</strong> oder das Löschen der Websitedaten entfernt es wieder.',
    ],
    sections: [
      {
        heading: 'Mermaid-Diagramme als Vektorgrafik statt Screenshot',
        body: [
          '<code>```mermaid</code>-Blöcke werden als SVG gerendert und als echte Vektorgrafik ins PDF eingebettet. Sie bleiben bei jeder Vergrößerung scharf, der Text darin lässt sich markieren, kopieren und durchsuchen, und mit <code>classDef</code> gesetzte Füllfarben, Konturen und Linienstärken bleiben erhalten. Viele Online-Konverter rendern Mermaid gar nicht und drucken nur den Quelltext; manche machen aus der ganzen Seite ein Bild, in dem sich nichts markieren lässt.',
        ],
      },
      {
        heading: 'Satz, der zu deiner Schrift passt',
        body: [
          'Text wird als echter, markierbarer und durchsuchbarer Text eingebettet; Schriften werden automatisch auf die benötigten Zeichen reduziert, damit die Dateien klein bleiben. Umlaute und ß sitzen, wie sie sollen. Neben lateinischer Schrift werden auch Chinesisch (vereinfacht und traditionell), Japanisch, Koreanisch, Kyrillisch und Vietnamesisch mit passenden Schriften gesetzt, und gemischtsprachige Absätze brechen korrekt um. Kommen seltene Zeichen außerhalb der kompakten Teilschrift vor, wird automatisch die vollständige Schrift geladen – statt leerer Kästchen.',
        ],
      },
      {
        heading: 'Eine echte Satz-Engine',
        body: [
          'Unter der Haube arbeitet Typst, ein modernes Satzsystem, das nach WebAssembly kompiliert im Browser läuft. Es kümmert sich um Seitenumbruch, Schusterjungen und Hurenkinder, Inhaltsverzeichnis, Seitenzahlen, Fußnoten und PDF-Lesezeichen und hebt Code mit seinem eingebauten Highlighter hervor. Die Engine ist etwa 10 MB groß: Sie lädt still im Hintergrund, während du schreibst, wird auf deinem Gerät zwischengespeichert und funktioniert danach auch offline.',
        ],
      },
      {
        heading: 'Unterstütztes Markdown',
        body: [
          'Überschriften, Absätze, fett, kursiv, durchgestrichen, Inline-Code, Links, Bilder, nummerierte und unnummerierte Listen, verschachtelte Listen, Aufgabenlisten, Zitatblöcke, Tabellen mit Spaltenausrichtung, Definitionslisten, Fußnoten, Trennlinien, Codeblöcke mit Syntaxhervorhebung und Mermaid-Diagramme. Bilder lassen sich hineinziehen oder aus der Zwischenablage einfügen. Auch mathematische Formeln in LaTeX-Syntax werden unterstützt: im Fließtext mit <code>$...$</code>, abgesetzt mit <code>$$...$$</code> oder <code>```math</code>-Blöcken.',
        ],
      },
    ],
    faqHeading: 'Häufige Fragen',
    faq: [
      {
        question: 'Wird mein Dokument auf einen Server hochgeladen?',
        answer: [
          'Nein. Einlesen, Satz und PDF-Erzeugung passieren komplett in deinem Browser. Text, Bilder und PDF verlassen dein Gerät nie. Die Content Security Policy der Seite erlaubt Verbindungen nur zur Seite selbst und zum anonymen, cookiefreien Besucherzähler von Cloudflare, der Seitenaufrufe zählt und nie dein Dokument erhält; alle anderen Ziele blockiert dein Browser.',
        ],
      },
      {
        question: 'Ist meine Arbeit noch da, wenn ich die Seite schließe?',
        answer: [
          'Ja. Sobald du ein Dokument bearbeitest, werden Text, Layout-Einstellungen und hineingezogene Bilder automatisch im lokalen Speicher deines Browsers gesichert und beim nächsten Besuch wiederhergestellt. Der Entwurf liegt nur in diesem Browser auf diesem Gerät; er wird nie hochgeladen oder synchronisiert. Mit <strong>Neu</strong> oder durch Löschen der Websitedaten entfernst du ihn.',
        ],
      },
      {
        question: 'Werden Mermaid-Diagramme unterstützt?',
        answer: [
          'Ja. Diagramme landen als Vektorgrafik im PDF, bleiben beim Zoomen scharf, ihr Text bleibt markierbar und durchsuchbar, und eigene <code>classDef</code>-Farben bleiben erhalten.',
        ],
      },
      {
        question: 'Werden Umlaute und andere Schriften richtig dargestellt?',
        answer: [
          'Ja. Umlaute, ß und typografische Anführungszeichen werden korrekt gesetzt. Auch Chinesisch (vereinfacht und traditionell), Japanisch, Koreanisch, Kyrillisch und Vietnamesisch bekommen passende Schriften und landen als echter Text im PDF, den du markieren, kopieren und durchsuchen kannst. Die Schriften dafür werden nur geladen, wenn ein Dokument sie tatsächlich braucht.',
        ],
      },
      {
        question: 'Warum sieht die Vorschau etwas anders aus als das PDF?',
        answer: [
          'Die Vorschau ist HTML, das dein Browser direkt darstellt – nur so hält sie mit jedem Tastendruck mit. Das PDF setzt die Typst-Engine; Seitenumbrüche, Zeilenumbrüche und Abstände richten sich nach der heruntergeladenen Datei. Inhalt, Struktur und Gestaltung sind in beiden gleich.',
        ],
      },
      {
        question: 'Wie lange dauert das erste PDF?',
        answer: [
          'Die Seite selbst hat nur ein paar Dutzend Kilobyte und öffnet sich sofort. Die Satz-Engine ist etwa 10 MB groß und lädt nach dem Seitenaufruf still im Hintergrund, meist noch bevor du fertig geschrieben hast; die Statusleiste unten zeigt den Stand. Danach liegt sie auf deinem Gerät, spätere Umwandlungen klappen also auch offline.',
        ],
      },
      {
        question: 'Muss ich mich anmelden oder bezahlen? Gibt es ein Wasserzeichen?',
        answer: [
          'Nichts davon. Das Werkzeug ist eine statische Webseite ohne Konten und ohne Backend, und das PDF trägt kein Wasserzeichen.',
        ],
      },
      {
        question: 'Werden mathematische Formeln unterstützt?',
        answer: [
          'Ja. Schreib <code>$...$</code> für Formeln im Fließtext und <code>$$...$$</code> (oder einen <code>```math</code>-Block) für abgesetzte Gleichungen, in LaTeX-Syntax. Typst setzt sie nativ, im PDF stehen also echte, durchsuchbare Formeln statt Bilder, und eine fehlerhafte Formel wird einzeln markiert, ohne den Rest des Dokuments zu beeinträchtigen.',
        ],
      },
      {
        question: 'Kann ich HTML-Tags verwenden?',
        answer: [
          'Nur <code>&lt;br&gt;</code>. Die Satz-Engine hat keine Entsprechung für HTML. Statt etwas zu erzeugen, das nur so aussieht, als stimme es, werden andere Tags mit einem Hinweis übersprungen.',
        ],
      },
    ],
    footer:
      `<strong class="colophon-mark"><span class="brand-free">free</span>md2pdf.com</strong> · Markdown in PDF umwandeln, direkt im Browser, mit Mermaid-Diagrammen als Vektorgrafik. Nichts wird hochgeladen.`,
    languagesHeading: 'Sprachen',
  },

  ui: {
    words: { one: '{n} Wort', other: '{n} Wörter' },
    lines: { one: '{n} Zeile', other: '{n} Zeilen' },
    paperHint: '{paper} · Seitenumbrüche wie im PDF',

    engineIdle: 'PDF-Engine bereit zum Laden',
    engineWillLoad: 'PDF-Engine lädt im Hintergrund (ca. 10 MB)',
    engineCached: 'PDF-Engine zwischengespeichert',
    engineDownloading: 'PDF-Engine lädt im Hintergrund {pct} %',
    engineStarting: 'PDF-Engine startet …',
    engineFonts: 'Schriften werden geladen …',
    engineReady: 'PDF-Engine bereit · auch offline',
    engineFailed: 'PDF-Engine nicht geladen, neuer Versuch beim Download',
    networkFailed: 'Beim Laden der Schriften oder der Satz-Engine ist die Verbindung abgebrochen, auch nach erneuten Versuchen. Prüfen Sie Ihre Verbindung und versuchen Sie es erneut.',
    reloadPage: 'Seite neu laden',
    chunkFailed: 'Ein Teil der App konnte nicht geladen werden, vermutlich wegen eines Verbindungsabbruchs. Neu laden behebt es; Ihr Entwurf ist gespeichert.',

    download: 'PDF laden',
    downloadGenerating: 'Erzeuge …',
    downloadEngine: 'Engine {pct} %',
    downloadStarting: 'Starte …',
    downloadFonts: 'Schriften …',
    downloadTypesetting: 'Setze …',
    print: 'Drucken',
    printInTab: 'Das PDF ist in einem neuen Tab geöffnet. Drucke es von dort aus.',
    printBlocked: 'Dein Browser hat den neuen Tab blockiert. Öffne das PDF und drucke es von dort aus.',
    printOpen: 'PDF öffnen',

    missingGlyphs: 'Diese Zeichen fehlen in den Schriften und werden eventuell nicht angezeigt: {chars}',
    pdfFailed: 'PDF konnte nicht erzeugt werden: {detail}',
    pdfFailedShort: 'PDF konnte nicht erzeugt werden',
    initFailed: 'Die Seite konnte nicht starten: {detail}',

    close: 'Schließen',
    undo: 'Rückgängig',
    cleared: 'Geleert, gespeicherter Entwurf gelöscht',
    langAuto: 'Automatisch · {detected}',
    aiCleaned: 'Formatierung der eingefügten KI-Antwort bereinigt',
    draftNotSample: 'Angezeigt wird dein gespeicherter Entwurf, nicht das Beispiel dieser Seite',
    loadExample: 'Beispiel laden',
    exampleLoaded: 'Beispiel geladen; dein Entwurf bleibt erhalten, bis du etwas änderst',
    otherTab: 'Dieses Dokument wurde in einem anderen Tab geändert',
    loadLatest: 'Neueste laden',
    syncedFromTab: 'Mit anderem Tab synchronisiert',
    syncedFromTabTitle: 'Ein anderer Tab hat eine neuere Version gespeichert; dieser Tab zeigt sie jetzt an',
    saved: 'Im Browser gespeichert',
    savedTitle: 'Gespeichert um {time} · der Entwurf bleibt in diesem Browser und wird nie hochgeladen',
    restored: 'Entwurf wiederhergestellt',
    restoredTitle: 'Der Entwurf bleibt in diesem Browser und wird nie hochgeladen; „Neu“ löscht ihn',
    quotaState: 'Speicher voll, Entwurf nicht gesichert',
    quotaNotice:
      'Der lokale Speicher deines Browsers ist voll, der Entwurf kann gerade nicht gesichert werden. Die Seite funktioniert weiter – lade das PDF herunter oder speichere das Markdown, um nichts zu verlieren.',
    storageOff: 'Kein lokaler Speicher, Entwurf wird nicht gesichert',
    imageBudget:
      'Die Bilder sind zusammen größer als 50 MB. Der Rest wird nicht lokal gespeichert und muss beim nächsten Mal erneut hineingezogen werden.',
    imageQuota:
      'Der lokale Speicher deines Browsers ist voll, daher wurden einige Bilder nicht gespeichert und müssen beim nächsten Mal erneut hineingezogen werden.',
    imageEmbedded: 'Bild {name} eingebettet',
    fileLoaded: '{name} geladen',
    pasteBlocked: 'Dein Browser erlaubt keinen Zugriff auf die Zwischenablage. Drück im Editor ⌘/Strg + V.',
    /** {name} */
    downloaded: '{name} gespeichert',
    unsupportedFile: 'Dateityp nicht unterstützt: {name}',

    diagramPending: 'Diagramm wird gerendert …',
    diagramError: 'Das Diagramm konnte nicht gerendert werden: {detail}',
    mathError: 'Die Formel konnte nicht gesetzt werden: {detail}',
    diagramErrorAt: 'Fehler im Diagramm in Zeile {line}',
    diagramErrorTitle: 'Fehler im Diagramm',
    diagramUnknown: 'Unbekannter Diagrammtyp „{name}“',
    diagramStale: 'Angezeigt wird die letzte Version, die sich rendern ließ',
    diagramCopySvg: 'SVG kopieren',
    diagramCopied: 'SVG in die Zwischenablage kopiert',
    diagramCopyFailed: 'Die Zwischenablage ist hier nicht verfügbar – lade das SVG stattdessen herunter',
    diagramDownloadSvg: 'SVG herunterladen',
    diagramDownloadPng: 'PNG herunterladen',
    diagramActions: 'Diagramm exportieren',
    remoteImage: 'Externe Bilder werden nicht geladen: {name}',
    missingImage: 'Bild nicht gefunden – zieh die Datei auf die Seite: {name}',
    tocTitle: 'Inhalt',
    pageBreak: 'Seitenumbruch',
    fromDocument: '(aus dem Dokument)',
    fromDocumentTitle: 'Vom Front Matter am Anfang des Dokuments festgelegt; dort ändern',
    frontMatterSyntax: 'Front Matter, Zeile {line}: nicht lesbar, ignoriert.',
    frontMatterValue: 'Front Matter, Zeile {line}: „{value}“ ist kein gültiger Wert für {key} und wurde ignoriert.',
    frontMatterUnclosed: 'Dem Front Matter am Anfang fehlt die schließende Zeile ---, daher wird es als normaler Text behandelt.',
  },

  sample: `# Beispieldokument von ${BRAND}

Dieser Markdown-PDF-Konverter **läuft komplett in deinem Browser**. Dein Dokument wird nie auf einen Server hochgeladen: Satz-Engine, Schriften und die Umwandlung selbst stecken in diesem Tab.

Links schreibst du, rechts folgt die Vorschau beim Tippen. Mit **PDF laden** oben rechts bekommst du die echte Datei – gesetzt mit Seitenumbrüchen, Seitenzahlen und Lesezeichen.

## Diagramme

\`\`\`mermaid
flowchart LR
  A[Markdown] --> B[Einlesen mit markdown-it]
  B --> C{Diagramme enthalten?}
  C -- ja --> D[SVG mit Mermaid rendern]
  C -- nein --> E[Typst-Quelltext erzeugen]
  D --> E
  E --> F[(PDF)]
\`\`\`

Diagramme werden als **Vektorgrafik** eingebettet: Sie bleiben beim Zoomen scharf, und der Text darin lässt sich markieren und durchsuchen.

## Text

*Kursiv*, **fett**, ***fett kursiv***, ~~durchgestrichen~~, \`Inline-Code\` und [Links](https://example.com) funktionieren. Die Typografie folgt der Sprache: „deutsche Anführungszeichen“, Umlaute wie in „Größenänderung“ und „Fußgängerübergänge“, Halbgeviertstriche in Bereichen wie 1990–2024 – und Wortungetüme wie Donaudampfschifffahrtsgesellschaftskapitän, die sauber umbrechen.

> Ein Zitatblock hebt eine Passage hervor.
>
> Er kann mehrere Absätze umfassen.

## Listen

1. Eine nummerierte Liste
2. Der zweite Punkt
   - Eine verschachtelte Aufzählung
   - Noch ein Punkt
3. Der dritte Punkt

- [x] Eine erledigte Aufgabe
- [ ] Etwas, das noch ansteht
- [ ] Noch eine offene Aufgabe

## Code

\`\`\`python
def fibonacci(n: int) -> int:
    """Die Hervorhebung kommt vom eingebauten syntect in Typst."""
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a
\`\`\`

## Tabellen

| Funktion | Hinweis | Status |
|:---------|:-------:|-------:|
| Deutscher Satz | Umlaute, ß, echte „Anführungszeichen“ | Unterstützt |
| Diagramme | Echte Vektorgrafik | Unterstützt |
| Formeln | Nativer Formelsatz, durchsuchbar | Unterstützt |

## Formeln

Formeln werden nativ gesetzt, bleiben also scharf und durchsuchbar: Die eulersche Identität $e^{i\\pi} + 1 = 0$ passt in einen Satz, größere Gleichungen bekommen eine eigene Zeile.

$$
x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
$$

## Fußnoten

Die Satz-Engine ist Typst[^1]; sie kümmert sich um Seitenumbruch, Inhaltsverzeichnis, Seitenzahlen und Lesezeichen.

[^1]: Ein modernes Satzsystem, das nach WebAssembly kompiliert im Browser läuft.

---

Die letzte Zeile.
`,
};

export default de;
