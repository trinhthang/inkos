import { describe, it, expect, afterEach } from "vitest";
import { setAppLanguage, tr } from "../lib/app-language";
import { foundationFileLabel } from "../lib/truth-display";
import { localizeKnownRuntimeMessage } from "../lib/error-copy";
import {
  PAGE_COPY_FOR_TEST,
  buildBookCreatePayload,
  platformOptionsForLanguage,
} from "../pages/BookCreate";

const HAN = /[㐀-䶿一-鿿]/;

// Restore the default language so these cases cannot leak into other suites.
afterEach(() => {
  setAppLanguage("zh");
});

describe("tr() fallback under vi", () => {
  it("returns en when no vi translation was supplied, never undefined", () => {
    setAppLanguage("vi");
    expect(tr("中文", "English")).toBe("English");
    expect(tr("中文", "English", "Tiếng Việt")).toBe("Tiếng Việt");
  });
});

describe("helpers that bypass tr()", () => {
  it("labels foundation files in Vietnamese with no Han", () => {
    setAppLanguage("vi");
    for (const name of ["outline/story_frame.md", "outline/volume_map.md", "current_state.md", "pending_hooks.md", "book_rules.md"]) {
      const label = foundationFileLabel(name);
      expect(label).toBeDefined();
      expect(HAN.test(label!)).toBe(false);
    }
    expect(foundationFileLabel("not_a_foundation_file.md")).toBeUndefined();
  });

  // Runtime messages arrive in English and only zh has replacements, so vi must
  // pass them through rather than fall back to the Chinese table.
  it("leaves known runtime messages in English under vi", () => {
    const message = "Studio LLM API key not set. Open Studio services and save an API key for the selected service.";
    setAppLanguage("vi");
    expect(localizeKnownRuntimeMessage(message)).toBe(message);
    setAppLanguage("zh");
    expect(localizeKnownRuntimeMessage(message)).not.toBe(message);
  });
});

describe("BookCreate separates display language from writing language", () => {
  it("has Vietnamese page copy with no Han", () => {
    expect(HAN.test(JSON.stringify(PAGE_COPY_FOR_TEST.vi))).toBe(false);
    expect(PAGE_COPY_FOR_TEST.vi.creationSteps).toHaveLength(PAGE_COPY_FOR_TEST.en.creationSteps.length);
  });

  // Guards A7 against drifting into Bước 8: a vi project must still submit en as the
  // writing language, and get the English platform list.
  it("still writes English content for a Vietnamese project", () => {
    const form = {
      title: "Thử Nghiệm",
      genre: "other",
      platform: "royal-road",
      targetChapters: "10",
      chapterWordCount: "2000",
      brief: "Một thử nghiệm.",
    };
    expect(buildBookCreatePayload(form, "en").language).toBe("en");
    expect(platformOptionsForLanguage("en").map((o) => o.value)).toContain("royal-road");
  });
});
