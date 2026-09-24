import type { Messages } from './types';
import { BRAND } from './constants';

const zh: Messages = {
  locale: {
    code: 'zh',
    lang: 'zh-CN',
    hreflang: 'zh',
    ogLocale: 'zh_CN',
    nativeName: '简体中文',
  },

  meta: {
    title: 'Markdown 转 PDF 在线工具 · 支持 Mermaid 流程图与中文排版',
    description:
      '免费的在线 Markdown 转 PDF 工具。Mermaid 流程图以矢量嵌入、文字可选中，中文是可搜索的真文字。全部在浏览器本地完成，文档不上传，无需注册，无水印。',
    ogTitle: 'Markdown 转 PDF · 支持 Mermaid 流程图与中文排版',
    ogDescription:
      '在浏览器里把 Markdown 转成 PDF，流程图以矢量嵌入，中文是可搜索的真文字。文档不上传，无需注册，无水印。',
    appDescription:
      '在浏览器本地把 Markdown 转换为 PDF，Mermaid 流程图以矢量嵌入，中文排版正确，文档不会上传。',
    operatingSystem: '任何支持 WebAssembly 的现代浏览器',
    featureList: [
      'Mermaid 流程图矢量嵌入，图中文字可选中',
      '中文（简体、繁体）、日文、韩文、西里尔字母与越南语排版',
      '代码语法高亮',
      '目录、页码与 PDF 书签',
      '即时预览，草稿自动保存在本地浏览器',
      '本地转换，文档不上传',
    ],
  },

  page: {
    privacyBadge: '本地转换 · 不上传 · 无需注册 · 无水印 · 可离线使用',
    privacyTitle: '解析、排版与生成全部在这个标签页里完成，文档不会离开你的设备',
    newDoc: '新建',
    newDocTitle: '新建空白文档（同时清除本地草稿）',
    open: '打开',
    openTitle: '打开 .md 文件',
    layout: '排版',
    layoutTitle: '排版设置',
    downloadTitle: '下载 PDF (⌘/Ctrl + S)',
    printTitle: '打印排好版的 PDF (⌘/Ctrl + P)',
    language: '语言',
    paper: '纸张',
    margin: '页边距',
    fontSize: '字号',
    lineHeight: '行距',
    pageNumbers: '页码',
    toc: '目录',
    justify: '两端对齐',
    docLanguage: '文档语言',
    template: '模板',
    templateDefault: '默认',
    templateReport: '报告',
    templateAcademic: '学术论文',
    templateResume: '简历',
    templateLetter: '信函',
    cover: '封面',
    h1NewPage: '一级标题另起一页',
    header: '页眉',
    footer: '页脚',
    bandTitle: '可用变量：{title} {page} {pages} {date} {author}。用 | 分隔左 | 中 | 右。留空使用模板默认，填 none 则不显示。',
    editorHint: '可拖入 .md 文件或图片',
    editorLabel: 'Markdown 源文件',
    editorPlaceholder: '在这里输入或粘贴 Markdown，也可以把 .md 文件拖进来…',
    preview: '预览',
    dropHint: '松开以导入文件',
    source: '源码',
    proof: '校样',
    live: '实时',
    viewSwitch: '显示',
    fullscreen: '全屏编辑',
    heroTitle: 'Markdown 转 PDF',
    heroTagline: '：在浏览器里完成排版。',
    heroLead: '粘贴或拖入 Markdown，下载排版精良的 PDF，Mermaid 图表保持矢量。文档从不离开你的浏览器。',
    aboutToggle: `关于 ${BRAND}`,
    emptyTitle: '粘贴 Markdown、拖入 .md 文件，或打开一个文件',
    paste: '粘贴',
    pasteTitle: '从剪贴板粘贴 Markdown',
  },

  about: {
    heading: '在浏览器里把 Markdown 转成 PDF',
    intro: [
      '粘贴或拖入一份 Markdown，右侧边写边预览，点「下载 PDF」就拿到排好版的文件。预览是即时的，不需要等待；PDF 由真正的排版引擎生成，分页、页码和目录都在下载的文件里。',
      '整个过程没有服务器参与。Markdown 解析、流程图渲染、排版和 PDF 生成全部在这个标签页里完成，不需要注册，没有水印，也没有次数限制。你写的内容会自动保存在你自己浏览器的本地存储里，关掉页面再打开也还在；它从不上传，点「新建」或清除本站的网站数据即可删除。',
    ],
    sections: [
      {
        heading: '流程图是矢量的，不是截图',
        body: [
          '<code>```mermaid</code> 代码块会被渲染成 SVG 并以原生矢量图形嵌入 PDF。放大到任意倍数都清晰，图里的文字可以被选中、复制和搜索，<code>classDef</code> 自定义的填充色、描边颜色和线宽都会完整保留。不少在线工具根本不渲染 Mermaid，只会把源码原样印出来；还有的把整页转成图片，里面的文字一个也选不中。',
        ],
      },
      {
        heading: '中文是真文字',
        body: [
          '中文以可选中、可搜索的真实文本嵌入，字体会自动子集化以控制文件体积。常用汉字使用一份较小的字体子集，如果文档里出现了子集之外的生僻字，会自动切换到完整字体，不会出现缺字的方块。中英文混排时会正确处理断行，不会插入多余空格。繁体中文、日文、韩文、西里尔字母和越南语也有各自合适的字体。',
        ],
      },
      {
        heading: '排版由真正的排版引擎完成',
        body: [
          '底层用的是 Typst —— 一个编译成 WebAssembly、可以在浏览器里运行的现代排版系统。分页、孤行控制、目录、页码、脚注和 PDF 书签都由它处理，代码高亮也由它内置的高亮器完成。引擎约 10 MB，会在你编辑时于后台静默加载，缓存在本机，之后可以离线使用。',
        ],
      },
      {
        heading: '支持的 Markdown 语法',
        body: [
          '标题、段落、粗体、斜体、删除线、行内代码、链接、图片、有序与无序列表、嵌套列表、任务列表、引用块、带对齐的表格、定义列表、脚注、分隔线、围栏代码块（带语法高亮），以及 Mermaid 流程图。图片支持拖拽和粘贴本地文件。另外支持 LaTeX 语法的数学公式：行内 <code>$...$</code>、独立 <code>$$...$$</code> 与 <code>```math</code> 代码块。',
        ],
      },
    ],
    faqHeading: '常见问题',
    faq: [
      {
        question: '我的文档会被上传到服务器吗？',
        answer: [
          '不会。解析、排版和生成 PDF 全部在你的浏览器里完成。你的文字、图片和生成的 PDF 都不会离开你的设备。站点的内容安全策略只允许连接本站和 Cloudflare 的匿名访问统计（不使用 Cookie，只记录页面访问，从不接触文档内容），其他地址一律被浏览器拦截。',
        ],
      },
      {
        question: '关掉页面后，写的内容还在吗？',
        answer: [
          '在。你编辑过的草稿（文字、排版设置和拖入的图片）会自动保存在你自己浏览器的本地存储里，下次打开时恢复。草稿只存在这台设备的这个浏览器里，从不上传，也不会同步到别处。点「新建」或清除本站的网站数据即可删除。',
        ],
      },
      {
        question: '支持 Mermaid 流程图吗？',
        answer: [
          '支持。流程图以矢量图形嵌入 PDF，放大不会模糊，图中的文字仍然可以选中和搜索，自定义的 <code>classDef</code> 配色也会完整保留。',
        ],
      },
      {
        question: '中文显示正常吗？',
        answer: [
          '正常。中文以真实文字嵌入 PDF，可以选中、复制和搜索，字体会自动子集化。常用字使用较小的字体子集，遇到生僻字会自动切换到完整字体，不会出现缺字方块。繁体中文、日文和韩文同样支持。',
        ],
      },
      {
        question: '为什么预览和 PDF 有细微差别？',
        answer: [
          '预览是浏览器直接渲染的 HTML，为了即时响应；PDF 由 Typst 排版引擎生成，分页、断行和字距以下载的 PDF 为准。内容、结构和样式两者一致。',
        ],
      },
      {
        question: '第一次下载 PDF 要等多久？',
        answer: [
          '页面本身只有几十 KB，打开是即时的。排版引擎约 10 MB，会在页面打开后于后台静默下载，通常在你写完之前就已就绪，底部状态栏会显示它的状态。引擎会缓存在本机，之后离线也能用。',
        ],
      },
      {
        question: '需要注册或付费吗？有水印吗？',
        answer: ['都不需要，也没有水印。工具是纯静态页面，没有账号系统，也没有后端。'],
      },
      {
        question: '支持数学公式吗？',
        answer: [
          '支持。行内公式用 <code>$...$</code>，独立公式用 <code>$$...$$</code> 或 <code>```math</code> 代码块，语法与 LaTeX 相同。公式由 Typst 原生排版，PDF 里是可搜索的真实公式而不是图片；某个公式写错时只标出这一个，不影响其余内容。',
        ],
      },
      {
        question: '可以用 HTML 标签吗？',
        answer: [
          '除 <code>&lt;br&gt;</code> 外不支持。排版引擎没有与 HTML 对应的语义，与其渲染出一个似是而非的结果，不如明确跳过并给出提示。',
        ],
      },
    ],
    footer:
      `<strong class="colophon-mark"><span class="brand-free">free</span>md2pdf.com</strong> · 在浏览器里把 Markdown 转成 PDF，流程图以矢量嵌入，中文排版正确。文档不会上传。`,
    languagesHeading: '语言',
  },

  ui: {
    words: { other: '{n} 字' },
    lines: { other: '{n} 行' },
    paperHint: '{paper} · 分页以下载的 PDF 为准',

    engineIdle: 'PDF 引擎待命',
    engineWillLoad: 'PDF 引擎将在后台加载（约 10 MB）',
    engineCached: 'PDF 引擎已缓存',
    engineDownloading: 'PDF 引擎后台加载中 {pct}%',
    engineStarting: '正在启动 PDF 引擎…',
    engineFonts: '正在加载字体…',
    engineReady: 'PDF 引擎就绪 · 可离线使用',
    engineFailed: 'PDF 引擎加载失败，下载时会重试',
    networkFailed: '下载字体或排版引擎时网络中断，自动重试后仍未成功。请检查网络后再试。',

    download: '下载 PDF',
    downloadGenerating: '正在生成…',
    downloadEngine: '加载引擎 {pct}%',
    downloadStarting: '启动引擎…',
    downloadFonts: '加载字体…',
    downloadTypesetting: '正在排版…',
    print: '打印',
    printInTab: 'PDF 已在新标签页中打开，请在那里打印。',
    printBlocked: '浏览器拦截了新标签页。请打开 PDF，在那里打印。',
    printOpen: '打开 PDF',

    missingGlyphs: '以下字符不在字体覆盖范围内，可能无法显示：{chars}',
    pdfFailed: 'PDF 生成失败：{detail}',
    pdfFailedShort: 'PDF 生成失败',
    initFailed: '页面初始化失败：{detail}',

    close: '关闭',
    undo: '撤销',
    cleared: '已清空，本地草稿已删除',
    langAuto: '自动 · {detected}',
    aiCleaned: '已整理 AI 输出的格式',
    draftNotSample: '显示的是你保存的草稿，而不是本页的示例',
    loadExample: '载入示例',
    exampleLoaded: '已载入示例；在你编辑之前，草稿仍会保留',
    otherTab: '此文档已在另一个标签页中修改',
    loadLatest: '载入最新',
    syncedFromTab: '已同步其他标签页',
    syncedFromTabTitle: '另一个标签页保存了更新的版本，这里已自动更新',
    saved: '已保存到本地浏览器',
    savedTitle: '{time} 保存 · 草稿只存在这个浏览器里，不会上传',
    restored: '已恢复本地草稿',
    restoredTitle: '草稿只存在这个浏览器里，不会上传；点「新建」可清除',
    quotaState: '本地空间不足，草稿未保存',
    quotaNotice:
      '浏览器的本地存储空间已满，草稿暂时无法自动保存。页面仍可正常使用，请及时下载 PDF 或另存 Markdown。',
    storageOff: '本地存储不可用，草稿不会保存',
    imageBudget: '图片总计超过 50 MB，超出部分不会保存到本地，下次打开需要重新拖入。',
    imageQuota: '浏览器的本地存储空间已满，部分图片没有保存到本地，下次打开需要重新拖入。',
    imageEmbedded: '已嵌入图片 {name}',
    fileLoaded: '已载入 {name}',
    pasteBlocked: '浏览器不允许读取剪贴板。请在编辑器里按 ⌘/Ctrl + V 粘贴。',
    /** {name} */
    downloaded: '已保存 {name}',
    unsupportedFile: '不支持的文件类型：{name}',

    diagramPending: '正在渲染流程图…',
    diagramError: '流程图无法渲染：{detail}',
    mathError: '公式无法排版：{detail}',
    diagramErrorAt: '图表第 {line} 行有错误',
    diagramErrorTitle: '图表有错误',
    diagramUnknown: '未知的图表类型“{name}”',
    diagramStale: '显示的是上一次成功渲染的版本',
    diagramCopySvg: '复制 SVG',
    diagramCopied: '已将 SVG 复制到剪贴板',
    diagramCopyFailed: '此处无法使用剪贴板，请改为下载 SVG',
    diagramDownloadSvg: '下载 SVG',
    diagramDownloadPng: '下载 PNG',
    diagramActions: '导出图表',
    remoteImage: '远程图片不会被加载：{name}',
    missingImage: '未找到图片，请把文件拖进页面：{name}',
    tocTitle: '目录',
    pageBreak: '分页',
    fromDocument: '（来自文档）',
    fromDocumentTitle: '由文档开头的 front matter 设定，请在那里修改',
    frontMatterSyntax: 'Front matter 第 {line} 行无法识别，已忽略。',
    frontMatterValue: 'Front matter 第 {line} 行：“{value}”不是有效的 {key}，已忽略。',
    frontMatterUnclosed: '开头的 front matter 缺少结束的 --- 行，因此按普通文本处理。',
  },

  sample: `# ${BRAND} 示例文档

这是一个**完全在浏览器里运行**的 Markdown 转 PDF 工具。你的文档不会上传到任何服务器 —— 排版引擎、字体、转换过程全部在这个标签页里完成。

左边编辑，右边即时预览。点右上角「下载 PDF」，拿到由排版引擎生成的正式文件，带分页、页码和书签。

## 流程图

\`\`\`mermaid
flowchart LR
  A[Markdown] --> B[markdown-it 解析]
  B --> C{含流程图?}
  C -- 是 --> D[Mermaid 渲染 SVG]
  C -- 否 --> E[生成 Typst 源码]
  D --> E
  E --> F[(PDF)]
\`\`\`

流程图是以**矢量**嵌入的，放大不会糊，图里的文字也能被选中和搜索。

## 文字排版

支持 *斜体*、**粗体**、***粗斜体***、~~删除线~~、\`行内代码\`，以及[链接](https://example.com)。中英文混排时会自动处理断行，不会出现多余空格。

> 引用块用来强调一段话。
>
> 也可以有多个段落。

## 列表

1. 有序列表
2. 第二项
   - 嵌套的无序列表
   - 另一项
3. 第三项

- [x] 已完成的任务
- [ ] 待办事项
- [ ] 另一个待办

## 代码

\`\`\`python
def fibonacci(n: int) -> int:
    """语法高亮由 Typst 内置的 syntect 提供。"""
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a
\`\`\`

## 表格

| 特性 | 说明 | 状态 |
|:-----|:----:|-----:|
| 中文排版 | 真文字，可选可搜 | 支持 |
| 流程图 | 原生矢量嵌入 | 支持 |
| 数学公式 | 原生排版，可搜索 | 支持 |

## 数学公式

公式以原生方式排版，放大也清晰，还能搜索：欧拉恒等式 $e^{i\\pi} + 1 = 0$ 可以直接写在句子里，较长的公式单独成行。

$$
x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
$$

## 脚注

排版引擎用的是 Typst[^1]，它负责分页、目录、页码和书签。

[^1]: 一个现代的排版系统，编译成 WebAssembly 后可以在浏览器里运行。

---

最后一行。
`,
};

export default zh;
