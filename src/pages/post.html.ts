import { htmlResponse, legacyRedirectHtml } from '../lib/legacyRedirect';
import { getLegacyPostMap } from '../lib/site';

export const prerender = true;

const legacyPostMap = await getLegacyPostMap();
const script = `(() => {
  const postMap = ${JSON.stringify(legacyPostMap)};
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id') || '';
  const normalizedId = id.replace(/^0+/, '') || id;
  const target = postMap[id] || postMap[normalizedId] || '/ko/blog/';
  window.location.replace(target + window.location.hash);
})();`;

export function GET() {
  return htmlResponse(legacyRedirectHtml({
    title: 'EastFever Post Redirect',
    fallbackPath: '/ko/blog/',
    canonicalPath: '/ko/blog/',
    script,
    linkLabel: 'Continue to EastFever Dev Story'
  }));
}
