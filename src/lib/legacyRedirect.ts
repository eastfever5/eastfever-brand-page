import { absoluteUrl } from './site';

type LegacyRedirectOptions = {
  title?: string;
  fallbackPath: string;
  canonicalPath?: string;
  script?: string;
  linkLabel?: string;
};

export function legacyRedirectHtml({
  title = 'EastFever Redirect',
  fallbackPath,
  canonicalPath = fallbackPath,
  script,
  linkLabel = 'Continue to EastFever'
}: LegacyRedirectOptions) {
  const redirectScript = script || `window.location.replace(${JSON.stringify(fallbackPath)} + window.location.hash);`;

  return `<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex, follow">
    <link rel="canonical" href="${escapeHtml(absoluteUrl(canonicalPath))}">
    <script>${redirectScript}</script>
    <meta http-equiv="refresh" content="0; url=${escapeHtml(fallbackPath)}">
    <title>${escapeHtml(title)}</title>
  </head>
  <body>
    <p><a href="${escapeHtml(fallbackPath)}">${escapeHtml(linkLabel)}</a></p>
  </body>
</html>`;
}

export function htmlResponse(html: string) {
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8'
    }
  });
}

function escapeHtml(value: string) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char] || char);
}
