import type { Messages } from './types';
import { BRAND } from './constants';

const ko: Messages = {
  locale: {
    code: 'ko',
    lang: 'ko',
    hreflang: 'ko',
    ogLocale: 'ko_KR',
    nativeName: '한국어',
  },

  meta: {
    title: '마크다운 PDF 변환 · Mermaid 다이어그램, 한글 지원, 무료',
    description:
      '마크다운(Markdown)을 PDF로 변환하는 무료 도구. Mermaid 다이어그램은 벡터 그대로, 안의 글자도 선택할 수 있습니다. 한글도 제대로 조판됩니다. 모든 처리는 브라우저 안에서 끝나며 업로드, 회원가입, 워터마크가 없습니다.',
    ogTitle: '마크다운 PDF 변환 · Mermaid 다이어그램을 벡터 그대로',
    ogDescription:
      '브라우저만으로 Markdown을 PDF로 변환하세요. 다이어그램은 벡터, 한글은 검색 가능한 진짜 텍스트. 업로드 없음, 가입 불필요, 워터마크 없음.',
    appDescription:
      '브라우저에서 Markdown을 PDF로 변환하는 도구입니다. Mermaid 다이어그램을 벡터로 넣고, 한글을 포함한 여러 문자를 올바르게 조판합니다. 문서는 업로드되지 않습니다.',
    operatingSystem: 'WebAssembly를 지원하는 최신 브라우저',
    featureList: [
      'Mermaid 다이어그램을 벡터로 삽입, 다이어그램 속 글자도 선택 가능',
      '한글, 중국어(간체·번체), 일본어, 키릴 문자, 베트남어 조판',
      '코드 블록 구문 강조',
      '목차, 쪽 번호, PDF 책갈피',
      '실시간 미리보기와 브라우저 내 초안 자동 저장',
      '로컬에서 처리하며 문서를 업로드하지 않음',
    ],
  },

  page: {
    privacyBadge: '로컬 변환 · 업로드 없음 · 가입 불필요 · 워터마크 없음 · 오프라인 사용',
    privacyTitle: '파싱, 조판, PDF 생성이 모두 이 탭 안에서 이루어집니다. 문서는 기기 밖으로 나가지 않습니다',
    newDoc: '새 문서',
    newDocTitle: '빈 문서 만들기 (저장된 초안도 삭제)',
    open: '열기',
    openTitle: '.md 파일 열기',
    layout: '레이아웃',
    layoutTitle: '페이지 설정',
    downloadTitle: 'PDF 다운로드 (⌘/Ctrl + S)',
    printTitle: '조판된 PDF 인쇄 (⌘/Ctrl + P)',
    language: '언어',
    paper: '용지',
    margin: '여백',
    fontSize: '글자 크기',
    lineHeight: '줄 간격',
    pageNumbers: '쪽 번호',
    toc: '목차',
    justify: '양쪽 정렬',
    docLanguage: '문서 언어',
    template: '템플릿',
    templateDefault: '기본',
    templateReport: '보고서',
    templateAcademic: '논문',
    templateResume: '이력서',
    templateLetter: '편지',
    cover: '표지',
    h1NewPage: 'H1마다 새 페이지',
    header: '머리글',
    footer: '바닥글',
    bandTitle: '사용 가능한 변수: {title} {page} {pages} {date} {author}. | 로 왼쪽 | 가운데 | 오른쪽을 나눕니다. 비워 두면 템플릿 기본값, none이면 표시하지 않습니다.',
    editorHint: '.md 파일이나 이미지를 끌어다 놓으세요',
    editorLabel: 'Markdown 원본',
    editorPlaceholder: '여기에 Markdown을 입력하거나 붙여 넣으세요. .md 파일을 끌어다 놓아도 됩니다…',
    preview: '미리보기',
    dropHint: '놓으면 가져옵니다',
    source: '원고',
    proof: '교정지',
    live: '실시간',
    viewSwitch: '보기',
    fullscreen: '전체 화면 편집',
    heroTitle: 'Markdown을 PDF로',
    heroTagline: ': 브라우저 안에서 조판합니다.',
    heroLead: 'Markdown을 붙여넣거나 끌어다 놓으면 제대로 조판된 PDF를 내려받을 수 있습니다. Mermaid 다이어그램은 벡터 그대로 남습니다. 문서는 브라우저 밖으로 나가지 않습니다.',
    aboutToggle: `${BRAND} 소개`,
    emptyTitle: 'Markdown을 붙여넣거나, .md 파일을 끌어다 놓거나, 파일을 여세요',
    paste: '붙여넣기',
    pasteTitle: '클립보드에서 Markdown 붙여넣기',
  },

  about: {
    heading: '브라우저에서 바로 마크다운을 PDF로 변환',
    intro: [
      'Markdown을 붙여 넣거나 파일을 끌어다 놓으면, 입력하는 대로 오른쪽 미리보기가 바뀝니다. <strong>PDF 다운로드</strong>를 누르면 제대로 조판된 파일을 받을 수 있습니다. 미리보기는 즉시 보이고, PDF는 실제 조판 엔진이 만들기 때문에 페이지 나눔, 쪽 번호, 목차(선택)까지 그대로 들어갑니다.',
      '서버는 전혀 관여하지 않습니다. Markdown 파싱, 다이어그램 렌더링, 조판, PDF 생성까지 모두 이 탭 안에서 처리됩니다. 회원가입도, 워터마크도, 사용 횟수 제한도 없습니다. 작성한 내용은 내 브라우저에 자동으로 저장되어 탭을 닫아도 사라지지 않습니다. 업로드되는 일은 없으며, <strong>새 문서</strong>를 누르거나 이 사이트의 데이터를 지우면 삭제됩니다.',
    ],
    sections: [
      {
        heading: 'Mermaid 다이어그램은 캡처 이미지가 아닌 벡터로',
        body: [
          '<code>```mermaid</code> 블록은 SVG로 렌더링되어 PDF에 네이티브 벡터 그래픽으로 들어갑니다. 아무리 확대해도 선명하고, 다이어그램 속 글자를 선택·복사·검색할 수 있으며, <code>classDef</code>로 지정한 채우기 색, 선 색, 선 두께도 그대로 유지됩니다. 많은 온라인 변환기는 Mermaid를 아예 렌더링하지 못해 코드를 그대로 출력하고, 페이지 전체를 이미지로 만들어 글자를 선택할 수 없는 경우도 있습니다.',
        ],
      },
      {
        heading: '한글을 제대로 조판합니다',
        body: [
          '한글은 선택하고 검색할 수 있는 진짜 텍스트로 PDF에 들어가며, 파일 크기를 줄이기 위해 글꼴은 자동으로 서브셋 처리됩니다. 한글에는 한글용 글꼴이 쓰이고, 단어 사이 띄어쓰기와 영문이 섞인 문단의 줄바꿈도 올바르게 처리됩니다. 중국어(간체·번체), 일본어, 키릴 문자, 베트남어도 각각 알맞은 글꼴로 조판됩니다.',
        ],
      },
      {
        heading: '진짜 조판 엔진이 만드는 PDF',
        body: [
          '내부에서는 WebAssembly로 컴파일되어 브라우저에서 동작하는 최신 조판 시스템 Typst가 쓰입니다. 페이지 나눔, 외톨이 줄 방지, 목차, 쪽 번호, 각주, PDF 책갈피를 처리하고, 코드 강조도 내장 하이라이터가 맡습니다. 엔진 크기는 약 10 MB이며, 편집하는 동안 백그라운드에서 조용히 불러와 기기에 캐시되므로 그 뒤로는 오프라인에서도 쓸 수 있습니다.',
        ],
      },
      {
        heading: '지원하는 Markdown 문법',
        body: [
          '제목, 문단, 굵게, 기울임, 취소선, 인라인 코드, 링크, 이미지, 번호 목록과 글머리 목록, 중첩 목록, 할 일 목록, 인용문, 열 정렬이 있는 표, 정의 목록, 각주, 구분선, 구문 강조가 되는 코드 블록, 그리고 Mermaid 다이어그램. 이미지는 끌어다 놓거나 클립보드에서 붙여 넣을 수 있습니다. LaTeX 문법의 수식(인라인 <code>$...$</code>, 별도 줄 <code>$$...$$</code>, <code>```math</code> 블록)도 지원합니다.',
        ],
      },
    ],
    faqHeading: '자주 묻는 질문',
    faq: [
      {
        question: '문서가 서버에 업로드되나요?',
        answer: [
          '아니요. 파싱, 조판, PDF 생성은 모두 브라우저 안에서 이루어집니다. 이 사이트의 콘텐츠 보안 정책(CSP)은 사이트 자신 외의 어떤 주소로도 네트워크 요청을 보내지 못하게 막습니다. 즉 ‘업로드하지 않는다’는 약속이 아니라 브라우저가 강제하는 제한입니다.',
        ],
      },
      {
        question: '페이지를 닫아도 작성한 내용이 남아 있나요?',
        answer: [
          '네. 편집한 초안(본문, 레이아웃 설정, 끌어다 놓은 이미지)은 브라우저의 로컬 저장소에 자동으로 저장되고, 다음에 열 때 복원됩니다. 초안은 이 기기의 이 브라우저에만 있으며 업로드되거나 동기화되지 않습니다. <strong>새 문서</strong>를 누르거나 이 사이트의 데이터를 지우면 삭제됩니다.',
        ],
      },
      {
        question: 'Mermaid 다이어그램을 지원하나요?',
        answer: [
          '네. 다이어그램은 벡터 그래픽으로 PDF에 들어가므로 확대해도 흐려지지 않고, 다이어그램 속 글자도 선택하고 검색할 수 있습니다. <code>classDef</code>로 지정한 색상도 그대로 유지됩니다.',
        ],
      },
      {
        question: '한글이 제대로 표시되나요?',
        answer: [
          '네. 한글은 선택·복사·검색이 되는 진짜 텍스트로 PDF에 들어가며, 한글에 맞는 글꼴로 조판됩니다. 글꼴은 문서에서 실제로 필요할 때만 내려받습니다. 중국어(간체·번체), 일본어, 키릴 문자, 베트남어도 지원합니다.',
        ],
      },
      {
        question: '미리보기와 PDF가 조금 다른 이유는 무엇인가요?',
        answer: [
          '미리보기는 키를 누를 때마다 따라갈 수 있도록 브라우저가 직접 그리는 HTML입니다. PDF는 Typst 조판 엔진이 만들기 때문에 페이지 나눔, 줄바꿈, 자간은 내려받은 PDF를 기준으로 합니다. 내용, 구조, 스타일은 둘 다 같습니다.',
        ],
      },
      {
        question: '처음 PDF를 만들 때 얼마나 걸리나요?',
        answer: [
          '페이지 자체는 수십 KB라 바로 열립니다. 조판 엔진은 약 10 MB로, 페이지가 열린 뒤 백그라운드에서 조용히 내려받으며 보통 글을 다 쓰기 전에 준비가 끝납니다. 진행 상황은 하단 상태 표시줄에 나옵니다. 엔진은 기기에 캐시되므로 이후에는 오프라인에서도 변환할 수 있습니다.',
        ],
      },
      {
        question: '회원가입이나 결제가 필요한가요? 워터마크가 있나요?',
        answer: [
          '모두 필요 없고, 워터마크도 없습니다. 이 도구는 계정도 백엔드도 없는 정적 웹 페이지입니다.',
        ],
      },
      {
        question: '수식을 지원하나요?',
        answer: [
          '네. LaTeX 문법으로 인라인 수식은 <code>$...$</code>, 별도 줄 수식은 <code>$$...$$</code> 또는 <code>```math</code> 블록으로 씁니다. 수식은 Typst가 네이티브로 조판하므로 PDF에는 이미지가 아니라 검색 가능한 진짜 수식이 들어가며, 잘못 쓴 수식은 그 부분에만 오류가 표시되고 나머지 문서에는 영향을 주지 않습니다.',
        ],
      },
      {
        question: 'HTML 태그를 쓸 수 있나요?',
        answer: [
          '<code>&lt;br&gt;</code>만 쓸 수 있습니다. 조판 엔진에는 HTML에 대응하는 개념이 없어서, 그럴듯해 보이기만 하는 결과를 내는 대신 다른 태그는 알림과 함께 건너뜁니다.',
        ],
      },
    ],
    footer:
      `<strong>${BRAND}</strong> · 브라우저에서 Markdown을 PDF로 변환, Mermaid 다이어그램은 벡터 그대로. 문서는 업로드되지 않습니다.`,
    languagesHeading: '언어',
  },

  ui: {
    words: { other: '단어 {n}개' },
    lines: { other: '{n}줄' },
    paperHint: '{paper} · 페이지 나눔은 내려받은 PDF 기준',

    engineIdle: 'PDF 엔진 대기 중',
    engineWillLoad: 'PDF 엔진은 백그라운드에서 불러옵니다 (약 10 MB)',
    engineCached: 'PDF 엔진 캐시됨',
    engineDownloading: 'PDF 엔진 불러오는 중 {pct}%',
    engineStarting: 'PDF 엔진 시작 중…',
    engineFonts: '글꼴 불러오는 중…',
    engineReady: 'PDF 엔진 준비됨 · 오프라인 가능',
    engineFailed: 'PDF 엔진을 불러오지 못했습니다. 다운로드할 때 다시 시도합니다',

    download: 'PDF 다운로드',
    downloadGenerating: '생성 중…',
    downloadEngine: '엔진 불러오는 중 {pct}%',
    downloadStarting: '엔진 시작 중…',
    downloadFonts: '글꼴 불러오는 중…',
    downloadTypesetting: '조판 중…',
    print: '인쇄',
    printInTab: 'PDF를 새 탭에서 열었습니다. 그 탭에서 인쇄하세요.',
    printBlocked: '브라우저가 새 탭을 차단했습니다. PDF를 열어 그 탭에서 인쇄하세요.',
    printOpen: 'PDF 열기',

    missingGlyphs: '다음 문자는 글꼴에 없어 표시되지 않을 수 있습니다: {chars}',
    pdfFailed: 'PDF를 만들지 못했습니다: {detail}',
    pdfFailedShort: 'PDF를 만들지 못했습니다',
    initFailed: '페이지를 시작하지 못했습니다: {detail}',

    close: '닫기',
    undo: '실행 취소',
    cleared: '비웠습니다. 저장된 초안도 삭제되었습니다',
    langAuto: '자동 · {detected}',
    aiCleaned: 'AI 답변의 서식을 정리했습니다',
    draftNotSample: '이 페이지의 예제 대신 저장된 초안을 표시하고 있습니다',
    loadExample: '예제 불러오기',
    exampleLoaded: '예제를 불러왔습니다. 편집하기 전까지 초안은 유지됩니다',
    otherTab: '다른 탭에서 이 문서가 변경되었습니다',
    loadLatest: '최신 버전 불러오기',
    syncedFromTab: '다른 탭과 동기화됨',
    syncedFromTabTitle: '다른 탭에서 더 새로운 버전이 저장되어 이 탭에도 반영했습니다',
    saved: '이 브라우저에 저장됨',
    savedTitle: '{time} 저장 · 초안은 이 브라우저에만 있으며 업로드되지 않습니다',
    restored: '초안을 복원했습니다',
    restoredTitle: '초안은 이 브라우저에만 있으며 업로드되지 않습니다. 새 문서를 누르면 지워집니다',
    quotaState: '저장 공간 부족, 초안 저장 안 됨',
    quotaNotice:
      '브라우저의 로컬 저장 공간이 가득 차서 지금은 초안을 저장할 수 없습니다. 페이지는 계속 쓸 수 있으니 PDF를 내려받거나 Markdown을 따로 저장해 두세요.',
    storageOff: '로컬 저장소를 쓸 수 없어 초안이 저장되지 않습니다',
    imageBudget:
      '이미지가 합계 50 MB를 넘었습니다. 넘는 부분은 로컬에 저장되지 않으므로 다음에 다시 끌어다 놓아야 합니다.',
    imageQuota:
      '브라우저의 로컬 저장 공간이 가득 차서 일부 이미지가 저장되지 않았습니다. 다음에 다시 끌어다 놓아야 합니다.',
    imageEmbedded: '이미지 {name}을(를) 넣었습니다',
    fileLoaded: '{name}을(를) 불러왔습니다',
    pasteBlocked: '브라우저가 클립보드 읽기를 허용하지 않았습니다. 편집기에서 ⌘/Ctrl + V를 누르세요.',
    /** {name} */
    downloaded: '{name} 저장됨',
    unsupportedFile: '지원하지 않는 파일 형식: {name}',

    diagramPending: '다이어그램 그리는 중…',
    diagramError: '다이어그램을 그릴 수 없습니다: {detail}',
    mathError: '수식을 조판할 수 없습니다: {detail}',
    diagramErrorAt: '다이어그램 {line}번째 줄에 오류가 있습니다',
    diagramErrorTitle: '다이어그램 오류',
    diagramUnknown: '알 수 없는 다이어그램 종류: “{name}”',
    diagramStale: '마지막으로 그려진 버전을 표시하고 있습니다',
    diagramCopySvg: 'SVG 복사',
    diagramCopied: 'SVG를 클립보드에 복사했습니다',
    diagramCopyFailed: '여기서는 클립보드를 쓸 수 없습니다. SVG를 내려받으세요',
    diagramDownloadSvg: 'SVG 내려받기',
    diagramDownloadPng: 'PNG 내려받기',
    diagramActions: '다이어그램 내보내기',
    remoteImage: '원격 이미지는 불러오지 않습니다: {name}',
    missingImage: '이미지를 찾을 수 없습니다. 파일을 페이지에 끌어다 놓으세요: {name}',
    tocTitle: '목차',
    pageBreak: '페이지 나누기',
    fromDocument: '(문서에서 지정)',
    fromDocumentTitle: '문서 맨 앞의 front matter에서 지정했습니다. 그곳에서 바꾸세요',
    frontMatterSyntax: 'Front matter {line}번째 줄을 읽을 수 없어 무시했습니다.',
    frontMatterValue: 'Front matter {line}번째 줄: “{value}”은(는) {key}에 쓸 수 없는 값이라 무시했습니다.',
    frontMatterUnclosed: '맨 앞의 front matter에 닫는 --- 줄이 없어 일반 텍스트로 처리합니다.',
  },

  sample: `# ${BRAND} 예제 문서

이 Markdown → PDF 변환 도구는 **브라우저 안에서만 동작**합니다. 문서는 어떤 서버에도 업로드되지 않습니다. 조판 엔진, 글꼴, 변환 과정이 모두 이 탭 안에 있습니다.

왼쪽에서 편집하면 오른쪽 미리보기가 바로 따라옵니다. 오른쪽 위의 **PDF 다운로드**를 누르면 페이지 나눔, 쪽 번호, 책갈피가 들어간 정식 PDF를 조판 엔진이 만들어 줍니다.

## 다이어그램

\`\`\`mermaid
flowchart LR
  A[Markdown] --> B[markdown-it으로 파싱]
  B --> C{다이어그램이 있나?}
  C -- 예 --> D[Mermaid로 SVG 렌더링]
  C -- 아니요 --> E[Typst 소스 생성]
  D --> E
  E --> F[(PDF)]
\`\`\`

다이어그램은 **벡터**로 들어가므로 확대해도 흐려지지 않고, 그 안의 글자도 선택하고 검색할 수 있습니다.

## 글자 조판

*기울임*, **굵게**, ***굵은 기울임***, ~~취소선~~, \`인라인 코드\`, [링크](https://example.com)를 지원합니다. 한글 문장 사이에 Typst나 PDF 같은 영문을 섞어 써도 띄어쓰기와 줄바꿈이 자연스럽게 처리됩니다.

> 인용문은 한 단락을 돋보이게 합니다.
>
> 여러 문단으로 쓸 수도 있습니다.

## 목록

1. 번호 목록
2. 두 번째 항목
   - 중첩된 글머리 목록
   - 또 다른 항목
3. 세 번째 항목

- [x] 끝낸 일
- [ ] 할 일
- [ ] 또 하나의 할 일

## 코드

\`\`\`python
def fibonacci(n: int) -> int:
    """구문 강조는 Typst에 내장된 syntect가 담당합니다."""
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a
\`\`\`

## 표

| 기능 | 설명 | 상태 |
|:-----|:----:|-----:|
| 한글 조판 | 선택·검색 가능한 진짜 텍스트 | 지원 |
| 다이어그램 | 네이티브 벡터 그래픽 | 지원 |
| 수식 | 네이티브 조판, 검색 가능 | 지원 |

## 수식

수식은 네이티브로 조판되어 확대해도 선명하고 검색도 됩니다. 오일러 항등식 $e^{i\\pi} + 1 = 0$ 처럼 문장 안에 넣을 수도 있고, 긴 식은 따로 한 줄에 둘 수 있습니다.

$$
x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
$$

## 각주

조판 엔진으로는 Typst[^1]를 쓰며, 페이지 나눔, 목차, 쪽 번호, 책갈피를 맡고 있습니다.

[^1]: WebAssembly로 컴파일하면 브라우저에서도 돌아가는 최신 조판 시스템입니다.

---

마지막 줄입니다.
`,
};

export default ko;
