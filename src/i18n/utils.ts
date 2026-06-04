import { ui, defaultLang, type Lang, type UIKey } from './ui';

export function getLangFromUrl(url: URL): Lang {
  const segment = url.pathname.split('/')[1];
  if (segment in ui) return segment as Lang;
  return defaultLang;
}

export function useTranslations(lang: Lang) {
  return function t(key: UIKey): string {
    return ui[lang][key] ?? ui[defaultLang][key];
  };
}

/**
 * Renvoie le chemin équivalent dans la langue cible.
 * FR est sans préfixe ("/atlas"), EN est préfixé ("/en/atlas").
 */
export function localizedPath(pathname: string, target: Lang): string {
  // Retire un éventuel préfixe de langue existant
  let path = pathname.replace(/^\/(fr|en)(?=\/|$)/, '');
  if (path === '') path = '/';

  if (target === defaultLang) {
    return path;
  }
  // Cible non par défaut : préfixe avec la langue
  if (path === '/') return `/${target}/`;
  return `/${target}${path}`;
}
