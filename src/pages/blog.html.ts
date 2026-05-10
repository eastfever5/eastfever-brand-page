import { htmlResponse, legacyRedirectHtml } from '../lib/legacyRedirect';

export const prerender = true;

export function GET() {
  return htmlResponse(legacyRedirectHtml({
    title: 'EastFever Blog Redirect',
    fallbackPath: '/ko/blog/',
    linkLabel: 'Continue to EastFever Dev Story'
  }));
}
