/**
 * Sample documents for every template in English, Chinese and Japanese, used
 * by scripts/pages.mjs to render the PDFs and PNGs one looks at.
 */

const report = {
  en: `---
title: Quarterly Operations Review
subtitle: Logistics, fulfilment and customer service, Q3 2026
author: Operations Team
date: 2026-09-30
toc: true
template: report
---

# Summary

Order volume grew 18% over the quarter while the average time from order to dispatch fell from 31 to 22 hours. Most of the gain came from the new sorting line in the northern warehouse, which went live in July.

Customer contacts per hundred orders fell for the third quarter in a row. The remaining contacts are dominated by delivery-date questions, which the tracking page redesign planned for Q4 should address.

## Key figures

| Metric | Q2 | Q3 | Change |
|:-------|---:|---:|-------:|
| Orders shipped | 48,200 | 56,900 | +18% |
| Order to dispatch (h) | 31 | 22 | −29% |
| Contacts per 100 orders | 6.1 | 4.8 | −21% |
| Returns rate | 3.9% | 3.6% | −0.3 pt |

# Fulfilment

## Warehouse throughput

The northern sorting line handled 61% of all parcels by September. Peak throughput reached 2,400 parcels an hour during the end-of-month sale, against a design capacity of 2,600.

> Staffing, not equipment, is now the constraint on peak days. Cross-training pickers for the packing stations is the cheapest way to add capacity.

## Carriers

- Standard deliveries moved to two regional carriers, cutting cost per parcel by 7%.
- Next-day delivery stayed with the national carrier; on-time performance was 96.4%.
- Collection points now cover 82% of postcodes.

# Customer service

## Contact reasons

1. Where is my order? (41%)
2. Returns and refunds (27%)
3. Product questions (19%)
4. Everything else (13%)

## Next steps

The tracking page will show a delivery window instead of a date, and send a message when the parcel is out for delivery. We expect this to remove a third of "where is my order" contacts.
`,
  zh: `---
title: 第三季度运营报告
subtitle: 物流、履约与客户服务
author: 运营部
date: 2026-09-30
toc: true
template: report
---

# 摘要

本季度订单量增长 18%，从下单到发货的平均时长由 31 小时缩短至 22 小时。主要提升来自七月上线的北区仓库新分拣线。

每百单的客户咨询量已连续第三个季度下降。剩余的咨询以配送时间为主，计划在第四季度上线的物流跟踪页面改版将解决这一问题。

## 关键指标

| 指标 | 第二季度 | 第三季度 | 变化 |
|:-----|-----:|-----:|-----:|
| 发货订单 | 48,200 | 56,900 | +18% |
| 下单到发货（小时） | 31 | 22 | −29% |
| 每百单咨询 | 6.1 | 4.8 | −21% |
| 退货率 | 3.9% | 3.6% | −0.3 个百分点 |

# 履约

## 仓库吞吐量

到九月，北区分拣线处理了全部包裹的 61%。月末促销期间峰值达到每小时 2,400 件，设计产能为 2,600 件。

> 高峰日的瓶颈已经从设备转为人手。对拣货员进行打包岗位的交叉培训，是增加产能最经济的方式。

## 承运商

- 标准配送改由两家区域承运商负责，单件成本下降 7%。
- 次日达仍由全国性承运商承担，准时率为 96.4%。
- 自提点已覆盖 82% 的邮政编码区域。

# 客户服务

## 咨询原因

1. 我的订单在哪里？（41%）
2. 退货与退款（27%）
3. 商品问题（19%）
4. 其他（13%）

## 下一步

物流跟踪页面将显示配送时间段而非单一日期，并在包裹派送时发送通知。预计可减少三分之一的“订单在哪里”类咨询。
`,
  ja: `---
title: 第3四半期 業務報告書
subtitle: 物流・フルフィルメント・カスタマーサービス
author: 業務部
date: 2026-09-30
toc: true
template: report
---

# 概要

当四半期の受注件数は 18% 増加し、受注から出荷までの平均時間は 31 時間から 22 時間に短縮されました。改善の大部分は、7 月に稼働した北倉庫の新しい仕分けラインによるものです。

100 件あたりの問い合わせ件数は 3 四半期連続で減少しました。残る問い合わせの多くは配送日に関するもので、第 4 四半期に予定している追跡ページの刷新で対応します。

## 主要指標

| 指標 | 第2四半期 | 第3四半期 | 増減 |
|:-----|-----:|-----:|-----:|
| 出荷件数 | 48,200 | 56,900 | +18% |
| 受注から出荷（時間） | 31 | 22 | −29% |
| 100件あたり問い合わせ | 6.1 | 4.8 | −21% |
| 返品率 | 3.9% | 3.6% | −0.3 pt |

# フルフィルメント

## 倉庫の処理能力

9 月には北倉庫の仕分けラインが全荷物の 61% を処理しました。月末セールのピーク時には毎時 2,400 個に達し、設計能力は 2,600 個です。

> ピーク日の制約は設備ではなく人員になりました。ピッキング担当者に梱包作業の研修を行うことが、最も安価な増強策です。

## 配送業者

- 通常配送を地域の配送業者 2 社に移管し、1 個あたりのコストを 7% 削減しました。
- 翌日配送は全国配送業者のままで、定時配達率は 96.4% でした。
- 受取拠点は郵便番号の 82% をカバーしています。

# カスタマーサービス

## 問い合わせの内訳

1. 注文はどこですか？（41%）
2. 返品と返金（27%）
3. 商品に関する質問（19%）
4. その他（13%）

## 今後の対応

追跡ページでは配達日ではなく時間帯を表示し、配達に出た時点で通知を送ります。「注文はどこですか」という問い合わせの 3 分の 1 が減る見込みです。
`,
};

const academic = {
  en: `---
title: Measuring Typesetting Quality in Browser-Based PDF Tools
author: [Ada Lovelace, Charles Babbage]
date: 2026-09-23
template: academic
abstract: |
  Browser print dialogs produce PDFs that paginate poorly: headings are
  stranded at the bottom of pages, tables split without their headers and
  line breaking ignores the rules of the language. We compare four
  Markdown-to-PDF tools on a corpus of 120 documents in nine languages and
  find that a real typesetting engine running in WebAssembly removes
  almost all of these defects at a cost of one extra download.
---

## Introduction

Converting Markdown to PDF is usually done by rendering HTML and printing it. That approach inherits the browser's pagination, which was designed for screens rather than pages.[^print] Typesetting systems such as TeX and Typst instead treat the page as the unit of layout, and choose line and page breaks to minimise a cost function over the whole paragraph.

In this paper we ask how large the difference is in practice, and whether it is visible to readers who do not know what to look for.

## Method

We collected 120 documents from public repositories: READMEs, reports, lecture notes and papers. Each was converted by four tools, and every page was scored for five defects.

### Defects scored

1. A heading as the last line of a page.
2. A table split without repeating its header row.
3. A single line of a paragraph alone at the top or bottom of a page.
4. A line starting with closing punctuation (in Chinese and Japanese).
5. Hyphenation that breaks the rules of the language.

### Tools

| Tool | Engine | Defects per page | Languages passed |
|:-----|:-------|-----:|-----:|
| Print dialog | Browser | 0.42 | 3 / 9 |
| Tool B | Browser | 0.38 | 4 / 9 |
| Tool C | LaTeX (server) | 0.05 | 7 / 9 |
| md2pdf | Typst (WebAssembly) | 0.04 | 9 / 9 |

## Results

Browser-based conversion averaged 0.4 defects per page, nearly all of them stranded headings and widowed lines. The typesetting engines averaged under 0.05. Readers shown pairs of pages preferred the typeset version in 87% of trials, even when they could not say why.[^survey]

## Conclusion

A typesetting engine in the browser is now practical. The one cost is the size of the engine, which can be fetched in the background after the page has loaded.

[^print]: CSS Paged Media would allow better pagination, but browser support remains partial.
[^survey]: 64 participants, each shown 20 pairs in random order.
`,
  zh: `---
title: 浏览器端 PDF 工具的排版质量评估
author: [张三, 李四]
date: 2026-09-23
template: academic
abstract: |
  浏览器的打印功能生成的 PDF 分页质量较差：标题孤悬在页尾，表格跨页时丢失表头，换行也不遵循语言的规则。本文在九种语言的 120 篇文档上比较了四种 Markdown 转 PDF 工具，发现在 WebAssembly 中运行的真正排版引擎几乎消除了所有这些缺陷，代价只是一次额外的下载。
---

## 引言

将 Markdown 转换为 PDF，通常的做法是先渲染成 HTML 再打印。这种方式沿用了浏览器的分页逻辑，而它是为屏幕而不是纸张设计的。[^print] TeX 和 Typst 等排版系统则以页面为排版单位，在整个段落范围内选择最优的换行与分页位置。

本文考察这种差异在实践中有多大，以及不了解排版的读者能否察觉。

## 方法

我们从公开仓库收集了 120 篇文档，包括说明文档、报告、讲义和论文。每篇文档分别用四种工具转换，并对每一页的五类缺陷计分。

### 计分的缺陷

1. 标题出现在页面最后一行。
2. 表格跨页且未重复表头。
3. 段落的单独一行出现在页首或页尾。
4. 行首出现闭合标点（中文和日文）。
5. 不符合语言规则的断词。

### 工具

| 工具 | 引擎 | 每页缺陷数 | 通过的语言 |
|:-----|:-----|-----:|-----:|
| 打印对话框 | 浏览器 | 0.42 | 3 / 9 |
| 工具 B | 浏览器 | 0.38 | 4 / 9 |
| 工具 C | LaTeX（服务器） | 0.05 | 7 / 9 |
| md2pdf | Typst（WebAssembly） | 0.04 | 9 / 9 |

## 结果

基于浏览器的转换平均每页 0.4 个缺陷，几乎都是孤立的标题和孤行。排版引擎的平均值低于 0.05。在成对比较中，读者有 87% 的情况选择了排版引擎生成的页面，即使他们说不出原因。[^survey]

## 结论

在浏览器中运行排版引擎已经切实可行。唯一的代价是引擎的体积，而它可以在页面加载后于后台下载。

[^print]: CSS 分页媒体规范可以改善分页，但浏览器的支持仍不完整。
[^survey]: 共 64 名参与者，每人按随机顺序比较 20 组页面。
`,
  ja: `---
title: ブラウザ上の PDF 変換ツールにおける組版品質の評価
author: [山田太郎, 佐藤花子]
date: 2026-09-23
template: academic
abstract: |
  ブラウザの印刷機能で作成した PDF は改ページの質が低く、見出しがページ末に取り残され、表は見出し行なしで分割され、行分割も言語の規則に従わない。本論文では 9 言語 120 文書を用いて 4 種類の Markdown から PDF への変換ツールを比較し、WebAssembly で動作する本格的な組版エンジンが、追加のダウンロード 1 回と引き換えに、これらの欠陥をほぼすべて解消することを示す。
---

## はじめに

Markdown を PDF に変換するには、HTML として描画してから印刷するのが一般的である。この方法はブラウザの改ページ処理を受け継ぐが、それは紙ではなく画面のために設計されたものである。[^print] TeX や Typst などの組版システムはページを組版の単位とし、段落全体を見渡して行分割と改ページの位置を決める。

本論文では、この違いが実際にどの程度のものか、また組版に詳しくない読者にも見て取れるかを調べる。

## 方法

公開リポジトリから、説明文書・報告書・講義ノート・論文の計 120 文書を集めた。各文書を 4 つのツールで変換し、すべてのページについて 5 種類の欠陥を数えた。

### 数えた欠陥

1. ページの最終行に見出しがある。
2. 表が見出し行を繰り返さずに分割されている。
3. 段落の 1 行だけがページの先頭または末尾にある。
4. 行頭に閉じ括弧や句読点がある（中国語と日本語）。
5. 言語の規則に反するハイフネーション。

### ツール

| ツール | エンジン | ページあたりの欠陥 | 合格した言語 |
|:-----|:-----|-----:|-----:|
| 印刷ダイアログ | ブラウザ | 0.42 | 3 / 9 |
| ツール B | ブラウザ | 0.38 | 4 / 9 |
| ツール C | LaTeX（サーバー） | 0.05 | 7 / 9 |
| md2pdf | Typst（WebAssembly） | 0.04 | 9 / 9 |

## 結果

ブラウザによる変換では 1 ページあたり平均 0.4 件の欠陥があり、そのほとんどが取り残された見出しと孤立行であった。組版エンジンでは平均 0.05 件未満であった。2 ページを並べて見せたところ、読者は理由を説明できなくても 87% の試行で組版エンジンの出力を選んだ。[^survey]

## 結論

ブラウザ内で組版エンジンを動かすことは、もはや現実的である。唯一の代償はエンジンの大きさだが、ページの読み込み後にバックグラウンドで取得できる。

[^print]: CSS の Paged Media を使えば改ページは改善できるが、ブラウザの対応はまだ不完全である。
[^survey]: 参加者は 64 名で、各自 20 組を無作為な順序で比較した。
`,
};

const resume = {
  en: `---
template: resume
---

# Jordan Rivera

jordan.rivera@example.com · +1 555 0134 · Seattle, WA · github.com/jrivera

## Experience

### Senior Software Engineer, Northwind Logistics | 2022 – present

- Led the rewrite of the dispatch service in Rust, cutting p99 latency from 900 ms to 120 ms.
- Designed the event pipeline that now carries 40 million messages a day.
- Mentored four engineers; two have since been promoted.

### Software Engineer, Contoso Retail | 2018 – 2022

- Built the order-tracking API used by the mobile apps and 30 partner stores.
- Introduced contract testing, which halved integration incidents in a year.

### Junior Developer, Fabrikam Studio | 2016 – 2018

- Shipped features for three client web apps in TypeScript and React.

## Education

### B.Sc. Computer Science, University of Washington | 2012 – 2016

Graduated with honours. Thesis on incremental parsing for code editors.

## Skills

- **Languages:** Rust, TypeScript, Go, Python, SQL
- **Systems:** Kafka, PostgreSQL, Kubernetes, AWS
- **Practices:** API design, observability, incident response, code review

## Projects

### tinyparse, open-source incremental parser | 2019 – present

- 2,300 GitHub stars; used by two commercial code editors.
- Parses a 10,000-line file after an edit in under a millisecond.

## Languages

English (native), Spanish (fluent), Japanese (conversational)
`,
  zh: `---
template: resume
---

# 王小明

xiaoming.wang@example.com · 138 0000 0000 · 上海 · github.com/xmwang

## 工作经历

### 高级软件工程师，北风物流 | 2022 – 至今

- 主导用 Rust 重写调度服务，p99 延迟从 900 毫秒降至 120 毫秒。
- 设计事件管道，目前每天处理 4,000 万条消息。
- 指导四名工程师，其中两人已获晋升。

### 软件工程师，康拓零售 | 2018 – 2022

- 开发订单跟踪接口，供移动应用和 30 家合作门店使用。
- 引入契约测试，一年内集成故障减少一半。

## 教育背景

### 计算机科学学士，复旦大学 | 2014 – 2018

以优异成绩毕业。毕业论文研究代码编辑器的增量解析。

## 技能

- **编程语言：** Rust、TypeScript、Go、Python、SQL
- **系统：** Kafka、PostgreSQL、Kubernetes、AWS
- **实践：** 接口设计、可观测性、故障响应、代码评审

## 项目

### tinyparse，开源增量解析器 | 2019 – 至今

- GitHub 2,300 星，被两款商业代码编辑器采用。
- 编辑后重新解析一万行的文件不到一毫秒。

## 语言

中文（母语），英语（流利），日语（日常会话）
`,
  ja: `---
template: resume
---

# 田中 健

ken.tanaka@example.com · 090-0000-0000 · 東京都 · github.com/ktanaka

## 職歴

### シニアソフトウェアエンジニア、北風ロジスティクス | 2022 – 現在

- 配車サービスを Rust で再実装し、p99 レイテンシを 900 ms から 120 ms に短縮。
- 1 日 4,000 万件のメッセージを処理するイベント基盤を設計。
- エンジニア 4 名を指導し、うち 2 名が昇格。

### ソフトウェアエンジニア、コントソ・リテール | 2018 – 2022

- モバイルアプリと提携店舗 30 店が利用する注文追跡 API を開発。
- 契約テストを導入し、1 年で結合障害を半減。

## 学歴

### 情報科学科 学士、東京大学 | 2014 – 2018

優秀な成績で卒業。卒業論文はコードエディタのインクリメンタル構文解析。

## スキル

- **言語：** Rust、TypeScript、Go、Python、SQL
- **システム：** Kafka、PostgreSQL、Kubernetes、AWS
- **実践：** API 設計、可観測性、障害対応、コードレビュー

## プロジェクト

### tinyparse、オープンソースの増分パーサー | 2019 – 現在

- GitHub スター 2,300、商用コードエディタ 2 製品で採用。
- 編集後、1 万行のファイルを 1 ミリ秒未満で再解析。

## 語学

日本語（母語）、英語（ビジネス）、中国語（日常会話）
`,
};

const letter = {
  en: `---
template: letter
author: Jordan Rivera
from: |
  12 Harbour Street
  Seattle, WA 98101
  jordan.rivera@example.com
to: |
  Hiring Committee
  Northwind Logistics
  400 Pine Street
  Seattle, WA 98104
date: 2026-09-23
subject: Application for the Staff Engineer position
closing: Yours sincerely,
---

Dear members of the committee,

I am writing to apply for the Staff Engineer position advertised on your careers page. For the past four years I have led the dispatch platform at Northwind's largest competitor, and I would like to bring that experience to a team whose customers I have long admired.

In that time my team rewrote the dispatch service, cut its tail latency by a factor of seven and built the event pipeline that now carries forty million messages a day. Just as important to me, two of the engineers I mentored have since been promoted.

I would welcome the chance to discuss how I could contribute. Thank you for your time and consideration.
`,
  zh: `---
template: letter
author: 王小明
from: |
  上海市黄浦区中山东一路 12 号
  xiaoming.wang@example.com
to: |
  北风物流 招聘委员会
  上海市浦东新区世纪大道 400 号
date: 2026-09-23
subject: 关于应聘资深工程师一职
closing: |
  此致
  敬礼
---

尊敬的招聘委员会：

您好！我在贵公司官网看到资深工程师的招聘信息，特此申请。过去四年，我在业内一家同类企业负责调度平台，希望能把这些经验带到贵公司的团队中。

这期间，我的团队重写了调度服务，将尾部延迟降低到原来的七分之一，并搭建了每天处理四千万条消息的事件管道。同样令我自豪的是，我指导的两名工程师已先后获得晋升。

期待有机会与您进一步交流。感谢您拨冗阅读。
`,
  ja: `---
template: letter
author: 田中 健
from: |
  東京都千代田区丸の内 1-2-3
  ken.tanaka@example.com
to: |
  北風ロジスティクス株式会社
  採用ご担当者様
date: 2026-09-23
subject: スタッフエンジニア職への応募について
closing: 敬具
---

拝啓　秋冷の候、貴社ますますご清栄のこととお慶び申し上げます。

貴社ウェブサイトに掲載のスタッフエンジニア職の募集を拝見し、応募いたしました。私はこの 4 年間、同業他社で配車プラットフォームの開発を率いてまいりました。その経験を貴社のチームで活かしたいと考えております。

この間、チームとともに配車サービスを再構築してレイテンシを 7 分の 1 に短縮し、1 日 4,000 万件のメッセージを処理するイベント基盤を構築しました。また、指導したエンジニア 2 名が昇格したことも大きな喜びです。

ぜひ一度、お話しする機会をいただけましたら幸いです。
`,
};

const standard = {
  en: `---
title: Getting Started with md2pdf
author: The md2pdf team
date: 2026-09-23
---

Write Markdown on the left; the preview on the right follows as you type. **Download PDF** typesets the real file, with page numbers, bookmarks and proper line breaking.

## Page breaks

Put \`\\newpage\` or \`<!-- pagebreak -->\` on a line of its own to start a new page. The next section starts on page two.

\\newpage

## Front matter

A block of \`key: value\` lines between \`---\` fences at the top sets the title, author, date, template and more for this document only:

\`\`\`yaml
title: Getting Started
template: report
cover: true
footer: "{title} | {page} / {pages}"
\`\`\`

| Key | Meaning |
|:----|:--------|
| \`template\` | default, report, academic, resume or letter |
| \`cover\` | a title page from the title, author and date |
| \`header\`, \`footer\` | running text with {title}, {page}, {pages}, {date}, {author} |

> Everything happens in your browser. Nothing is uploaded.
`,
  zh: `---
title: md2pdf 入门
author: md2pdf 团队
date: 2026-09-23
---

在左侧编写 Markdown，右侧预览随输入实时更新。点击**下载 PDF**即可得到真正排版的文件，带页码、书签和正确的换行。

## 分页

在单独一行写 \`\\newpage\` 或 \`<!-- pagebreak -->\` 即可另起一页。下一节从第二页开始。

\\newpage

## Front matter

在文档开头用 \`---\` 包围若干 \`键: 值\` 行，可以只为本文档设置标题、作者、日期、模板等：

\`\`\`yaml
title: 入门
template: report
cover: true
footer: "{title} | {page} / {pages}"
\`\`\`

| 键 | 含义 |
|:---|:-----|
| \`template\` | default、report、academic、resume 或 letter |
| \`cover\` | 用标题、作者和日期生成封面 |
| \`header\`、\`footer\` | 页眉页脚，可用 {title}、{page}、{pages}、{date}、{author} |

> 一切都在浏览器中完成，不会上传任何内容。
`,
  ja: `---
title: md2pdf 入門
author: md2pdf チーム
date: 2026-09-23
---

左側に Markdown を書くと、右側のプレビューが入力に合わせて更新されます。**PDF をダウンロード**を押すと、ページ番号・しおり・正しい行分割を備えた本物の組版ファイルが得られます。

## 改ページ

\`\\newpage\` または \`<!-- pagebreak -->\` を単独の行に書くと改ページします。次の節は 2 ページ目から始まります。

\\newpage

## フロントマター

文書の先頭で \`---\` に挟んだ \`キー: 値\` の行により、この文書だけのタイトル・著者・日付・テンプレートなどを設定できます。

\`\`\`yaml
title: 入門
template: report
cover: true
footer: "{title} | {page} / {pages}"
\`\`\`

| キー | 意味 |
|:-----|:-----|
| \`template\` | default、report、academic、resume、letter |
| \`cover\` | タイトル・著者・日付から表紙を作る |
| \`header\`、\`footer\` | ヘッダー・フッター。{title}、{page}、{pages}、{date}、{author} が使える |

> すべてブラウザ内で処理され、何もアップロードされません。
`,
};

export const SAMPLES = { default: standard, report, academic, resume, letter };
