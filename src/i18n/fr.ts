import type { Messages } from './types';
import { BRAND } from './constants';

/*
 * French typography: U+00A0 (no-break space) before « : » and inside « »,
 * U+202F (narrow no-break space) before ; ? !. They are written as escapes so
 * they survive editors that normalise whitespace.
 */

const fr: Messages = {
  locale: {
    code: 'fr',
    lang: 'fr',
    hreflang: 'fr',
    ogLocale: 'fr_FR',
    nativeName: 'Français',
  },

  meta: {
    title: 'Convertir Markdown en PDF en ligne · Gratuit, avec Mermaid',
    description:
      'Convertissez Markdown en PDF gratuitement dans votre navigateur. Diagrammes Mermaid vectoriels, texte sélectionnable. Sans envoi, sans inscription ni filigrane.',
    ogTitle: 'Markdown en PDF dans votre navigateur · Diagrammes Mermaid vectoriels',
    ogDescription:
      'Transformez du Markdown en un PDF bien composé sans rien envoyer sur un serveur. Diagrammes Mermaid vectoriels, texte cherchable. Gratuit, sans inscription.',
    appDescription:
      'Convertit Markdown en PDF localement dans le navigateur, avec des diagrammes Mermaid en graphiques vectoriels et une typographie correcte pour de nombreuses écritures. Les documents ne sont jamais envoyés.',
    operatingSystem: 'Tout navigateur récent compatible WebAssembly',
    featureList: [
      'Diagrammes Mermaid intégrés en graphiques vectoriels, texte sélectionnable',
      'Typographie pour le latin accentué, le chinois, le japonais, le coréen, le cyrillique et le vietnamien',
      'Blocs de code avec coloration syntaxique',
      'Table des matières, numéros de page et signets PDF',
      'Aperçu en direct et brouillon enregistré automatiquement dans le navigateur',
      'Fonctionne en local : les documents ne sont jamais envoyés',
    ],
  },

  page: {
    privacyBadge: 'En local · aucun envoi · sans inscription · sans filigrane · hors ligne',
    privacyTitle:
      'L’analyse, la mise en page et la génération du PDF se font dans cet onglet. Votre document ne quitte jamais votre appareil.',
    newDoc: 'Nouveau',
    newDocTitle: 'Nouveau document vierge (efface aussi le brouillon enregistré)',
    open: 'Ouvrir',
    openTitle: 'Ouvrir un fichier .md',
    layout: 'Mise en page',
    layoutTitle: 'Réglages de mise en page',
    downloadTitle: 'Télécharger le PDF (⌘/Ctrl + S)',
    printTitle: 'Imprimer le PDF composé (⌘/Ctrl + P)',
    language: 'Langue',
    paper: 'Papier',
    margin: 'Marges',
    fontSize: 'Taille du texte',
    lineHeight: 'Interligne',
    pageNumbers: 'Numéros de page',
    toc: 'Sommaire',
    justify: 'Justifier',
    docLanguage: 'Langue du document',
    template: 'Modèle',
    templateDefault: 'Par défaut',
    templateReport: 'Rapport',
    templateAcademic: 'Académique',
    templateResume: 'CV',
    templateLetter: 'Lettre',
    cover: 'Page de titre',
    h1NewPage: 'Nouvelle page à chaque H1',
    header: 'En-tête',
    footer: 'Pied de page',
    bandTitle: 'Variables : {title} {page} {pages} {date} {author}. Séparez gauche | centre | droite par |. Vide : celui du modèle ; none : aucun.',
    editorHint: 'Déposez ici un fichier .md ou des images',
    editorLabel: 'Source Markdown',
    editorPlaceholder: 'Saisissez ou collez du Markdown ici, ou déposez un fichier .md…',
    preview: 'Aperçu',
    dropHint: 'Relâchez pour importer',
    source: 'Source',
    proof: 'Épreuve',
    live: 'En direct',
    viewSwitch: 'Afficher',
    fullscreen: 'Édition plein écran',
    heroTitle: 'Markdown en PDF',
    heroTagline: ' : composé dans votre navigateur.',
    heroLead: 'Collez ou déposez du Markdown et téléchargez un PDF correctement composé, avec des diagrammes Mermaid vectoriels. Votre document ne quitte jamais le navigateur.',
    aboutToggle: `À propos de ${BRAND}`,
    emptyTitle: 'Collez du Markdown, déposez un fichier .md ou ouvrez-en un',
    paste: 'Coller',
    pasteTitle: 'Coller du Markdown depuis le presse-papiers',
  },

  about: {
    heading: 'Convertir Markdown en PDF dans votre navigateur',
    intro: [
      'Collez ou déposez un fichier Markdown, regardez l’aperçu se mettre à jour pendant que vous tapez, puis cliquez sur <strong>Télécharger le PDF</strong> pour obtenir un fichier proprement composé. L’aperçu est instantané ; le PDF est produit par un vrai moteur de composition typographique, avec sauts de page, numéros de page et table des matières en option.',
      'Aucun serveur n’intervient. L’analyse du Markdown, le rendu des diagrammes, la mise en page et la génération du PDF se déroulent dans cet onglet. C’est un convertisseur Markdown en PDF en ligne et gratuit, sans inscription, sans filigrane et sans limite d’utilisation. Ce que vous écrivez est enregistré automatiquement dans votre propre navigateur : fermer l’onglet ne vous fait rien perdre. Rien n’est jamais envoyé, et <strong>Nouveau</strong> ou l’effacement des données du site suffit à tout supprimer.',
    ],
    sections: [
      {
        heading: 'Des diagrammes Mermaid vectoriels, pas des captures d’écran',
        body: [
          'Les blocs <code>```mermaid</code> sont rendus en SVG puis intégrés au PDF sous forme de graphiques vectoriels natifs. Ils restent nets quel que soit le zoom, leur texte se sélectionne, se copie et se recherche, et les remplissages, contours et épaisseurs définis avec <code>classDef</code> sont conservés tels quels. Beaucoup de convertisseurs en ligne n’affichent pas Mermaid et impriment simplement le code ; certains transforment la page entière en image, où plus rien ne se sélectionne.',
        ],
      },
      {
        heading: 'Une typographie qui respecte votre écriture',
        body: [
          'Le texte est intégré comme du vrai texte, sélectionnable et cherchable, et les polices sont automatiquement réduites aux caractères utilisés pour garder des fichiers légers. Accents, cédilles, ligatures comme « œ » et guillemets français sont composés correctement, et en plus de l’alphabet latin, le chinois (simplifié et traditionnel), le japonais, le coréen, le cyrillique et le vietnamien sont pris en charge avec des polices conçues pour eux. Si un document contient des caractères rares absents du sous-ensemble compact, la police complète est chargée automatiquement au lieu d’afficher des carrés vides.',
        ],
      },
      {
        heading: 'Un vrai moteur de composition',
        body: [
          'Sous le capot tourne Typst, un système de composition typographique moderne compilé en WebAssembly pour s’exécuter dans le navigateur. Il gère la pagination, les veuves et orphelines, la table des matières, les numéros de page, les notes de bas de page et les signets PDF, et colore le code avec son surligneur intégré. Le moteur pèse environ 7 Mo : il se charge discrètement en arrière-plan pendant que vous écrivez, reste en cache sur votre appareil et fonctionne ensuite hors ligne.',
        ],
      },
      {
        heading: 'Markdown pris en charge',
        body: [
          'Titres, paragraphes, gras, italique, barré, code en ligne, liens, images, listes numérotées et à puces, listes imbriquées, listes de tâches, citations, tableaux avec alignement des colonnes, listes de définitions, notes de bas de page, séparateurs horizontaux, blocs de code avec coloration syntaxique et diagrammes Mermaid. Les images peuvent être glissées dans la page ou collées depuis le presse-papiers. Les formules mathématiques en syntaxe LaTeX sont aussi prises en charge : dans le texte avec <code>$...$</code>, centrées avec <code>$$...$$</code> ou un bloc <code>```math</code>.',
        ],
      },
    ],
    faqHeading: 'Questions fréquentes',
    faq: [
      {
        question: 'Mon document est-il envoyé sur un serveur ?',
        answer: [
          'Non. L’analyse, la mise en page et la génération du PDF se font dans votre navigateur. Votre texte, vos images et le PDF ne quittent jamais votre appareil. La politique de sécurité du contenu (CSP) du site n’autorise les connexions qu’au site lui-même et au compteur de visites anonyme et sans cookies de Cloudflare, qui enregistre les pages consultées sans jamais recevoir votre document ; votre navigateur bloque toute autre destination.',
        ],
      },
      {
        question: 'Mon texte est-il toujours là après avoir fermé la page ?',
        answer: [
          'Oui. Dès que vous modifiez un document, le texte, les réglages de mise en page et les images déposées sont enregistrés automatiquement dans le stockage local de votre navigateur, puis restaurés à la visite suivante. Le brouillon n’existe que dans ce navigateur, sur cet appareil ; il n’est jamais envoyé ni synchronisé. Cliquez sur <strong>Nouveau</strong> ou effacez les données du site pour le supprimer.',
        ],
      },
      {
        question: 'Les diagrammes Mermaid sont-ils pris en charge ?',
        answer: [
          'Oui. Les diagrammes sont intégrés au PDF en graphiques vectoriels : ils restent nets au zoom, leur texte reste sélectionnable et cherchable, et les couleurs personnalisées avec <code>classDef</code> sont conservées.',
        ],
      },
      {
        question: 'Les accents et les autres écritures s’affichent-ils correctement ?',
        answer: [
          'Oui. Les accents, la cédille, « œ » et les guillemets « » sont composés avec des polices complètes, et le chinois (simplifié et traditionnel), le japonais, le coréen, le cyrillique et le vietnamien sont également pris en charge. Tout est intégré comme du vrai texte que vous pouvez sélectionner, copier et rechercher. Les polices de ces écritures ne sont téléchargées que si un document en a besoin, et les caractères rares basculent automatiquement vers la police complète au lieu d’apparaître en carrés vides.',
        ],
      },
      {
        question: 'Pourquoi l’aperçu diffère-t-il légèrement du PDF ?',
        answer: [
          'L’aperçu est du HTML affiché directement par votre navigateur, pour suivre chaque frappe au clavier. Le PDF est composé par le moteur Typst : ce sont les sauts de page, coupures de ligne et espacements du fichier téléchargé qui font foi. Le contenu, la structure et les styles sont identiques dans les deux.',
        ],
      },
      {
        question: 'Combien de temps prend le premier PDF ?',
        answer: [
          'La page elle-même ne pèse que quelques dizaines de kilo-octets et s’ouvre instantanément. Le moteur de composition fait environ 7 Mo et se télécharge discrètement en arrière-plan une fois la page chargée, en général avant que vous ayez fini d’écrire ; la barre d’état en bas indique où il en est. Il reste en cache sur votre appareil, si bien que les conversions suivantes fonctionnent aussi hors ligne.',
        ],
      },
      {
        question: 'Faut-il s’inscrire ou payer ? Y a-t-il un filigrane ?',
        answer: [
          'Rien de tout cela. L’outil est une page web statique, sans compte ni serveur applicatif, et le PDF ne porte aucun filigrane.',
        ],
      },
      {
        question: 'Les formules mathématiques sont-elles prises en charge ?',
        answer: [
          'Oui. Écrivez <code>$...$</code> pour une formule dans le texte et <code>$$...$$</code> (ou un bloc <code>```math</code>) pour une équation centrée, en syntaxe LaTeX. Typst les compose nativement : le PDF contient de vraies formules, cherchables, et non des images, et une formule erronée est signalée à elle seule, sans toucher au reste du document.',
        ],
      },
      {
        question: 'Puis-je utiliser des balises HTML ?',
        answer: [
          'Seulement <code>&lt;br&gt;</code>. Le moteur de composition n’a pas d’équivalent au HTML : plutôt que de produire un résultat qui n’en a que l’apparence, les autres balises sont ignorées et signalées.',
        ],
      },
    ],
    footer:
      `<strong class="colophon-mark"><span class="brand-free">free</span>md2pdf.com</strong> · Markdown en PDF dans votre navigateur, avec des diagrammes Mermaid vectoriels. Rien n’est envoyé.`,
    languagesHeading: 'Langues',
  },

  ui: {
    words: { one: '{n} mot', many: '{n} de mots', other: '{n} mots' },
    lines: { one: '{n} ligne', many: '{n} de lignes', other: '{n} lignes' },
    paperHint: '{paper} · la pagination finale est celle du PDF',

    engineIdle: 'Moteur PDF en veille',
    engineWillLoad: 'Le moteur PDF se chargera en arrière-plan (environ 7 Mo)',
    engineCached: 'Moteur PDF en cache',
    engineDownloading: 'Chargement du moteur PDF en arrière-plan {pct} %',
    engineStarting: 'Démarrage du moteur PDF…',
    engineFonts: 'Chargement des polices…',
    engineReady: 'Moteur PDF prêt · fonctionne hors ligne',
    engineFailed: 'Échec du chargement du moteur PDF ; nouvel essai au téléchargement',
    networkFailed: 'La connexion a été interrompue pendant le téléchargement des polices ou du moteur de composition, malgré de nouvelles tentatives. Vérifiez votre connexion et réessayez.',

    download: 'Télécharger le PDF',
    downloadGenerating: 'Génération…',
    downloadEngine: 'Moteur {pct} %',
    downloadStarting: 'Démarrage…',
    downloadFonts: 'Polices…',
    downloadTypesetting: 'Composition…',
    print: 'Imprimer',
    printInTab: 'Le PDF est ouvert dans un nouvel onglet : imprimez-le depuis celui-ci.',
    printBlocked: 'Le navigateur a bloqué le nouvel onglet. Ouvrez le PDF et imprimez-le depuis celui-ci.',
    printOpen: 'Ouvrir le PDF',

    missingGlyphs: 'Ces caractères ne sont pas couverts par les polices et risquent de ne pas s’afficher : {chars}',
    pdfFailed: 'La génération du PDF a échoué : {detail}',
    pdfFailedShort: 'La génération du PDF a échoué',
    initFailed: 'La page n’a pas pu démarrer : {detail}',

    close: 'Fermer',
    undo: 'Annuler',
    cleared: 'Document vidé ; le brouillon enregistré a été supprimé',
    langAuto: 'Automatique · {detected}',
    aiCleaned: 'La mise en forme de la réponse d’IA collée a été nettoyée',
    draftNotSample: 'Votre brouillon enregistré est affiché, pas l’exemple de cette page',
    loadExample: 'Charger l’exemple',
    exampleLoaded: 'Exemple chargé ; votre brouillon est conservé tant que vous ne modifiez rien',
    otherTab: 'Ce document a été modifié dans un autre onglet',
    loadLatest: 'Charger la dernière version',
    syncedFromTab: 'Synchronisé depuis un autre onglet',
    syncedFromTabTitle: 'Un autre onglet a enregistré une version plus récente ; cet onglet l’affiche désormais',
    saved: 'Enregistré dans ce navigateur',
    savedTitle: 'Enregistré à {time} · le brouillon reste dans ce navigateur et n’est jamais envoyé',
    restored: 'Brouillon restauré',
    restoredTitle: 'Le brouillon reste dans ce navigateur et n’est jamais envoyé ; cliquez sur Nouveau pour l’effacer',
    quotaState: 'Stockage plein ; brouillon non enregistré',
    quotaNotice:
      'Le stockage local de votre navigateur est plein : le brouillon ne peut pas être enregistré pour l’instant. La page reste utilisable ; téléchargez le PDF ou enregistrez le Markdown pour ne rien perdre.',
    storageOff: 'Stockage local indisponible ; le brouillon ne sera pas enregistré',
    imageBudget:
      'Les images dépassent 50 Mo au total. Le surplus ne sera pas enregistré localement et devra être redéposé la prochaine fois.',
    imageQuota:
      'Le stockage local de votre navigateur est plein : certaines images n’ont pas été enregistrées et devront être redéposées la prochaine fois.',
    imageEmbedded: 'Image intégrée : {name}',
    fileLoaded: 'Fichier ouvert : {name}',
    pasteBlocked: 'Le navigateur n’a pas autorisé la lecture du presse-papiers. Appuyez sur ⌘/Ctrl + V dans l’éditeur.',
    /** {name} */
    downloaded: '{name} enregistré',
    unsupportedFile: 'Type de fichier non pris en charge : {name}',

    diagramPending: 'Rendu du diagramme…',
    diagramError: 'Impossible de rendre le diagramme : {detail}',
    mathError: 'Impossible de composer la formule : {detail}',
    diagramErrorAt: 'Erreur dans le diagramme, ligne {line}',
    diagramErrorTitle: 'Erreur dans le diagramme',
    diagramUnknown: 'Type de diagramme inconnu : « {name} »',
    diagramStale: 'Dernière version rendue avec succès',
    diagramCopySvg: 'Copier le SVG',
    diagramCopied: 'SVG copié dans le presse-papiers',
    diagramCopyFailed: 'Le presse-papiers n’est pas disponible ici ; téléchargez le SVG',
    diagramDownloadSvg: 'Télécharger le SVG',
    diagramDownloadPng: 'Télécharger le PNG',
    diagramActions: 'Exporter le diagramme',
    remoteImage: 'Les images distantes ne sont pas chargées : {name}',
    missingImage: 'Image introuvable, déposez le fichier sur la page : {name}',
    tocTitle: 'Sommaire',
    pageBreak: 'Saut de page',
    fromDocument: '(du document)',
    fromDocumentTitle: 'Défini par le front matter en tête du document ; modifiez-le là',
    frontMatterSyntax: 'Front matter, ligne {line} : illisible, ignorée.',
    frontMatterValue: 'Front matter, ligne {line} : « {value} » n’est pas une valeur valide pour {key} ; ignorée.',
    frontMatterUnclosed: 'Le front matter en tête n’a pas de ligne --- de fermeture : il est traité comme du texte ordinaire.',
  },

  sample: `# Document d’exemple ${BRAND}

Ce convertisseur Markdown en PDF **fonctionne entièrement dans votre navigateur**. Votre document n’est jamais envoyé sur un serveur : le moteur de composition, les polices et la conversion elle-même se trouvent dans cet onglet.

Modifiez à gauche, l’aperçu à droite suit au fil de la frappe. Cliquez sur **Télécharger le PDF**, en haut à droite, pour obtenir le vrai fichier, composé avec sauts de page, numéros de page et signets.

## Diagrammes

\`\`\`mermaid
flowchart LR
  A[Markdown] --> B[Analyse par markdown-it]
  B --> C{Des diagrammes ?}
  C -- oui --> D[Rendu SVG par Mermaid]
  C -- non --> E[Génération du code Typst]
  D --> E
  E --> F[(PDF)]
\`\`\`

Les diagrammes sont intégrés en **vectoriel** : ils restent nets au zoom, et leur texte se sélectionne et se recherche.

## Texte

L’*italique*, le **gras**, le ***gras italique***, le ~~barré~~, le \`code en ligne\` et les [liens](https://example.com) fonctionnent. La typographie suit la langue : « guillemets français », espaces insécables avant les signes doubles ; ligatures comme dans « cœur » et « œuvre » ! Vraiment ?

> Une citation met un passage en valeur.
>
> Elle peut compter plusieurs paragraphes.

## Listes

1. Une liste numérotée
2. Le deuxième élément
   - Une liste à puces imbriquée
   - Un autre élément
3. Le troisième élément

- [x] Une tâche terminée
- [ ] Quelque chose à faire
- [ ] Encore une tâche

## Code

\`\`\`python
def fibonacci(n: int) -> int:
    """La coloration vient de syntect, intégré à Typst."""
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a
\`\`\`

## Tableaux

| Fonction | Détails | État |
|:---------|:-------:|-----:|
| Accents et œ | Vrai texte, cherchable | Disponible |
| Diagrammes | Graphiques vectoriels natifs | Disponible |
| Formules | Composition native, cherchable | Disponible |

## Formules

Les formules sont composées nativement : elles restent nettes et se recherchent comme du texte. L’identité d’Euler $e^{i\\pi} + 1 = 0$ tient dans une phrase, les équations plus longues ont leur propre ligne.

$$
x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
$$

## Notes de bas de page

Le moteur de composition est Typst[^1], qui gère la pagination, la table des matières, les numéros de page et les signets.

[^1]: Un système de composition typographique moderne qui tourne dans le navigateur une fois compilé en WebAssembly.

---

La dernière ligne.
`,
};

export default fr;
