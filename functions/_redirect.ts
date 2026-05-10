const supportedLangs = ['ko', 'en', 'ja'] as const;
type Lang = (typeof supportedLangs)[number];

export function permanentRedirect(request: Request, pathname: string) {
  return Response.redirect(new URL(pathname, request.url).toString(), 301);
}

export function languagePath(request: Request, page?: 'privacy' | 'terms') {
  const url = new URL(request.url);
  const lang = normalizeLang(url.searchParams.get('lang'));
  return page ? `/${lang}/${page}/` : `/${lang}/`;
}

function normalizeLang(value: string | null): Lang {
  return supportedLangs.includes(value as Lang) ? value as Lang : 'ko';
}
