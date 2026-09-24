import type { Messages } from './types';
import { BRAND } from './constants';

const ja: Messages = {
  locale: {
    code: 'ja',
    lang: 'ja',
    hreflang: 'ja',
    ogLocale: 'ja_JP',
    nativeName: '日本語',
  },

  meta: {
    title: 'Markdown PDF 変換ツール · Mermaid 図と日本語組版に対応',
    description:
      'Markdown を PDF に変換できる無料ツール。Mermaid の図はベクターのまま埋め込まれ、図中の文字も選択可能。日本語も正しく組版。処理はすべてブラウザ内で完結し、アップロード・登録・透かしは一切なし。',
    ogTitle: 'Markdown を PDF に変換 · Mermaid 図はベクターのまま',
    ogDescription:
      'ブラウザだけで Markdown を PDF に変換。Mermaid の図はベクター、日本語は検索できる本物のテキスト。アップロードなし、登録不要、透かしなし。',
    appDescription:
      'ブラウザ内で Markdown を PDF に変換するツール。Mermaid の図をベクターで埋め込み、日本語を含む多言語を正しく組版します。文書がアップロードされることはありません。',
    operatingSystem: 'WebAssembly に対応したモダンブラウザ',
    featureList: [
      'Mermaid の図をベクターで埋め込み、図中の文字も選択可能',
      '日本語・中国語（簡体字・繁体字）・韓国語・キリル文字・ベトナム語の組版',
      'コードブロックのシンタックスハイライト',
      '目次・ページ番号・PDF しおり',
      'リアルタイムプレビューと下書きのブラウザ内自動保存',
      'ローカルで処理し、文書はアップロードしない',
    ],
  },

  page: {
    privacyBadge: 'ローカル処理 · 送信なし · 登録不要 · 透かしなし · オフライン対応',
    privacyTitle: '解析・組版・PDF 生成はすべてこのタブの中で行われます。文書が端末の外に出ることはありません',
    newDoc: '新規',
    newDocTitle: '新しい空の文書（保存済みの下書きも消去）',
    open: '開く',
    openTitle: '.md ファイルを開く',
    layout: 'レイアウト',
    layoutTitle: 'ページ設定',
    downloadTitle: 'PDF をダウンロード (⌘/Ctrl + S)',
    printTitle: '組版した PDF を印刷 (⌘/Ctrl + P)',
    language: '言語',
    paper: '用紙',
    margin: '余白',
    fontSize: '文字サイズ',
    lineHeight: '行間',
    pageNumbers: 'ページ番号',
    toc: '目次',
    justify: '両端揃え',
    docLanguage: '文書の言語',
    template: 'テンプレート',
    templateDefault: '標準',
    templateReport: 'レポート',
    templateAcademic: '論文',
    templateResume: '履歴書',
    templateLetter: '手紙',
    cover: '表紙',
    h1NewPage: '見出し1ごとに改ページ',
    header: 'ヘッダー',
    footer: 'フッター',
    bandTitle: '使える変数：{title} {page} {pages} {date} {author}。| で 左 | 中央 | 右 に分けます。空欄はテンプレートの既定、none で非表示。',
    editorHint: '.md ファイルや画像をドロップできます',
    editorLabel: 'Markdown ソース',
    editorPlaceholder: 'ここに Markdown を入力・貼り付け、または .md ファイルをドロップ…',
    preview: 'プレビュー',
    dropHint: 'ドロップして読み込む',
    source: '原稿',
    proof: '校正刷り',
    live: 'ライブ',
    viewSwitch: '表示',
    fullscreen: '全画面で編集',
    heroTitle: 'Markdown を PDF に',
    heroTagline: '：ブラウザの中で組版。',
    heroLead: 'Markdown を貼り付けるかドロップするだけで、きちんと組版された PDF をダウンロードできます。Mermaid の図はベクターのまま。文書がブラウザの外に出ることはありません。',
    aboutToggle: `${BRAND} について`,
    emptyTitle: 'Markdown を貼り付けるか、.md ファイルをドロップするか、ファイルを開いてください',
    paste: '貼り付け',
    pasteTitle: 'クリップボードから Markdown を貼り付け',
  },

  about: {
    heading: 'Markdown を PDF に変換、ブラウザだけで',
    intro: [
      'Markdown を貼り付けるかファイルをドロップすれば、入力に合わせて右側のプレビューが更新されます。「PDF をダウンロード」を押せば、きちんと組版された PDF が手に入ります。プレビューは即時、PDF は本格的な組版エンジンが生成するので、改ページやページ番号、目次（任意）もそのまま入ります。',
      'サーバーは一切関与しません。Markdown の解析、図の描画、組版、PDF の生成まで、すべてこのタブの中で完結します。登録不要、透かしなし、回数制限もありません。書いた内容はお使いのブラウザに自動保存されるので、タブを閉じても消えません。アップロードされることはなく、「新規」を押すかこのサイトのデータを消去すれば削除されます。',
    ],
    sections: [
      {
        heading: 'Mermaid の図はスクリーンショットではなくベクター',
        body: [
          '<code>```mermaid</code> ブロックは SVG に描画され、ネイティブのベクター図形として PDF に埋め込まれます。どれだけ拡大しても鮮明で、図の中の文字は選択・コピー・検索ができ、<code>classDef</code> で指定した塗り・線の色・線幅もそのまま保たれます。Mermaid に対応せずソースをそのまま出力するオンライン変換ツールも多く、ページ全体を画像にしてしまい文字を選択できないものもあります。',
        ],
      },
      {
        heading: '日本語をきちんと組版',
        body: [
          '漢字・ひらがな・カタカナは本物のテキストとして埋め込まれるので、選択も検索もできます。フォントは自動でサブセット化され、ファイルサイズも抑えられます。日本語には日本語用のフォントが使われるため、中国語の字形が混ざることはありません。和欧混植の段落でも行分割が正しく処理されます。中国語（簡体字・繁体字）、韓国語、キリル文字、ベトナム語にも対応しています。',
        ],
      },
      {
        heading: '本物の組版エンジンで PDF を生成',
        body: [
          '中核にあるのは Typst。WebAssembly にコンパイルされ、ブラウザ上で動くモダンな組版システムです。改ページ、孤立行の制御、目次、ページ番号、脚注、PDF のしおりを処理し、コードのハイライトも内蔵のハイライタで行います。エンジンは約 10 MB。編集中にバックグラウンドで静かに読み込まれ、端末にキャッシュされるので、以降はオフラインでも使えます。',
        ],
      },
      {
        heading: '対応している Markdown 記法',
        body: [
          '見出し、段落、太字、斜体、打ち消し線、インラインコード、リンク、画像、番号付き・番号なしリスト、入れ子のリスト、タスクリスト、引用、列揃え付きの表、定義リスト、脚注、水平線、シンタックスハイライト付きのコードブロック、そして Mermaid の図。画像はドラッグ＆ドロップやクリップボードからの貼り付けで追加できます。LaTeX 記法の数式（インラインの <code>$...$</code>、独立した <code>$$...$$</code>、<code>```math</code> ブロック）にも対応しています。',
        ],
      },
    ],
    faqHeading: 'よくある質問',
    faq: [
      {
        question: '文書はサーバーにアップロードされますか？',
        answer: [
          'いいえ。解析・組版・PDF の生成はすべてブラウザ内で行われます。文章・画像・PDF が端末の外に出ることはありません。このサイトのコンテンツセキュリティポリシーが通信を許可しているのは、サイト自身と Cloudflare の匿名アクセス解析（Cookie 不使用。記録するのはページの閲覧だけで、文書の内容は受け取りません）のみで、それ以外への通信はブラウザが遮断します。',
        ],
      },
      {
        question: 'ページを閉じても、書いた内容は残りますか？',
        answer: [
          '残ります。編集した下書き（本文、レイアウト設定、ドロップした画像）はブラウザのローカルストレージに自動保存され、次に開いたときに復元されます。下書きはこの端末のこのブラウザにだけ保存され、アップロードも同期もされません。「新規」を押すか、このサイトのデータを消去すると削除されます。',
        ],
      },
      {
        question: 'Mermaid の図に対応していますか？',
        answer: [
          '対応しています。図はベクター図形として PDF に埋め込まれるので、拡大してもぼやけず、図中の文字も選択・検索できます。<code>classDef</code> で指定した配色もそのまま残ります。',
        ],
      },
      {
        question: '日本語は正しく表示されますか？',
        answer: [
          'はい。漢字・かなは本物のテキストとして PDF に埋め込まれ、選択・コピー・検索ができます。日本語用のフォントで組まれるので、字形が中国語風になることもありません。フォントは文書で実際に必要になったときだけダウンロードされます。中国語（簡体字・繁体字）、韓国語、キリル文字、ベトナム語にも対応しています。',
        ],
      },
      {
        question: 'プレビューと PDF の見た目が少し違うのはなぜですか？',
        answer: [
          'プレビューはキー入力のたびに追従できるよう、ブラウザが直接描画する HTML です。PDF は Typst の組版エンジンが生成するため、改ページ・改行・字間はダウンロードした PDF が正となります。内容、構造、スタイルはどちらも同じです。',
        ],
      },
      {
        question: '最初の PDF 変換にはどのくらい時間がかかりますか？',
        answer: [
          'ページ自体は数十 KB で、すぐに開きます。組版エンジンは約 10 MB あり、ページの読み込み後にバックグラウンドで静かにダウンロードされます。たいていは書き終わる前に準備が整い、その状況は画面下のステータスバーに表示されます。エンジンは端末にキャッシュされるので、以降はオフラインでも変換できます。',
        ],
      },
      {
        question: '登録や料金は必要ですか？透かしは入りますか？',
        answer: [
          'どれも不要で、透かしも入りません。このツールはアカウントもバックエンドもない静的な Web ページです。',
        ],
      },
      {
        question: '数式には対応していますか？',
        answer: [
          '対応しています。LaTeX 記法で、インラインの数式は <code>$...$</code>、独立した数式は <code>$$...$$</code> または <code>```math</code> ブロックで書けます。数式は Typst でネイティブに組版されるため、PDF には画像ではなく検索できる本物の数式が入ります。書き間違えた数式はその箇所だけにエラーが表示され、ほかの内容には影響しません。',
        ],
      },
      {
        question: 'HTML タグは使えますか？',
        answer: [
          '<code>&lt;br&gt;</code> のみ使えます。組版エンジンには HTML に相当するものがないため、それらしく見えるだけの結果を出すよりも、その他のタグは通知を出したうえでスキップします。',
        ],
      },
    ],
    footer:
      `<strong>${BRAND}</strong> · ブラウザで Markdown を PDF に変換。Mermaid の図はベクターのまま。文書はアップロードされません。`,
    languagesHeading: '言語',
  },

  ui: {
    words: { other: '{n} 文字' },
    lines: { other: '{n} 行' },
    paperHint: '{paper} · 改ページはダウンロードした PDF に準じます',

    engineIdle: 'PDF エンジン待機中',
    engineWillLoad: 'PDF エンジンはバックグラウンドで読み込みます（約 10 MB）',
    engineCached: 'PDF エンジンはキャッシュ済み',
    engineDownloading: 'PDF エンジンを読み込み中 {pct}%',
    engineStarting: 'PDF エンジンを起動中…',
    engineFonts: 'フォントを読み込み中…',
    engineReady: 'PDF エンジン準備完了 · オフライン可',
    engineFailed: 'PDF エンジンの読み込みに失敗。ダウンロード時に再試行します',
    networkFailed: 'PDF エンジンをダウンロードできませんでした。接続を確認して、もう一度お試しください。',

    download: 'PDF をダウンロード',
    downloadGenerating: '生成中…',
    downloadEngine: 'エンジン読込中 {pct}%',
    downloadStarting: 'エンジン起動中…',
    downloadFonts: 'フォント読込中…',
    downloadTypesetting: '組版中…',
    print: '印刷',
    printInTab: 'PDF を新しいタブで開きました。そのタブから印刷してください。',
    printBlocked: 'ブラウザが新しいタブをブロックしました。PDF を開いて、そこから印刷してください。',
    printOpen: 'PDF を開く',

    missingGlyphs: '次の文字はフォントに含まれていないため、表示されない可能性があります：{chars}',
    pdfFailed: 'PDF の生成に失敗しました：{detail}',
    pdfFailedShort: 'PDF の生成に失敗しました',
    initFailed: 'ページの初期化に失敗しました：{detail}',

    close: '閉じる',
    undo: '元に戻す',
    cleared: '消去しました。保存済みの下書きも削除されています',
    langAuto: '自動 · {detected}',
    aiCleaned: 'AI の出力の書式を整えました',
    draftNotSample: 'このページのサンプルではなく、保存済みの下書きを表示しています',
    loadExample: 'サンプルを読み込む',
    exampleLoaded: 'サンプルを読み込みました。編集するまで下書きは残ります',
    otherTab: 'この文書は別のタブで変更されました',
    loadLatest: '最新を読み込む',
    syncedFromTab: '別のタブと同期しました',
    syncedFromTabTitle: '別のタブで新しい版が保存されたため、このタブにも反映しました',
    saved: 'ブラウザに保存しました',
    savedTitle: '{time} に保存 · 下書きはこのブラウザ内にのみ保存され、アップロードされません',
    restored: '下書きを復元しました',
    restoredTitle: '下書きはこのブラウザ内にのみ保存され、アップロードされません。「新規」で消去できます',
    quotaState: '保存領域が不足、下書きは未保存',
    quotaNotice:
      'ブラウザのローカルストレージがいっぱいのため、下書きを自動保存できません。ページはそのまま使えます。PDF をダウンロードするか、Markdown を別途保存してください。',
    storageOff: 'ローカルストレージが使えないため、下書きは保存されません',
    imageBudget:
      '画像の合計が 50 MB を超えました。超えた分はローカルに保存されないため、次回は改めてドロップしてください。',
    imageQuota:
      'ブラウザのローカルストレージがいっぱいのため、一部の画像を保存できませんでした。次回は改めてドロップしてください。',
    imageEmbedded: '画像 {name} を埋め込みました',
    fileLoaded: '{name} を読み込みました',
    pasteBlocked: 'ブラウザがクリップボードの読み取りを許可しませんでした。エディタで ⌘/Ctrl + V を押してください。',
    /** {name} */
    downloaded: '{name} を保存しました',
    unsupportedFile: '対応していないファイル形式です：{name}',

    diagramPending: '図を描画中…',
    diagramError: '図を描画できませんでした：{detail}',
    mathError: '数式を組版できませんでした：{detail}',
    diagramErrorAt: '図の {line} 行目にエラーがあります',
    diagramErrorTitle: '図にエラーがあります',
    diagramUnknown: '不明な図の種類「{name}」',
    diagramStale: '最後に描画できた版を表示しています',
    diagramCopySvg: 'SVG をコピー',
    diagramCopied: 'SVG をクリップボードにコピーしました',
    diagramCopyFailed: 'ここではクリップボードを使えません。SVG をダウンロードしてください',
    diagramDownloadSvg: 'SVG をダウンロード',
    diagramDownloadPng: 'PNG をダウンロード',
    diagramActions: '図の書き出し',
    remoteImage: 'リモートの画像は読み込みません：{name}',
    missingImage: '画像が見つかりません。ファイルをページにドロップしてください：{name}',
    tocTitle: '目次',
    pageBreak: '改ページ',
    fromDocument: '（文書で指定）',
    fromDocumentTitle: '文書冒頭のフロントマターで指定されています。そちらで変更してください',
    frontMatterSyntax: 'フロントマター {line} 行目を読み取れなかったため無視しました。',
    frontMatterValue: 'フロントマター {line} 行目：「{value}」は {key} の値として使えないため無視しました。',
    frontMatterUnclosed: '冒頭のフロントマターに閉じる --- 行がないため、通常のテキストとして扱います。',
  },

  sample: `# ${BRAND} サンプル文書

これは**ブラウザの中だけで動く** Markdown → PDF 変換ツールです。文書がサーバーにアップロードされることはありません。組版エンジンもフォントも変換処理も、すべてこのタブの中にあります。

左で編集すると、右のプレビューが即座に追従します。右上の「PDF をダウンロード」を押せば、改ページ・ページ番号・しおり付きの PDF が組版エンジンによって生成されます。

## 図

\`\`\`mermaid
flowchart LR
  A[Markdown] --> B[markdown-it で解析]
  B --> C{図はある？}
  C -- はい --> D[Mermaid で SVG 描画]
  C -- いいえ --> E[Typst ソースを生成]
  D --> E
  E --> F[(PDF)]
\`\`\`

図は**ベクター**で埋め込まれるので、拡大してもぼやけず、図の中の文字も選択・検索できます。

## 文字組み

*斜体*、**太字**、***太字斜体***、~~打ち消し線~~、\`インラインコード\`、[リンク](https://example.com)に対応しています。「かぎ括弧」や全角の句読点、そして Typst や PDF といった欧文を交えた和欧混植も、余計な空白なしに自然に組まれます。

> 引用ブロックは、ひとまとまりの文章を際立たせます。
>
> 複数の段落にすることもできます。

## リスト

1. 番号付きリスト
2. 二番目の項目
   - 入れ子の箇条書き
   - もうひとつの項目
3. 三番目の項目

- [x] 完了したタスク
- [ ] やること
- [ ] もうひとつのやること

## コード

\`\`\`python
def fibonacci(n: int) -> int:
    """シンタックスハイライトは Typst 内蔵の syntect によるものです。"""
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a
\`\`\`

## 表

| 機能 | 説明 | 状態 |
|:-----|:----:|-----:|
| 日本語組版 | 本物のテキストで選択・検索可 | 対応 |
| 図 | ネイティブのベクター図形 | 対応 |
| 数式 | ネイティブ組版、検索可 | 対応 |

## 数式

数式はネイティブに組版されるので、拡大しても鮮明で、検索もできます。オイラーの等式 $e^{i\\pi} + 1 = 0$ は文中に、長い式は独立した行に置けます。

$$
x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
$$

## 脚注

組版エンジンには Typst[^1] を使っており、改ページ、目次、ページ番号、しおりを担当しています。

[^1]: WebAssembly にコンパイルすることでブラウザ上でも動く、モダンな組版システムです。

---

最後の行です。
`,
};

export default ja;
