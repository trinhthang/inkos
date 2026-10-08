import { describe, expect, it } from "vitest";
import { resolveSurfaceLanguages } from "../api/server";

describe("resolveSurfaceLanguages", () => {
  // The old single value coerced "vi" to "zh", so a Vietnamese project got Chinese
  // chrome AND Chinese content. Both halves had to move.
  it("gives a vi project Vietnamese chrome and English content", () => {
    expect(resolveSurfaceLanguages({ configLanguage: "vi", bookLanguage: undefined, requestedLanguage: undefined }))
      .toEqual({ ui: "vi", content: "en" });
  });

  it("lets the book's own language own the content", () => {
    expect(resolveSurfaceLanguages({ configLanguage: "vi", bookLanguage: "zh", requestedLanguage: undefined }))
      .toEqual({ ui: "vi", content: "zh" });
    expect(resolveSurfaceLanguages({ configLanguage: "zh", bookLanguage: "en", requestedLanguage: undefined }))
      .toEqual({ ui: "zh", content: "en" });
  });

  // A client payload may ask for content in a given language; it must not be able to
  // change the chrome.
  it("never lets a requested content language move the chrome", () => {
    expect(resolveSurfaceLanguages({ configLanguage: "zh", bookLanguage: undefined, requestedLanguage: "en" }))
      .toEqual({ ui: "zh", content: "en" });
    expect(resolveSurfaceLanguages({ configLanguage: "vi", bookLanguage: undefined, requestedLanguage: "zh" }))
      .toEqual({ ui: "vi", content: "zh" });
  });

  it("falls back to zh for an absent or unknown project language", () => {
    expect(resolveSurfaceLanguages({ configLanguage: undefined, bookLanguage: undefined, requestedLanguage: undefined }))
      .toEqual({ ui: "zh", content: "zh" });
    expect(resolveSurfaceLanguages({ configLanguage: "klingon", bookLanguage: undefined, requestedLanguage: undefined }))
      .toEqual({ ui: "zh", content: "zh" });
  });
});
