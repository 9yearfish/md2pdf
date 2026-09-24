/**
 * Tell IndexNow search engines (Bing, Yandex, Naver, Seznam, …) about every
 * URL in the live sitemap. Run after a deploy that adds or changes pages:
 *
 *   npm run indexnow
 *
 * The key is the public/<key>.txt file served at the site root; IndexNow
 * fetches it to confirm the site is ours. The key is public by design.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const site = (readFileSync(join(ROOT, '.env'), 'utf8').match(/^VITE_SITE_URL=(.+)$/m)?.[1] ?? '').trim();
const host = new URL(site).host;
const keyFile = readdirSync(join(ROOT, 'public')).find(f => /^[0-9a-f]{32}\.txt$/.test(f));
if (!keyFile) throw new Error('no IndexNow key file (public/<32 hex>.txt)');
const key = keyFile.replace('.txt', '');

const sitemap = await (await fetch(`${site}/sitemap.xml`)).text();
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
const live = await fetch(`${site}/${keyFile}`);
if (!live.ok || (await live.text()).trim() !== key) throw new Error(`key file not live at ${site}/${keyFile}; deploy first`);

const response = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host, key, keyLocation: `${site}/${keyFile}`, urlList }),
});
console.log(`IndexNow: ${urlList.length} URLs → HTTP ${response.status} ${response.statusText}`);
if (response.status >= 400) console.log(await response.text());
