// SUPPORTED LANGUAGES --------------------------------------------------------------------

export enum SupportedLanguage {
  default = 'en',
  fr = 'fr',
  en = 'en'
}

export function isSupportedLanguage(lang: string): boolean {
  return Object.values(SupportedLanguage).includes(lang as SupportedLanguage);
}

export function asSupportedLanguage(lang: string): SupportedLanguage {
  return (isSupportedLanguage(lang)) ? lang as SupportedLanguage : SupportedLanguage.default;
}

export interface Translation {
  key: string;
  values: Record<string, unknown>;
}
