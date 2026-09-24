import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import {
  llmsFullTxt,
  llmsTxt,
  manifest,
  ogImagePath,
  PAGES,
  pageForPath,
  pagePath,
  REDIRECT_MARKER,
  redirectScript,
  renderPage,
  robotsTxt,
  sitemap,
  validateLandings,
  validateLocales,
  type PageRef,
} from './src/i18n/pages';

const require = createRequire(import.meta.url);

/**
 * The decompressed size of the compiler, so the loader can report honest
 * progress. `Content-Length` is no use for this: with compression enabled it
 * reports compressed bytes while the stream yields decompressed ones.
 */
const compilerWasmBytes = statSync(
  require.resolve('@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm'),
).size;

/**
 * Keep `unsafe-eval` out of the Content-Security-Policy.
 *
 * The Typst compiler needs two string-to-function escapes that CSP would
 * otherwise force us to allow, and both are dead code in this app:
 *
 *  - typst.ts hides a dynamic `import()` behind `new Function` so bundlers
 *    leave it alone. What it imports is a Node-only font cache; the branch is
 *    short-circuited in a browser, but merely constructing the function needs
 *    eval.
 *  - The compiler builds placeholder callbacks for a filesystem and a package
 *    registry through `js_sys::Function`, unconditionally, before any
 *    configuration runs. `engine.ts` replaces both with real implementations
 *    via `withAccessModel`/`withPackageRegistry`, so the placeholders are never
 *    invoked.
 *
 * Both are replaced with stubs that throw if they are ever actually called, so
 * a future version of typst.ts that depends on them fails loudly instead of
 * silently misbehaving. The end-to-end test compiles the sample document
 * against the production build with the real CSP applied, which is what proves
 * these paths stay dead.
 */
function avoidEval(): Plugin {
  const ESCAPE_IMPORT = /new Function\('m', 'return import\(m\)'\)/g;
  const JS_SYS_FUNCTION = /new Function\(getStringFromWasm0\(/g;

  const helper = `
function __md2pdfPlaceholder(...body) {
  return () => {
    throw new Error(
      'md2pdf: a Typst placeholder callback was invoked, which should not happen: ' +
        body.join(' | '),
    );
  };
}
`;

  return {
      name: 'md2pdf:avoid-eval',
      enforce: 'pre',
      transform(code, id) {
        if (!id.includes('@myriaddreamin')) return null;

        let out = code.replace(
          ESCAPE_IMPORT,
          "((m) => { throw new Error('md2pdf: ' + m + ' is Node-only'); })",
        );
        if (JS_SYS_FUNCTION.test(out)) {
          JS_SYS_FUNCTION.lastIndex = 0;
          out = out.replace(JS_SYS_FUNCTION, '__md2pdfPlaceholder(getStringFromWasm0(');
          out = helper + out;
        }
        return out === code ? null : { code: out, map: null };
      },
    };
  }

/**
 * Temml, the preview's maths renderer, as its own terser build.
 *
 * Temml ships an ES module and a minified build that assigns a global. The
 * minified one is 41 KB with brotli against 50 KB for the ES module run
 * through esbuild, and it is fetched for every document with maths, so it is
 * wrapped as a module here instead. It contains no eval.
 */
function temmlMinified(): Plugin {
  const ID = '\0md2pdf:temml';
  return {
    name: 'md2pdf:temml-min',
    enforce: 'pre',
    resolveId: source => (source === 'temml' ? ID : null),
    load(id) {
      if (id !== ID) return null;
      const code = readFileSync(require.resolve('temml/dist/temml.min.js'), 'utf8');
      if (!/^var temml=/.test(code)) throw new Error('md2pdf: unexpected temml.min.js layout');
      return `${code}\nexport default temml;\n`;
    },
  };
}

/**
 * Prerenders one static page per locale, plus each locale's landing pages
 * (src/i18n/landing.ts), from index.html and the dictionaries in src/i18n, and
 * emits robots.txt, sitemap.xml and the language redirect.
 *
 * `/` is the default locale's home page; every other page is a virtual
 * `<path>/index.html` input (`zh/index.html`, `chatgpt-to-pdf/index.html`,
 * `ja/chatgpt-to-pdf/index.html`), so Vite bundles it like any page and writes
 * it to the same path under dist/. All pages share the same JS and CSS; each
 * carries only its own strings. See src/i18n/pages.ts for the template
 * placeholders.
 *
 * The origin cannot come from public/ because a sitemap or canonical link with
 * a placeholder origin is worse than none.
 */
function i18nPages(siteUrl: string): Plugin {
  const origin = siteUrl.replace(/\/$/, '');
  const root = process.cwd();
  const template = () => readFileSync(resolve(root, 'index.html'), 'utf8');
  /** `/ja/chatgpt-to-pdf/` is built from the virtual `<root>/ja/chatgpt-to-pdf/index.html`. */
  const pageId = (page: PageRef) => resolve(root, `.${pagePath(page)}index.html`);
  const inputName = (page: PageRef) => pagePath(page).replace(/^\/|\/$/g, '') || 'index';
  const rootPage = resolve(root, 'index.html');
  const virtualPages = new Set(PAGES.map(pageId).filter(id => id !== rootPage));
  const DEV_REDIRECT = '/lang-redirect.js';
  let building = false;

  validateLocales();
  validateLandings();

  return {
    name: 'md2pdf:i18n-pages',
    enforce: 'pre',
    config() {
      return {
        build: {
          rollupOptions: {
            input: Object.fromEntries(PAGES.map(p => [inputName(p), pageId(p)])),
          },
        },
      };
    },
    resolveId(id) {
      const file = resolve(root, id.replace(/^\//, ''));
      return virtualPages.has(id) ? id : virtualPages.has(file) ? file : null;
    },
    load(id) {
      return virtualPages.has(id) ? template() : null;
    },
    configResolved(config) {
      building = config.command === 'build';
    },
    buildStart() {
      // Fingerprinted like any asset, so it can be cached forever.
      if (building) this.emitFile({ type: 'asset', name: 'lang-redirect.js', source: redirectScript() });
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        // In dev the script is served by the middleware below; in a build the
        // marker stays until the post hook knows the fingerprinted file name.
        const tag = ctx.server ? `<script src="${DEV_REDIRECT}"></script>` : REDIRECT_MARKER;
        return renderPage(html, pageForPath(ctx.path), origin, tag);
      },
    },
    generateBundle() {
      // Every page's og:image must exist, or a share shows a broken image.
      const missing = PAGES.map(ogImagePath).filter(file => !existsSync(resolve(root, `public${file}`)));
      if (missing.length) {
        throw new Error(`md2pdf: missing share images (run npm run og): ${missing.slice(0, 5).join(', ')}`);
      }
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robotsTxt(origin) });
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap(origin) });
      this.emitFile({ type: 'asset', fileName: 'llms.txt', source: llmsTxt(origin) });
      this.emitFile({ type: 'asset', fileName: 'llms-full.txt', source: llmsFullTxt(origin) });
      this.emitFile({ type: 'asset', fileName: 'manifest.webmanifest', source: manifest() });
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const path = (req.url ?? '/').split('?')[0];
        if (path === DEV_REDIRECT) {
          res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
          res.end(redirectScript());
          return;
        }
        // Vite serves `/` itself; every other page is virtual.
        const wanted = path.replace(/index\.html$/, '').replace(/\/?$/, '/');
        const page = PAGES.find(p => pagePath(p) === wanted && pagePath(p) !== '/');
        if (!page) return next();
        if (!path.endsWith('/') && !path.endsWith('.html')) {
          res.writeHead(301, { Location: `${path}/` }).end();
          return;
        }
        const html = await server.transformIndexHtml(`${pagePath(page)}index.html`, template());
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(html);
      });
    },
  };
}

/** Swaps the redirect marker for the fingerprinted script, once the bundle names it. */
function i18nRedirectTag(): Plugin {
  return {
    name: 'md2pdf:i18n-redirect-tag',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!html.includes(REDIRECT_MARKER)) return html;
        const asset = Object.values(ctx.bundle ?? {}).find(
          file => file.type === 'asset' && (file.names?.includes('lang-redirect.js') || file.name === 'lang-redirect.js'),
        );
        if (!asset) throw new Error('md2pdf: lang-redirect.js was not emitted');
        return html.replace(REDIRECT_MARKER, `<script src="/${asset.fileName}"></script>`);
      },
    },
  };
}

/**
 * 103 Early Hints on Cloudflare Pages, and the HTML's cache policy.
 *
 * Pages sends an Early Hint for every `Link` header a path's _headers rule
 * gives it, while the edge is still fetching the page, so the stylesheet and
 * the entry module are on their way before the HTML arrives. Their names are
 * fingerprinted, so the rules are written here, per page, from what each built
 * page actually references (the language redirect only exists on `/`). Fonts,
 * the engine and Mermaid are never hinted: nothing on first paint needs them.
 *
 * The same rule states the HTML's cache policy: the browser revalidates every
 * time (a deploy is picked up at once) and the edge serves it from its cache.
 * Pages allows 100 rules; the build fails before a deploy would.
 */
function earlyHints(): Plugin {
  let outDir = 'dist';
  return {
    name: 'md2pdf:early-hints',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    writeBundle(_options, bundle) {
      const hints: { path: string; links: string[] }[] = [];
      for (const file of Object.values(bundle)) {
        if (file.type !== 'asset' || !file.fileName.endsWith('index.html')) continue;
        const html = String(file.source);
        const links: string[] = [];
        for (const [, src] of html.matchAll(/<script src="(\/assets\/[^"]+\.js)"><\/script>/g)) links.push(`<${src}>; rel=preload; as=script`);
        for (const [, href] of html.matchAll(/<link rel="stylesheet"[^>]*href="(\/assets\/[^"]+\.css)"/g)) links.push(`<${href}>; rel=preload; as=style; crossorigin`);
        for (const [, src] of html.matchAll(/<script type="module"[^>]*src="(\/assets\/[^"]+\.js)"/g)) links.push(`<${src}>; rel=modulepreload; crossorigin`);
        for (const [, href] of html.matchAll(/<link rel="modulepreload"[^>]*href="(\/assets\/[^"]+\.js)"/g)) links.push(`<${href}>; rel=modulepreload; crossorigin`);
        if (!links.some(l => l.includes('as=style')) || !links.some(l => l.includes('modulepreload'))) {
          throw new Error(`md2pdf: ${file.fileName} has no stylesheet or entry module to hint`);
        }
        hints.push({ path: '/' + file.fileName.replace(/index\.html$/, ''), links });
      }
      // public/_headers has been copied to the output by now.
      const target = resolve(outDir, '_headers');
      const rules = hints
        .sort((a, b) => a.path.localeCompare(b.path))
        .map(h => [h.path, '  Cache-Control: public, max-age=0, must-revalidate', ...h.links.map(l => `  Link: ${l}`)].join('\n'));
      appendFileSync(target, `\n# Generated by vite.config.ts (earlyHints): one rule per page.\n${rules.join('\n')}\n`);
      const count = readFileSync(target, 'utf8').split('\n').filter(line => /^\S/.test(line) && !line.startsWith('#')).length;
      if (count > 100) throw new Error(`md2pdf: _headers has ${count} rules; Cloudflare Pages allows 100`);
    },
  };
}

const WASM_PARTS_PLACEHOLDER = '__MD2PDF_WASM_PARTS__';
/** Cloudflare Pages rejects files larger than 25 MiB; stay well under it. */
const WASM_PART_BYTES = 20 * 1024 * 1024;

/**
 * Split the 27 MiB compiler into parts Cloudflare Pages accepts.
 *
 * Each part keeps the .wasm extension so it is served as application/wasm and
 * compressed at the edge like the whole file was. The loader fetches the
 * parts in parallel and joins them; see src/typst/wasm-loader.ts. The part
 * names carry a hash of the whole module, so they stay immutable.
 */
function splitEngine(): Plugin {
  return {
    name: 'md2pdf:split-engine',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const key = Object.keys(bundle).find(k => /typst_ts_web_compiler_bg-[\w-]+\.wasm$/.test(k));
      if (!key) return;
      const asset = bundle[key];
      if (asset.type !== 'asset' || typeof asset.source === 'string') return;
      const bytes = asset.source;
      const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 10);
      const count = Math.ceil(bytes.length / WASM_PART_BYTES);
      const size = Math.ceil(bytes.length / count);
      const urls: string[] = [];
      for (let i = 0; i < count; i++) {
        const fileName = `assets/typst-engine-${hash}.${i}.wasm`;
        this.emitFile({ type: 'asset', fileName, source: bytes.subarray(i * size, (i + 1) * size) });
        urls.push('/' + fileName);
      }
      delete bundle[key];
      let replaced = 0;
      for (const chunk of Object.values(bundle)) {
        if (chunk.type === 'chunk' && chunk.code.includes(WASM_PARTS_PLACEHOLDER)) {
          chunk.code = chunk.code.split(WASM_PARTS_PLACEHOLDER).join(urls.join('|'));
          replaced++;
        }
      }
      if (!replaced) this.error('split-engine: the loader placeholder was not found in any chunk');
    },
  };
}

/**
 * Give the service worker's asset cache a name unique to this build, so the
 * worker's activate step clears the previous build's fingerprinted files.
 * (The engine lives in its own cache, which survives this.)
 */
function swCacheName(): Plugin {
  return {
    name: 'md2pdf:sw-cache-name',
    apply: 'build',
    writeBundle(options) {
      const dir = options.dir ?? 'dist';
      const file = resolve(dir, 'sw.js');
      if (!existsSync(file)) return;
      const source = readFileSync(file, 'utf8');
      const build = createHash('sha256').update(String(Date.now())).digest('hex').slice(0, 10);
      if (!source.includes("const CACHE = 'md2pdf-v1';")) this.error('sw-cache-name: cache constant not found in sw.js');
      writeFileSync(file, source.replace("const CACHE = 'md2pdf-v1';", `const CACHE = 'md2pdf-${build}';`));
    },
  };
}

  export default defineConfig(({ mode }) => {
    const siteUrl = loadEnv(mode, process.cwd(), 'VITE_').VITE_SITE_URL ?? 'https://freemd2pdf.com';
    return {
    plugins: [avoidEval(), temmlMinified(), i18nPages(siteUrl), i18nRedirectTag(), earlyHints(), splitEngine(), swCacheName()],
    define: {
      __WASM_BYTES__: JSON.stringify(compilerWasmBytes),
      // Replaced with the part URLs by splitEngine() in production builds.
      __WASM_PARTS__: JSON.stringify(WASM_PARTS_PLACEHOLDER),
    },
    build: {
      target: 'es2022',
      // The Typst compiler alone is 27 MB; warning about it on every build is noise.
      chunkSizeWarningLimit: 4096,
      // No manualChunks: mermaid is imported dynamically and gets its own
      // chunk anyway. Pinning it to a manual chunk makes Rollup pull the
      // dependencies it shares with markdown-it (and Vite's preload helper)
      // into that chunk, which then loads with the first page.
    },
    optimizeDeps: {
      exclude: ['@myriaddreamin/typst-ts-web-compiler'],
    },
    worker: { format: 'es' },
  };
});
