# Lộ trình Việt hóa InkOS — từng bước

Tài liệu này mô tả toàn bộ công việc Việt hóa InkOS, từ giao diện tới các tool sinh nội dung. Mỗi bước có: file cần sửa, cách sửa, tiêu chí nghiệm thu.

Xem thêm [fork-vi-support-guide.md](fork-vi-support-guide.md) cho quy trình fork và sync upstream.

Cập nhật lần cuối: 2026-10-06. Nhánh làm việc: `feature/vi-support`.

---

## Bước 0 — Hiểu 6 lớp i18n trong codebase

InkOS không có 1 hệ i18n duy nhất. Có 6 cơ chế độc lập, phải xử lý riêng từng cái. Đây là lý do không thể "dịch 1 file là xong".

| # | Cơ chế | File gốc | Phạm vi | Trạng thái |
|---|--------|----------|---------|------------|
| A | Catalog key → `{zh, en, vi}` | [packages/studio/src/hooks/use-i18n.ts](../packages/studio/src/hooks/use-i18n.ts) | Chrome Studio: nav, dashboard, nút, nhãn | ✅ Xong |
| B | `tr(zh, en, vi?)` inline | [packages/studio/src/lib/app-language.ts](../packages/studio/src/lib/app-language.ts) | 312 call site rải khắp component/store Studio | ⚙️ Hạ tầng xong, nội dung chưa |
| C | `pick(lang, zh, en, vi?)` backend | [packages/studio/src/api/server.ts](../packages/studio/src/api/server.ts) | 46 call site: thông báo lỗi, confirmation card từ API | ⚙️ Hạ tầng xong, nội dung chưa |
| D | Object `TuiCopy` | [packages/cli/src/tui/i18n.ts](../packages/cli/src/tui/i18n.ts), [tui/setup.ts](../packages/cli/src/tui/setup.ts) | TUI terminal + wizard cấu hình lần đầu | ✅ Xong |
| E | `CliLanguage` + ternary rải rác | [packages/cli/src/localization.ts](../packages/cli/src/localization.ts), [progress-text.ts](../packages/cli/src/progress-text.ts), [tui/agent-input.ts](../packages/cli/src/tui/agent-input.ts), [tui/slash-autocomplete.ts](../packages/cli/src/tui/slash-autocomplete.ts), [tui/effects.ts](../packages/cli/src/tui/effects.ts) | 39 site: output lệnh CLI, tiến trình, slash command | ❌ Chưa |
| F | Prompt nội dung `"zh" \| "en"` | 36 file trong `packages/core/src` | 118 site: prompt gửi LLM để sinh truyện | ❌ Chưa |

Nguyên tắc xuyên suốt: **mọi helper nhận `vi` là tham số optional, thiếu bản dịch thì fallback về `en`.** Nhờ vậy dịch dần được, không phải dịch hết mới chạy được, và không bao giờ crash vì thiếu key.

### Hai khái niệm ngôn ngữ phải tách rõ

Đây là điểm dễ sai nhất:

- **UI language** (`project.language` trong `inkos.json`): ngôn ngữ giao diện. Đã nhận `"vi"`.
- **Content language** (`book.language` trong từng sách): ngôn ngữ LLM dùng để viết truyện. Vẫn chỉ `"zh" | "en"`.

Hàm [`toContentLanguage()`](../packages/studio/src/api/server.ts) trong `server.ts` là biên giới giữa hai khái niệm: UI = `vi` thì content fallback `en`. Khi nào làm xong Bước 7 mới bỏ fallback này.

---

## Bước 1 ✅ — Catalog chrome Studio

**File:** [packages/studio/src/hooks/use-i18n.ts](../packages/studio/src/hooks/use-i18n.ts)

Thêm `vi` vào type `Lang` và vào cả 234 entry của object `strings`. Hàm `resolveLang()` map `project.language` → `Lang`.

**Nghiệm thu:** mở Studio, bật VI, toàn bộ sidebar / dashboard / breadcrumb / nút hiện tiếng Việt.

---

## Bước 2 ✅ — Cho phép `vi` đi hết đường từ UI xuống file cấu hình

**File:**
- [packages/core/src/models/project.ts](../packages/core/src/models/project.ts) — `z.enum(["zh", "en", "vi"])`
- [packages/studio/src/api/server.ts](../packages/studio/src/api/server.ts) — `StudioLanguage`, `normalizeStudioLanguage()`, whitelist ở `PUT /api/v1/project` và `POST /api/v1/project/language`
- [packages/studio/src/App.tsx](../packages/studio/src/App.tsx) — nút toggle `VI` trên header
- [packages/studio/src/pages/LanguageSelector.tsx](../packages/studio/src/pages/LanguageSelector.tsx) — thẻ chọn "Sáng Tác Tiếng Việt" ở màn onboarding

**Cạm bẫy đã gặp:** mở rộng `StudioLanguage` làm vỡ type ở 8 chỗ truyền thẳng `lang` vào tool sinh nội dung (core chỉ nhận `"zh"|"en"`). Giải pháp: hàm `toContentLanguage()` ép ở biên. Nếu bạn mở rộng thêm type nào khác, hãy để compiler chỉ chỗ — đừng cast bừa `as`.

**Nghiệm thu:** bấm VI → reload → `inkos.json` có `"language": "vi"`, giao diện vẫn tiếng Việt sau khi khởi động lại.

---

## Bước 3 ✅ — CLI TUI + wizard cấu hình

**File:** [packages/cli/src/tui/i18n.ts](../packages/cli/src/tui/i18n.ts), [packages/cli/src/tui/setup.ts](../packages/cli/src/tui/setup.ts)

Thêm `"vi"` vào `TuiLocale`, thêm object `VI: TuiCopy` đầy đủ, nhánh `vi` trong `getTuiCopy()` / `normalizeLocale()` / `buildInteractiveSetupCopy()` / `buildAutoInitMessages()`.

**Nghiệm thu:**
```bash
INKOS_TUI_LOCALE=vi inkos tui
```
Toàn bộ nhãn, placeholder, trạng thái, `/help` hiện tiếng Việt.

---

## Bước 4 — 312 call site `tr()` trong Studio

**Hạ tầng:** đã xong — `tr(zh, en, vi?)` ở [app-language.ts](../packages/studio/src/lib/app-language.ts).

**Việc còn lại:** thêm tham số thứ 3 cho từng call site. Làm theo nhóm file, theo thứ tự người dùng gặp nhiều nhất:

| Thứ tự | File | Số call site |
|--------|------|--------------|
| 1 | [components/Sidebar.tsx](../packages/studio/src/components/Sidebar.tsx) | 22 |
| 2 | [components/chat/ToolExecutionSteps.tsx](../packages/studio/src/components/chat/ToolExecutionSteps.tsx) | 58 |
| 3 | [pages/ServiceListPage.tsx](../packages/studio/src/pages/ServiceListPage.tsx) | 22 |
| 4 | [pages/ServiceDetailPage.tsx](../packages/studio/src/pages/ServiceDetailPage.tsx) | 32 |
| 5 | [components/ServiceConfigSourceCard.tsx](../packages/studio/src/components/ServiceConfigSourceCard.tsx) | 18 |
| 6 | [pages/ImportManager.tsx](../packages/studio/src/pages/ImportManager.tsx) | 18 |
| 7 | [pages/WorkInspector.tsx](../packages/studio/src/pages/WorkInspector.tsx) | 15 |
| 8 | [pages/FilmWizard.tsx](../packages/studio/src/pages/FilmWizard.tsx) | 14 |
| 9 | [pages/CreativeMethodsEditor.tsx](../packages/studio/src/pages/CreativeMethodsEditor.tsx) | 12 |
| 10 | [store/chat/parts-builder.ts](../packages/studio/src/store/chat/parts-builder.ts) | 10 |
| 11 | Phần còn lại (`StoryGraphTree`, `FlowView`, `stream-events`, `action`, `AnalysisPanel`, ...) | ~91 |

Liệt kê lại bất cứ lúc nào bằng:
```bash
grep -rc 'tr(' packages/studio/src --include=*.tsx --include=*.ts | grep -v ':0' | sort -t: -k2 -rn
```

**Cách sửa:** `tr("中文", "English")` → `tr("中文", "English", "Tiếng Việt")`. Không đổi logic, không đổi thứ tự tham số, không gom thành catalog (sẽ thành diff khổng lồ, conflict mỗi lần rebase upstream).

**Nghiệm thu từng nhóm:** mở đúng trang đó trong Studio ở chế độ VI, không còn chữ Trung/Anh nào ngoài tên riêng (API, model id, tên dịch vụ).

---

## Bước 5 — 46 call site `pick()` ở backend

**File:** [packages/studio/src/api/server.ts](../packages/studio/src/api/server.ts)

**Hạ tầng:** đã xong — `pick(lang, zh, en, vi?)`.

Đây là text API trả về cho UI: thông báo lỗi, lý do từ chối, nội dung confirmation card. Người dùng gặp khi có sự cố — nên quan trọng hơn vẻ ngoài.

Liệt kê:
```bash
grep -n 'pick(lang' packages/studio/src/api/server.ts
```

**Ưu tiên:** các message gắn với luồng tạo sách / viết chương / cấu hình model trước; message của film/storyboard/play sau.

**Nghiệm thu:** cố tình gây lỗi (xóa API key rồi bấm viết chương) → thông báo lỗi hiện tiếng Việt.

---

## Bước 6 — Output CLI (lệnh thường, không phải TUI)

**File:**
- [packages/cli/src/localization.ts](../packages/cli/src/localization.ts) — `CliLanguage = "zh" | "en"` → thêm `"vi"`, sửa hàm chọn message và `resolveCliLanguage()`
- [packages/cli/src/progress-text.ts](../packages/cli/src/progress-text.ts) — text tiến trình import/viết
- [packages/cli/src/tui/agent-input.ts](../packages/cli/src/tui/agent-input.ts) — ~20 site: text slash command, thông báo xác nhận
- [packages/cli/src/tui/slash-autocomplete.ts](../packages/cli/src/tui/slash-autocomplete.ts) — mô tả slash command
- [packages/cli/src/tui/effects.ts](../packages/cli/src/tui/effects.ts) — nhãn hiệu ứng
- [packages/cli/src/project-bootstrap.ts](../packages/cli/src/project-bootstrap.ts), [commands/init.ts](../packages/cli/src/commands/init.ts) — `--lang` hiện chỉ nhận `zh|en`

**Lưu ý về `--lang`:** cờ này đang trộn 2 vai: ngôn ngữ UI và ngôn ngữ viết. Khi làm bước này nên tách thành `--lang` (UI) và `--content-lang` (nội dung), hoặc giữ `--lang` cho nội dung và thêm `INKOS_UI_LOCALE` cho UI. Quyết định trước khi code, vì đổi sau là breaking change với người dùng.

**Nghiệm thu:** `INKOS_LOCALE=vi inkos status`, `inkos doctor`, `inkos book list` — output tiếng Việt.

---

## Bước 7 — Tool sinh nội dung (phần lớn nhất)

Đây là phần làm LLM **viết truyện bằng tiếng Việt**, không chỉ hiển thị tiếng Việt. 118 site trong 36 file.

### 7a. Nền tảng dùng chung

Tạo `packages/core/src/models/language.ts`:

```ts
import { z } from "zod";

export const LANGUAGES = ["zh", "en", "vi"] as const;
export type LanguageCode = (typeof LANGUAGES)[number];
export const LanguageCodeSchema = z.enum(LANGUAGES);

/** Thiếu bản dịch vi thì dùng en — không bao giờ trả undefined. */
export function pickByLanguage<T>(lang: LanguageCode, variants: { zh: T; en: T; vi?: T }): T {
  return variants[lang] ?? variants.en;
}
```

Rồi đổi 13 chỗ `z.enum(["zh", "en"])` sang dùng `LanguageCodeSchema`:

```
packages/core/src/models/book.ts
packages/core/src/models/runtime-state.ts
packages/core/src/play/play-store.ts
packages/core/src/forecast/schema.ts
packages/core/src/interaction/action-envelope.ts        (7 chỗ)
packages/core/src/interaction/session-transcript-schema.ts
packages/core/src/pipeline/short-production-state.ts
```
(`models/project.ts` đã làm ở Bước 2.)

Đây là thay đổi máy móc, rủi ro thấp. Chạy `pnpm --filter @actalk/inkos-core build` sau mỗi file.

### 7b. Đường chính: tạo sách → viết 1 chương

Chỉ sửa đúng các file trong luồng này trước. Thứ tự:

| Thứ tự | File | Số site | Vai trò |
|--------|------|---------|---------|
| 1 | [agents/architect.ts](../packages/core/src/agents/architect.ts) | 4 | Sinh nền tảng: story frame, nhân vật, rules |
| 2 | [agents/planner-prompts.ts](../packages/core/src/agents/planner-prompts.ts) + [planner.ts](../packages/core/src/agents/planner.ts) | 3 | Lập ý đồ chương |
| 3 | [agents/composer.ts](../packages/core/src/agents/composer.ts) | 12 | Ráp context cho chương |
| 4 | [agents/writer-prompts.ts](../packages/core/src/agents/writer-prompts.ts) + [writer.ts](../packages/core/src/agents/writer.ts) | 16 | Viết chính văn |
| 5 | [agents/settler-prompts.ts](../packages/core/src/agents/settler-prompts.ts) | 2 | Chốt state sau chương |
| 6 | [agents/continuity.ts](../packages/core/src/agents/continuity.ts) + [reviser.ts](../packages/core/src/agents/reviser.ts) | 3 | Soát mạch + sửa chương |
| 7 | [utils/length-metrics.ts](../packages/core/src/utils/length-metrics.ts) | 1 | Đếm độ dài — **xem cảnh báo bên dưới** |

**Cách sửa mỗi file:** đổi type `"zh" | "en"` → `LanguageCode`, đổi ternary 2 nhánh → `pickByLanguage(language, { zh, en, vi })`, viết bản chỉ dẫn tiếng Việt.

**Chất lượng prompt quan trọng hơn bản dịch.** Prompt `zh` có thuật ngữ nghề viết web novel Trung (伏笔 = cài cắm, 爽点 = điểm thỏa mãn, 金手指 = lợi thế nhân vật chính). Đừng dịch máy móc. Viết lại bằng thuật ngữ truyện Việt / truyện mạng Việt mà người viết thật dùng. Prompt là bản thiết kế, không phải chuỗi UI.

**⚠️ Cảnh báo đo độ dài:** hệ thống đếm `zh_chars` cho tiếng Trung, `en_words` cho tiếng Anh. Tiếng Việt dùng khoảng trắng nên phải đếm theo **từ** như `en`, nhưng mật độ thông tin mỗi từ khác tiếng Anh — 1 chương 3000 từ tiếng Việt không tương đương 3000 từ tiếng Anh. Phải để lại núm điều chỉnh (`--words`) và đo bằng bản thảo thật, đừng tin con số mặc định copy từ `en`.

**Nghiệm thu 7b (milestone bắt buộc, không bỏ qua):**
```bash
inkos book create --title "Thử Nghiệm" --genre other --lang vi
inkos write next
```
Đọc chương sinh ra. Phải là văn tiếng Việt đọc được, không lẫn tiếng Trung, không bị cắt giữa câu. Chưa đạt thì **không đi tiếp 7c** — sửa prompt trước.

### 7c. Phần ngoại vi (làm sau, không chặn release)

Nhờ `pickByLanguage` fallback `en`, các phần này chạy được ngay khi chưa dịch:

```
packages/core/src/agents/script-storyboard.ts          13 site
packages/core/src/agent/agent-tools.ts                 12
packages/core/src/play/play-runner.ts                   6
packages/core/src/play/play-agents.ts                   6
packages/core/src/pipeline/script-storyboard-runner.ts   5
packages/core/src/state/*.ts                           11
packages/core/src/forecast/*.ts                         3
packages/core/src/utils/narrative-control.ts            3
... (xem danh sách đầy đủ bằng lệnh grep bên dưới)
```

```bash
grep -roc '"zh" | "en"' packages/core/src --include=*.ts | grep -v ':0' | sort -t: -k2 -rn
```

---

## Bước 8 — Mở `book.language = "vi"` đi hết đường

Sau khi 7b đạt, mới mở cửa cho người dùng chọn tiếng Việt làm ngôn ngữ **viết**:

- [packages/studio/src/api/server.ts](../packages/studio/src/api/server.ts) — bỏ `toContentLanguage()`, mở whitelist `body.language === "en" || body.language === "zh"` ở route tạo sách (2 chỗ, dòng ~2939 và ~2960)
- [packages/studio/src/api/book-create.ts](../packages/studio/src/api/book-create.ts) — `language: "zh" | "en"` → `LanguageCode`
- [packages/studio/src/pages/BookCreate.tsx](../packages/studio/src/pages/BookCreate.tsx) — thêm `vi` vào `PAGE_COPY`, `defaultChapterWordsForLanguage()`, `platformOptionsForLanguage()`. Thêm `PLATFORMS_VI` (Wattpad, Truyenfull, Metruyenchu...) cạnh `PLATFORMS_ZH` / `PLATFORMS_EN`
- [packages/studio/src/pages/BookDetail.tsx](../packages/studio/src/pages/BookDetail.tsx), [Dashboard.tsx](../packages/studio/src/pages/Dashboard.tsx) — các check `book.language === "en"`
- [packages/cli/src/commands/book.ts](../packages/cli/src/commands/book.ts), [init.ts](../packages/cli/src/commands/init.ts), [short-fiction.ts](../packages/cli/src/commands/short-fiction.ts) — `--lang` nhận `vi`

Không cần làm gì cho thể loại: `GenreSchema` là `z.string().min(1)`, thể loại truyện Việt gõ thẳng vào được. Phương pháp sáng tác thể loại Việt nên viết thành Skill (`SKILL.md`) thay vì hard-code.

**Nghiệm thu:** tạo sách bằng Studio với ngôn ngữ Việt, viết 3 chương liên tiếp, state/truth file sinh ra đúng, `inkos export --format epub` ra file đọc được.

---

## Bước 9 — Test và chống hồi quy

- Nhân bản [packages/core/src/\_\_tests\_\_/play-language.flow.test.ts](../packages/core/src/__tests__/play-language.flow.test.ts) cho `vi`
- Thêm test parity: mọi key trong catalog `use-i18n.ts` phải có đủ 3 ngôn ngữ (chống thiếu key khi merge upstream thêm key mới)
- Thêm test `tr()` / `pick()` / `pickByLanguage()` fallback: `vi` thiếu → trả `en`, không trả `undefined`
- Test `resolveTuiLocale` với `INKOS_LOCALE=vi`, `LANG=vi_VN.UTF-8`

Chạy đủ bộ trước khi push:
```bash
pnpm -r build
pnpm -r test
```

---

## Bước 10 — Giữ đồng bộ với upstream

Upstream thêm key UI và sửa prompt liên tục. Sau mỗi lần rebase:

```bash
# Tìm key upstream mới thêm mà chưa có bản vi
grep -n 'zh:.*en:' packages/studio/src/hooks/use-i18n.ts | grep -v 'vi:'

# Tìm call site tr()/pick() mới chưa có tham số vi
grep -rn 'tr("' packages/studio/src --include=*.tsx | grep -v '", *"[^"]*", *"'
```

Hai lệnh này nên đưa vào CI của fork để không âm thầm tụt lại sau upstream. Chi tiết quy trình rebase: [fork-vi-support-guide.md](fork-vi-support-guide.md).

---

## Phần KHÔNG cần Việt hóa — đã dùng được ngay

**Dịch tài liệu/truyện sang tiếng Việt** đã hoạt động từ đầu, không cần sửa code: `translate init --source/--target` nhận string tự do (`z.string().min(1)`), không phải enum.

```bash
inkos translate init --from truyen.epub --source zh --target vi
inkos translate run <project-id>
inkos translate export <project-id> --format epub
```

Nghĩa là nếu nhu cầu chính của bạn là **đọc truyện Trung/Anh bằng tiếng Việt** chứ không phải **sáng tác bằng tiếng Việt**, thì dùng được ngay hôm nay — Bước 7 chỉ cần cho sáng tác gốc.

---

## Tổng kết khối lượng

| Bước | Phạm vi | Trạng thái |
|------|---------|------------|
| 1-3 | Chrome Studio + TUI + đường đi của `project.language` | ✅ Xong |
| 4 | 312 call site `tr()` | ❌ |
| 5 | 46 call site `pick()` | ❌ |
| 6 | 39 site output CLI | ❌ |
| 7 | 118 site prompt nội dung trong 36 file core | ❌ |
| 8 | Mở `book.language = vi` toàn hệ | ❌ |
| 9-10 | Test + CI chống tụt hậu | ❌ |

Giao diện đã dùng được. Phần nặng còn lại là Bước 7 — và đó là phần cần người biết nghề viết, không chỉ biết code.
