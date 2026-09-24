import type { Messages } from './types';
import { BRAND } from './constants';

const es: Messages = {
  locale: {
    code: 'es',
    lang: 'es',
    hreflang: 'es',
    ogLocale: 'es_ES',
    nativeName: 'Español',
  },

  meta: {
    title: 'Convertir Markdown a PDF online · Gratis, con Mermaid',
    description:
      'Convierte Markdown a PDF gratis en tu navegador. Diagramas Mermaid vectoriales con texto seleccionable. Sin subir archivos, sin registro, sin marca de agua.',
    ogTitle: 'Markdown a PDF en tu navegador · Diagramas Mermaid vectoriales',
    ogDescription:
      'Convierte Markdown en un PDF bien maquetado sin subirlo a ningún servidor. Diagramas Mermaid vectoriales y texto que se puede buscar. Gratis y sin registro.',
    appDescription:
      'Convierte Markdown a PDF de forma local en el navegador, con diagramas Mermaid como gráficos vectoriales y una tipografía correcta para muchos alfabetos. Los documentos nunca se suben.',
    operatingSystem: 'Cualquier navegador moderno compatible con WebAssembly',
    featureList: [
      'Diagramas Mermaid incrustados como gráficos vectoriales con texto seleccionable',
      'Tipografía para textos latinos con acentos, chino, japonés, coreano, cirílico y vietnamita',
      'Bloques de código con resaltado de sintaxis',
      'Índice, números de página y marcadores PDF',
      'Vista previa en vivo y guardado automático del borrador en el navegador',
      'Funciona en local; los documentos nunca se suben',
    ],
  },

  page: {
    privacyBadge: 'En local · sin subir nada · sin registro · sin marca de agua · funciona sin conexión',
    privacyTitle:
      'El análisis, la maquetación y la generación del PDF ocurren en esta pestaña. Tu documento nunca sale de tu dispositivo.',
    newDoc: 'Nuevo',
    newDocTitle: 'Nuevo documento en blanco (también borra el borrador guardado)',
    open: 'Abrir',
    openTitle: 'Abrir un archivo .md',
    layout: 'Diseño',
    layoutTitle: 'Diseño de página',
    downloadTitle: 'Descargar PDF (⌘/Ctrl + S)',
    printTitle: 'Imprimir el PDF maquetado (⌘/Ctrl + P)',
    language: 'Idioma',
    paper: 'Papel',
    margin: 'Márgenes',
    fontSize: 'Tamaño de letra',
    lineHeight: 'Interlineado',
    pageNumbers: 'Números de página',
    toc: 'Índice',
    justify: 'Justificar',
    docLanguage: 'Idioma del documento',
    template: 'Plantilla',
    templateDefault: 'Predeterminada',
    templateReport: 'Informe',
    templateAcademic: 'Académica',
    templateResume: 'Currículum',
    templateLetter: 'Carta',
    cover: 'Portada',
    h1NewPage: 'Cada H1 en página nueva',
    header: 'Encabezado',
    footer: 'Pie de página',
    bandTitle: 'Variables: {title} {page} {pages} {date} {author}. Usa | para separar izquierda | centro | derecha. Vacío usa el de la plantilla; none lo oculta.',
    editorHint: 'Arrastra aquí un archivo .md o imágenes',
    editorLabel: 'Código Markdown',
    editorPlaceholder: 'Escribe o pega Markdown aquí, o arrastra un archivo .md…',
    preview: 'Vista previa',
    dropHint: 'Suelta para importar',
    source: 'Fuente',
    proof: 'Prueba',
    live: 'En vivo',
    viewSwitch: 'Mostrar',
    fullscreen: 'Edición a pantalla completa',
    heroTitle: 'Markdown a PDF',
    heroTagline: ': maquetado en tu navegador.',
    heroLead: 'Pega o arrastra Markdown y descarga un PDF bien compuesto, con los diagramas Mermaid en vectorial. Tu documento nunca sale del navegador.',
    aboutToggle: `Acerca de ${BRAND}`,
    emptyTitle: 'Pega Markdown, arrastra un archivo .md o abre uno',
    paste: 'Pegar',
    pasteTitle: 'Pegar Markdown desde el portapapeles',
  },

  about: {
    heading: 'Convertir Markdown a PDF en tu navegador',
    intro: [
      'Pega o arrastra un archivo Markdown, mira cómo la vista previa se actualiza mientras escribes y pulsa <strong>Descargar PDF</strong> para obtener un archivo bien maquetado. La vista previa es instantánea; el PDF lo genera un motor de composición tipográfica de verdad, con saltos de página, números de página e índice opcional.',
      'No interviene ningún servidor. El análisis del Markdown, el dibujo de los diagramas, la maquetación y la generación del PDF se hacen en esta pestaña. Sin registro, sin marca de agua y sin límite de uso: un conversor de Markdown a PDF online y gratis en el que tu documento no sale del navegador. Lo que escribes se guarda automáticamente en tu propio navegador, así que cerrar la pestaña no te hace perder nada; nunca se sube, y con <strong>Nuevo</strong> o borrando los datos de este sitio desaparece.',
    ],
    sections: [
      {
        heading: 'Diagramas Mermaid vectoriales, no capturas de pantalla',
        body: [
          'Los bloques <code>```mermaid</code> se convierten en SVG y se incrustan en el PDF como gráficos vectoriales nativos. Se ven nítidos con cualquier zoom, el texto que contienen se puede seleccionar, copiar y buscar, y los rellenos, trazos y grosores definidos con <code>classDef</code> se conservan intactos. Muchos conversores online no renderizan Mermaid y se limitan a imprimir el código; algunos convierten la página entera en una imagen en la que no se puede seleccionar nada.',
        ],
      },
      {
        heading: 'Tipografía que respeta tu idioma',
        body: [
          'El texto se incrusta como texto real, seleccionable y con búsqueda, y las fuentes se reducen automáticamente a los caracteres usados para que los archivos pesen poco. Las tildes, la ñ y los signos de apertura ¿ y ¡ se componen correctamente, y además del alfabeto latino se admiten el chino (simplificado y tradicional), el japonés, el coreano, el cirílico y el vietnamita, cada uno con fuentes pensadas para él. Si un documento usa caracteres poco comunes que no están en el subconjunto compacto, se carga automáticamente la fuente completa en lugar de imprimir cuadros vacíos.',
        ],
      },
      {
        heading: 'Un motor tipográfico de verdad',
        body: [
          'Por dentro funciona Typst, un sistema moderno de composición tipográfica compilado a WebAssembly para que se ejecute en el navegador. Se encarga de la paginación, las líneas viudas y huérfanas, el índice, los números de página, las notas al pie y los marcadores del PDF, y resalta el código con su resaltador integrado. El motor ocupa unos 7 MB: se carga en segundo plano, sin que lo notes, mientras escribes; queda guardado en tu dispositivo y a partir de entonces funciona sin conexión.',
        ],
      },
      {
        heading: 'Markdown compatible',
        body: [
          'Títulos, párrafos, negrita, cursiva, tachado, código en línea, enlaces, imágenes, listas numeradas y con viñetas, listas anidadas, listas de tareas, citas, tablas con alineación de columnas, listas de definiciones, notas al pie, líneas horizontales, bloques de código con resaltado de sintaxis y diagramas Mermaid. Las imágenes se pueden arrastrar o pegar desde el portapapeles. También se admiten fórmulas matemáticas en sintaxis LaTeX: en línea con <code>$...$</code> y destacadas con <code>$$...$$</code> o bloques <code>```math</code>.',
        ],
      },
    ],
    faqHeading: 'Preguntas frecuentes',
    faq: [
      {
        question: '¿Se sube mi documento a algún servidor?',
        answer: [
          'No. El análisis, la maquetación y la generación del PDF ocurren en tu navegador. La política de seguridad de contenido (CSP) del sitio prohíbe las peticiones de red a cualquier lugar que no sea el propio sitio, así que «no se sube nada» no es una promesa, sino una restricción que aplica tu navegador.',
        ],
      },
      {
        question: '¿Sigue ahí mi trabajo si cierro la página?',
        answer: [
          'Sí. En cuanto editas un documento, el texto, los ajustes de diseño y las imágenes que hayas arrastrado se guardan automáticamente en el almacenamiento local de tu navegador y se recuperan en tu próxima visita. El borrador solo existe en este navegador de este dispositivo; nunca se sube ni se sincroniza. Pulsa <strong>Nuevo</strong> o borra los datos de este sitio para eliminarlo.',
        ],
      },
      {
        question: '¿Admite diagramas Mermaid?',
        answer: [
          'Sí. Los diagramas se incrustan en el PDF como gráficos vectoriales: siguen nítidos al ampliar, su texto se puede seleccionar y buscar, y los colores personalizados con <code>classDef</code> se conservan.',
        ],
      },
      {
        question: '¿Se ven bien los acentos y otros alfabetos?',
        answer: [
          'Sí. Las tildes, la diéresis, la ñ y los signos ¿ y ¡ se componen con fuentes completas, y también se admiten el chino (simplificado y tradicional), el japonés, el coreano, el cirílico y el vietnamita. Todo se incrusta como texto real que puedes seleccionar, copiar y buscar. Las fuentes de esos alfabetos solo se descargan cuando un documento las necesita, y los caracteres poco comunes pasan automáticamente a la fuente completa en lugar de mostrar cuadros vacíos.',
        ],
      },
      {
        question: '¿Por qué la vista previa se ve un poco distinta del PDF?',
        answer: [
          'La vista previa es HTML que dibuja directamente tu navegador, para poder seguir el ritmo de cada pulsación. El PDF lo compone el motor Typst, y los saltos de página, los cortes de línea y el espaciado son los del archivo descargado. El contenido, la estructura y los estilos son los mismos en ambos.',
        ],
      },
      {
        question: '¿Cuánto tarda el primer PDF?',
        answer: [
          'La página en sí pesa apenas unas decenas de kilobytes y se abre al instante. El motor tipográfico ocupa unos 7 MB y se descarga discretamente en segundo plano después de cargar la página, normalmente antes de que termines de escribir; la barra de estado inferior indica cómo va. Con el modo de ahorro de datos o una conexión lenta no se descarga por adelantado, sino la primera vez que descargas un PDF. Queda guardado en tu dispositivo, así que las conversiones siguientes también funcionan sin conexión.',
        ],
      },
      {
        question: '¿Hay que registrarse o pagar? ¿Lleva marca de agua?',
        answer: [
          'Nada de eso. La herramienta es una página web estática, sin cuentas ni servidor propio, y el PDF no lleva marca de agua.',
        ],
      },
      {
        question: '¿Admite fórmulas matemáticas?',
        answer: [
          'Sí. Escribe <code>$...$</code> para fórmulas en línea y <code>$$...$$</code> (o un bloque <code>```math</code>) para ecuaciones destacadas, con sintaxis LaTeX. Typst las compone de forma nativa, así que el PDF contiene fórmulas reales y con búsqueda, no imágenes, y una fórmula con un error se marca por separado sin afectar al resto del documento.',
        ],
      },
      {
        question: '¿Puedo usar etiquetas HTML?',
        answer: [
          'Solo <code>&lt;br&gt;</code>. El motor tipográfico no tiene equivalente para el HTML, así que, en lugar de producir algo que solo lo parezca, las demás etiquetas se omiten con un aviso.',
        ],
      },
    ],
    footer:
      `<strong>${BRAND}</strong> · Markdown a PDF en tu navegador, con diagramas Mermaid vectoriales. No se sube nada.`,
    languagesHeading: 'Idiomas',
  },

  ui: {
    words: { one: '{n} palabra', many: '{n} de palabras', other: '{n} palabras' },
    lines: { one: '{n} línea', many: '{n} de líneas', other: '{n} líneas' },
    paperHint: '{paper} · la paginación final es la del PDF',

    engineIdle: 'Motor PDF en espera',
    engineWillLoad: 'El motor PDF se cargará en segundo plano (unos 7 MB)',
    engineCached: 'Motor PDF en caché',
    engineDownloading: 'Cargando el motor PDF en segundo plano {pct}%',
    engineStarting: 'Iniciando el motor PDF…',
    engineFonts: 'Cargando fuentes…',
    engineReady: 'Motor PDF listo · funciona sin conexión',
    engineSaveData: 'Ahorro de datos: el motor PDF se carga al descargar',
    engineFailed: 'No se pudo cargar el motor PDF; se reintentará al descargar',

    download: 'Descargar PDF',
    downloadGenerating: 'Generando…',
    downloadEngine: 'Cargando motor {pct}%',
    downloadStarting: 'Iniciando motor…',
    downloadFonts: 'Cargando fuentes…',
    downloadTypesetting: 'Maquetando…',
    print: 'Imprimir',
    printInTab: 'El PDF se ha abierto en una pestaña nueva; imprímelo desde ahí.',
    printBlocked: 'El navegador ha bloqueado la pestaña nueva. Abre el PDF e imprímelo desde ahí.',
    printOpen: 'Abrir PDF',

    missingGlyphs: 'Estos caracteres no están en las fuentes y puede que no se vean: {chars}',
    pdfFailed: 'No se pudo generar el PDF: {detail}',
    pdfFailedShort: 'No se pudo generar el PDF',
    initFailed: 'La página no se pudo iniciar: {detail}',

    close: 'Cerrar',
    undo: 'Deshacer',
    cleared: 'Documento vacío; se borró el borrador guardado',
    langAuto: 'Automático · {detected}',
    aiCleaned: 'Se ha limpiado el formato de la respuesta de IA pegada',
    draftNotSample: 'Se muestra tu borrador guardado, no el ejemplo de esta página',
    loadExample: 'Cargar ejemplo',
    exampleLoaded: 'Ejemplo cargado; tu borrador se conserva hasta que edites',
    otherTab: 'Este documento se modificó en otra pestaña',
    loadLatest: 'Cargar lo último',
    syncedFromTab: 'Sincronizado desde otra pestaña',
    syncedFromTabTitle: 'Otra pestaña guardó una versión más reciente; esta pestaña ya la muestra',
    saved: 'Guardado en este navegador',
    savedTitle: 'Guardado a las {time} · el borrador se queda en este navegador y nunca se sube',
    restored: 'Borrador recuperado',
    restoredTitle: 'El borrador se queda en este navegador y nunca se sube; pulsa Nuevo para borrarlo',
    quotaState: 'Almacenamiento lleno; borrador sin guardar',
    quotaNotice:
      'El almacenamiento local de tu navegador está lleno, así que por ahora el borrador no se puede guardar. La página sigue funcionando; descarga el PDF o guarda el Markdown para no perder tu trabajo.',
    storageOff: 'Almacenamiento local no disponible; el borrador no se guardará',
    imageBudget:
      'Las imágenes suman más de 50 MB. Las que sobran no se guardarán en local y tendrás que volver a arrastrarlas la próxima vez.',
    imageQuota:
      'El almacenamiento local de tu navegador está lleno, así que algunas imágenes no se guardaron y tendrás que volver a arrastrarlas la próxima vez.',
    imageEmbedded: 'Imagen incrustada: {name}',
    fileLoaded: 'Abierto: {name}',
    pasteBlocked: 'El navegador no ha permitido leer el portapapeles. Pulsa ⌘/Ctrl + V en el editor.',
    /** {name} */
    downloaded: 'Guardado: {name}',
    unsupportedFile: 'Tipo de archivo no compatible: {name}',

    diagramPending: 'Dibujando el diagrama…',
    diagramError: 'No se pudo dibujar el diagrama: {detail}',
    mathError: 'No se pudo componer la fórmula: {detail}',
    diagramErrorAt: 'Error en el diagrama, línea {line}',
    diagramErrorTitle: 'Error en el diagrama',
    diagramUnknown: 'Tipo de diagrama desconocido: «{name}»',
    diagramStale: 'Se muestra la última versión que se pudo dibujar',
    diagramCopySvg: 'Copiar SVG',
    diagramCopied: 'SVG copiado al portapapeles',
    diagramCopyFailed: 'El portapapeles no está disponible aquí; descarga el SVG',
    diagramDownloadSvg: 'Descargar SVG',
    diagramDownloadPng: 'Descargar PNG',
    diagramActions: 'Exportar diagrama',
    remoteImage: 'Las imágenes remotas no se cargan: {name}',
    missingImage: 'Imagen no encontrada; arrastra el archivo a la página: {name}',
    tocTitle: 'Índice',
    pageBreak: 'Salto de página',
    fromDocument: '(del documento)',
    fromDocumentTitle: 'Lo fija el front matter al principio del documento; cámbialo allí',
    frontMatterSyntax: 'Front matter, línea {line}: no se pudo leer y se ha ignorado.',
    frontMatterValue: 'Front matter, línea {line}: «{value}» no es un valor válido para {key} y se ha ignorado.',
    frontMatterUnclosed: 'El front matter del principio no tiene la línea --- de cierre, así que se trata como texto normal.',
  },

  sample: `# Documento de ejemplo de ${BRAND}

Este conversor de Markdown a PDF **funciona por completo en tu navegador**. Tu documento nunca se sube a un servidor: el motor tipográfico, las fuentes y la conversión viven en esta pestaña.

Edita a la izquierda y la vista previa de la derecha te sigue mientras escribes. Pulsa **Descargar PDF**, arriba a la derecha, para obtener el archivo definitivo, maquetado con saltos de página, números de página y marcadores.

## Diagramas

\`\`\`mermaid
flowchart LR
  A[Markdown] --> B[Análisis con markdown-it]
  B --> C{¿Hay diagramas?}
  C -- sí --> D[Mermaid dibuja el SVG]
  C -- no --> E[Generar código Typst]
  D --> E
  E --> F[(PDF)]
\`\`\`

Los diagramas se incrustan en **vectorial**: siguen nítidos al ampliar y su texto se puede seleccionar y buscar.

## Texto

Funcionan la *cursiva*, la **negrita**, la ***negrita cursiva***, el ~~tachado~~, el \`código en línea\` y los [enlaces](https://example.com). La tipografía respeta el idioma: ¿preguntas?, ¡exclamaciones!, «comillas latinas», la ñ de «señor» y tildes como en «canción» o «pingüino».

> Una cita destaca un pasaje del resto.
>
> Puede tener varios párrafos.

## Listas

1. Una lista numerada
2. El segundo elemento
   - Una lista anidada con viñetas
   - Otro elemento
3. El tercer elemento

- [x] Una tarea terminada
- [ ] Algo pendiente
- [ ] Otra tarea por hacer

## Código

\`\`\`python
def fibonacci(n: int) -> int:
    """El resaltado viene del syntect integrado en Typst."""
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a
\`\`\`

## Tablas

| Función | Detalles | Estado |
|:--------|:--------:|-------:|
| Tildes y ñ | Texto real y con búsqueda | Disponible |
| Diagramas | Gráficos vectoriales nativos | Disponible |
| Fórmulas | Composición nativa, con búsqueda | Disponible |

## Fórmulas

Las fórmulas se componen de forma nativa, así que se ven nítidas y se pueden buscar: la identidad de Euler $e^{i\\pi} + 1 = 0$ cabe en una frase, y las ecuaciones más largas van en su propia línea.

$$
x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
$$

## Notas al pie

El motor tipográfico es Typst[^1], que se encarga de la paginación, el índice, los números de página y los marcadores.

[^1]: Un sistema moderno de composición tipográfica que funciona en el navegador una vez compilado a WebAssembly.

---

La última línea.
`,
};

export default es;
