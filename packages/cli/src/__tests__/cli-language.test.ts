import { describe, expect, it } from "vitest";
import {
  normalizeCliLanguageTag,
  pickCliText,
  resolveCliLanguage,
  toContentLanguage,
} from "../localization.js";

describe("resolveCliLanguage", () => {
  it("accepts vi from INKOS_LOCALE", () => {
    expect(resolveCliLanguage(undefined, { INKOS_LOCALE: "vi" })).toBe("vi");
  });

  // The environment is checked first so INKOS_LOCALE can localize the chrome of a
  // zh/en book: `preferred` at the call sites is the book's own language, not
  // something the user asked for on this command.
  it("lets the environment beat the preferred language", () => {
    expect(resolveCliLanguage("en", { INKOS_LOCALE: "vi" })).toBe("vi");
    expect(resolveCliLanguage("zh", { INKOS_LOCALE: "vi" })).toBe("vi");
  });

  it("falls back to the preferred language, then the locale env, then zh", () => {
    expect(resolveCliLanguage("en", {})).toBe("en");
    expect(resolveCliLanguage(undefined, { LANG: "vi_VN.UTF-8" })).toBe("vi");
    expect(resolveCliLanguage(undefined, {})).toBe("zh");
  });
});

describe("normalizeCliLanguageTag", () => {
  // `--lang` is explicit intent about the writing language, so the commands that
  // fill BookConfig.language normalize the flag themselves rather than letting
  // INKOS_LOCALE override it.
  it("parses a flag value without consulting the environment", () => {
    expect(normalizeCliLanguageTag("zh")).toBe("zh");
    expect(normalizeCliLanguageTag("en")).toBe("en");
    expect(normalizeCliLanguageTag("vi")).toBe("vi");
    expect(normalizeCliLanguageTag(undefined)).toBeUndefined();
    expect(normalizeCliLanguageTag("klingon")).toBeUndefined();
  });
});

describe("toContentLanguage", () => {
  // Guards the one-type model: display accepts vi, but BookConfig.language must
  // never receive it until the writing agents can produce Vietnamese prose.
  it("narrows vi to en and leaves zh/en alone", () => {
    expect(toContentLanguage("vi")).toBe("en");
    expect(toContentLanguage("en")).toBe("en");
    expect(toContentLanguage("zh")).toBe("zh");
  });
});

describe("pickCliText", () => {
  it("falls back to en when vi is missing, never undefined", () => {
    expect(pickCliText("vi", { zh: "中文", en: "English" })).toBe("English");
    expect(pickCliText("vi", { zh: "中文", en: "English", vi: "Tiếng Việt" })).toBe("Tiếng Việt");
    expect(pickCliText("zh", { zh: "中文", en: "English", vi: "Tiếng Việt" })).toBe("中文");
  });
});
