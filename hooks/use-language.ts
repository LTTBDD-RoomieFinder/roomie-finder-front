import { useI18n } from "@/contexts/i18n-context";

/**
 * i18n: `t('namespace.key')`, optional `{{param}}` interpolation.
 */
export function useLanguage() {
  const { locale, setLocale, t, hydrated } = useI18n();
  return { locale, setLocale, t, hydrated };
}
