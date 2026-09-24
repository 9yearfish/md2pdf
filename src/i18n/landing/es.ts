import type { LandingDictionary } from '../landing';

const es: LandingDictionary<'es'> = {
  hubHeading: 'Guías y casos de uso',
  homeLink: 'Markdown a PDF',
  pages: {
    'chatgpt-to-pdf': {
      title: 'ChatGPT a PDF: convierte respuestas gratis y sin extensión',
      description:
        'Copia una respuesta de ChatGPT, pégala aquí y guárdala como PDF. Se conservan tablas, código y fórmulas. Gratis, sin extensión y sin subir nada.',
      h1: 'Convierte ChatGPT a PDF',
      lead: 'Pulsa el botón de copiar de ChatGPT, pega la respuesta a la izquierda y descarga un PDF bien maquetado. No se sube nada.',
      navLabel: 'ChatGPT a PDF',
      navBlurb: 'guarda una respuesta de ChatGPT como PDF, con sus tablas, código y fórmulas',
      intro: [
        'El botón de copiar que aparece bajo cada respuesta de ChatGPT la copia en Markdown: títulos, listas, tablas, bloques de código y fórmulas incluidos. Eso es justo lo que lee esta página. Pégala en el editor y pulsa <strong>Descargar PDF</strong>: obtienes un documento con títulos de verdad, números de página y texto seleccionable, no una captura de la ventana del chat.',
        'Al pegar, la respuesta se limpia sola. ChatGPT escribe las fórmulas entre <code>\\(…\\)</code> y <code>\\[…\\]</code>, y aquí se convierten a la forma habitual <code>$…$</code> y <code>$$…$$</code>. También desaparecen los marcadores de cita entre corchetes que a veces quedan en el texto, los caracteres invisibles de ancho cero y las líneas sueltas de «Copiar código». Los bloques de código nunca se tocan, y si algo cambia, un aviso te ofrece <strong>Deshacer</strong>.',
      ],
      howTo: {
        heading: 'Cómo guardar una respuesta de ChatGPT como PDF',
        steps: [
          { name: 'Copia la respuesta.', text: 'Haz clic en el icono de copiar bajo la respuesta de ChatGPT. Se copia en formato Markdown.' },
          { name: 'Pégala aquí.', text: 'Pégala en el editor de Markdown de esta página. La vista previa de la derecha muestra el resultado al momento.' },
          { name: 'Ajusta el diseño si quieres.', text: 'En Diseño eliges el tamaño de papel, los márgenes, el tamaño de letra, los números de página o un índice.' },
          { name: 'Descarga el PDF.', text: 'Pulsa Descargar PDF. El archivo se maqueta en tu navegador y se guarda en tu dispositivo.' },
        ],
      },
      sections: [
        {
          heading: 'Tablas, código y fórmulas intactos',
          body: [
            'Las tablas siguen siendo tablas, con la alineación de sus columnas. Los bloques de código conservan la sangría y llevan resaltado de sintaxis. Las fórmulas se componen como fórmulas, no como una ristra de barras invertidas. Si imprimes la página del chat desde el navegador, en cambio, te llevas también la barra lateral, los botones y unos saltos de página poco afortunados.',
          ],
        },
        {
          heading: 'Una respuesta o varias',
          body: [
            'Esto no exporta la conversación entera de forma automática: convierte en documento lo que pegas. Pega varias respuestas seguidas, añade tus propios títulos o notas entre ellas y tendrás un único PDF, con índice si lo activas. Lo que escribes se guarda como borrador en tu navegador, así que puedes seguir otro día.',
          ],
        },
        {
          heading: 'Privado por diseño',
          body: [
            'Las respuestas de ChatGPT suelen contener trabajo a medias: código, contratos, apuntes. Aquí no salen de tu dispositivo. La política de seguridad de contenido de la página prohíbe enviar nada a ningún sitio, así que la conversión ocurre entera en esta pestaña.',
          ],
        },
      ],
      faq: [
        {
          question: '¿Cómo copio una respuesta de ChatGPT sin perder el formato?',
          answer: [
            'Usa el icono de copiar que hay debajo de la respuesta en lugar de seleccionar el texto con el ratón. El botón copia Markdown, así que los títulos, las tablas y los bloques de código llegan enteros. Si seleccionas el texto ya mostrado, se copia como texto plano y se pierde la estructura, como los títulos o los bordes de las tablas.',
          ],
        },
        {
          question: '¿Por qué las fórmulas salen como \\( x^2 \\) al pegarlas en otro sitio?',
          answer: [
            'ChatGPT escribe las matemáticas con los delimitadores de LaTeX, <code>\\(…\\)</code> dentro del texto y <code>\\[…\\]</code> para las ecuaciones destacadas, y muchos editores de Markdown no los entienden. Al pegar aquí se convierten automáticamente a la sintaxis habitual <code>$…$</code> y <code>$$…$$</code>, y en el PDF se componen como fórmulas.',
          ],
        },
        {
          question: '¿Puedo exportar una conversación completa de ChatGPT a PDF?',
          answer: [
            'No de forma automática: pega en orden las respuestas que quieras conservar y, si te sirve, añade tú las preguntas como títulos. Si lo que buscas es un archivo con todos tus chats, la exportación de datos de ChatGPT (Configuración → Controles de datos → Exportar datos) te envía todas las conversaciones para descargar, pero en HTML y JSON, no como un PDF maquetado.',
          ],
        },
        {
          question: '¿Se sube mi conversación a algún servidor?',
          answer: [
            'No. El texto se convierte en tu navegador y no se envía a ningún servidor, tampoco al nuestro. Solo se guarda como borrador en este navegador, y <strong>Nuevo</strong> lo borra.',
          ],
        },
        {
          question: '¿Por qué no le pido directamente a ChatGPT que me haga el PDF?',
          answer: [
            'ChatGPT puede generar un archivo PDF ejecutando código, pero el resultado es tan bueno como el script: la maquetación es básica y las fuentes a menudo no incluyen los caracteres del chino, el japonés, el coreano u otros alfabetos, por eso a veces aparecen cuadros vacíos. Si le pides la respuesta en Markdown y la conviertes aquí, tienes títulos compuestos, tablas, código resaltado y fuentes pensadas para cada idioma.',
          ],
        },
        {
          question: '¿Funciona en el móvil?',
          answer: [
            'Sí, en cualquier navegador móvil moderno: copia la respuesta en la app de ChatGPT, pégala aquí y descarga el PDF. El motor tipográfico (unos 7 MB) se descarga la primera vez que generas un PDF y después queda en caché.',
          ],
        },
      ],
      sample: `# Cómo se calcula la cuota de una hipoteca

La mayoría de las hipotecas en España usan el **sistema francés**: pagas la misma cuota todos los meses, pero al principio casi todo son intereses y al final casi todo es capital. Para un capital $C$, un tipo de interés anual $i$ y un plazo de $n$ meses, con $r = i / 12$, la cuota mensual es:

$$
\\text{cuota} = C \\cdot \\frac{r}{1 - (1 + r)^{-n}}
$$

## Un ejemplo con números

Supongamos una hipoteca de **150.000 €** a un tipo fijo del **3 %** anual (un 0,25 % mensual).

| Plazo | Cuota mensual | Intereses totales |
|------:|--------------:|------------------:|
| 15 años | 1.035,87 € | 36.457,04 € |
| 20 años | 831,90 € | 49.655,14 € |
| 25 años | 711,32 € | 63.395,09 € |
| 30 años | 632,41 € | 77.666,18 € |

Dos conclusiones:

1. **Alargar el plazo abarata la cuota, pero encarece la hipoteca.** Pasar de 20 a 30 años baja la cuota unos 200 € al mes y suma unos 28.000 € de intereses.
2. **Amortizar pronto es lo que más ahorra.** Cada euro que devuelves en los primeros años deja de generar intereses durante mucho tiempo.

## Calcúlalo tú mismo

\`\`\`python
def cuota(capital: float, tipo_anual: float, anios: int) -> float:
    """Cuota mensual con el sistema francés."""
    r = tipo_anual / 12
    n = anios * 12
    return capital * r / (1 - (1 + r) ** -n)

for anios in (15, 20, 25, 30):
    print(anios, round(cuota(150_000, 0.03, anios), 2))
\`\`\`

> **Ojo:** a la cuota hay que sumarle los seguros vinculados y, si el tipo es variable, la cuota cambiará con cada revisión del euríbor.

---

*Pegado de una respuesta de ChatGPT. Sustitúyelo por la tuya y pulsa **Descargar PDF**.*
`,
    },

    'deepseek-to-pdf': {
      title: 'DeepSeek a PDF: exporta respuestas con fórmulas, gratis',
      description:
        'Pega una respuesta de DeepSeek y descarga un PDF limpio. Las fórmulas en \\( \\) y \\[ \\] se convierten; tablas y código se conservan. Gratis y sin subir nada.',
      h1: 'Exporta DeepSeek a PDF',
      lead: 'Copia una respuesta de DeepSeek, pégala a la izquierda y descarga un PDF con sus fórmulas, tablas y código. No se sube nada.',
      navLabel: 'DeepSeek a PDF',
      navBlurb: 'exporta respuestas de DeepSeek a PDF, fórmulas incluidas',
      intro: [
        'A DeepSeek se le suele pedir justo lo que más cuesta imprimir: demostraciones, desarrollos paso a paso, problemas resueltos y código. El botón de copiar bajo una respuesta de DeepSeek la copia en Markdown, con las fórmulas entre delimitadores de LaTeX como <code>\\(…\\)</code> y <code>\\[…\\]</code>. Al pegarla aquí, esos delimitadores se convierten a la forma estándar <code>$…$</code> y <code>$$…$$</code>, y las fórmulas se componen en lugar de salir como barras invertidas.',
        'Se copia solo la respuesta, no el razonamiento que DeepSeek muestra mientras piensa. Pega una o varias respuestas, añade títulos o notas propias y pulsa <strong>Descargar PDF</strong>.',
      ],
      howTo: {
        heading: 'Cómo exportar una respuesta de DeepSeek a PDF',
        steps: [
          { name: 'Copia la respuesta.', text: 'Haz clic en el icono de copiar bajo la respuesta de DeepSeek.' },
          { name: 'Pégala aquí.', text: 'Pégala en el editor de Markdown. Los delimitadores de las fórmulas y los caracteres invisibles se limpian, con la opción de Deshacer si quieres el original.' },
          { name: 'Revisa la vista previa.', text: 'Las fórmulas, las tablas y los bloques de código aparecen en la vista previa de la derecha.' },
          { name: 'Descarga el PDF.', text: 'Pulsa Descargar PDF. El archivo se genera en tu navegador.' },
        ],
      },
      sections: [
        {
          heading: 'Fórmulas bien compuestas',
          body: [
            'Las fórmulas en línea se quedan dentro del párrafo y las ecuaciones destacadas ocupan su propia línea centrada, como en un libro de texto. Como el PDF contiene texto de verdad y no una imagen de la página, pesa poco y se puede buscar en él.',
          ],
        },
        {
          heading: 'El código y las tablas, intactos',
          body: [
            'Los bloques de código conservan la sangría y llevan resaltado de sintaxis; las tablas mantienen sus columnas y su alineación. La limpieza automática nunca cambia nada dentro de un bloque de código.',
          ],
        },
        {
          heading: 'Nada sale de tu navegador',
          body: [
            'La conversión se hace en local, en esta pestaña. La política de seguridad de contenido de la página prohíbe enviar tu texto a cualquier servidor, incluido el nuestro.',
          ],
        },
      ],
      faq: [
        {
          question: '¿Por qué las fórmulas de DeepSeek salen con \\( \\) o \\[ \\] en otros editores?',
          answer: [
            'DeepSeek escribe las matemáticas con los delimitadores de paréntesis y corchetes de LaTeX, que muchos editores de Markdown no reconocen. Al pegarlas aquí se convierten a <code>$…$</code> y <code>$$…$$</code>, que este conversor compone como fórmulas.',
          ],
        },
        {
          question: '¿Se incluye el razonamiento, la parte en la que «piensa»?',
          answer: [
            'El botón de copiar copia la respuesta final. Si también quieres el razonamiento, selecciónalo y cópialo aparte, y pégalo donde prefieras dentro del documento.',
          ],
        },
        {
          question: '¿Puedo exportar una conversación entera de DeepSeek?',
          answer: [
            'No automáticamente: esta página no lee la conversación, convierte lo que pegas. Pega las respuestas una tras otra, pon un título encima de cada una y activa <strong>Índice</strong> en <strong>Diseño</strong> para tener un PDF con índice.',
          ],
        },
        {
          question: '¿Se mantienen las tablas y el código?',
          answer: [
            'Sí. Las tablas conservan sus columnas y la alineación, y los bloques de código su sangría, con resaltado de sintaxis. La limpieza al pegar no toca nada de lo que hay dentro de un bloque de código.',
          ],
        },
        {
          question: '¿Es gratis? ¿Se sube mi texto?',
          answer: [
            'Es gratis, sin registro y sin marca de agua, y no se sube nada: el PDF se genera en tu navegador.',
          ],
        },
      ],
      sample: `# Calcular una integral por partes

Queremos calcular $\\int_0^1 x e^x \\, dx$.

## Paso 1: elegir $u$ y $dv$

La fórmula de integración por partes es:

$$
\\int u\\,dv = u\\,v - \\int v\\,du
$$

Conviene derivar el factor que se simplifica y integrar el que no se complica:

| Elección | Expresión | Resultado |
|:---------|:---------:|----------:|
| $u$ | $x$ | $du = dx$ |
| $dv$ | $e^x \\, dx$ | $v = e^x$ |

## Paso 2: aplicar la fórmula

$$
\\int_0^1 x e^x \\, dx = \\left[ x e^x \\right]_0^1 - \\int_0^1 e^x \\, dx = e - (e - 1) = 1
$$

## Paso 3: comprobarlo con código

\`\`\`python
import sympy as sp

x = sp.symbols("x")
resultado = sp.integrate(x * sp.exp(x), (x, 0, 1))
print(resultado)  # 1
\`\`\`

**Respuesta:** la integral vale exactamente $1$.

> **Truco:** si hubieras elegido $u = e^x$ y $dv = x \\, dx$, la nueva integral tendría $x^2$ y sería más difícil que la original.

---

*Pegado de una respuesta de DeepSeek. Sustitúyelo por la tuya y pulsa **Descargar PDF**.*
`,
    },

    'gemini-to-pdf': {
      title: 'Gemini a PDF: exporta tus respuestas gratis y sin registro',
      description:
        'Copia una respuesta de Gemini, pégala aquí y descarga un PDF bien maquetado con tablas, código y fórmulas. Gratis, sin extensión y sin salir del navegador.',
      h1: 'Convierte Gemini a PDF',
      lead: 'Copia una respuesta de Google Gemini, pégala a la izquierda y descarga un PDF limpio con sus tablas y su código. No se sube nada.',
      navLabel: 'Gemini a PDF',
      navBlurb: 'guarda respuestas de Google Gemini como un PDF bien maquetado',
      intro: [
        'Gemini puede enviar una respuesta a Google Docs y, desde ahí, puedes descargarla en PDF, pero ese camino pide una cuenta de Google, pasar por un procesador de textos y, a menudo, retocar el formato. Copiar la respuesta y pegarla aquí es más rápido: el botón de copiar de Gemini copia Markdown, y esta página lo convierte en un PDF bien maquetado en un solo paso, dentro de tu navegador.',
        'Las tablas conservan sus columnas, los bloques de código su sangría y su resaltado, y las fórmulas se componen. Los restos del chat, como los caracteres invisibles de ancho cero, se limpian al pegar, con la opción de <strong>Deshacer</strong> si quieres recuperar el original.',
      ],
      howTo: {
        heading: 'Cómo exportar una respuesta de Gemini a PDF',
        steps: [
          { name: 'Copia la respuesta.', text: 'Usa la opción de copiar bajo la respuesta de Gemini.' },
          { name: 'Pégala aquí.', text: 'Pégala en el editor de Markdown de esta página y revisa la vista previa de la derecha.' },
          { name: 'Elige el diseño.', text: 'Si quieres, en Diseño eliges el tamaño de papel, los márgenes, los números de página o un índice.' },
          { name: 'Descarga el PDF.', text: 'Pulsa Descargar PDF; el archivo se maqueta en tu navegador.' },
        ],
      },
      sections: [
        {
          heading: 'Comparativas y planes de viaje que se imprimen bien',
          body: [
            'Las respuestas de Gemini suelen ser comparativas y planes largos: itinerarios, comparaciones de productos, resúmenes para estudiar. En PDF tienen títulos de verdad, números de página e índice si lo quieres, y las tablas se ajustan al ancho de la página en lugar de quedar cortadas.',
          ],
        },
        {
          heading: 'Junta varias respuestas',
          body: [
            'Pega más de una respuesta en el mismo documento, añade tus notas entre ellas y descárgalas como un único archivo. Tu texto se guarda como borrador en este navegador por si cierras la pestaña.',
          ],
        },
        {
          heading: 'Sin cuenta y sin subir nada',
          body: [
            'No hay que iniciar sesión en ningún sitio. El conversor funciona en tu navegador y la página no tiene permitido enviar lo que pegas a ningún servidor.',
          ],
        },
      ],
      faq: [
        {
          question: '¿Cómo guardo una conversación de Gemini en PDF?',
          answer: [
            'Copia las respuestas que quieras conservar, pégalas aquí en orden y pulsa <strong>Descargar PDF</strong>. Esta página no exporta el chat entero por sí sola: convierte lo que pegas. La otra vía es la opción «Exportar a Documentos» de Gemini, que envía una respuesta a Google Docs, desde donde puedes descargarla en PDF con tu cuenta de Google.',
          ],
        },
        {
          question: '¿Por qué se descuadran las tablas de Gemini al imprimir la página?',
          answer: [
            'Al imprimir el chat imprimes la página web, con su diseño, sus paneles laterales y sus tablas con desplazamiento. Pegada aquí, la tabla pasa a formar parte de un documento maquetado para papel.',
          ],
        },
        {
          question: '¿Funciona con el código y las fórmulas de Gemini?',
          answer: [
            'Sí. Los bloques de código se resaltan y la limpieza nunca los altera; las fórmulas en <code>$…$</code>, <code>\\(…\\)</code> o <code>\\[…\\]</code> se componen como tales.',
          ],
        },
        {
          question: '¿Funciona en el móvil?',
          answer: [
            'Sí, en cualquier navegador móvil moderno: copia la respuesta en la app de Gemini, pégala aquí y descarga el PDF. El motor tipográfico (unos 7 MB) se descarga la primera vez y después queda guardado en el dispositivo.',
          ],
        },
        {
          question: '¿Es gratis?',
          answer: ['Sí: sin registro, sin marca de agua y sin límite de PDF.'],
        },
      ],
      sample: `# Escapada de tres días a Granada

Aquí tienes un plan para **dos personas** que llegan en tren un viernes por la mañana y vuelven el domingo por la tarde.

## Itinerario

1. **Viernes:** paseo por el Albaicín, atardecer en el mirador de San Nicolás y tapas por la calle Navas.
2. **Sábado:** visita a la Alhambra por la mañana (reserva las entradas con antelación) y el Realejo por la tarde.
3. **Domingo:** catedral y Capilla Real, compras en la Alcaicería y vuelta.

## Presupuesto aproximado

| Concepto | Total | Por persona |
|:---------|------:|------------:|
| Alojamiento, 2 noches | 180 € | 90 € |
| Tren de ida y vuelta | 120 € | 60 € |
| Entradas a la Alhambra | 40 € | 20 € |
| Comidas y tapas | 150 € | 75 € |
| **Total** | **490 €** | **245 €** |

El coste por persona es el total dividido entre el número de viajeros:

$$
\\text{coste por persona} = \\frac{C_{\\text{total}}}{n}
$$

## Repartir los gastos

\`\`\`javascript
const gastos = { alojamiento: 180, tren: 120, alhambra: 40, comidas: 150 };
const viajeros = 2;

const total = Object.values(gastos).reduce((a, b) => a + b, 0);
console.log(\`Total: \${total} €, por persona: \${(total / viajeros).toFixed(2)} €\`);
\`\`\`

> En temporada alta las entradas de la Alhambra se agotan con semanas de antelación: resérvalas antes que el tren.

---

*Pegado de una respuesta de Gemini. Sustitúyelo por la tuya y pulsa **Descargar PDF**.*
`,
    },

    'mermaid-to-pdf': {
      title: 'Exportar diagramas Mermaid a PDF: vectoriales y gratis',
      description:
        'Convierte Markdown con diagramas Mermaid a PDF. Los diagramas quedan como gráficos vectoriales nítidos, con texto seleccionable y ajustados a la página. Gratis.',
      h1: 'Diagramas Mermaid a PDF',
      lead: 'Escribe o pega Markdown con bloques ```mermaid y descarga un PDF en el que cada diagrama es un gráfico vectorial nítido con texto seleccionable.',
      navLabel: 'Diagramas Mermaid a PDF',
      navBlurb: 'diagramas vectoriales, con texto seleccionable, dentro del PDF',
      intro: [
        'Mermaid convierte unas pocas líneas de texto en diagramas de flujo, diagramas de secuencia, diagramas de Gantt y mucho más. El problema llega al pasar esos diagramas a PDF: muchos conversores de Markdown online no renderizan Mermaid y se limitan a imprimir el código, otros convierten la página entera en una sola imagen, y exportar desde un editor puede cortar los diagramas anchos o depender de las fuentes instaladas en tu ordenador.',
        'Aquí, cada bloque <code>```mermaid</code> se convierte en SVG en tu navegador y se incrusta en el PDF como gráfico vectorial nativo. El diagrama se ve nítido con cualquier zoom, sus etiquetas se pueden seleccionar, copiar y buscar, y los colores definidos con <code>classDef</code> o <code>style</code> llegan tal como los escribiste.',
      ],
      howTo: {
        heading: 'Cómo exportar diagramas Mermaid a PDF',
        steps: [
          { name: 'Añade tus diagramas.', text: 'Pega tu Markdown o escribe un bloque de código delimitado con el lenguaje mermaid.' },
          { name: 'Revisa la vista previa.', text: 'Cada diagrama se dibuja en la vista previa mientras escribes; los errores de sintaxis se muestran en su sitio.' },
          { name: 'Descarga el PDF.', text: 'Pulsa Descargar PDF. Los diagramas se incrustan como gráficos vectoriales junto al resto del documento.' },
        ],
      },
      sections: [
        {
          heading: 'Vectoriales, seleccionables y nunca una captura',
          body: [
            'Como los diagramas se incrustan como trazados vectoriales y texto, no como píxeles, se imprimen nítidos a cualquier tamaño y el archivo pesa poco. La búsqueda de tu lector de PDF encuentra las palabras de dentro de los diagramas, y puedes copiar una etiqueta directamente de un diagrama de flujo.',
          ],
        },
        {
          heading: 'Ajustados a la página',
          body: [
            'Los diagramas mantienen su tamaño natural cuando caben; los anchos se reducen al ancho del texto en lugar de salirse del margen, y uno más alto que la página se reduce para que quepa en una sola. Las etiquetas se dibujan como texto SVG y no como HTML incrustado, que es lo que hace que otras exportaciones muestren cuadros vacíos donde deberían estar las etiquetas.',
          ],
        },
        {
          heading: 'Todos los tipos de diagrama habituales',
          body: [
            'Diagramas de flujo, de secuencia, de clases, de estados, de entidad-relación, de Gantt, circulares, mapas mentales, líneas de tiempo y el resto de tipos que admite Mermaid los dibuja el propio Mermaid, así que la sintaxis es exactamente la que ya conoces de GitHub, GitLab, Obsidian o Notion.',
          ],
        },
      ],
      faq: [
        {
          question: '¿Por qué mi diagrama Mermaid sale como código en el PDF?',
          answer: [
            'El conversor que usaste no renderiza Mermaid y trata el bloque como código normal. Aquí, cualquier bloque delimitado marcado como <code>mermaid</code> se dibuja como diagrama. Si la sintaxis tiene un error, la vista previa y el PDF muestran un recuadro con el mensaje de error de Mermaid, el número de línea y la línea que falla, y el resto del documento se genera con normalidad.',
          ],
        },
        {
          question: '¿El diagrama es una imagen dentro del PDF?',
          answer: [
            'Es un gráfico vectorial, no un mapa de bits. Sigue nítido al ampliar, y su texto es texto real que se puede seleccionar y buscar.',
          ],
        },
        {
          question: '¿Se conservan los colores y estilos personalizados?',
          answer: [
            'Sí. Los rellenos, los colores de trazo y los grosores de línea definidos con <code>classDef</code>, <code>class</code> o <code>style</code> se mantienen en el PDF.',
          ],
        },
        {
          question: '¿Puedo exportar solo un diagrama, sin el resto del documento?',
          answer: [
            'Sí: deja en el editor únicamente el bloque <code>```mermaid</code> y descarga. El PDF contendrá solo el diagrama, a su tamaño natural o reducido para que quepa en la página. Si quieres usarlo en otro sitio, pasa el ratón por encima del diagrama en la vista previa para copiar su SVG o descargarlo en SVG o PNG.',
          ],
        },
        {
          question: '¿Se sube mi diagrama a algún servidor para dibujarlo?',
          answer: [
            'No. Mermaid funciona en tu navegador, igual que el motor del PDF. La página no tiene permitido enviar tu documento a ningún sitio.',
          ],
        },
      ],
      sample: `# Diagramas Mermaid en un PDF

Todos los diagramas de abajo se dibujan en tu navegador y se incrustan en el PDF como **gráficos vectoriales**: amplía todo lo que quieras y selecciona o busca el texto que contienen.

## Diagrama de flujo

\`\`\`mermaid
flowchart LR
  A[Solicitud de devolución] --> B{¿Dentro de plazo?}
  B -- sí --> C[Enviar etiqueta]
  B -- no --> D[Revisión manual]
  D --> C
  C --> E[Paquete recibido]
  E --> F([Reembolso emitido])
  classDef hecho fill:#e3f5e8,stroke:#1f8a4c,stroke-width:2px
  class F hecho
\`\`\`

## Diagrama de secuencia

\`\`\`mermaid
sequenceDiagram
  participant C as Cliente
  participant T as Tienda online
  participant B as Banco
  C->>T: Finalizar compra
  T->>B: Autorizar 42,00 €
  B-->>T: Aprobado
  T-->>C: Pedido confirmado
\`\`\`

## Diagrama de Gantt

\`\`\`mermaid
gantt
  title Trabajo de Fin de Grado
  dateFormat YYYY-MM-DD
  section Investigación
    Estado del arte   :done, t1, 2026-02-02, 21d
    Diseño del estudio :active, t2, after t1, 14d
  section Redacción
    Resultados        :t3, after t2, 30d
    Depósito          :milestone, after t3, 0d
\`\`\`

## Diagrama de estados

\`\`\`mermaid
stateDiagram-v2
  [*] --> Pendiente
  Pendiente --> Pagado: pago recibido
  Pagado --> Enviado: sale del almacén
  Enviado --> Entregado
  Pendiente --> Cancelado: sin pago en 48 h
  Entregado --> [*]
  Cancelado --> [*]
\`\`\`

Edita cualquier bloque a la izquierda y la vista previa te sigue; pulsa **Descargar PDF** para obtener el archivo definitivo.
`,
    },

    'readme-to-pdf': {
      title: 'Convertir README a PDF · README.md de GitHub, gratis',
      description:
        'Convierte un README.md de GitHub a PDF con sus tablas, el código resaltado y los diagramas Mermaid. Arrastra las imágenes que usa. Gratis y sin subir nada.',
      h1: 'Convierte un README a PDF',
      lead: 'Pega el README.md o arrastra el archivo y descarga un PDF maquetado, con sus tablas, bloques de código y diagramas Mermaid. No se sube nada.',
      navLabel: 'README a PDF',
      navBlurb: 'un README.md de GitHub en PDF, con tablas, código y diagramas',
      intro: [
        'GitHub muestra los README muy bien, pero no tiene un botón de «descargar como PDF». Si imprimes la página del repositorio desde el navegador, te llevas también la lista de archivos, la barra lateral y la navegación, y los saltos de página caen donde caen. Casi siempre lo que quieres es el README como documento: para adjuntarlo a una propuesta, pasárselo a quien lo revisa o leerlo en papel.',
        'Aquí el Markdown se maqueta como un documento de verdad. Los títulos se convierten en marcadores del PDF, las tablas conservan su alineación, los bloques de código llevan resaltado de sintaxis y los bloques <code>```mermaid</code>, que GitHub también dibuja, se convierten en diagramas vectoriales. Las fórmulas en <code>$…$</code> funcionan igual que en GitHub.',
      ],
      howTo: {
        heading: 'Cómo convertir un README a PDF',
        steps: [
          { name: 'Consigue el Markdown.', text: 'En GitHub, abre README.md, pulsa Raw y copia el texto, o usa el archivo de tu copia local del repositorio.' },
          { name: 'Pégalo o arrástralo aquí.', text: 'Pega el texto en el editor o suelta el archivo README.md en cualquier parte de la página.' },
          { name: 'Añade sus imágenes.', text: 'Arrastra a la página las imágenes que usa el README; una ruta como docs/captura.png se asocia por el nombre del archivo.' },
          { name: 'Descarga el PDF.', text: 'Pulsa Descargar PDF, o Imprimir para mandar ese mismo PDF a la impresora.' },
        ],
      },
      sections: [
        {
          heading: 'Lo que se conserva',
          body: [
            'Tablas al estilo de GitHub con su alineación, código delimitado con resaltado de sintaxis, listas de tareas, notas al pie, listas anidadas, enlaces que siguen funcionando y diagramas Mermaid de flujo, de secuencia y del resto de tipos, dibujados como vectores con texto seleccionable. Activa <strong>Índice</strong> en Diseño para añadir un índice; un diagrama demasiado ancho o alto se ajusta a la página en lugar de cortarse.',
          ],
        },
        {
          heading: 'Imágenes: arrástralas',
          body: [
            'La página nunca se conecta a otro servidor, así que no descarga imágenes de internet. Las imágenes guardadas en el repositorio son fáciles: suelta los archivos en la página y cada referencia a ellas se completa, sea cual sea la carpeta que indique el README. Las que están alojadas en otro sitio, incluidas las insignias de shields.io que encabezan muchos README, aparecen en el PDF como un breve aviso de «imagen no disponible»; borra esas líneas o descarga la imagen y arrástrala.',
          ],
        },
        {
          heading: 'Lo que no se conserva',
          body: [
            'El HTML no se interpreta: una cabecera centrada con <code>&lt;p align="center"&gt;</code>, una etiqueta <code>&lt;img&gt;</code> o un bloque desplegable <code>&lt;details&gt;</code> aparecen como texto, así que conviene reescribir esas partes en Markdown. Los avisos <code>&gt; [!NOTE]</code> de GitHub quedan como citas normales, los códigos como <code>:rocket:</code> se quedan como texto y los emoji no tienen fuente aquí, así que salen como cuadros vacíos (la página te dice qué caracteres son).',
          ],
        },
      ],
      faq: [
        {
          question: '¿Cómo convierto un README de GitHub a PDF?',
          answer: [
            'Abre el README en GitHub, pulsa <strong>Raw</strong>, copia todo y pégalo en el editor de esta página; después pulsa <strong>Descargar PDF</strong>. Si tienes el repositorio en tu ordenador, arrastra directamente el archivo README.md a la página.',
          ],
        },
        {
          question: '¿Por qué faltan las imágenes en el PDF?',
          answer: [
            'Las imágenes con rutas relativas, como <code>docs/arquitectura.png</code>, son archivos del repositorio, y esta página no puede ver tu repositorio: arrastra esos archivos a la página y quedan incrustados. Las imágenes enlazadas con una dirección web, insignias incluidas, no se descargan nunca, porque aquí no se permite conectar con otros servidores.',
          ],
        },
        {
          question: '¿Se dibujan los diagramas Mermaid del README?',
          answer: [
            'Sí. Los bloques <code>```mermaid</code> se dibujan en tu navegador y se incrustan como gráficos vectoriales, los mismos diagramas que muestra GitHub. Un diagrama con un error de sintaxis aparece como un recuadro con el mensaje y la línea, y el resto del PDF no se ve afectado.',
          ],
        },
        {
          question: '¿Puedo convertir el README de un repositorio privado?',
          answer: [
            'Sí. El texto se maqueta en esta pestaña del navegador y no se sube a ningún sitio, así que no hace falta hacer nada público ni dar acceso a nadie. Copia el Markdown del repositorio y pégalo aquí.',
          ],
        },
        {
          question: '¿Por qué el HTML del README aparece como texto?',
          answer: [
            'El HTML no tiene equivalente en el motor de maquetación, así que las etiquetas se muestran tal cual en vez de interpretarse. Casi todo el HTML de un README es diseño: cambia un logotipo centrado por una línea de imagen normal y un bloque <code>&lt;details&gt;</code> por un título.',
          ],
        },
      ],
      sample: `# ordena

Una herramienta de línea de comandos que ordena por fechas una carpeta caótica de fotos y documentos, y nunca borra nada.

## Instalación

\`\`\`bash
npm install --global ordena
\`\`\`

Necesita Node.js 20 o posterior. Funciona en macOS, Linux y Windows.

## Uso

\`\`\`bash
ordena ~/Descargas --en ~/Archivo --simular
\`\`\`

| Opción | Por defecto | Qué hace |
|:--|:--:|:--|
| \`--en <carpeta>\` | \`./ordenado\` | Dónde van las carpetas por fecha |
| \`--por <unidad>\` | \`mes\` | \`dia\`, \`mes\` o \`anio\` |
| \`--simular\` | no | Muestra el plan sin mover nada |
| \`--deshacer\` | | Revierte la última ejecución |

## Cómo decide la fecha

\`\`\`mermaid
flowchart LR
  F[Archivo] --> E{¿Fecha EXIF?}
  E -- sí --> D[Fecha de la foto]
  E -- no --> M[Última modificación]
  D --> P[Carpeta AAAA/MM]
  M --> P
\`\`\`

## Configuración

Un archivo \`ordena.json\` en la carpeta de origen cambia los valores por defecto:

\`\`\`json
{
  "por": "anio",
  "ignorar": ["*.tmp", "node_modules"]
}
\`\`\`

## Hoja de ruta

- [x] Deshacer la última ejecución
- [x] Modo simulación
- [ ] Detección de duplicados

## Contribuir

Las pull requests son bienvenidas. Ejecuta \`npm test\` antes de abrir una.

## Licencia

MIT
`,
    },
  },
};

export default es;
