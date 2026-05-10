import { languagePath, permanentRedirect } from './_redirect';

export function onRequest({ request }: { request: Request }) {
  return permanentRedirect(request, languagePath(request, 'privacy'));
}
