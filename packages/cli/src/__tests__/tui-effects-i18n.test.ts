import { describe, expect, it } from "vitest";
import { buildStyledHelpSections, intentToBadge } from "../tui/effects.js";

// Han in vi output is the whole bug class of this file: every site used to be
// `locale === "en" ? english : chinese`, so vi fell through to Chinese. Assert on
// the script rather than on exact wording, which will keep changing.
const HAN = /[\u3400-\u4dbf\u4e00-\u9fff]/;

describe("tui effects i18n", () => {
  it("renders the help sections in Vietnamese with no Han", () => {
    const sections = buildStyledHelpSections("vi");
    expect(sections.length).toBeGreaterThan(0);
    expect(HAN.test(JSON.stringify(sections))).toBe(false);
  });

  it("renders intent badges in Vietnamese with no Han", () => {
    for (const intent of ["write_next", "revise_chapter", "rewrite_chapter", "update_focus", "explain_status"]) {
      expect(HAN.test(intentToBadge(intent, "vi"))).toBe(false);
    }
  });

  it("keeps zh-CN and en output distinct from each other", () => {
    expect(HAN.test(JSON.stringify(buildStyledHelpSections("zh-CN")))).toBe(true);
    expect(HAN.test(JSON.stringify(buildStyledHelpSections("en")))).toBe(false);
  });
});
