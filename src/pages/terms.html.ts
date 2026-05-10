import { htmlResponse, legacyRedirectHtml } from '../lib/legacyRedirect';

export const prerender = true;

const script = `(() => {
  const params = new URLSearchParams(window.location.search);
  const lang = params.get('lang');
  const targetLang = ['ko', 'en', 'ja'].includes(lang) ? lang : 'ko';
  window.location.replace('/' + targetLang + '/terms/' + window.location.hash);
})();`;

export function GET() {
  return htmlResponse(legacyRedirectHtml({
    title: 'EastFever Terms Redirect',
    fallbackPath: '/ko/terms/',
    canonicalPath: '/ko/terms/',
    script,
    linkLabel: 'Continue to EastFever Terms'
  }));
}
