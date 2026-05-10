import { htmlResponse, legacyRedirectHtml } from '../lib/legacyRedirect';

export const prerender = true;

const script = `(() => {
  const params = new URLSearchParams(window.location.search);
  const lang = params.get('lang');
  const targetLang = ['ko', 'en', 'ja'].includes(lang) ? lang : 'ko';
  window.location.replace('/' + targetLang + '/privacy/' + window.location.hash);
})();`;

export function GET() {
  return htmlResponse(legacyRedirectHtml({
    title: 'EastFever Privacy Redirect',
    fallbackPath: '/ko/privacy/',
    canonicalPath: '/ko/privacy/',
    script,
    linkLabel: 'Continue to EastFever Privacy Policy'
  }));
}
