import { describe, it, expect } from 'vitest';
import { getLangFromUrl, useTranslations, localizedPath } from '../../src/i18n/utils';

describe('i18n utils', () => {
  it('detects "en" from the URL path', () => {
    expect(getLangFromUrl(new URL('https://nocturne.pages.dev/en/atlas'))).toBe('en');
  });

  it('defaults to "fr" when there is no locale prefix', () => {
    expect(getLangFromUrl(new URL('https://nocturne.pages.dev/atlas'))).toBe('fr');
  });

  it('translates a key for the requested language', () => {
    const t = useTranslations('en');
    expect(t('nav.home')).toBe('The Journey');
  });

  it('builds the FR -> EN path preserving the current page', () => {
    expect(localizedPath('/atlas/la-lune', 'en')).toBe('/en/atlas/la-lune');
  });

  it('builds the EN -> FR path by stripping the prefix', () => {
    expect(localizedPath('/en/atlas/la-lune', 'fr')).toBe('/atlas/la-lune');
  });

  it('maps the FR home "/" to "/en/" and back', () => {
    expect(localizedPath('/', 'en')).toBe('/en/');
    expect(localizedPath('/en/', 'fr')).toBe('/');
  });
});
