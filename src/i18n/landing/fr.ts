import type { LandingDictionary } from '../landing';

/*
 * French typography, as in ../fr.ts: U+00A0 (no-break space) before « : »,
 * inside « » and before units (%, Mo, €); U+202F (narrow no-break space)
 * before ; ? ! and as thousands separator. Written literally, like ../fr.ts.
 */

const fr: LandingDictionary<'fr'> = {
  hubHeading: 'Guides et cas d’usage',
  homeLink: 'Markdown en PDF',
  pages: {
    'chatgpt-to-pdf': {
      title: 'ChatGPT en PDF : exportez vos réponses gratuitement',
      description:
        'Exportez une réponse ChatGPT en PDF : copiez-la, collez-la ici, téléchargez. Tableaux, code et formules conservés. Gratuit, sans extension ni envoi.',
      h1: 'Exporter ChatGPT en PDF',
      lead: 'Copiez la réponse avec le bouton de ChatGPT, collez-la à gauche et téléchargez un PDF bien composé. Rien n’est envoyé.',
      navLabel: 'ChatGPT en PDF',
      navBlurb: 'enregistrer une réponse ChatGPT en PDF, avec ses tableaux, son code et ses formules',
      intro: [
        'Pour enregistrer une réponse ChatGPT en PDF, inutile de faire une capture d’écran ou d’imprimer la page du chat. Le bouton de copie sous chaque réponse place le texte dans le presse-papiers au format Markdown, avec ses titres, listes, tableaux, blocs de code et formules. C’est précisément ce que cette page attend : collez la réponse dans l’éditeur ci-dessus et cliquez sur <strong>Télécharger le PDF</strong>. Vous obtenez un vrai document, avec des titres, des numéros de page et du texte sélectionnable.',
        'La réponse collée est nettoyée automatiquement. ChatGPT écrit les formules entre <code>\\(…\\)</code> et <code>\\[…\\]</code> ; elles sont converties dans la forme standard <code>$…$</code> et <code>$$…$$</code>. Les marqueurs de citation entre crochets, les caractères invisibles de largeur nulle et les lignes parasites du type « Copier le code » sont supprimés, et les puces comme • deviennent de vraies listes. Les blocs de code ne sont jamais modifiés, et un message avec <strong>Annuler</strong> vous signale chaque changement.',
      ],
      howTo: {
        heading: 'Comment enregistrer une réponse ChatGPT en PDF',
        steps: [
          { name: 'Copiez la réponse.', text: 'Cliquez sur l’icône de copie sous la réponse de ChatGPT : elle copie la réponse au format Markdown.' },
          { name: 'Collez-la ici.', text: 'Collez-la dans l’éditeur Markdown de cette page. L’aperçu à droite affiche aussitôt le résultat.' },
          { name: 'Réglez la mise en page si besoin.', text: 'Dans Mise en page, choisissez le format du papier, les marges, la taille du texte, les numéros de page ou un sommaire.' },
          { name: 'Téléchargez le PDF.', text: 'Cliquez sur Télécharger le PDF. Le fichier est composé dans votre navigateur puis enregistré sur votre appareil.' },
        ],
      },
      sections: [
        {
          heading: 'Tableaux, code et formules intacts',
          body: [
            'Les tableaux restent des tableaux, avec l’alignement de leurs colonnes. Les blocs de code gardent leur indentation et reçoivent une coloration syntaxique. Les formules sont composées comme des mathématiques, au lieu de s’afficher en barres obliques inverses. Imprimer la page du chat depuis le navigateur, à l’inverse, embarque la barre latérale, les boutons et des sauts de page mal placés.',
          ],
        },
        {
          heading: 'Une réponse ou plusieurs',
          body: [
            'Cet outil n’exporte pas une conversation entière d’un seul clic : il transforme en document ce que vous collez. Collez plusieurs réponses à la suite, ajoutez vos propres titres ou notes entre elles, et vous obtenez un seul PDF, avec un sommaire si vous l’activez. Votre texte est enregistré comme brouillon dans ce navigateur : vous pouvez y revenir plus tard.',
          ],
        },
        {
          heading: 'Confidentiel par conception',
          body: [
            'Les réponses de ChatGPT contiennent souvent du travail en cours : code, contrats, fiches de révision. Ici, elles ne quittent jamais votre appareil : la conversion se fait entièrement dans cet onglet. La politique de sécurité du contenu de la page n’autorise que ce site et le compteur de visites sans cookies de Cloudflare, qui ne voit jamais votre texte.',
          ],
        },
      ],
      faq: [
        {
          question: 'Comment enregistrer toute une conversation ChatGPT en PDF ?',
          answer: [
            'Cet outil ne récupère pas la conversation tout seul : collez les réponses à conserver dans l’ordre, et ajoutez vous-même les questions sous forme de titres si vous le souhaitez. Pour une archive complète de tous vos échanges, l’export de données de ChatGPT (Paramètres → Contrôles des données → Exporter les données) vous envoie toutes les conversations, mais en HTML et JSON, pas en PDF mis en forme.',
          ],
        },
        {
          question: 'Comment copier une réponse ChatGPT sans perdre la mise en forme ?',
          answer: [
            'Utilisez l’icône de copie sous la réponse plutôt que de sélectionner le texte à la souris. Le bouton copie du Markdown : titres, tableaux et blocs de code sont conservés. Une sélection à la souris ne copie que du texte brut, et la structure est perdue.',
          ],
        },
        {
          question: 'Pourquoi les formules s’affichent-elles avec \\( \\) ?',
          answer: [
            'ChatGPT écrit les mathématiques avec les délimiteurs LaTeX <code>\\(…\\)</code> en ligne et <code>\\[…\\]</code> pour les équations centrées, que beaucoup d’outils Markdown ne comprennent pas. Quand vous collez ici, ils sont convertis automatiquement en <code>$…$</code> et <code>$$…$$</code>, puis les formules sont composées dans le PDF.',
          ],
        },
        {
          question: 'Les tableaux et le code sont-ils conservés ?',
          answer: [
            'Oui. Les tableaux gardent leurs colonnes et leur alignement, et les blocs de code leur indentation, avec une coloration syntaxique. Le nettoyage automatique ne touche jamais au contenu des blocs de code.',
          ],
        },
        {
          question: 'Est-ce que ça marche sur mobile ?',
          answer: [
            'Oui, dans tout navigateur mobile récent : copiez la réponse dans l’application ChatGPT, collez-la ici et téléchargez. Le moteur de composition (environ 7 Mo) est récupéré lors du premier téléchargement, puis gardé en cache.',
          ],
        },
        {
          question: 'Est-ce gratuit ? Ma conversation est-elle envoyée sur un serveur ?',
          answer: [
            'C’est gratuit, sans inscription, sans filigrane et sans limite. Et rien n’est envoyé : le texte est converti dans votre navigateur, jamais sur un serveur, y compris le nôtre. Il n’est conservé que comme brouillon dans ce navigateur, et <strong>Nouveau</strong> l’efface.',
          ],
        },
      ],
      sample: `# Calculer la mensualité d’un prêt immobilier

La mensualité $M$ d’un prêt à taux fixe dépend du capital emprunté $C$, du taux mensuel $t$ (le taux annuel divisé par 12) et du nombre de mensualités $n$ :

$$
M = \\frac{C \\cdot t}{1 - (1 + t)^{-n}}
$$

## Exemple chiffré

Prenons un emprunt de **200 000 €** à **3,5 %** par an, hors assurance.

| Durée | Mensualité | Coût total des intérêts |
|:------|-----------:|------------------------:|
| 15 ans | 1 429,77 € | 57 357,71 € |
| 20 ans | 1 159,92 € | 78 380,66 € |
| 25 ans | 1 001,25 € | 100 374,14 € |

Deux enseignements :

1. **Allonger la durée baisse la mensualité**, mais fait grimper le coût du crédit : passer de 15 à 25 ans coûte environ 43 000 € de plus.
2. **Le taux d’endettement reste la contrainte principale.** Les banques visent en général une mensualité inférieure à 35 % des revenus.

## Faire le calcul vous-même

\`\`\`python
def mensualite(capital: float, taux_annuel: float, annees: int) -> float:
    """Mensualité d'un prêt à taux fixe, hors assurance."""
    t = taux_annuel / 12
    n = annees * 12
    return capital * t / (1 - (1 + t) ** -n)

for annees in (15, 20, 25):
    print(annees, round(mensualite(200_000, 0.035, annees), 2))
\`\`\`

> **À retenir :** pour une durée donnée, chaque dixième de point de taux compte ; sur 20 ans, il représente près de 2 500 € d’intérêts en plus.

---

*Collé depuis une réponse de ChatGPT. Remplacez ce texte par le vôtre et cliquez sur **Télécharger le PDF**.*
`,
    },

    'gemini-to-pdf': {
      title: 'Gemini en PDF : convertir vos réponses Gemini gratuitement',
      description:
        'Convertissez une réponse Gemini en PDF : copiez-la, collez-la ici et téléchargez un PDF propre, avec tableaux, code et formules. Gratuit, rien n’est envoyé.',
      h1: 'Convertir Gemini en PDF',
      lead: 'Copiez une réponse de Google Gemini, collez-la à gauche et téléchargez un PDF propre, tableaux et code compris. Rien n’est envoyé.',
      navLabel: 'Gemini en PDF',
      navBlurb: 'exporter les réponses de Google Gemini en PDF bien composé',
      intro: [
        'Gemini sait envoyer une réponse vers Google Docs, d’où l’on peut ensuite exporter en PDF, mais ce chemin demande un compte Google, un détour par un traitement de texte et souvent quelques retouches de mise en forme. Copier la réponse et la coller ici va plus vite : le bouton de copie de Gemini copie du Markdown, et cette page transforme le Markdown en PDF proprement composé, en une seule étape, dans votre navigateur.',
        'Les tableaux gardent leurs colonnes, les blocs de code leur indentation et leur coloration, et les formules sont composées. Les résidus du chat, comme les caractères invisibles de largeur nulle, sont nettoyés au collage, avec un bouton <strong>Annuler</strong> si vous voulez retrouver le texte d’origine. Aucune extension de navigateur n’est nécessaire.',
      ],
      howTo: {
        heading: 'Comment exporter une réponse Gemini en PDF',
        steps: [
          { name: 'Copiez la réponse.', text: 'Utilisez l’option de copie sous la réponse de Gemini.' },
          { name: 'Collez-la ici.', text: 'Collez-la dans l’éditeur Markdown de cette page et vérifiez l’aperçu à droite.' },
          { name: 'Choisissez la mise en page.', text: 'Si vous le souhaitez, réglez le papier, les marges, les numéros de page ou le sommaire dans Mise en page.' },
          { name: 'Téléchargez le PDF.', text: 'Cliquez sur Télécharger le PDF : le fichier est composé dans votre navigateur.' },
        ],
      },
      sections: [
        {
          heading: 'Recherches et comparatifs faits pour être imprimés',
          body: [
            'Les réponses de Gemini sont souvent de longs comparatifs ou des plans : itinéraires de voyage, comparaisons de produits, synthèses de cours. En PDF, elles reçoivent de vrais titres, des numéros de page et un sommaire si vous le voulez, et les tableaux sont mis en page à la largeur de la page au lieu d’être coupés.',
          ],
        },
        {
          heading: 'Plusieurs réponses dans un seul fichier',
          body: [
            'Collez plusieurs réponses dans le même document, ajoutez vos propres notes entre elles et téléchargez le tout en un seul PDF. Votre texte est gardé comme brouillon dans ce navigateur, au cas où vous fermeriez l’onglet.',
          ],
        },
        {
          heading: 'Sans compte, sans envoi',
          body: [
            'Il n’y a rien à quoi se connecter. Le convertisseur tourne dans votre navigateur, et la page n’envoie jamais ce que vous collez à un serveur, quel qu’il soit.',
          ],
        },
      ],
      faq: [
        {
          question: 'Comment enregistrer une conversation Gemini en PDF ?',
          answer: [
            'Copiez les réponses qui vous intéressent, collez-les ici dans l’ordre et cliquez sur <strong>Télécharger le PDF</strong>. Cet outil ne récupère pas la conversation automatiquement : c’est vous qui choisissez ce qui entre dans le document, et vous pouvez ajouter vos questions sous forme de titres.',
          ],
        },
        {
          question: 'Et l’option « Exporter vers Docs » de Gemini ?',
          answer: [
            'Elle envoie une réponse dans Google Docs, depuis lequel vous pouvez télécharger un PDF. Cela suppose un compte Google et passe par un traitement de texte, où la mise en forme demande parfois des retouches. Ici, le Markdown copié devient directement un PDF composé, sans compte.',
          ],
        },
        {
          question: 'Pourquoi les tableaux de Gemini sont-ils coupés quand j’imprime la page ?',
          answer: [
            'Imprimer la page du chat imprime la page web, avec sa mise en page, ses panneaux latéraux et ses tableaux à défilement horizontal. Collé ici, le tableau fait partie d’un document mis en page pour le papier.',
          ],
        },
        {
          question: 'Le code et les formules de Gemini sont-ils pris en charge ?',
          answer: [
            'Oui. Les blocs de code sont colorés et jamais modifiés par le nettoyage ; les formules en <code>$…$</code>, <code>\\(…\\)</code> ou <code>\\[…\\]</code> sont composées.',
          ],
        },
        {
          question: 'Est-ce gratuit ?',
          answer: ['Oui : sans inscription, sans filigrane et sans limite sur le nombre de PDF.'],
        },
      ],
      sample: `# Pompe à chaleur ou chaudière gaz : que choisir ?

Voici une comparaison des coûts de chauffage pour une maison qui a besoin d’environ **12 000 kWh** de chaleur par an.

## En un coup d’œil

| Mode de chauffage | Rendement ou COP | Prix de l’énergie | Coût annuel |
|:------------------|-----------------:|------------------:|------------:|
| Chaudière gaz à condensation | 0,90 | 0,12 € / kWh | 1 600 € |
| Poêle à granulés | 0,85 | 0,09 € / kWh | 1 271 € |
| Pompe à chaleur air-eau | 3,2 | 0,25 € / kWh | 938 € |

Le coefficient de performance d’une pompe à chaleur est le rapport entre la chaleur produite $Q$ et l’électricité consommée $W$ :

$$
\\text{COP} = \\frac{Q}{W}
$$

Avec un COP de 3,2, chaque kWh d’électricité fournit donc 3,2 kWh de chaleur.

## Ce qui fait pencher la balance

- **L’isolation.** Une maison mal isolée fait baisser le COP réel en hiver.
- **Les aides.** Elles réduisent fortement le coût d’installation de la pompe à chaleur, ce qui raccourcit le retour sur investissement.
- **Le type d’émetteurs.** Des radiateurs basse température ou un plancher chauffant conviennent mieux qu’une installation prévue pour de l’eau très chaude.

## Estimer votre propre cas

\`\`\`javascript
function coutAnnuel(besoinKwh, rendement, prixKwh) {
  return (besoinKwh / rendement) * prixKwh;
}

const gaz = coutAnnuel(12000, 0.9, 0.12);
const pac = coutAnnuel(12000, 3.2, 0.25);
console.log(\`Économie annuelle : \${(gaz - pac).toFixed(0)} €\`);
\`\`\`

> Dans une maison correctement isolée, la pompe à chaleur coûte nettement moins cher à l’usage ; l’écart se joue surtout sur le prix d’installation.

---

*Collé depuis une réponse de Gemini. Remplacez ce texte par le vôtre et cliquez sur **Télécharger le PDF**.*
`,
    },

    'mermaid-to-pdf': {
      title: 'Diagrammes Mermaid en PDF : vectoriels et sélectionnables',
      description:
        'Convertissez un Markdown avec diagrammes Mermaid en PDF. Diagrammes vectoriels nets, texte sélectionnable, mis à la largeur de la page. Gratuit, sans envoi.',
      h1: 'Diagrammes Mermaid en PDF',
      lead: 'Écrivez ou collez du Markdown avec des blocs ```mermaid et téléchargez un PDF où chaque diagramme est vectoriel, avec un texte sélectionnable.',
      navLabel: 'Mermaid en PDF',
      navBlurb: 'des diagrammes vectoriels, au texte sélectionnable, dans le PDF',
      intro: [
        'Mermaid transforme quelques lignes de texte en organigrammes, diagrammes de séquence, diagrammes de Gantt et bien d’autres. C’est au moment de passer du Markdown au PDF que les choses se gâtent souvent : beaucoup de convertisseurs en ligne n’interprètent pas du tout Mermaid et impriment le code source, certains transforment la page entière en une seule grande image, et les outils qui passent par l’impression du navigateur dépendent des polices installées sur votre ordinateur.',
        'Ici, chaque bloc <code>```mermaid</code> est rendu en SVG dans votre navigateur puis intégré au PDF sous forme de graphique vectoriel natif. Le diagramme reste net à tous les niveaux de zoom, ses libellés se sélectionnent, se copient et se retrouvent avec la recherche, et les couleurs définies avec <code>classDef</code> ou <code>style</code> sont conservées telles que vous les avez écrites.',
      ],
      howTo: {
        heading: 'Comment exporter des diagrammes Mermaid en PDF',
        steps: [
          { name: 'Ajoutez vos diagrammes.', text: 'Collez votre Markdown, ou écrivez un bloc de code délimité dont le langage est mermaid.' },
          { name: 'Vérifiez l’aperçu.', text: 'Chaque diagramme s’affiche dans l’aperçu au fil de la frappe ; les erreurs de syntaxe sont signalées à leur place.' },
          { name: 'Téléchargez le PDF.', text: 'Cliquez sur Télécharger le PDF. Les diagrammes sont intégrés en graphiques vectoriels, avec le reste du document.' },
        ],
      },
      sections: [
        {
          heading: 'Vectoriel et sélectionnable, jamais une capture d’écran',
          body: [
            'Les diagrammes sont intégrés sous forme de tracés vectoriels et de texte, pas de pixels : ils s’impriment nettement à toutes les tailles et le fichier reste léger. La recherche de votre lecteur PDF trouve les mots à l’intérieur des diagrammes, et vous pouvez copier un libellé directement depuis un organigramme.',
          ],
        },
        {
          heading: 'À la taille de la page',
          body: [
            'Un diagramme garde sa taille naturelle s’il tient dans la page ; un diagramme trop large est réduit à la largeur du bloc de texte au lieu de déborder dans la marge, et un diagramme plus haut qu’une page est réduit pour tenir sur une page. Les libellés sont dessinés en texte SVG et non en HTML intégré, ce qui explique que d’autres exports affichent parfois des cases vides à la place des libellés.',
          ],
        },
        {
          heading: 'Tous les types de diagrammes courants',
          body: [
            'Organigrammes, diagrammes de séquence, de classes, d’états et entité-relation, diagrammes de Gantt, camemberts, cartes mentales, frises chronologiques et les autres types pris en charge par Mermaid sont rendus par Mermaid lui-même : la syntaxe est exactement celle que vous connaissez sur GitHub, GitLab, Obsidian ou Notion.',
          ],
        },
      ],
      faq: [
        {
          question: 'Pourquoi mon diagramme Mermaid s’affiche-t-il comme du code dans le PDF ?',
          answer: [
            'Le convertisseur utilisé n’interprète pas Mermaid et traite le bloc comme du code ordinaire. Ici, tout bloc délimité marqué <code>mermaid</code> est rendu en diagramme. Si la syntaxe est invalide, l’aperçu et le PDF affichent un encadré avec le message d’erreur de Mermaid, le numéro de ligne et la ligne fautive, et le reste du document s’affiche normalement.',
          ],
        },
        {
          question: 'Le diagramme est-il une image dans le PDF ?',
          answer: [
            'C’est un graphique vectoriel, pas une image matricielle. Il reste net au zoom, et son texte est du vrai texte, que l’on peut sélectionner et rechercher.',
          ],
        },
        {
          question: 'Les couleurs et les styles sont-ils conservés ?',
          answer: [
            'Oui. Les remplissages, les couleurs de contour et les épaisseurs de trait définis avec <code>classDef</code>, <code>class</code> ou <code>style</code> se retrouvent dans le PDF.',
          ],
        },
        {
          question: 'Puis-je exporter uniquement un diagramme, sans le reste du document ?',
          answer: [
            'Oui : mettez seulement le bloc <code>```mermaid</code> dans l’éditeur et téléchargez. Le PDF contient alors le diagramme seul, à sa taille naturelle ou réduit pour tenir dans la page. Pour l’utiliser ailleurs, survolez le diagramme dans l’aperçu : vous pouvez copier son SVG ou le télécharger en SVG ou en PNG.',
          ],
        },
        {
          question: 'Mon diagramme est-il envoyé sur un serveur de rendu ?',
          answer: [
            'Non. Mermaid tourne dans votre navigateur, tout comme le moteur PDF. La page n’envoie jamais votre document où que ce soit.',
          ],
        },
      ],
      sample: `# Diagrammes Mermaid dans un PDF

Chaque diagramme ci-dessous est rendu dans votre navigateur et intégré au PDF en **graphique vectoriel** : zoomez autant que vous voulez, sélectionnez ou recherchez le texte qu’il contient.

## Organigramme

\`\`\`mermaid
flowchart LR
  A[Demande de congés] --> B{Solde suffisant ?}
  B -- oui --> C[Validation du manager]
  B -- non --> D[Refus automatique]
  C --> E{Période chargée ?}
  E -- non --> F([Congés accordés])
  E -- oui --> G[Discussion avec l’équipe]
  G --> F
  classDef ok fill:#e3f5e8,stroke:#1f8a4c,stroke-width:2px
  classDef ko fill:#fdecea,stroke:#c62828
  class F ok
  class D ko
\`\`\`

## Diagramme de séquence

\`\`\`mermaid
sequenceDiagram
  participant C as Client
  participant S as Site marchand
  participant B as Banque
  C->>S: Valide le panier
  S->>B: Demande d’autorisation de 42 €
  B-->>C: Code de confirmation
  C->>B: Saisit le code
  B-->>S: Paiement accepté
  S-->>C: Commande confirmée
\`\`\`

## Diagramme de Gantt

\`\`\`mermaid
gantt
  title Déménagement des bureaux
  dateFormat YYYY-MM-DD
  section Préparation
    Choix des locaux      :done, p1, 2026-10-01, 14d
    Travaux               :active, p2, after p1, 21d
  section Installation
    Réseau et postes      :p3, after p2, 5d
    Emménagement          :milestone, after p3, 0d
\`\`\`

## Diagramme d’états

\`\`\`mermaid
stateDiagram-v2
  [*] --> Brouillon
  Brouillon --> Envoyée : envoi au client
  Envoyée --> Payée : paiement reçu
  Envoyée --> EnRetard : échéance dépassée
  EnRetard --> Payée : relance réussie
  Payée --> [*]
\`\`\`

Modifiez n’importe quel bloc à gauche, l’aperçu suit ; cliquez sur **Télécharger le PDF** pour obtenir le vrai fichier.
`,
    },
  },
};

export default fr;
