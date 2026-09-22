import { statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { defineConfig, loadEnv, type Plugin } from 'vite';

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
   * Emits robots.txt and sitemap.xml with the real origin.
   *
   * They cannot live in public/ because Vite only substitutes environment
   * variables inside index.html, and a sitemap with a placeholder origin is
   * worse than no sitemap at all.
   */
  function seoFiles(siteUrl: string): Plugin {
    return {
      name: 'md2pdf:seo-files',
      apply: 'build',
      generateBundle() {
        const origin = siteUrl.replace(/\/$/, '');
        this.emitFile({
          type: 'asset',
          fileName: 'robots.txt',
          source: `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`,
        });
        this.emitFile({
          type: 'asset',
          fileName: 'sitemap.xml',
          source:
            '<?xml version="1.0" encoding="UTF-8"?>\n' +
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
            `  <url><loc>${origin}/</loc><changefreq>monthly</changefreq></url>\n` +
            '</urlset>\n',
        });
      },
    };
  }

  export default defineConfig(({ mode }) => {
    const siteUrl = loadEnv(mode, process.cwd(), 'VITE_').VITE_SITE_URL ?? 'https://md2pdf.pages.dev';
    return {
    plugins: [avoidEval(), seoFiles(siteUrl)],
    define: {
      __WASM_BYTES__: JSON.stringify(compilerWasmBytes),
    },
    build: {
      target: 'es2022',
      // The Typst compiler alone is 27 MB; warning about it on every build is noise.
      chunkSizeWarningLimit: 4096,
      rollupOptions: {
        output: {
          manualChunks: {
            // Keeping these apart means editing the app does not invalidate the
            // two largest downloads in a returning visitor's cache.
            mermaid: ['mermaid'],
            pdfjs: ['pdfjs-dist/legacy/build/pdf.mjs'],
          },
        },
      },
    },
    optimizeDeps: {
      exclude: ['@myriaddreamin/typst-ts-web-compiler'],
    },
    worker: { format: 'es' },
  };
});
