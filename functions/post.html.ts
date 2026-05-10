import { legacyPostMap } from './_legacyPostMap';
import { permanentRedirect } from './_redirect';

export function onRequest({ request }: { request: Request }) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id') || '';
  const normalizedId = id.replace(/^0+/, '') || id;
  const target = legacyPostMap[id] || legacyPostMap[normalizedId] || '/ko/blog/';

  return permanentRedirect(request, target);
}
