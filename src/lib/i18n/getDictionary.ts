import type { Locale } from "./locales";

export type Dictionary = Awaited<ReturnType<typeof getDictionary>>;

export async function getDictionary(locale: Locale) {
  switch (locale) {
    case "ar": {
      const mod = await import("./dictionaries/ar");
      return mod.ar;
    }
    case "en":
    default: {
      const mod = await import("./dictionaries/en");
      return mod.en;
    }
  }
}
