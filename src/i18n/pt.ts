import type { Messages } from './types';
import { BRAND } from './constants';

const pt: Messages = {
  locale: {
    code: 'pt',
    lang: 'pt-BR',
    hreflang: 'pt',
    ogLocale: 'pt_BR',
    nativeName: 'Português',
  },

  meta: {
    title: 'Converter Markdown para PDF online · Grátis, com Mermaid',
    description:
      'Converta Markdown para PDF de graça, direto no navegador. Diagramas Mermaid em vetor com texto selecionável. Sem upload, sem cadastro, sem marca d’água.',
    ogTitle: 'Markdown para PDF no seu navegador · Diagramas Mermaid em vetor',
    ogDescription:
      'Transforme Markdown em um PDF bem diagramado sem enviar nada para servidor nenhum. Diagramas Mermaid em vetor e texto pesquisável. Grátis e sem cadastro.',
    appDescription:
      'Converte Markdown para PDF localmente no navegador, com diagramas Mermaid como gráficos vetoriais e tipografia correta para vários sistemas de escrita. Os documentos nunca são enviados.',
    operatingSystem: 'Qualquer navegador moderno com suporte a WebAssembly',
    featureList: [
      'Diagramas Mermaid incorporados como gráficos vetoriais com texto selecionável',
      'Tipografia para texto latino acentuado, chinês, japonês, coreano, cirílico e vietnamita',
      'Blocos de código com realce de sintaxe',
      'Sumário, números de página e marcadores no PDF',
      'Pré-visualização ao vivo e rascunho salvo automaticamente no navegador',
      'Funciona localmente; os documentos nunca são enviados',
    ],
  },

  page: {
    privacyBadge: 'Local · sem upload · sem cadastro · sem marca d’água · funciona offline',
    privacyTitle:
      'A leitura, a diagramação e a geração do PDF acontecem nesta aba. Seu documento nunca sai do seu dispositivo.',
    newDoc: 'Novo',
    newDocTitle: 'Novo documento em branco (também apaga o rascunho salvo)',
    open: 'Abrir',
    openTitle: 'Abrir um arquivo .md',
    layout: 'Layout',
    layoutTitle: 'Layout da página',
    downloadTitle: 'Baixar PDF (⌘/Ctrl + S)',
    printTitle: 'Imprimir o PDF diagramado (⌘/Ctrl + P)',
    language: 'Idioma',
    paper: 'Papel',
    margin: 'Margens',
    fontSize: 'Tamanho da fonte',
    lineHeight: 'Entrelinha',
    pageNumbers: 'Números de página',
    toc: 'Sumário',
    justify: 'Justificar',
    docLanguage: 'Idioma do documento',
    template: 'Modelo',
    templateDefault: 'Padrão',
    templateReport: 'Relatório',
    templateAcademic: 'Acadêmico',
    templateResume: 'Currículo',
    templateLetter: 'Carta',
    cover: 'Capa',
    h1NewPage: 'Cada H1 em nova página',
    header: 'Cabeçalho',
    footer: 'Rodapé',
    bandTitle: 'Variáveis: {title} {page} {pages} {date} {author}. Use | para separar esquerda | centro | direita. Vazio usa o do modelo; none oculta.',
    editorHint: 'Arraste para cá um arquivo .md ou imagens',
    editorLabel: 'Código Markdown',
    editorPlaceholder: 'Digite ou cole Markdown aqui, ou arraste um arquivo .md…',
    preview: 'Pré-visualização',
    dropHint: 'Solte para importar',
    source: 'Fonte',
    proof: 'Prova',
    live: 'Ao vivo',
    viewSwitch: 'Mostrar',
    fullscreen: 'Edição em tela cheia',
    heroTitle: 'Markdown para PDF',
    heroTagline: ': diagramado no seu navegador.',
    heroLead: 'Cole ou arraste Markdown e baixe um PDF bem diagramado, com os diagramas Mermaid em vetor. Seu documento nunca sai do navegador.',
    aboutToggle: `Sobre o ${BRAND}`,
    emptyTitle: 'Cole Markdown, arraste um arquivo .md ou abra um',
    paste: 'Colar',
    pasteTitle: 'Colar Markdown da área de transferência',
  },

  about: {
    heading: 'Converter Markdown para PDF no navegador',
    intro: [
      'Cole ou arraste um arquivo Markdown, acompanhe a pré-visualização enquanto digita e clique em <strong>Baixar PDF</strong> para receber um arquivo bem diagramado. A pré-visualização é instantânea; o PDF sai de um motor de composição tipográfica de verdade, com quebras de página, números de página e sumário opcional.',
      'Nenhum servidor participa do processo. A leitura do Markdown, o desenho dos diagramas, a diagramação e a geração do PDF acontecem todos nesta aba. É um conversor de Markdown para PDF online e grátis: sem cadastro, sem marca d’água e sem limite de uso. O que você escreve é salvo automaticamente no seu próprio navegador, então fechar a aba não faz você perder nada; o texto nunca é enviado, e clicar em <strong>Novo</strong> ou limpar os dados deste site apaga tudo.',
    ],
    sections: [
      {
        heading: 'Diagramas Mermaid em vetor, não em captura de tela',
        body: [
          'Blocos <code>```mermaid</code> são renderizados em SVG e incorporados ao PDF como gráficos vetoriais nativos. Eles continuam nítidos em qualquer zoom, o texto dentro deles pode ser selecionado, copiado e pesquisado, e preenchimentos, contornos e espessuras definidos com <code>classDef</code> são preservados. Muitos conversores online nem renderizam Mermaid e só imprimem o código; alguns transformam a página inteira em imagem, sem nenhum texto selecionável.',
        ],
      },
      {
        heading: 'Tipografia que respeita o seu idioma',
        body: [
          'O texto é incorporado como texto de verdade, selecionável e pesquisável, e as fontes são reduzidas automaticamente aos caracteres usados para manter os arquivos leves. Acentos, cedilha e til saem corretos, e além do alfabeto latino há suporte a chinês (simplificado e tradicional), japonês, coreano, cirílico e vietnamita, cada um com fontes feitas para ele. Se um documento usar caracteres raros que não estão no subconjunto compacto da fonte, a fonte completa é carregada automaticamente em vez de aparecerem quadradinhos vazios.',
        ],
      },
      {
        heading: 'Um motor tipográfico de verdade',
        body: [
          'Por baixo dos panos está o Typst, um sistema moderno de composição tipográfica compilado para WebAssembly para rodar no navegador. Ele cuida da paginação, das linhas viúvas e órfãs, do sumário, dos números de página, das notas de rodapé e dos marcadores do PDF, e faz o realce de código com o destacador embutido. O motor tem cerca de 10 MB: carrega em segundo plano, sem você perceber, enquanto escreve, fica guardado no seu dispositivo e depois funciona offline.',
        ],
      },
      {
        heading: 'Markdown suportado',
        body: [
          'Títulos, parágrafos, negrito, itálico, tachado, código inline, links, imagens, listas numeradas e com marcadores, listas aninhadas, listas de tarefas, citações, tabelas com alinhamento de colunas, listas de definição, notas de rodapé, linhas horizontais, blocos de código com realce de sintaxe e diagramas Mermaid. Imagens podem ser arrastadas para a página ou coladas da área de transferência. Fórmulas matemáticas em sintaxe LaTeX também são suportadas: na linha com <code>$...$</code> e em destaque com <code>$$...$$</code> ou blocos <code>```math</code>.',
        ],
      },
    ],
    faqHeading: 'Perguntas frequentes',
    faq: [
      {
        question: 'Meu documento é enviado para algum servidor?',
        answer: [
          'Não. A leitura, a diagramação e a geração do PDF acontecem no seu navegador. Seu texto, suas imagens e o PDF nunca saem do seu dispositivo. A política de segurança de conteúdo (CSP) do site só permite conexões com o próprio site e com o contador de visitas anônimo e sem cookies da Cloudflare, que registra as visitas às páginas e nunca recebe o seu documento; o navegador bloqueia qualquer outro destino.',
        ],
      },
      {
        question: 'Meu texto continua lá depois que eu fecho a página?',
        answer: [
          'Sim. Assim que você edita um documento, o texto, as configurações de layout e as imagens que você arrastou são salvos automaticamente no armazenamento local do navegador e restaurados na próxima visita. O rascunho fica só neste navegador, neste dispositivo; nunca é enviado nem sincronizado. Clique em <strong>Novo</strong> ou limpe os dados deste site para apagá-lo.',
        ],
      },
      {
        question: 'Tem suporte a diagramas Mermaid?',
        answer: [
          'Tem. Os diagramas entram no PDF como gráficos vetoriais, então continuam nítidos ao ampliar, o texto deles continua selecionável e pesquisável, e as cores personalizadas com <code>classDef</code> são mantidas.',
        ],
      },
      {
        question: 'Acentos e outros alfabetos aparecem certinho?',
        answer: [
          'Sim. Acentos, cedilha e til são compostos com fontes completas, e há suporte também a chinês (simplificado e tradicional), japonês, coreano, cirílico e vietnamita. Tudo é incorporado como texto de verdade, que você pode selecionar, copiar e pesquisar. As fontes desses sistemas de escrita só são baixadas quando o documento precisa delas, e caracteres raros passam automaticamente para a fonte completa em vez de virarem quadradinhos vazios.',
        ],
      },
      {
        question: 'Por que a pré-visualização fica um pouco diferente do PDF?',
        answer: [
          'A pré-visualização é HTML desenhado direto pelo navegador, para acompanhar cada tecla digitada. O PDF é composto pelo motor Typst, e as quebras de página, as quebras de linha e o espaçamento que valem são os do arquivo baixado. Conteúdo, estrutura e estilos são os mesmos nos dois.',
        ],
      },
      {
        question: 'Quanto tempo leva o primeiro PDF?',
        answer: [
          'A página em si tem só algumas dezenas de kilobytes e abre na hora. O motor tipográfico tem cerca de 10 MB e é baixado discretamente em segundo plano depois que a página carrega, normalmente antes de você terminar de escrever; a barra de status lá embaixo mostra o andamento. Ele fica guardado no seu dispositivo, então as próximas conversões funcionam offline também.',
        ],
      },
      {
        question: 'Preciso me cadastrar ou pagar? Tem marca d’água?',
        answer: [
          'Nada disso. A ferramenta é uma página web estática, sem contas e sem back-end, e o PDF sai sem marca d’água.',
        ],
      },
      {
        question: 'Tem suporte a fórmulas matemáticas?',
        answer: [
          'Sim. Use <code>$...$</code> para fórmulas na linha e <code>$$...$$</code> (ou um bloco <code>```math</code>) para equações em destaque, com sintaxe LaTeX. O Typst as compõe de forma nativa, então o PDF traz fórmulas de verdade e pesquisáveis, não imagens, e uma fórmula com erro é marcada sozinha, sem afetar o resto do documento.',
        ],
      },
      {
        question: 'Posso usar tags HTML?',
        answer: [
          'Só <code>&lt;br&gt;</code>. O motor tipográfico não tem equivalente para HTML, então, em vez de gerar algo que só parece certo, as outras tags são ignoradas com um aviso.',
        ],
      },
    ],
    footer:
      `<strong class="colophon-mark"><span class="brand-free">free</span>md2pdf.com</strong> · Markdown para PDF no seu navegador, com diagramas Mermaid em vetor. Nada é enviado.`,
    languagesHeading: 'Idiomas',
  },

  ui: {
    words: { one: '{n} palavra', many: '{n} de palavras', other: '{n} palavras' },
    lines: { one: '{n} linha', many: '{n} de linhas', other: '{n} linhas' },
    paperHint: '{paper} · a paginação final é a do PDF',

    engineIdle: 'Motor de PDF em espera',
    engineWillLoad: 'O motor de PDF vai carregar em segundo plano (cerca de 10 MB)',
    engineCached: 'Motor de PDF em cache',
    engineDownloading: 'Carregando o motor de PDF em segundo plano {pct}%',
    engineStarting: 'Iniciando o motor de PDF…',
    engineFonts: 'Carregando fontes…',
    engineReady: 'Motor de PDF pronto · funciona offline',
    engineFailed: 'Falha ao carregar o motor de PDF; nova tentativa ao baixar',
    networkFailed: 'A conexão caiu ao baixar as fontes ou o motor tipográfico, mesmo após novas tentativas. Verifique sua conexão e tente de novo.',
    reloadPage: 'Recarregar página',
    chunkFailed: 'Não foi possível carregar uma parte do app, provavelmente porque a conexão caiu. Recarregar a página resolve; seu rascunho está salvo.',

    download: 'Baixar PDF',
    downloadGenerating: 'Gerando…',
    downloadEngine: 'Carregando motor {pct}%',
    downloadStarting: 'Iniciando motor…',
    downloadFonts: 'Carregando fontes…',
    downloadTypesetting: 'Diagramando…',
    print: 'Imprimir',
    printInTab: 'O PDF foi aberto em uma nova aba; imprima a partir dela.',
    printBlocked: 'O navegador bloqueou a nova aba. Abra o PDF e imprima a partir dele.',
    printOpen: 'Abrir PDF',

    missingGlyphs: 'Estes caracteres não estão nas fontes e podem não aparecer: {chars}',
    pdfFailed: 'Não foi possível gerar o PDF: {detail}',
    pdfFailedShort: 'Não foi possível gerar o PDF',
    initFailed: 'A página não conseguiu iniciar: {detail}',

    close: 'Fechar',
    undo: 'Desfazer',
    cleared: 'Documento limpo; o rascunho salvo foi apagado',
    langAuto: 'Automático · {detected}',
    aiCleaned: 'A formatação da resposta de IA colada foi ajustada',
    draftNotSample: 'Mostrando seu rascunho salvo, não o exemplo desta página',
    loadExample: 'Carregar exemplo',
    exampleLoaded: 'Exemplo carregado; seu rascunho fica guardado até você editar',
    otherTab: 'Este documento foi alterado em outra aba',
    loadLatest: 'Carregar a mais recente',
    syncedFromTab: 'Sincronizado de outra aba',
    syncedFromTabTitle: 'Outra aba salvou uma versão mais recente; esta aba já mostra ela',
    saved: 'Salvo neste navegador',
    savedTitle: 'Salvo às {time} · o rascunho fica neste navegador e nunca é enviado',
    restored: 'Rascunho restaurado',
    restoredTitle: 'O rascunho fica neste navegador e nunca é enviado; clique em Novo para apagá-lo',
    quotaState: 'Armazenamento cheio; rascunho não salvo',
    quotaNotice:
      'O armazenamento local do navegador está cheio, então o rascunho não pode ser salvo por enquanto. A página continua funcionando; baixe o PDF ou salve o Markdown para não perder seu trabalho.',
    storageOff: 'Armazenamento local indisponível; o rascunho não será salvo',
    imageBudget:
      'As imagens somam mais de 50 MB. O excedente não será salvo localmente e precisará ser arrastado de novo na próxima vez.',
    imageQuota:
      'O armazenamento local do navegador está cheio, então algumas imagens não foram salvas e precisarão ser arrastadas de novo na próxima vez.',
    imageEmbedded: 'Imagem incorporada: {name}',
    fileLoaded: 'Arquivo aberto: {name}',
    pasteBlocked: 'O navegador não permitiu ler a área de transferência. Pressione ⌘/Ctrl + V no editor.',
    /** {name} */
    downloaded: 'Salvo: {name}',
    unsupportedFile: 'Tipo de arquivo não suportado: {name}',

    diagramPending: 'Desenhando o diagrama…',
    diagramError: 'Não foi possível desenhar o diagrama: {detail}',
    mathError: 'Não foi possível compor a fórmula: {detail}',
    diagramErrorAt: 'Erro no diagrama, linha {line}',
    diagramErrorTitle: 'Erro no diagrama',
    diagramUnknown: 'Tipo de diagrama desconhecido: “{name}”',
    diagramStale: 'Mostrando a última versão que foi desenhada',
    diagramCopySvg: 'Copiar SVG',
    diagramCopied: 'SVG copiado para a área de transferência',
    diagramCopyFailed: 'A área de transferência não está disponível aqui; baixe o SVG',
    diagramDownloadSvg: 'Baixar SVG',
    diagramDownloadPng: 'Baixar PNG',
    diagramActions: 'Exportar diagrama',
    remoteImage: 'Imagens remotas não são carregadas: {name}',
    missingImage: 'Imagem não encontrada; arraste o arquivo para a página: {name}',
    tocTitle: 'Sumário',
    pageBreak: 'Quebra de página',
    fromDocument: '(do documento)',
    fromDocumentTitle: 'Definido pelo front matter no início do documento; altere lá',
    frontMatterSyntax: 'Front matter, linha {line}: não foi possível ler esta linha, que foi ignorada.',
    frontMatterValue: 'Front matter, linha {line}: “{value}” não é um valor válido para {key} e foi ignorado.',
    frontMatterUnclosed: 'O front matter no início não tem a linha --- de fechamento, então é tratado como texto comum.',
  },

  sample: `# Documento de exemplo do ${BRAND}

Este conversor de Markdown para PDF **roda inteiramente no seu navegador**. Seu documento nunca é enviado para um servidor: o motor tipográfico, as fontes e a conversão ficam todos nesta aba.

Edite à esquerda e a pré-visualização à direita acompanha enquanto você digita. Clique em **Baixar PDF**, no canto superior direito, para receber o arquivo final, diagramado com quebras de página, números de página e marcadores.

## Diagramas

\`\`\`mermaid
flowchart LR
  A[Markdown] --> B[Leitura com markdown-it]
  B --> C{Tem diagramas?}
  C -- sim --> D[Mermaid gera o SVG]
  C -- não --> E[Gerar código Typst]
  D --> E
  E --> F[(PDF)]
\`\`\`

Os diagramas são incorporados em **vetor**: continuam nítidos ao ampliar, e o texto dentro deles pode ser selecionado e pesquisado.

## Texto

Funcionam *itálico*, **negrito**, ***negrito itálico***, ~~tachado~~, \`código inline\` e [links](https://example.com). A tipografia respeita o idioma: “aspas curvas”, travessão — como este —, cedilha em “ação” e “coração”, til em “não” e “manhã”.

> Uma citação destaca um trecho do resto do texto.
>
> Ela pode ter vários parágrafos.

## Listas

1. Uma lista numerada
2. O segundo item
   - Uma lista aninhada com marcadores
   - Outro item
3. O terceiro item

- [x] Uma tarefa concluída
- [ ] Algo ainda por fazer
- [ ] Mais uma pendência

## Código

\`\`\`python
def fibonacci(n: int) -> int:
    """O realce de sintaxe vem do syntect embutido no Typst."""
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a
\`\`\`

## Tabelas

| Recurso | Detalhes | Situação |
|:--------|:--------:|---------:|
| Acentos, ç e til | Texto real e pesquisável | Disponível |
| Diagramas | Gráficos vetoriais nativos | Disponível |
| Fórmulas | Composição nativa e pesquisável | Disponível |

## Fórmulas

As fórmulas são compostas de forma nativa, então ficam nítidas e pesquisáveis: a identidade de Euler $e^{i\\pi} + 1 = 0$ cabe numa frase, e equações maiores ganham uma linha própria.

$$
x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
$$

## Notas de rodapé

O motor tipográfico é o Typst[^1], que cuida da paginação, do sumário, dos números de página e dos marcadores.

[^1]: Um sistema moderno de composição tipográfica que roda no navegador depois de compilado para WebAssembly.

---

A última linha.
`,
};

export default pt;
