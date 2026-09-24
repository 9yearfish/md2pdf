import type { LandingDictionary } from '../landing';

const en: LandingDictionary<'en'> = {
  hubHeading: 'Guides and use cases',
  homeLink: 'Markdown to PDF',
  pages: {
    'chatgpt-to-pdf': {
      title: 'ChatGPT to PDF · Save Any Answer as PDF, Free, No Extension',
      description:
        'Copy a ChatGPT answer, paste it here and download a clean PDF. Tables, code blocks and formulas survive; citation junk is tidied. Free, in your browser.',
      h1: 'ChatGPT to PDF',
      lead: 'Press ChatGPT’s copy button, paste the answer on the left and download a properly typeset PDF. Nothing is uploaded.',
      navLabel: 'ChatGPT to PDF',
      navBlurb: 'save a ChatGPT answer as a clean PDF with its tables, code and formulas',
      intro: [
        'The copy button under every ChatGPT answer puts the answer on your clipboard as Markdown: headings, lists, tables, code blocks and formulas included. That is exactly what this page takes. Paste it into the editor above and press <strong>Download PDF</strong>: you get a document with real headings, page numbers and selectable text, not a screenshot of a chat window.',
        'Pasted answers are tidied automatically. ChatGPT writes formulas as <code>\\(…\\)</code> and <code>\\[…\\]</code>; they are turned into the standard <code>$…$</code> and <code>$$…$$</code> form. Leftover citation markers such as <code>【4†source】</code>, invisible zero-width characters and stray “Copy code” lines are removed. Code blocks are never touched, and a notice with <strong>Undo</strong> tells you when anything was changed.',
      ],
      howTo: {
        heading: 'How to save a ChatGPT answer as a PDF',
        steps: [
          { name: 'Copy the answer.', text: 'Click the copy icon under the ChatGPT response. It copies the answer as Markdown.' },
          { name: 'Paste it here.', text: 'Paste into the Markdown editor on this page. The preview on the right shows the result straight away.' },
          { name: 'Adjust the layout if you like.', text: 'Under Layout, choose the paper size, margins, font size, page numbers or a table of contents.' },
          { name: 'Download the PDF.', text: 'Press Download PDF. The file is typeset in your browser and saved to your device.' },
        ],
      },
      sections: [
        {
          heading: 'Tables, code and formulas that stay intact',
          body: [
            'Tables stay tables, with their column alignment. Code blocks keep their indentation and get syntax highlighting. Formulas are typeset as maths rather than printed as backslashes. Printing the chat page from the browser, by contrast, gives you the sidebar, the buttons and awkward page breaks along with the answer.',
          ],
        },
        {
          heading: 'One answer or several',
          body: [
            'This is not a full-conversation exporter: it turns what you paste into a document. Paste several answers one after another, add your own headings or notes between them, and they become one PDF with a table of contents if you switch it on. What you write is saved in your browser as a draft, so you can come back to it later.',
          ],
        },
        {
          heading: 'Private by construction',
          body: [
            'ChatGPT answers often contain work in progress: code, contracts, study notes. Here they never leave your device: the conversion happens entirely in this tab. The page’s Content Security Policy allows connections only to this site and to Cloudflare’s cookie-free visit counter, which never sees your text.',
          ],
        },
      ],
      faq: [
        {
          question: 'How do I copy a ChatGPT answer as Markdown?',
          answer: [
            'Use the copy icon below the answer rather than selecting the text with the mouse. The button copies Markdown, so headings, tables and code blocks come through. Selecting the rendered text copies plain text instead, and structure such as headings and table borders is lost.',
          ],
        },
        {
          question: 'Why do formulas look like \\( x^2 \\) after pasting elsewhere?',
          answer: [
            'ChatGPT writes maths with LaTeX brackets, <code>\\(…\\)</code> inline and <code>\\[…\\]</code> for displayed equations, which many Markdown tools do not understand. When you paste here, they are converted to the common <code>$…$</code> and <code>$$…$$</code> syntax automatically.',
          ],
        },
        {
          question: 'Can I export a whole ChatGPT conversation?',
          answer: [
            'Paste the answers you want to keep, in order; you can add the questions as headings yourself. For a complete archive of every chat, ChatGPT’s own data export (Settings → Data controls → Export data) sends you all conversations as a download, but as HTML and JSON rather than a formatted PDF.',
          ],
        },
        {
          question: 'Is my conversation uploaded anywhere?',
          answer: [
            'No. The text is converted in your browser and never sent to a server, including ours. It is saved only as a draft in this browser, which <strong>New</strong> deletes.',
          ],
        },
        {
          question: 'Why not just ask ChatGPT to make the PDF?',
          answer: [
            'ChatGPT can write a PDF file for you by running code, but that file is only as good as the script: the layout is basic, and fonts often lack the characters for Chinese, Japanese, Korean or other scripts, which is why such PDFs sometimes show empty boxes. Asking for the answer in Markdown and converting it here gives you typeset headings, tables, highlighted code and fonts made for your language.',
          ],
        },
        {
          question: 'Does it work on a phone?',
          answer: [
            'Yes, in any modern mobile browser: copy the answer in the ChatGPT app, paste it here and download. The typesetting engine (about 7 MB) is fetched the first time you download a PDF and cached after that.',
          ],
        },
        {
          question: 'Can I undo the automatic clean-up?',
          answer: [
            'Yes. When a paste is tidied, a notice appears with <strong>Undo</strong>, which puts back exactly what you pasted. Ctrl+Z (⌘Z) works too. Text that does not look like an AI answer is never changed.',
          ],
        },
      ],
      sample: `# Compound interest, explained

Compound interest means you earn interest on the interest you have already earned. After $t$ years, a principal $P$ at an annual rate $r$, compounded $n$ times a year, grows to:

$$
A = P\\left(1 + \\frac{r}{n}\\right)^{nt}
$$

## A worked example

Suppose you invest **€10,000** at **5 %** a year, compounded monthly ($n = 12$).

| Years | Balance | Interest earned |
|------:|--------:|----------------:|
| 1 | €10,511.62 | €511.62 |
| 5 | €12,833.59 | €2,833.59 |
| 10 | €16,470.09 | €6,470.09 |
| 20 | €27,126.40 | €17,126.40 |

Two things stand out:

1. **Time matters more than the rate.** Doubling the time more than doubles the interest.
2. **Frequency matters less than you think.** Daily compounding adds only a few euros over monthly.

## Calculating it yourself

\`\`\`python
def compound(principal: float, rate: float, years: int, per_year: int = 12) -> float:
    """Balance after compounding per_year times a year."""
    return principal * (1 + rate / per_year) ** (per_year * years)

for years in (1, 5, 10, 20):
    print(years, round(compound(10_000, 0.05, years), 2))
\`\`\`

> **Rule of 72:** divide 72 by the rate in percent to estimate how long it takes to double your money. At 5 %, that is about $72 / 5 \\approx 14.4$ years.

---

*Pasted from a ChatGPT answer. Replace this with your own and press **Download PDF**.*
`,
    },

    'claude-to-pdf': {
      title: 'Claude to PDF · Save Claude Chats & Artifacts as PDF, Free',
      description:
        'Paste a Claude answer or a Markdown artifact and download a typeset PDF. Mermaid diagrams render as vectors, code and tables stay intact. Nothing is uploaded.',
      h1: 'Claude to PDF',
      lead: 'Copy a Claude response or a Markdown artifact, paste it on the left and download a clean PDF, diagrams included. Nothing is uploaded.',
      navLabel: 'Claude to PDF',
      navBlurb: 'turn Claude answers and Markdown artifacts, Mermaid diagrams included, into a PDF',
      intro: [
        'Claude’s <strong>Copy</strong> button copies a response as Markdown, and a Markdown artifact (a report, a plan, documentation) can be copied or downloaded as a <code>.md</code> file. Both are exactly what this converter reads. Paste the text or drop the file onto the page, then press <strong>Download PDF</strong>.',
        'Claude often answers with Mermaid diagrams: flowcharts, sequence diagrams, entity relationships. Here they are rendered and embedded as vector graphics, so they print sharply and the labels stay selectable, instead of showing up as a block of diagram source.',
      ],
      howTo: {
        heading: 'How to save a Claude answer as a PDF',
        steps: [
          { name: 'Copy the response or artifact.', text: 'Use Copy under Claude’s response, or copy or download a Markdown artifact.' },
          { name: 'Paste or drop it here.', text: 'Paste into the editor on this page, or drop the downloaded .md file anywhere on the page.' },
          { name: 'Check the preview.', text: 'Headings, tables, code and Mermaid diagrams appear in the preview on the right as you paste.' },
          { name: 'Download the PDF.', text: 'Press Download PDF to typeset the document in your browser and save it.' },
        ],
      },
      sections: [
        {
          heading: 'Mermaid diagrams as real vector graphics',
          body: [
            'Every <code>```mermaid</code> block is drawn to SVG and placed in the PDF as native vector art. Zoom in as far as you like and it stays crisp; the text inside can be searched and copied. Wide diagrams are scaled to the width of the page and tall ones to its height, rather than running off the edge.',
          ],
        },
        {
          heading: 'Long answers become proper documents',
          body: [
            'Claude’s answers tend to be long and structured. Switch on <strong>Contents</strong> under Layout and the PDF gets a table of contents, page numbers and bookmarks from the headings, so a forty-section report is navigable in any PDF reader.',
          ],
        },
        {
          heading: 'Clean-up without surprises',
          body: [
            'If a paste carries chat artifacts, such as zero-width characters, a stray “Copy” line or formulas in <code>\\(…\\)</code> brackets, they are tidied and a notice offers <strong>Undo</strong>. Text that looks like ordinary Markdown is left exactly as it was.',
          ],
        },
      ],
      faq: [
        {
          question: 'How do I export a Claude artifact to PDF?',
          answer: [
            'Copy the artifact’s content, or download it as a Markdown file, then paste the text or drop the file here and press <strong>Download PDF</strong>. Artifacts that are code or web pages are better saved as they are; this tool is for documents written in Markdown.',
          ],
        },
        {
          question: 'Will the Mermaid diagrams Claude writes show up in the PDF?',
          answer: [
            'Yes. Mermaid blocks are rendered in your browser and embedded as vector graphics with selectable text. If a diagram has a syntax error, the preview shows the error so you can fix the source or ask Claude to correct it.',
          ],
        },
        {
          question: 'Does it keep formulas from Claude’s answers?',
          answer: [
            'Formulas written with <code>$…$</code> or <code>$$…$$</code> are kept, and <code>\\(…\\)</code> or <code>\\[…\\]</code> brackets are converted to that form when you paste.',
          ],
        },
        {
          question: 'Is anything I paste sent to a server?',
          answer: [
            'No. The conversion runs entirely in your browser; the page never sends your text anywhere. Your draft is kept only in this browser.',
          ],
        },
      ],
      sample: `# Designing a rate limiter

A rate limiter caps how many requests a client can make in a given window. Here is a design based on the **token bucket** algorithm, which allows short bursts while enforcing an average rate.

## How a request flows

\`\`\`mermaid
sequenceDiagram
  participant C as Client
  participant G as API gateway
  participant R as Redis
  participant S as Service
  C->>G: GET /orders
  G->>R: take 1 token (client id)
  alt tokens left
    R-->>G: ok, 41 left
    G->>S: forward request
    S-->>C: 200 OK
  else bucket empty
    R-->>G: empty, retry in 2 s
    G-->>C: 429 Too Many Requests
  end
\`\`\`

## Choosing an algorithm

| Algorithm | Bursts | Memory per client | Precision |
|:----------|:------:|:-----------------:|----------:|
| Fixed window | at window edges | 1 counter | low |
| Sliding log | no | 1 entry per request | exact |
| Sliding window counter | smoothed | 2 counters | high |
| **Token bucket** | **yes, up to capacity** | **2 values** | **high** |

With capacity $b$ and refill rate $r$ tokens per second, a client can send at most $b + r t$ requests in any interval of $t$ seconds.

## Implementation sketch

\`\`\`typescript
interface Bucket { tokens: number; updatedAt: number }

export function take(bucket: Bucket, now: number, rate: number, capacity: number): boolean {
  const elapsed = (now - bucket.updatedAt) / 1000;
  bucket.tokens = Math.min(capacity, bucket.tokens + elapsed * rate);
  bucket.updatedAt = now;
  if (bucket.tokens < 1) return false;
  bucket.tokens -= 1;
  return true;
}
\`\`\`

## Next steps

- [ ] Store buckets in Redis with a TTL so idle clients cost nothing
- [ ] Return \`Retry-After\` with every 429
- [ ] Add per-endpoint limits for expensive routes

---

*Pasted from a Claude answer. Replace this with your own and press **Download PDF**.*
`,
    },

    'deepseek-to-pdf': {
      title: 'DeepSeek to PDF · Save DeepSeek Answers as PDF, Free',
      description:
        'Paste a DeepSeek answer and download a clean PDF. Formulas in \\( \\) and \\[ \\] are converted, tables and code stay intact. Free, runs in your browser, no upload.',
      h1: 'DeepSeek to PDF',
      lead: 'Copy a DeepSeek answer, paste it on the left and download a typeset PDF with its formulas, tables and code. Nothing is uploaded.',
      navLabel: 'DeepSeek to PDF',
      navBlurb: 'export DeepSeek answers, formulas included, as a PDF',
      intro: [
        'DeepSeek is often asked for exactly the things that are hard to print: derivations, proofs, step-by-step solutions and code. The copy button under a DeepSeek answer copies it as Markdown, with formulas in LaTeX brackets such as <code>\\(…\\)</code> and <code>\\[…\\]</code>. Paste it here and those brackets are converted to the standard <code>$…$</code> and <code>$$…$$</code> form, so the formulas are typeset instead of printed as backslashes.',
        'Only the answer is copied, not the reasoning shown while DeepSeek thinks. Paste one or several answers, add headings or notes of your own, and press <strong>Download PDF</strong>.',
      ],
      howTo: {
        heading: 'How to save a DeepSeek answer as a PDF',
        steps: [
          { name: 'Copy the answer.', text: 'Click the copy icon under the DeepSeek answer.' },
          { name: 'Paste it here.', text: 'Paste into the Markdown editor. Formula brackets and invisible characters are tidied, with an Undo if you want the original.' },
          { name: 'Check the preview.', text: 'Formulas, tables and code blocks appear in the preview on the right.' },
          { name: 'Download the PDF.', text: 'Press Download PDF. The file is created in your browser.' },
        ],
      },
      sections: [
        {
          heading: 'Formulas, typeset',
          body: [
            'Inline formulas stay in the line of text and displayed equations get their own centred line, as in a textbook. Because the PDF contains real text rather than an image of the page, it stays small and searchable.',
          ],
        },
        {
          heading: 'Code and tables stay intact',
          body: [
            'Code blocks keep their indentation and get syntax highlighting; tables keep their columns and alignment. Nothing inside a code block is ever changed by the automatic clean-up.',
          ],
        },
        {
          heading: 'Nothing leaves your browser',
          body: [
            'The conversion runs locally in this tab. Your text is never sent to any server, including ours; the page’s Content Security Policy allows connections only to this site and to Cloudflare’s cookie-free visit counter, which never sees it.',
          ],
        },
      ],
      faq: [
        {
          question: 'Why do DeepSeek formulas show up as \\( \\) or \\[ \\] in other editors?',
          answer: [
            'DeepSeek writes maths using LaTeX’s bracket delimiters, which many Markdown tools do not recognise. Pasted here, they are converted to <code>$…$</code> and <code>$$…$$</code>, which this converter typesets.',
          ],
        },
        {
          question: 'Is the reasoning (the “thinking” part) included?',
          answer: [
            'The copy button copies the final answer. If you want the reasoning too, select and copy it separately and paste it wherever you like in the document.',
          ],
        },
        {
          question: 'Can I put several answers in one PDF?',
          answer: [
            'Yes. Paste them one after another, add a heading above each, and switch on <strong>Contents</strong> under Layout for a table of contents.',
          ],
        },
        {
          question: 'Is it free, and is my text uploaded?',
          answer: [
            'It is free, with no signup and no watermark, and nothing is uploaded: the PDF is produced in your browser.',
          ],
        },
      ],
      sample: `# Solving a quadratic equation

We want to solve $2x^2 - 3x - 5 = 0$.

## Step 1: identify the coefficients

For $ax^2 + bx + c = 0$ we have $a = 2$, $b = -3$ and $c = -5$.

## Step 2: compute the discriminant

$$
\\Delta = b^2 - 4ac = (-3)^2 - 4 \\cdot 2 \\cdot (-5) = 9 + 40 = 49
$$

Since $\\Delta > 0$, there are two distinct real roots.

## Step 3: apply the quadratic formula

$$
x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a} = \\frac{3 \\pm 7}{4}
$$

| Root | Value | Check: $2x^2 - 3x - 5$ |
|:-----|------:|-----------------------:|
| $x_1$ | $\\frac{5}{2}$ | $0$ |
| $x_2$ | $-1$ | $0$ |

## Verifying in code

\`\`\`python
import math

def solve(a: float, b: float, c: float) -> tuple[float, float]:
    d = b * b - 4 * a * c
    if d < 0:
        raise ValueError("no real roots")
    r = math.sqrt(d)
    return (-b + r) / (2 * a), (-b - r) / (2 * a)

print(solve(2, -3, -5))  # (2.5, -1.0)
\`\`\`

**Answer:** $x = \\frac{5}{2}$ or $x = -1$.

---

*Pasted from a DeepSeek answer. Replace this with your own and press **Download PDF**.*
`,
    },

    'gemini-to-pdf': {
      title: 'Gemini to PDF · Save Gemini Answers as PDF, No Extension',
      description:
        'Copy a Gemini response, paste it here and download a clean, typeset PDF with tables, code and formulas. Free, no signup, and nothing leaves your browser.',
      h1: 'Gemini to PDF',
      lead: 'Copy a Google Gemini response, paste it on the left and download a clean PDF with its tables and code. Nothing is uploaded.',
      navLabel: 'Gemini to PDF',
      navBlurb: 'save Google Gemini responses as a typeset PDF',
      intro: [
        'Gemini can send a response to Google Docs, and from there to PDF, but that route takes a Google account, a detour through a document editor and often some reformatting. Copying the response and pasting it here is quicker: Gemini’s copy button copies Markdown, and this page turns Markdown into a properly typeset PDF in one step, in your browser.',
        'Tables keep their columns, code blocks keep their indentation and highlighting, and formulas are typeset. Chat leftovers such as zero-width characters or a stray “Use code with caution” line are tidied when you paste, with an <strong>Undo</strong> if you want the original back.',
      ],
      howTo: {
        heading: 'How to save a Gemini response as a PDF',
        steps: [
          { name: 'Copy the response.', text: 'Use the copy option under the Gemini response.' },
          { name: 'Paste it here.', text: 'Paste into the Markdown editor on this page and check the preview on the right.' },
          { name: 'Set the layout.', text: 'Optionally choose paper size, margins, page numbers or a table of contents under Layout.' },
          { name: 'Download the PDF.', text: 'Press Download PDF; the file is typeset in your browser.' },
        ],
      },
      sections: [
        {
          heading: 'Research and trip plans that print well',
          body: [
            'Gemini answers are often long comparisons and plans: itineraries, product comparisons, study summaries. As a PDF they get real headings, page numbers and a table of contents if you want one, and the tables are laid out to the page width instead of being cut off.',
          ],
        },
        {
          heading: 'Combine several responses',
          body: [
            'Paste more than one response into the same document, add your own notes between them, and download them as one file. Your text is kept as a draft in this browser in case you close the tab.',
          ],
        },
        {
          heading: 'No account, no upload',
          body: [
            'There is nothing to sign in to. The converter runs in your browser, and the page never sends what you paste to any server.',
          ],
        },
      ],
      faq: [
        {
          question: 'How do I save a Gemini chat as a PDF?',
          answer: [
            'Copy the responses you want, paste them here in order and press <strong>Download PDF</strong>. Alternatively, Gemini’s “Export to Docs” sends a response to Google Docs, from which you can download a PDF.',
          ],
        },
        {
          question: 'Why do Gemini tables break when I print the page?',
          answer: [
            'Printing a chat page prints the web page, with its layout, side panels and scrolling tables. Pasted here, the table becomes part of a document that is laid out for paper.',
          ],
        },
        {
          question: 'Does it work with Gemini’s code and formulas?',
          answer: [
            'Yes. Code blocks are highlighted and never altered by the clean-up; formulas in <code>$…$</code>, <code>\\(…\\)</code> or <code>\\[…\\]</code> are typeset.',
          ],
        },
        {
          question: 'Is it free?',
          answer: ['Yes: no signup, no watermark and no limit on the number of PDFs.'],
        },
      ],
      sample: `# Rooftop solar: is it worth it?

Here is a comparison of three system sizes for a household using about **4,000 kWh** of electricity a year.

## At a glance

| System | Cost after incentives | Yearly output | Yearly savings | Payback |
|:-------|----------------------:|--------------:|---------------:|--------:|
| 3 kW | €6,300 | 3,600 kWh | €720 | 8.8 years |
| 5 kW | €9,800 | 6,000 kWh | €1,050 | 9.3 years |
| 8 kW | €15,200 | 9,600 kWh | €1,380 | 11.0 years |

The simple payback period is the cost divided by the yearly savings:

$$
\\text{payback} = \\frac{C}{S}
$$

## What changes the answer

- **Your electricity price.** Savings scale with it directly.
- **Export rates.** Power you sell back is often worth less than power you avoid buying, which is why the 8 kW system pays back more slowly.
- **Orientation and shade.** A south-facing roof (in the northern hemisphere) produces the most.

## Estimating it for your roof

\`\`\`javascript
function payback({ cost, kwhPerYear, selfUse, price, exportPrice }) {
  const saved = kwhPerYear * selfUse * price + kwhPerYear * (1 - selfUse) * exportPrice;
  return cost / saved;
}

console.log(payback({ cost: 9800, kwhPerYear: 6000, selfUse: 0.6, price: 0.22, exportPrice: 0.08 }).toFixed(1));
\`\`\`

> For most households, the mid-sized system is the best balance of cost and savings.

---

*Pasted from a Gemini response. Replace this with your own and press **Download PDF**.*
`,
    },

    'mermaid-to-pdf': {
      title: 'Mermaid Diagrams to PDF · Vector, Selectable Text, Free',
      description:
        'Convert Markdown with Mermaid diagrams to PDF. Diagrams render as sharp vector graphics with selectable text, scaled to fit the page. Free, no upload.',
      h1: 'Mermaid diagrams to PDF',
      lead: 'Write or paste Markdown with ```mermaid blocks and download a PDF in which every diagram is a sharp vector graphic with selectable text.',
      navLabel: 'Mermaid to PDF',
      navBlurb: 'diagrams that render as vectors, with selectable text, in the PDF',
      intro: [
        'Mermaid turns a few lines of text into flowcharts, sequence diagrams, Gantt charts and more. Getting those diagrams into a PDF is where it often goes wrong: many online Markdown converters do not render Mermaid at all and print the source code instead, some turn the whole page into one big image, and export from an editor may cut off wide diagrams or depend on fonts installed on your computer.',
        'Here, every <code>```mermaid</code> block is rendered to SVG in your browser and embedded in the PDF as native vector graphics. The diagram stays sharp at any zoom level, the labels can be selected, copied and found with search, and colours set with <code>classDef</code> or <code>style</code> come through as written.',
      ],
      howTo: {
        heading: 'How to convert Mermaid diagrams to PDF',
        steps: [
          { name: 'Add your diagrams.', text: 'Paste your Markdown, or write a fenced code block with the language mermaid.' },
          { name: 'Check the preview.', text: 'Each diagram renders in the preview as you type; syntax errors are shown in place.' },
          { name: 'Download the PDF.', text: 'Press Download PDF. Diagrams are embedded as vector graphics next to the rest of your document.' },
        ],
      },
      sections: [
        {
          heading: 'Vector, selectable, never a screenshot',
          body: [
            'Because diagrams are embedded as vector paths and text rather than pixels, they print crisply at any size and keep the file small. Search in your PDF reader finds words inside the diagrams, and you can copy a label straight out of a flowchart.',
          ],
        },
        {
          heading: 'Sized to the page',
          body: [
            'Diagrams keep their natural size when they fit. Wide ones are scaled down to the width of the text block instead of running past the margin, and one taller than a page is scaled to fit on a page. Labels are drawn as SVG text rather than embedded HTML, which is what makes some other exports show empty boxes where the labels should be.',
          ],
        },
        {
          heading: 'All the common diagram types',
          body: [
            'Flowcharts, sequence diagrams, class diagrams, state diagrams, entity-relationship diagrams, Gantt charts, pie charts, mind maps, timelines and the other types Mermaid supports are rendered by Mermaid itself, so the syntax is exactly what you know from GitHub, GitLab, Obsidian or Notion.',
          ],
        },
      ],
      faq: [
        {
          question: 'Why is my Mermaid diagram shown as code in the PDF?',
          answer: [
            'The converter you used does not render Mermaid; it treats the block as ordinary code. Here, any fenced block marked <code>mermaid</code> is rendered as a diagram. If the syntax is invalid, the preview and the PDF show a box with Mermaid’s error message, the line number and the offending line, and the rest of the document still renders.',
          ],
        },
        {
          question: 'Is the diagram an image in the PDF?',
          answer: [
            'It is a vector graphic, not a bitmap. It stays sharp when zoomed, and the text in it is real text that can be selected and searched.',
          ],
        },
        {
          question: 'Can I export only a diagram, without the rest of the document?',
          answer: [
            'Yes: put just the <code>```mermaid</code> block in the editor and download. The PDF then contains the diagram alone, at its natural size or scaled down to fit the page. To use a diagram elsewhere, hover it in the preview to copy its SVG or download it as SVG or PNG.',
          ],
        },
        {
          question: 'Do custom colours and styles survive?',
          answer: [
            'Yes. Fills, stroke colours and line widths set with <code>classDef</code>, <code>class</code> or <code>style</code> are kept in the PDF.',
          ],
        },
        {
          question: 'Is my diagram uploaded to a rendering server?',
          answer: [
            'No. Mermaid runs in your browser, and so does the PDF engine. The page never sends your document anywhere.',
          ],
        },
      ],
      sample: `# Mermaid diagrams in a PDF

Every diagram below is rendered in your browser and embedded in the PDF as **vector graphics**: zoom in as far as you like, and select or search the text inside.

## Flowchart

\`\`\`mermaid
flowchart LR
  A[Order placed] --> B{In stock?}
  B -- yes --> C[Pack]
  B -- no --> D[Back-order]
  D --> C
  C --> E[Ship]
  E --> F([Delivered])
  classDef done fill:#e3f5e8,stroke:#1f8a4c,stroke-width:2px
  class F done
\`\`\`

## Sequence diagram

\`\`\`mermaid
sequenceDiagram
  participant U as User
  participant A as App
  participant P as Payment provider
  U->>A: Checkout
  A->>P: Authorise €42.00
  P-->>A: Approved
  A-->>U: Order confirmed
\`\`\`

## Gantt chart

\`\`\`mermaid
gantt
  title Release plan
  dateFormat YYYY-MM-DD
  section Build
    Design       :done, d1, 2026-01-05, 10d
    Development  :active, d2, after d1, 20d
  section Ship
    Testing      :d3, after d2, 8d
    Launch       :milestone, after d3, 0d
\`\`\`

## Class diagram

\`\`\`mermaid
classDiagram
  class Document {
    +String title
    +render() PDF
  }
  class Diagram {
    +String source
    +toSvg() SVG
  }
  Document "1" o-- "*" Diagram : contains
\`\`\`

Edit any block on the left and the preview follows; press **Download PDF** for the real file.
`,
    },

    'readme-to-pdf': {
      title: 'README to PDF · Convert README.md Online, Free',
      description:
        'Convert a GitHub README.md to PDF with its tables, highlighted code and Mermaid diagrams. Drop in the images it uses. Free, in your browser, no upload.',
      h1: 'README to PDF',
      lead: 'Paste a README.md or drop the file here and download it as a typeset PDF, with its tables, code blocks and Mermaid diagrams. Nothing is uploaded.',
      navLabel: 'README to PDF',
      navBlurb: 'a GitHub README.md as a PDF, with tables, code and diagrams',
      intro: [
        'GitHub renders a README beautifully, but it has no “download as PDF”. Printing the repository page from the browser gives you the file list, the sidebar and the navigation along with the text, and page breaks wherever they happen to fall. What you usually want is the README itself as a document: to attach to a proposal, hand to a reviewer or read on paper.',
        'Here the Markdown is typeset as a real document. Headings become PDF bookmarks, tables keep their alignment, code blocks are highlighted, and <code>```mermaid</code> blocks, which GitHub also renders, become vector diagrams. Formulas in <code>$…$</code> work as they do on GitHub.',
      ],
      howTo: {
        heading: 'How to convert a README to PDF',
        steps: [
          { name: 'Get the Markdown.', text: 'On GitHub, open README.md, click Raw and copy the text, or use the file from your clone of the repository.' },
          { name: 'Paste or drop it here.', text: 'Paste into the editor, or drop the README.md file anywhere on the page.' },
          { name: 'Drop in its images.', text: 'Drag the image files the README uses onto the page; a path such as docs/screenshot.png is matched by its file name.' },
          { name: 'Download the PDF.', text: 'Press Download PDF, or Print to send the same PDF to a printer.' },
        ],
      },
      sections: [
        {
          heading: 'What comes through',
          body: [
            'GitHub-style tables with column alignment, fenced code with syntax highlighting, task lists, footnotes, nested lists, links that stay clickable, and Mermaid flowcharts, sequence diagrams and the other types, drawn as vectors with selectable text. Switch on <strong>Contents</strong> under Layout for a table of contents; a wide or tall diagram is fitted to the page rather than cut off.',
          ],
        },
        {
          heading: 'Images: drag them in',
          body: [
            'The page’s security policy blocks images from other websites, so it does not fetch images from the web. Images stored in the repository are easy: drop the files onto the page and every reference to them, whatever folder the README names, is filled in. Images that live elsewhere, including the badges from shields.io at the top of many READMEs, show up in the PDF as a short “image unavailable” note; delete those lines, or download the image and drop it in.',
          ],
        },
        {
          heading: 'What does not carry over',
          body: [
            'Raw HTML is not rendered: a centred <code>&lt;p align="center"&gt;</code> header, an <code>&lt;img&gt;</code> tag or a collapsible <code>&lt;details&gt;</code> block appears as text, so rewrite those parts in plain Markdown. GitHub’s <code>&gt; [!NOTE]</code> alerts become ordinary quotes, <code>:rocket:</code> shortcodes stay as text, and emoji have no font here, so they print as empty boxes (the page tells you which characters are affected).',
          ],
        },
      ],
      faq: [
        {
          question: 'How do I convert a GitHub README to PDF?',
          answer: [
            'Open the README on GitHub, click <strong>Raw</strong>, copy everything and paste it into the editor on this page, then press <strong>Download PDF</strong>. If you have the repository on your computer, drop README.md onto the page instead.',
          ],
        },
        {
          question: 'Why are the images missing from my PDF?',
          answer: [
            'Relative images such as <code>docs/architecture.png</code> are files in the repository, and this page cannot see your repository: drop the image files onto the page and they are embedded. Images referenced by a web address, badges included, are never fetched, because the page’s security policy blocks images from other servers.',
          ],
        },
        {
          question: 'Are Mermaid diagrams in the README rendered?',
          answer: [
            'Yes. <code>```mermaid</code> blocks are drawn in your browser and embedded as vector graphics, the same diagrams GitHub shows. A diagram with a syntax error appears as a box with the error message and line, and the rest of the PDF is unaffected.',
          ],
        },
        {
          question: 'Can I convert a README from a private repository?',
          answer: [
            'Yes. The text is typeset in this browser tab and never uploaded, so there is no need to make anything public or grant access to anything. Copy the Markdown from the repository and paste it here.',
          ],
        },
        {
          question: 'Why does my HTML show up as text?',
          answer: [
            'Raw HTML has no equivalent in the typesetting engine, so tags are shown rather than interpreted. Most README HTML is layout: replace a centred logo block with a plain image line and a <code>&lt;details&gt;</code> block with a heading.',
          ],
        },
      ],
      sample: `# tidyup

A command-line tool that sorts a messy folder of photos and documents into dated folders, and never deletes anything.

## Install

\`\`\`bash
npm install --global tidyup
\`\`\`

Requires Node.js 20 or later. Works on macOS, Linux and Windows.

## Usage

\`\`\`bash
tidyup ~/Downloads --into ~/Archive --dry-run
\`\`\`

| Option | Default | What it does |
|:--|:--:|:--|
| \`--into <dir>\` | \`./sorted\` | Where the dated folders go |
| \`--by <unit>\` | \`month\` | \`day\`, \`month\` or \`year\` |
| \`--dry-run\` | off | Print the plan, move nothing |
| \`--undo\` | | Put the last run back |

## How it decides

\`\`\`mermaid
flowchart LR
  F[File] --> E{EXIF date?}
  E -- yes --> D[Photo taken]
  E -- no --> M[Last modified]
  D --> P[YYYY/MM folder]
  M --> P
\`\`\`

## Configuration

A \`tidyup.json\` in the source folder overrides the defaults:

\`\`\`json
{
  "by": "year",
  "ignore": ["*.tmp", "node_modules"]
}
\`\`\`

## Roadmap

- [x] Undo the last run
- [x] Dry run
- [ ] Duplicate detection

## Contributing

Pull requests are welcome. Run \`npm test\` before you open one.

## Licence

MIT
`,
    },

    'claude-md-to-pdf': {
      title: 'CLAUDE.md to PDF · Print or Share AGENTS.md Files, Free',
      description:
        'Turn a CLAUDE.md, an AGENTS.md or a plan Claude Code wrote into a clean PDF to review, print or share. Code, tables and diagrams kept. Free, no upload.',
      h1: 'CLAUDE.md to PDF',
      lead: 'Drop a CLAUDE.md, an AGENTS.md or any Markdown file your coding agent wrote, and download a clean PDF to review, annotate or share. Nothing is uploaded.',
      navLabel: 'CLAUDE.md to PDF',
      navBlurb: 'agent instruction files and Claude Code plans as a readable PDF',
      intro: [
        '<code>CLAUDE.md</code> is the file Claude Code reads at the start of every session: how to build and test the project, the conventions to follow, the things never to do. <code>AGENTS.md</code> is the same idea in a vendor-neutral file that several coding agents read. As these files grow, they become policy, and policy gets reviewed: by a tech lead, by security, by a new team member on their first day.',
        'A PDF is the easy way to do that review. Drop the file here and it is typeset as a document: headings with bookmarks, commands in highlighted code blocks, tables, nested rules and Mermaid diagrams, ready to annotate on a tablet, attach to a ticket or print for a meeting. The same works for the plans, specs and reports Claude Code writes as <code>.md</code> files.',
      ],
      howTo: {
        heading: 'How to turn a CLAUDE.md into a PDF',
        steps: [
          { name: 'Find the file.', text: 'CLAUDE.md or AGENTS.md is usually in the project root; your personal one is ~/.claude/CLAUDE.md.' },
          { name: 'Drop it here.', text: 'Drop the file onto this page, or open it in your editor, copy everything and paste it.' },
          { name: 'Pick a layout.', text: 'Under Layout, the Report template adds a header and numbered headings; Contents adds a table of contents.' },
          { name: 'Download or print.', text: 'Press Download PDF to save the file, or Print to send the same PDF to a printer.' },
        ],
      },
      sections: [
        {
          heading: 'Rules and commands, readable',
          body: [
            'Instruction files are dense: nested lists of rules, commands in backticks, blocks of shell and config. In the PDF, commands stay in a monospaced face with syntax highlighting, lists keep their nesting, and tables keep their columns, so a reviewer can read the file the way the agent does, only more comfortably.',
          ],
        },
        {
          heading: 'Plans and reports from Claude Code',
          body: [
            'Ask Claude Code for a design plan, a migration checklist or a review summary and it writes Markdown, often with a Mermaid diagram of the architecture. Drop that file here to share it with people who do not live in a terminal. The diagrams become vector graphics, and a long plan gets a table of contents and page numbers.',
          ],
        },
        {
          heading: 'Nothing leaves your machine',
          body: [
            'Instruction files tend to mention internal hostnames, directory layouts and deployment steps. This page typesets them in your browser and never sends them anywhere: its Content Security Policy blocks every server except this site and Cloudflare’s anonymous visit counter, which never sees your files.',
          ],
        },
      ],
      faq: [
        {
          question: 'Where is my CLAUDE.md?',
          answer: [
            'A project’s file is <code>CLAUDE.md</code> (or <code>.claude/CLAUDE.md</code>) in the repository root; personal instructions for every project are in <code>~/.claude/CLAUDE.md</code>. Folders that start with a dot are hidden on macOS: press ⌘⇧. in a Finder window to show them.',
          ],
        },
        {
          question: 'Does it work with AGENTS.md, GEMINI.md and other instruction files?',
          answer: [
            'Yes. They are all Markdown, so any of them converts the same way. Front matter at the top of a file is read for the options it knows, such as <code>title</code>, and anything else in it is ignored.',
          ],
        },
        {
          question: 'Are @imports included?',
          answer: [
            'No. A line such as <code>@docs/testing.md</code> tells Claude Code to read another file; here it is printed as written. To review the whole set, paste the imported files below the main one, each under its own heading.',
          ],
        },
        {
          question: 'Can’t Claude Code make the PDF itself?',
          answer: [
            'It can, by writing and running a conversion script with a tool such as pandoc or a PDF library, which has to be installed and sets the look. Here there is nothing to install, the layout is a proper typeset document, and the conversion never goes through the model or anyone’s server.',
          ],
        },
        {
          question: 'Is the file uploaded?',
          answer: [
            'No. It is converted in this browser tab. If you edit it here, the text is kept as a draft in this browser only, until you press <strong>New</strong>.',
          ],
        },
      ],
      sample: `# CLAUDE.md

Instructions for coding agents working in this repository. Read this before changing anything.

## Project

A web shop for a bakery chain: a TypeScript API (\`api/\`), a React front end (\`web/\`) and a Postgres database migrated with \`dbmate\`.

\`\`\`mermaid
flowchart LR
  W[web/ React] --> A[api/ Fastify]
  A --> D[(Postgres)]
  A --> Q[Payment provider]
\`\`\`

## Commands

\`\`\`bash
pnpm install          # once
pnpm dev              # api on :3000, web on :5173
pnpm test             # unit tests, must pass before a commit
pnpm lint --fix
dbmate new <name>     # create a migration
\`\`\`

## Conventions

- TypeScript strict mode everywhere. No \`any\` without a comment saying why.
- API handlers live in \`api/routes/<resource>.ts\`, one file per resource.
- Money is stored in cents as integers. Never use floating point for prices.
- Dates are UTC in the database and converted only in \`web/\`.

## Never

1. Never edit an existing migration; write a new one.
2. Never commit \`.env\` files or print secrets in logs.
3. Never call the payment provider from tests; use \`api/test/fake-payments.ts\`.

## Before you finish

| Check | Command |
|:--|:--|
| Types | \`pnpm typecheck\` |
| Tests | \`pnpm test\` |
| Formatting | \`pnpm lint\` |

@docs/testing.md
`,
    },

    'print-markdown': {
      title: 'Print Markdown · Real Page Breaks, Mermaid and CJK, Free',
      description:
        'Print a Markdown file as a typeset document: clean page breaks, page numbers, Mermaid diagrams and Chinese, Japanese or Korean text. Free, in your browser.',
      h1: 'Print Markdown',
      lead: 'Paste or drop a Markdown file and press Print: the printer gets a typeset PDF with page numbers and page breaks where you want them, not a web page.',
      navLabel: 'Print Markdown',
      navBlurb: 'print a .md file with proper page breaks, diagrams and fonts',
      intro: [
        'Printing Markdown usually means printing something else: the raw text with its asterisks and hash marks, or a web page rendered from it, with the browser’s headers, cut-off code blocks and page breaks through the middle of a table. The result also changes from one computer to the next, because it depends on the fonts installed there.',
        'The <strong>Print</strong> button on this page prints the PDF that the typesetting engine makes from your Markdown, the same file <strong>Download PDF</strong> saves. Its fonts travel with it, so the pages come out the same on any computer and any printer: headings, tables, highlighted code, Mermaid diagrams, formulas, and Chinese, Japanese or Korean text included.',
      ],
      howTo: {
        heading: 'How to print a Markdown file',
        steps: [
          { name: 'Open the file.', text: 'Drop the .md file onto this page, use Open, or paste the Markdown into the editor.' },
          { name: 'Set up the pages.', text: 'Under Layout, choose the paper size, margins and page numbers; put \\pagebreak on a line of its own wherever a new page should start.' },
          { name: 'Press Print.', text: 'Press Print, or Ctrl+P (⌘P on a Mac). The print dialog opens with the typeset PDF.' },
          { name: 'Choose the printer.', text: 'Pick your printer, or Save as PDF, and print.' },
        ],
      },
      sections: [
        {
          heading: 'Page breaks you control',
          body: [
            'The engine breaks lines and pages the way a book is set, and you can add your own breaks: a line with <code>\\pagebreak</code>, <code>\\newpage</code> or <code>&lt;!-- pagebreak --&gt;</code> starts a new page, and <strong>New page per H1</strong> under Layout gives every chapter its own. The preview marks each break with a dashed line. Headers and footers, a cover page and templates for reports, papers, letters and résumés are there when a printout needs to look official.',
          ],
        },
        {
          heading: 'Diagrams and every script, on paper',
          body: [
            'Mermaid diagrams are printed as sharp vector graphics, scaled to fit the page rather than cut off at its edge. Chinese, Japanese, Korean, Cyrillic, Greek, Arabic and other scripts are set in matching Noto fonts that come with the page, so nothing turns into empty boxes because a font is missing on the computer you print from.',
          ],
        },
        {
          heading: 'Printing Markdown from VS Code or on a Mac',
          body: [
            'VS Code has no print command for Markdown. Its preview cannot be printed directly; the usual workaround is an extension such as Markdown PDF, which exports a PDF for you to print. On a Mac, TextEdit opens a .md file as plain text and prints it with the Markdown symbols showing. Either way, dropping the file onto this page and pressing <strong>Print</strong> is quicker: nothing to install, and the page breaks are set properly.',
          ],
        },
      ],
      faq: [
        {
          question: 'How do I print a Markdown file?',
          answer: [
            'Drop the file onto this page (or paste its text), check the preview and press <strong>Print</strong>. The print dialog shows the typeset pages, and you print as you would any document.',
          ],
        },
        {
          question: 'How do I print Markdown from VS Code?',
          answer: [
            'VS Code cannot print its Markdown preview itself. Install an export extension such as Markdown PDF and print the PDF it writes, or drag the file from VS Code’s explorer onto this page and press <strong>Print</strong>.',
          ],
        },
        {
          question: 'How do I print a Markdown file on a Mac?',
          answer: [
            'macOS has no built-in app that formats Markdown for printing: TextEdit prints the raw text. Drop the file onto this page in Safari, Chrome or Firefox and press Print. In Safari and Firefox the PDF opens in a new tab; print it from there with ⌘P.',
          ],
        },
        {
          question: 'Why did a new tab open instead of the print dialog?',
          answer: [
            'Safari, Firefox and phone browsers do not reliably print a PDF from inside another page, so the PDF opens in a tab of its own and you print it from there. It is the same file, so the printout is identical. Chrome and Edge on a computer open the print dialog directly.',
          ],
        },
        {
          question: 'How do I add a page break?',
          answer: [
            'Put <code>\\pagebreak</code> (or <code>\\newpage</code>, or <code>&lt;!-- pagebreak --&gt;</code>) on a line of its own. Two breaks in a row, or a break right before a heading that already starts a page, never leave a blank page.',
          ],
        },
        {
          question: 'Will it look the same on another computer?',
          answer: [
            'Yes. The page prints a PDF with its fonts embedded, not a web page laid out by your browser, so the line and page breaks do not change with the computer, the browser or the printer.',
          ],
        },
      ],
      sample: `# Workshop handout: planning a small garden

Saturday, 10:00 to 13:00, community hall. Bring gloves and a notebook.

## Agenda

| Time | Session | Who |
|:--|:--|:--|
| 10:00 | Choosing a spot: sun, soil, water | Maria |
| 10:45 | Raised beds versus open ground | Tom |
| 11:30 | Break | |
| 11:45 | What to plant in the first year | Maria |
| 12:30 | Questions and seed swap | Everyone |

## Before you start

- [ ] Watch the spot for a day: it needs six hours of sun
- [ ] Check how water drains after rain
- [ ] Decide on a budget for soil and timber

## Which bed is right for you?

\`\`\`mermaid
flowchart TD
  A{Soil good?} -- yes --> B[Plant in open ground]
  A -- no --> C{Bad back or knees?}
  C -- yes --> D[Raised bed, 60 cm high]
  C -- no --> E[Raised bed, 30 cm high]
\`\`\`

\\pagebreak

## Notes

A 1.2 m by 2.4 m raised bed 30 cm deep needs about 0.86 m³ of soil. Mix roughly 60 % topsoil and 40 % compost.

> Start small. One bed that is looked after produces more than three that are not.

*Press **Print** to print this handout, or replace it with your own Markdown.*
`,
    },
  },
};

export default en;
