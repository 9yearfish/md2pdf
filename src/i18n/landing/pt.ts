import type { LandingDictionary } from '../landing';

const pt: LandingDictionary<'pt'> = {
  hubHeading: 'Guias e casos de uso',
  homeLink: 'Markdown para PDF',
  pages: {
    'chatgpt-to-pdf': {
      title: 'ChatGPT para PDF: salve respostas grátis, sem extensão',
      description:
        'Salve respostas do ChatGPT em PDF: copie, cole aqui e baixe um arquivo bem diagramado, com tabelas, código e fórmulas. Grátis, sem extensão e sem upload.',
      h1: 'Salve o ChatGPT em PDF',
      lead: 'Clique no botão de copiar do ChatGPT, cole a resposta à esquerda e baixe um PDF bem diagramado. Nada é enviado.',
      navLabel: 'ChatGPT para PDF',
      navBlurb: 'salve uma resposta do ChatGPT em PDF com tabelas, código e fórmulas',
      intro: [
        'O botão de copiar embaixo de cada resposta do ChatGPT coloca o texto na área de transferência em Markdown, com títulos, listas, tabelas, blocos de código e fórmulas. É exatamente isso que esta página recebe. Cole no editor acima e clique em <strong>Baixar PDF</strong>: você recebe um documento com títulos de verdade, números de página e texto selecionável, e não uma captura de tela da janela do chat.',
        'A resposta colada é arrumada automaticamente. O ChatGPT escreve fórmulas entre <code>\\(…\\)</code> e <code>\\[…\\]</code>; elas são convertidas para a forma padrão <code>$…$</code> e <code>$$…$$</code>. Marcadores de citação entre colchetes que sobram das buscas, caracteres invisíveis de largura zero e linhas soltas como “Copiar código” são removidos. Os blocos de código nunca são alterados, e um aviso com <strong>Desfazer</strong> mostra quando algo foi mudado.',
      ],
      howTo: {
        heading: 'Como salvar uma resposta do ChatGPT em PDF',
        steps: [
          { name: 'Copie a resposta.', text: 'Clique no ícone de copiar embaixo da resposta do ChatGPT. Ele copia a resposta em Markdown.' },
          { name: 'Cole aqui.', text: 'Cole no editor de Markdown desta página. A pré-visualização à direita mostra o resultado na hora.' },
          { name: 'Ajuste o layout, se quiser.', text: 'Em Layout, escolha o tamanho do papel, as margens, o tamanho da fonte, os números de página ou o sumário.' },
          { name: 'Baixe o PDF.', text: 'Clique em Baixar PDF. O arquivo é diagramado no seu navegador e salvo no seu dispositivo.' },
        ],
      },
      sections: [
        {
          heading: 'Tabelas, código e fórmulas do jeito que vieram',
          body: [
            'Tabelas continuam tabelas, com o alinhamento das colunas. Blocos de código mantêm a indentação e ganham realce de sintaxe. Fórmulas são compostas como matemática, e não impressas cheias de barras invertidas. Já imprimir a página do chat pelo navegador traz junto a barra lateral, os botões e quebras de página no meio do texto.',
          ],
        },
        {
          heading: 'Uma resposta ou várias',
          body: [
            'Esta ferramenta não exporta a conversa inteira sozinha: ela transforma em documento o que você cola. Cole várias respostas em sequência, escreva seus próprios títulos ou anotações entre elas, e tudo vira um único PDF, com sumário se você ativar essa opção. O texto fica salvo como rascunho no seu navegador, então dá para continuar depois.',
          ],
        },
        {
          heading: 'Privado por construção',
          body: [
            'Respostas do ChatGPT costumam ter coisas de trabalho: código, contratos, anotações de estudo. Aqui elas nunca saem do seu dispositivo. A política de segurança de conteúdo (CSP) da página proíbe enviar qualquer coisa para qualquer lugar, então a conversão acontece inteira nesta aba.',
          ],
        },
      ],
      faq: [
        {
          question: 'Como salvar a conversa inteira do ChatGPT em PDF?',
          answer: [
            'Esta página não baixa a conversa sozinha nem lê links compartilhados. Copie as respostas que quer guardar, na ordem, e cole aqui; se quiser, escreva as perguntas como títulos. Para um arquivo completo de todos os chats, a exportação do próprio ChatGPT (Configurações → Controles de dados → Exportar dados) envia todas as conversas para você baixar, mas em HTML e JSON, não em um PDF formatado.',
          ],
        },
        {
          question: 'Como copiar uma resposta do ChatGPT em Markdown?',
          answer: [
            'Use o ícone de copiar embaixo da resposta em vez de selecionar o texto com o mouse. O botão copia Markdown, então títulos, tabelas e blocos de código vêm junto. Selecionar o texto já renderizado copia só texto simples, e a estrutura, como títulos e bordas de tabela, se perde.',
          ],
        },
        {
          question: 'Por que as fórmulas aparecem como \\( x^2 \\) quando colo em outro lugar?',
          answer: [
            'O ChatGPT escreve matemática com os delimitadores do LaTeX, <code>\\(…\\)</code> no meio do texto e <code>\\[…\\]</code> para equações em destaque, e muitas ferramentas de Markdown não entendem isso. Ao colar aqui, eles são convertidos automaticamente para a sintaxe comum <code>$…$</code> e <code>$$…$$</code>, e as fórmulas saem compostas no PDF.',
          ],
        },
        {
          question: 'Por que não pedir para o próprio ChatGPT gerar o PDF?',
          answer: [
            'O ChatGPT consegue criar um arquivo PDF rodando código, mas o resultado é tão bom quanto o script: o layout é básico, e as fontes muitas vezes não têm os caracteres de chinês, japonês, coreano ou outros alfabetos, e é por isso que esses PDFs às vezes mostram quadradinhos vazios. Pedir a resposta em Markdown e converter aqui dá títulos bem compostos, tabelas, código com realce e fontes feitas para o seu idioma.',
          ],
        },
        {
          question: 'Funciona no celular?',
          answer: [
            'Funciona, em qualquer navegador de celular moderno: copie a resposta no aplicativo do ChatGPT, cole aqui e baixe. O motor tipográfico (cerca de 7 MB) é baixado na primeira vez que você gera um PDF e fica guardado depois disso.',
          ],
        },
        {
          question: 'É grátis? Minha conversa é enviada para algum servidor?',
          answer: [
            'É grátis, sem cadastro, sem marca d’água e sem limite. E nada é enviado: o texto é convertido no seu navegador e não vai para servidor nenhum, nem para o nosso. Ele fica só como rascunho neste navegador, e o botão <strong>Novo</strong> apaga tudo.',
          ],
        },
      ],
      sample: `# Financiamento imobiliário: tabela SAC ou tabela Price?

Os dois sistemas pagam a mesma dívida, mas distribuem os juros de formas diferentes. Veja um financiamento de **200.000 reais**, com juros de **1 % ao mês**, em **240 meses**.

## Tabela Price: parcelas iguais

Na tabela Price, a parcela é fixa. Com valor financiado $PV$, taxa mensal $i$ e prazo de $n$ meses:

$$
PMT = PV \\cdot \\frac{i}{1 - (1 + i)^{-n}}
$$

Com $PV = 200000$, $i = 0{,}01$ e $n = 240$, a parcela fica em cerca de **2.202,17 reais** do começo ao fim.

## Tabela SAC: amortização constante

No SAC, a amortização é sempre $PV / n$ e os juros incidem sobre o saldo devedor, que cai todo mês. Por isso a parcela começa mais alta e vai diminuindo.

| Sistema | Primeira parcela | Última parcela | Total de juros |
|:--------|-----------------:|---------------:|---------------:|
| Price | 2.202,17 reais | 2.202,17 reais | 328.521,34 reais |
| SAC | 2.833,33 reais | 841,67 reais | 241.000,00 reais |

Em resumo:

1. **O SAC paga menos juros no total**, porque o saldo devedor cai mais rápido.
2. **A Price cabe melhor no orçamento no início**, já que a primeira parcela é menor.

## Faça a conta você mesmo

\`\`\`python
def parcela_price(pv: float, i: float, n: int) -> float:
    """Parcela fixa da tabela Price."""
    return pv * i / (1 - (1 + i) ** -n)

def parcelas_sac(pv: float, i: float, n: int) -> list[float]:
    """Parcelas decrescentes do SAC."""
    amortizacao = pv / n
    return [amortizacao + (pv - k * amortizacao) * i for k in range(n)]

print(round(parcela_price(200_000, 0.01, 240), 2))
sac = parcelas_sac(200_000, 0.01, 240)
print(round(sac[0], 2), round(sac[-1], 2))
\`\`\`

> **Dica:** antes de assinar, compare o Custo Efetivo Total (CET), que inclui seguros e tarifas além dos juros.

---

*Resposta colada do ChatGPT. Troque pelo seu texto e clique em **Baixar PDF**.*
`,
    },

    'deepseek-to-pdf': {
      title: 'DeepSeek para PDF: exporte respostas com fórmulas, grátis',
      description:
        'Cole uma resposta do DeepSeek e baixe um PDF limpo. Fórmulas em \\( \\) e \\[ \\] são convertidas; tabelas e código ficam intactos. Grátis, no navegador, sem upload.',
      h1: 'DeepSeek para PDF',
      lead: 'Copie uma resposta do DeepSeek, cole à esquerda e baixe um PDF com as fórmulas, tabelas e código bem compostos. Nada é enviado.',
      navLabel: 'DeepSeek para PDF',
      navBlurb: 'exporte respostas do DeepSeek em PDF, com as fórmulas',
      intro: [
        'O DeepSeek é muito usado justamente para o que é difícil de imprimir: demonstrações, resoluções passo a passo, exercícios de física e código. O botão de copiar embaixo da resposta copia tudo em Markdown, com as fórmulas entre os delimitadores do LaTeX, como <code>\\(…\\)</code> e <code>\\[…\\]</code>. Ao colar aqui, esses delimitadores são convertidos para a forma padrão <code>$…$</code> e <code>$$…$$</code>, e as fórmulas saem compostas no PDF em vez de virarem um monte de barras invertidas.',
        'Só a resposta é copiada, não o raciocínio que o DeepSeek mostra enquanto pensa. Cole uma ou várias respostas, acrescente seus próprios títulos ou anotações e clique em <strong>Baixar PDF</strong>.',
      ],
      howTo: {
        heading: 'Como exportar uma resposta do DeepSeek para PDF',
        steps: [
          { name: 'Copie a resposta.', text: 'Clique no ícone de copiar embaixo da resposta do DeepSeek.' },
          { name: 'Cole aqui.', text: 'Cole no editor de Markdown. Os delimitadores das fórmulas e os caracteres invisíveis são ajustados, com a opção Desfazer se você quiser o original.' },
          { name: 'Confira a pré-visualização.', text: 'Fórmulas, tabelas e blocos de código aparecem na pré-visualização à direita.' },
          { name: 'Baixe o PDF.', text: 'Clique em Baixar PDF. O arquivo é gerado no seu navegador.' },
        ],
      },
      sections: [
        {
          heading: 'Fórmulas compostas como em livro',
          body: [
            'As fórmulas no meio do texto continuam na linha, e as equações em destaque ganham uma linha própria, centralizada, como em um livro didático. Como o PDF tem texto de verdade, e não uma imagem da página, o arquivo fica leve e pesquisável.',
          ],
        },
        {
          heading: 'Código e tabelas intactos',
          body: [
            'Blocos de código mantêm a indentação e ganham realce de sintaxe; tabelas mantêm as colunas e o alinhamento. A limpeza automática nunca altera nada dentro de um bloco de código.',
          ],
        },
        {
          heading: 'Nada sai do seu navegador',
          body: [
            'A conversão roda localmente nesta aba. A política de segurança de conteúdo (CSP) da página proíbe enviar seu texto para qualquer servidor, inclusive o nosso.',
          ],
        },
      ],
      faq: [
        {
          question: 'Por que as fórmulas do DeepSeek aparecem com \\( \\) ou \\[ \\] em outros editores?',
          answer: [
            'O DeepSeek escreve matemática com os delimitadores de colchetes e parênteses do LaTeX, que muitas ferramentas de Markdown não reconhecem. Coladas aqui, as fórmulas são convertidas para <code>$…$</code> e <code>$$…$$</code>, que este conversor compõe no PDF.',
          ],
        },
        {
          question: 'Como exportar a conversa inteira do DeepSeek?',
          answer: [
            'Esta página não exporta a conversa sozinha nem lê links compartilhados. Copie as respostas que quer guardar e cole aqui em sequência, com um título acima de cada uma; ative o <strong>Sumário</strong> em Layout para ter um índice no começo do PDF.',
          ],
        },
        {
          question: 'O raciocínio (a parte em que ele “pensa”) vem junto?',
          answer: [
            'O botão de copiar copia só a resposta final. Se quiser o raciocínio também, selecione e copie essa parte separadamente e cole onde preferir no documento.',
          ],
        },
        {
          question: 'Tabelas e código ficam certos no PDF?',
          answer: [
            'Ficam. Tabelas saem com colunas e alinhamento, e o código sai com indentação preservada e realce de sintaxe. Como o texto do PDF é real, dá para selecionar e copiar um trecho de código depois.',
          ],
        },
        {
          question: 'É grátis? Meu texto é enviado para algum lugar?',
          answer: [
            'É grátis, sem cadastro e sem marca d’água, e nada é enviado: o PDF é gerado no seu navegador.',
          ],
        },
      ],
      sample: `# Lançamento oblíquo: alcance e altura máxima

Uma bola é chutada com velocidade inicial $v_0 = 20$ m/s, formando um ângulo $\\theta$ de 30° com o chão. Vamos desprezar a resistência do ar e usar $g = 10$ m/s².

## Passo 1: decompor a velocidade

$$
v_x = v_0 \\cos\\theta = 20 \\cdot \\frac{\\sqrt{3}}{2} \\approx 17{,}3 \\text{ m/s}
\\qquad
v_y = v_0 \\sin\\theta = 20 \\cdot \\frac{1}{2} = 10 \\text{ m/s}
$$

## Passo 2: tempo de voo e altura máxima

A bola sobe até $v_y$ zerar e leva o mesmo tempo para descer:

$$
T = \\frac{2 v_0 \\sin\\theta}{g} = \\frac{2 \\cdot 10}{10} = 2 \\text{ s}
\\qquad
H = \\frac{v_0^2 \\sin^2\\theta}{2g} = \\frac{400 \\cdot 0{,}25}{20} = 5 \\text{ m}
$$

## Passo 3: alcance horizontal

$$
R = \\frac{v_0^2 \\sin(2\\theta)}{g}
$$

| Ângulo $\\theta$ | Alcance |
|:----------------|------------:|
| 15° | 20,0 m |
| 30° | 34,6 m |
| 45° | 40,0 m |
| 60° | 34,6 m |
| 75° | 20,0 m |

Repare que ângulos complementares, como 30° e 60°, dão o mesmo alcance, e que o máximo acontece em 45°.

## Conferindo com código

\`\`\`python
import math

def alcance(v0: float, angulo_graus: float, g: float = 10.0) -> float:
    theta = math.radians(angulo_graus)
    return v0 ** 2 * math.sin(2 * theta) / g

for angulo in (15, 30, 45, 60, 75):
    print(angulo, round(alcance(20, angulo), 1))
\`\`\`

**Resposta:** a bola fica $2$ s no ar, sobe até $5$ m e cai a cerca de $34{,}6$ m do ponto de partida.

---

*Resposta colada do DeepSeek. Troque pelo seu texto e clique em **Baixar PDF**.*
`,
    },

    'gemini-to-pdf': {
      title: 'Gemini para PDF: salve respostas do Gemini sem extensão',
      description:
        'Copie uma resposta do Gemini, cole aqui e baixe um PDF limpo e bem diagramado, com tabelas, código e fórmulas. Grátis, sem cadastro e sem sair do navegador.',
      h1: 'Gemini para PDF',
      lead: 'Copie uma resposta do Google Gemini, cole à esquerda e baixe um PDF limpo, com tabelas e código. Nada é enviado.',
      navLabel: 'Gemini para PDF',
      navBlurb: 'salve respostas do Google Gemini em um PDF bem diagramado',
      intro: [
        'O Gemini consegue mandar uma resposta para o Google Docs, e de lá dá para baixar em PDF, mas esse caminho exige uma conta Google, uma passagem pelo editor de documentos e, muitas vezes, algum retrabalho na formatação. Copiar a resposta e colar aqui é mais rápido: o botão de copiar do Gemini copia Markdown, e esta página transforma Markdown em um PDF bem diagramado em um passo só, no seu navegador.',
        'Tabelas mantêm as colunas, blocos de código mantêm a indentação e o realce, e as fórmulas saem compostas. Sobras do chat, como caracteres invisíveis de largura zero, são limpas quando você cola, com a opção <strong>Desfazer</strong> se quiser o original de volta.',
      ],
      howTo: {
        heading: 'Como exportar uma resposta do Gemini para PDF',
        steps: [
          { name: 'Copie a resposta.', text: 'Use a opção de copiar embaixo da resposta do Gemini.' },
          { name: 'Cole aqui.', text: 'Cole no editor de Markdown desta página e confira a pré-visualização à direita.' },
          { name: 'Ajuste o layout.', text: 'Se quiser, escolha o tamanho do papel, as margens, os números de página ou o sumário em Layout.' },
          { name: 'Baixe o PDF.', text: 'Clique em Baixar PDF; o arquivo é diagramado no seu navegador.' },
        ],
      },
      sections: [
        {
          heading: 'Pesquisas e roteiros que ficam bons no papel',
          body: [
            'Respostas do Gemini costumam ser comparações e planos longos: roteiros de viagem, comparativos de produtos, resumos de estudo. Em PDF, elas ganham títulos de verdade, números de página e sumário, se você quiser, e as tabelas são ajustadas à largura da página em vez de ficarem cortadas.',
          ],
        },
        {
          heading: 'Junte várias respostas',
          body: [
            'Cole mais de uma resposta no mesmo documento, escreva suas anotações entre elas e baixe tudo em um arquivo só. O texto fica guardado como rascunho neste navegador, caso você feche a aba.',
          ],
        },
        {
          heading: 'Sem conta e sem upload',
          body: [
            'Não há nada para entrar ou cadastrar. O conversor roda no seu navegador, e a página não tem permissão para enviar o que você cola para servidor nenhum.',
          ],
        },
      ],
      faq: [
        {
          question: 'Como exportar uma conversa do Gemini para PDF?',
          answer: [
            'Copie as respostas que quer guardar, cole aqui na ordem e clique em <strong>Baixar PDF</strong>. Esta página não baixa a conversa inteira sozinha. Outra opção é a exportação do próprio Gemini para o Google Docs, de onde você pode baixar um PDF, mas para isso precisa de uma conta Google.',
          ],
        },
        {
          question: 'Por que as tabelas do Gemini quebram quando imprimo a página?',
          answer: [
            'Imprimir a página do chat imprime a página web, com o layout dela, os painéis laterais e as tabelas com rolagem. Coladas aqui, as tabelas passam a fazer parte de um documento diagramado para papel.',
          ],
        },
        {
          question: 'Funciona com o código e as fórmulas do Gemini?',
          answer: [
            'Funciona. Blocos de código ganham realce e nunca são alterados pela limpeza automática; fórmulas em <code>$…$</code>, <code>\\(…\\)</code> ou <code>\\[…\\]</code> são compostas no PDF.',
          ],
        },
        {
          question: 'Funciona no celular?',
          answer: [
            'Funciona em qualquer navegador de celular moderno: copie a resposta no aplicativo do Gemini, cole aqui e baixe o PDF.',
          ],
        },
        {
          question: 'É grátis?',
          answer: ['É: sem cadastro, sem marca d’água e sem limite de PDFs.'],
        },
      ],
      sample: `# Etanol ou gasolina: qual compensa abastecer?

A regra mais conhecida diz que o etanol vale a pena quando custa **até 70 %** do preço da gasolina, porque rende menos por litro.

## A regra dos 70 %

Com o preço do etanol $P_e$ e o da gasolina $P_g$, abasteça com etanol quando:

$$
\\frac{P_e}{P_g} < 0{,}7
$$

## Comparando três postos

| Posto | Gasolina (reais/L) | Etanol (reais/L) | Razão | Melhor opção |
|:------|-------------------:|-----------------:|------:|:-------------|
| Posto A | 6,19 | 4,09 | 0,66 | Etanol |
| Posto B | 6,49 | 4,49 | 0,69 | Etanol, por pouco |
| Posto C | 5,89 | 4,39 | 0,75 | Gasolina |

## O que muda a conta

- **O consumo do seu carro.** Alguns motores flex rendem mais ou menos que 70 % com etanol; vale medir o seu.
- **O tipo de trajeto.** Na cidade e na estrada a diferença de consumo não é a mesma.
- **A partida a frio.** Em regiões frias, o etanol pode exigir mais do motor nas primeiras manhãs.

## Calculando com o consumo real

\`\`\`javascript
function custoPorKm(preco, kmPorLitro) {
  return preco / kmPorLitro;
}

const gasolina = custoPorKm(6.19, 12.0);
const etanol = custoPorKm(4.09, 8.4);
console.log(etanol < gasolina ? 'Etanol' : 'Gasolina', etanol.toFixed(3), gasolina.toFixed(3));
\`\`\`

> Se você souber quantos quilômetros seu carro faz por litro com cada combustível, a comparação por quilômetro é mais precisa que a regra dos 70 %.

---

*Resposta colada do Gemini. Troque pelo seu texto e clique em **Baixar PDF**.*
`,
    },

    'mermaid-to-pdf': {
      title: 'Diagramas Mermaid em PDF: vetor e texto selecionável',
      description:
        'Converta Markdown com diagramas Mermaid para PDF. Os diagramas viram gráficos vetoriais nítidos, com texto selecionável e ajustados à página. Grátis, sem upload.',
      h1: 'Converter diagramas Mermaid para PDF',
      lead: 'Escreva ou cole Markdown com blocos ```mermaid e baixe um PDF em que cada diagrama é um gráfico vetorial nítido, com texto selecionável.',
      navLabel: 'Diagramas Mermaid em PDF',
      navBlurb: 'diagramas em vetor, com texto selecionável, dentro do PDF',
      intro: [
        'O Mermaid transforma poucas linhas de texto em fluxogramas, diagramas de sequência, gráficos de Gantt e muito mais. O problema costuma aparecer na hora de levar esses diagramas para um PDF: muitos conversores de Markdown online nem renderizam Mermaid e imprimem só o código, alguns transformam a página inteira em uma única imagem, e a exportação de alguns editores corta diagramas largos ou depende das fontes instaladas no seu computador.',
        'Aqui, cada bloco <code>```mermaid</code> é renderizado em SVG no seu navegador e incorporado ao PDF como gráfico vetorial nativo. O diagrama continua nítido em qualquer zoom, os rótulos podem ser selecionados, copiados e encontrados pela busca, e as cores definidas com <code>classDef</code> ou <code>style</code> saem como você escreveu.',
      ],
      howTo: {
        heading: 'Como converter diagramas Mermaid para PDF',
        steps: [
          { name: 'Adicione seus diagramas.', text: 'Cole seu Markdown ou escreva um bloco de código cercado com a linguagem mermaid.' },
          { name: 'Confira a pré-visualização.', text: 'Cada diagrama aparece na pré-visualização enquanto você digita; erros de sintaxe são mostrados no lugar do diagrama.' },
          { name: 'Baixe o PDF.', text: 'Clique em Baixar PDF. Os diagramas entram como gráficos vetoriais junto com o resto do documento.' },
        ],
      },
      sections: [
        {
          heading: 'Vetor e texto selecionável, nunca captura de tela',
          body: [
            'Como os diagramas entram como traçados vetoriais e texto, e não como pixels, eles saem nítidos em qualquer tamanho de impressão e deixam o arquivo leve. A busca do seu leitor de PDF encontra palavras dentro dos diagramas, e você pode copiar um rótulo direto de um fluxograma.',
          ],
        },
        {
          heading: 'Do tamanho da página',
          body: [
            'Os diagramas mantêm o tamanho natural quando cabem; os largos são reduzidos até a largura do texto em vez de passarem da margem, e um mais alto que a página é reduzido para caber em uma página. Os rótulos são desenhados como texto SVG, e não como HTML incorporado, que é o que faz algumas outras exportações mostrarem caixas vazias no lugar dos rótulos.',
          ],
        },
        {
          heading: 'Todos os tipos de diagrama mais comuns',
          body: [
            'Fluxogramas, diagramas de sequência, de classes, de estados e de entidade-relacionamento, gráficos de Gantt, gráficos de pizza, mapas mentais, linhas do tempo e os outros tipos que o Mermaid suporta são renderizados pelo próprio Mermaid, então a sintaxe é exatamente a que você já usa no GitHub, no GitLab, no Obsidian ou no Notion.',
          ],
        },
      ],
      faq: [
        {
          question: 'Por que meu diagrama Mermaid aparece como código no PDF?',
          answer: [
            'O conversor que você usou não renderiza Mermaid e trata o bloco como código comum. Aqui, todo bloco cercado marcado como <code>mermaid</code> vira diagrama. Se a sintaxe tiver erro, a pré-visualização e o PDF mostram um quadro com a mensagem de erro do Mermaid, o número da linha e a linha com problema, e o resto do documento sai normalmente.',
          ],
        },
        {
          question: 'O diagrama vira imagem no PDF?',
          answer: [
            'Ele vira um gráfico vetorial, não uma imagem em pixels. Continua nítido ao ampliar, e o texto dentro dele é texto de verdade, que pode ser selecionado e pesquisado.',
          ],
        },
        {
          question: 'As cores e os estilos personalizados ficam?',
          answer: [
            'Ficam. Preenchimentos, cores de contorno e espessuras de linha definidos com <code>classDef</code>, <code>class</code> ou <code>style</code> são mantidos no PDF.',
          ],
        },
        {
          question: 'Dá para exportar só o diagrama, sem o resto do documento?',
          answer: [
            'Dá: deixe apenas o bloco <code>```mermaid</code> no editor e baixe. O PDF terá só o diagrama, no tamanho natural ou reduzido para caber na página. Para usar o diagrama em outro lugar, passe o mouse sobre ele na pré-visualização para copiar o SVG ou baixá-lo em SVG ou PNG.',
          ],
        },
        {
          question: 'Meu diagrama é enviado para algum servidor de renderização?',
          answer: [
            'Não. O Mermaid roda no seu navegador, assim como o motor de PDF. A página não tem permissão para enviar seu documento para lugar nenhum.',
          ],
        },
      ],
      sample: `# Diagramas Mermaid em um PDF

Todos os diagramas abaixo são renderizados no seu navegador e incorporados ao PDF como **gráficos vetoriais**: amplie quanto quiser e selecione ou pesquise o texto dentro deles.

## Fluxograma

\`\`\`mermaid
flowchart LR
  A[Cliente faz o pedido] --> B{Pagamento aprovado?}
  B -- Pix ou cartão --> C[Separar no estoque]
  B -- boleto pendente --> D[Aguardar compensação]
  D --> C
  C --> E[Enviar pelos Correios]
  E --> F([Entregue])
  classDef ok fill:#e3f5e8,stroke:#1f8a4c,stroke-width:2px
  class F ok
\`\`\`

## Diagrama de sequência

\`\`\`mermaid
sequenceDiagram
  participant C as Cliente
  participant L as Loja virtual
  participant B as Banco
  C->>L: Finaliza a compra
  L->>B: Gera cobrança Pix
  B-->>C: Mostra o QR Code
  C->>B: Confirma o pagamento
  B-->>L: Pagamento recebido
  L-->>C: Pedido confirmado
\`\`\`

## Gráfico de Gantt

\`\`\`mermaid
gantt
  title Cronograma do TCC
  dateFormat YYYY-MM-DD
  section Pesquisa
    Revisão bibliográfica :done, p1, 2026-03-02, 30d
    Coleta de dados       :active, p2, after p1, 45d
  section Escrita
    Redação               :p3, after p2, 40d
    Defesa                :milestone, after p3, 0d
\`\`\`

## Diagrama de estados

\`\`\`mermaid
stateDiagram-v2
  [*] --> Aguardando
  Aguardando --> Pago: pagamento aprovado
  Aguardando --> Cancelado: prazo expirado
  Pago --> Enviado: nota fiscal emitida
  Enviado --> Entregue
  Entregue --> [*]
  Cancelado --> [*]
\`\`\`

*Edite qualquer bloco à esquerda e a pré-visualização acompanha; clique em **Baixar PDF** para receber o arquivo.*
`,
    },

    'readme-to-pdf': {
      title: 'Converter README para PDF · README.md do GitHub, grátis',
      description:
        'Converta um README.md do GitHub para PDF com as tabelas, o código destacado e os diagramas Mermaid. Arraste as imagens que ele usa. Grátis e sem upload.',
      h1: 'Converta um README para PDF',
      lead: 'Cole o README.md ou arraste o arquivo e baixe um PDF diagramado, com tabelas, blocos de código e diagramas Mermaid. Nada é enviado.',
      navLabel: 'README para PDF',
      navBlurb: 'um README.md do GitHub em PDF, com tabelas, código e diagramas',
      intro: [
        'O GitHub mostra um README muito bem, mas não tem a opção «baixar como PDF». Imprimir a página do repositório pelo navegador traz junto a lista de arquivos, a barra lateral e a navegação, com quebras de página onde calhar. Quase sempre o que você quer é só o README, como documento: para anexar a uma proposta, mandar para revisão ou ler no papel.',
        'Aqui o Markdown é diagramado como um documento de verdade. Os títulos viram marcadores do PDF, as tabelas mantêm o alinhamento, os blocos de código ganham destaque de sintaxe e os blocos <code>```mermaid</code>, que o GitHub também desenha, viram diagramas vetoriais. Fórmulas em <code>$…$</code> funcionam como no GitHub.',
      ],
      howTo: {
        heading: 'Como converter um README para PDF',
        steps: [
          { name: 'Pegue o Markdown.', text: 'No GitHub, abra o README.md, clique em Raw e copie o texto, ou use o arquivo do seu clone do repositório.' },
          { name: 'Cole ou arraste aqui.', text: 'Cole o texto no editor ou solte o arquivo README.md em qualquer lugar da página.' },
          { name: 'Traga as imagens.', text: 'Arraste para a página as imagens que o README usa; um caminho como docs/tela.png é reconhecido pelo nome do arquivo.' },
          { name: 'Baixe o PDF.', text: 'Clique em Baixar PDF, ou em Imprimir para mandar esse mesmo PDF para a impressora.' },
        ],
      },
      sections: [
        {
          heading: 'O que é mantido',
          body: [
            'Tabelas no estilo do GitHub com alinhamento, código com destaque de sintaxe, listas de tarefas, notas de rodapé, listas aninhadas, links que continuam clicáveis e diagramas Mermaid de fluxo, de sequência e dos outros tipos, desenhados como vetores com texto selecionável. Ative <strong>Sumário</strong> em Layout para incluir um sumário; um diagrama largo ou alto demais é ajustado à página em vez de ser cortado.',
          ],
        },
        {
          heading: 'Imagens: é só arrastar',
          body: [
            'A página nunca se conecta a outro servidor, então não baixa imagens da internet. As imagens guardadas no repositório são fáceis: solte os arquivos na página e cada referência a elas é preenchida, não importa a pasta indicada no README. As que ficam hospedadas em outro lugar, inclusive os selos do shields.io no topo de muitos README, aparecem no PDF como um aviso curto de «imagem indisponível»; apague essas linhas ou baixe a imagem e arraste para cá.',
          ],
        },
        {
          heading: 'O que não é mantido',
          body: [
            'HTML não é interpretado: um cabeçalho centralizado com <code>&lt;p align="center"&gt;</code>, uma tag <code>&lt;img&gt;</code> ou um bloco recolhível <code>&lt;details&gt;</code> aparecem como texto, então reescreva essas partes em Markdown. Os alertas <code>&gt; [!NOTE]</code> do GitHub viram citações comuns, códigos como <code>:rocket:</code> ficam como texto e os emojis não têm fonte aqui, então saem como caixas vazias (a página avisa quais caracteres são).',
          ],
        },
      ],
      faq: [
        {
          question: 'Como converto um README do GitHub para PDF?',
          answer: [
            'Abra o README no GitHub, clique em <strong>Raw</strong>, copie tudo e cole no editor desta página; depois clique em <strong>Baixar PDF</strong>. Se o repositório estiver no seu computador, arraste o arquivo README.md direto para a página.',
          ],
        },
        {
          question: 'Por que as imagens sumiram do PDF?',
          answer: [
            'Imagens com caminho relativo, como <code>docs/arquitetura.png</code>, são arquivos do repositório, e esta página não enxerga o seu repositório: arraste esses arquivos para a página e eles são incorporados. Imagens referenciadas por endereço web, selos incluídos, nunca são baixadas, porque aqui nada pode se conectar a outros servidores.',
          ],
        },
        {
          question: 'Os diagramas Mermaid do README aparecem?',
          answer: [
            'Aparecem. Os blocos <code>```mermaid</code> são desenhados no seu navegador e incorporados como gráficos vetoriais, os mesmos diagramas que o GitHub mostra. Um diagrama com erro de sintaxe aparece como um quadro com a mensagem e a linha, e o resto do PDF não é afetado.',
          ],
        },
        {
          question: 'Dá para converter o README de um repositório privado?',
          answer: [
            'Dá. O texto é diagramado nesta aba do navegador e não é enviado a lugar nenhum, então não é preciso tornar nada público nem dar acesso a ninguém. Copie o Markdown do repositório e cole aqui.',
          ],
        },
        {
          question: 'Por que o HTML do README aparece como texto?',
          answer: [
            'HTML não tem equivalente no motor de diagramação, então as tags são mostradas em vez de interpretadas. A maior parte do HTML de um README é só layout: troque um logotipo centralizado por uma linha de imagem comum e um bloco <code>&lt;details&gt;</code> por um título.',
          ],
        },
      ],
      sample: `# arruma

Uma ferramenta de linha de comando que organiza por data uma pasta bagunçada de fotos e documentos, sem nunca apagar nada.

## Instalação

\`\`\`bash
npm install --global arruma
\`\`\`

Requer Node.js 20 ou mais recente. Funciona no macOS, no Linux e no Windows.

## Uso

\`\`\`bash
arruma ~/Downloads --para ~/Arquivo --simular
\`\`\`

| Opção | Padrão | O que faz |
|:--|:--:|:--|
| \`--para <pasta>\` | \`./organizado\` | Onde ficam as pastas por data |
| \`--por <unidade>\` | \`mes\` | \`dia\`, \`mes\` ou \`ano\` |
| \`--simular\` | não | Mostra o plano sem mover nada |
| \`--desfazer\` | | Desfaz a última execução |

## Como a data é escolhida

\`\`\`mermaid
flowchart LR
  F[Arquivo] --> E{Data EXIF?}
  E -- sim --> D[Data da foto]
  E -- não --> M[Última modificação]
  D --> P[Pasta AAAA/MM]
  M --> P
\`\`\`

## Configuração

Um arquivo \`arruma.json\` na pasta de origem muda os padrões:

\`\`\`json
{
  "por": "ano",
  "ignorar": ["*.tmp", "node_modules"]
}
\`\`\`

## Próximos passos

- [x] Desfazer a última execução
- [x] Modo de simulação
- [ ] Detecção de duplicatas

## Como contribuir

Pull requests são bem-vindos. Rode \`npm test\` antes de abrir um.

## Licença

MIT
`,
    },
  },
};

export default pt;
