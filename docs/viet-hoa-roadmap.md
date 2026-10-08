# Lộ trình Việt hóa InkOS — từng bước

Tài liệu này mô tả toàn bộ công việc Việt hóa InkOS, từ giao diện tới các tool sinh nội dung. Mỗi bước có: file cần sửa, cách sửa, tiêu chí nghiệm thu.

Xem thêm [fork-vi-support-guide.md](fork-vi-support-guide.md) cho quy trình fork và sync upstream.

Cập nhật lần cuối: 2026-10-08. Nhánh làm việc: `feature/vi-support`.

**Trạng thái hiện tại:** toàn bộ lớp hiển thị đã xong (Bước 1–6). Phần còn lại là Bước 7 — làm LLM **viết truyện bằng tiếng Việt** — và Bước 8 mở `book.language = "vi"`.

---

## Bước 0 — Hiểu 6 lớp i18n trong codebase

InkOS không có 1 hệ i18n duy nhất. Có 6 cơ chế độc lập, phải xử lý riêng từng cái. Đây là lý do không thể "dịch 1 file là xong".

| # | Cơ chế | File gốc | Phạm vi | Trạng thái |
|---|--------|----------|---------|------------|
| A | Catalog key → `{zh, en, vi}` | [packages/studio/src/hooks/use-i18n.ts](../packages/studio/src/hooks/use-i18n.ts) | Chrome Studio: nav, dashboard, nút, nhãn | ✅ Xong — 315/315 entry |
| B | `tr(zh, en, vi?)` inline | [packages/studio/src/lib/app-language.ts](../packages/studio/src/lib/app-language.ts) | 321 call site rải khắp component/store Studio | ✅ Xong |
| C | `pick(lang, zh, en, vi?)` backend | [packages/studio/src/api/server.ts](../packages/studio/src/api/server.ts) | 73 call site: thông báo lỗi, confirmation card từ API | ✅ Xong |
| D | Object `TuiCopy` | [packages/cli/src/tui/i18n.ts](../packages/cli/src/tui/i18n.ts), [tui/setup.ts](../packages/cli/src/tui/setup.ts) | TUI terminal + wizard cấu hình lần đầu | ✅ Xong |
| E | `CliLanguage` + `pickCliText` | [packages/cli/src/localization.ts](../packages/cli/src/localization.ts), [tui/effects.ts](../packages/cli/src/tui/effects.ts), [tui/agent-input.ts](../packages/cli/src/tui/agent-input.ts), [tui/slash-autocomplete.ts](../packages/cli/src/tui/slash-autocomplete.ts) | ~104 site: output lệnh CLI, tiến trình, slash command | ✅ Xong |
| F | Prompt nội dung `"zh" \| "en"` | 36 file trong `packages/core/src` | 118 site: prompt gửi LLM để sinh truyện | ❌ Chưa |

Nguyên tắc xuyên suốt: **mọi helper nhận `vi` là tham số optional, thiếu bản dịch thì fallback về `en`.** Nhờ vậy dịch dần được, không phải dịch hết mới chạy được, và không bao giờ crash vì thiếu key.

Ngoại lệ có chủ ý: bảng nhỏ và **đóng kín** thì để `vi` **bắt buộc**, cho compiler canh khi upstream thêm entry mới. Hiện áp dụng cho `NOTIFY_ACTION_LABELS`, `TOOL_LABELS` (server + parts-builder + runtime), `statusLabels`, `PAGE_COPY`, `INTENT_BADGES`, `HELP_SECTIONS`, `HELP_FOOTERS`, `THEME_LABELS`, `TIER_BADGE`, `ProgressStep`, `PHASE_LABELS`, `PHASE_SUBVIEWS`, 3 bảng `GROUP_*`.

### Hai khái niệm ngôn ngữ phải tách rõ

Đây là điểm dễ sai nhất, và là nguồn của hầu hết lỗi đã sửa:

- **UI language**: ngôn ngữ giao diện. `project.language` trong `inkos.json` (Studio + TUI), `CliLanguage` trong CLI. Đã nhận `"vi"`.
- **Content language**: ngôn ngữ LLM dùng để viết truyện. `book.language`. Vẫn chỉ `"zh" | "en"`.

Ba biên giới giữa hai khái niệm:

| Hàm | File | Vai |
|---|---|---|
| `toContentLanguage()` | [studio/src/api/server.ts](../packages/studio/src/api/server.ts) | UI `vi` → content `en` |
| `resolveSurfaceLanguages()` | [studio/src/api/server.ts](../packages/studio/src/api/server.ts) | tách 3 nguồn ngôn ngữ ở endpoint agent thành `{ui, content}` |
| `toContentLanguage()` | [cli/src/localization.ts](../packages/cli/src/localization.ts) | `CliLanguage` nhận `vi` cho hiển thị; thu hẹp về `zh\|en` trước khi rót vào `BookConfig.language` |

**Cạm bẫy đã gặp nhiều lần:** ternary thô `lang === "en" ? "en" : "zh"` ép `vi` về **tiếng Trung**, tệ hơn hẳn fallback về tiếng Anh, và khiến người dùng tưởng vi chưa được hỗ trợ. Đã xóa hết các chỗ như vậy ở lớp hiển thị. Nếu thấy lại pattern này, hãy cho nó đi qua helper ở bảng trên.

---

## Bước 1 ✅ — Catalog chrome Studio

**File:** [packages/studio/src/hooks/use-i18n.ts](../packages/studio/src/hooks/use-i18n.ts)

Thêm `vi` vào type `Lang` và vào cả 315 entry của object `strings`. Hàm `resolveLang()` map `project.language` → `Lang`.

File này **không cần test parity**: `strings` khai báo `as const` và `t()` làm `strings[key][lang]`, nên thiếu một `vi` là fail compile. `pnpm -r typecheck` chính là test parity.

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

Thêm `"vi"` vào `TuiLocale`, thêm object `VI: TuiCopy` đầy đủ 48 field, nhánh `vi` trong `getTuiCopy()` / `normalizeLocale()` / `buildInteractiveSetupCopy()` / `buildAutoInitMessages()`.

**Nghiệm thu:**
```bash
INKOS_TUI_LOCALE=vi inkos tui
```
Toàn bộ nhãn, placeholder, trạng thái, `/help` hiện tiếng Việt.

---

## Bước 4 ✅ — 321 call site `tr()` trong Studio

**Hạ tầng:** `tr(zh, en, vi?)` ở [app-language.ts](../packages/studio/src/lib/app-language.ts).

Đã thêm tham số thứ 3 cho toàn bộ call site, theo nhóm bề mặt giao diện (1 commit = 1 màn hình người review mở ra xem được):

| Nhóm | File | Site |
|------|------|------|
| 1 | [components/chat/ToolExecutionSteps.tsx](../packages/studio/src/components/chat/ToolExecutionSteps.tsx) | 64 |
| 2 | [components/Sidebar.tsx](../packages/studio/src/components/Sidebar.tsx) + `components/sidebar/*` | 32 |
| 3 | [pages/ServiceDetailPage.tsx](../packages/studio/src/pages/ServiceDetailPage.tsx) + [ServiceConfigSourceCard.tsx](../packages/studio/src/components/ServiceConfigSourceCard.tsx) | 54 |
| 4 | [pages/ServiceListPage.tsx](../packages/studio/src/pages/ServiceListPage.tsx) + [constants/service-groups.ts](../packages/studio/src/constants/service-groups.ts) | 26 |
| 5 | [pages/ImportManager.tsx](../packages/studio/src/pages/ImportManager.tsx) + [WorkInspector.tsx](../packages/studio/src/pages/WorkInspector.tsx) | 36 |
| 6 | [pages/FilmWizard.tsx](../packages/studio/src/pages/FilmWizard.tsx) + [film/AnalysisPanel.tsx](../packages/studio/src/components/film/AnalysisPanel.tsx) | 24 |
| 7 | [pages/StoryGraphTree.tsx](../packages/studio/src/pages/StoryGraphTree.tsx) + [FlowView.tsx](../packages/studio/src/pages/FlowView.tsx) | 26 |
| 8 | `App`, `CreativeMethodsEditor`, `Dashboard`, `chat/*`, `store/chat/*` | 56 |

**Cách sửa:** `tr("中文", "English")` → `tr("中文", "English", "Tiếng Việt")`. Không đổi logic, không đổi thứ tự tham số, **không gom thành catalog**. Lý do không gom: chuỗi UI ngắn thì thêm tham số thứ 3 là sửa đúng dòng đó; gom catalog cũng sửa đúng dòng đó (đổi thành key) nhưng thêm cả file mới và một lớp gián tiếp — không giảm conflict, chỉ tăng việc. Prompt core dài nhiều dòng thì ngược lại, nên Bước 7 mới cần `locale-vi.ts`.

**Chỗ phải sửa cả dữ liệu, không chỉ call site:** vài nơi gọi `tr(x.zh, x.en)` với `x` là entry của một bảng. Những bảng đó phải thêm `vi` vào chính kiểu dữ liệu — và đều để **bắt buộc** vì chúng đóng kín: `TIER_BADGE`, `ProgressStep`, `PHASE_LABELS`, `PHASE_SUBVIEWS`, 3 bảng `GROUP_*`, và 3 bảng dạng tuple `readonly [string, string, string]` (`statusLabels` ở tool.tsx, `TOOL_LABELS` ở parts-builder và runtime).

**Kiểm bất cứ lúc nào** — liệt kê call site còn thiếu `vi`:
```bash
# Đừng dùng grep: 17 call site dùng template literal và nhiều call site viết nhiều dòng,
# regex sẽ vừa bỏ sót vừa báo nhầm. Dùng bộ đếm tham số cân bằng ngoặc.
python docs/scripts/tr-scan.py $(grep -rl 'tr(' packages/studio/src --include=*.tsx --include=*.ts)
```
Hiện kết quả phải là 1 site duy nhất: một ca trong `__tests__/app-language-vi.test.ts` cố ý để 2 tham số nhằm khẳng định vi thiếu thì fallback về en.

**Nghiệm thu:** mở từng trang trong Studio ở chế độ VI, không còn chữ Trung/Anh nào ngoài tên riêng (API, model id, tên dịch vụ).

**Lưu ý:** `setAppLanguage` là biến module do `App.tsx` set sau khi `/project` resolve. Mọi `tr()` chạy ở lần paint đầu vẫn ra tiếng Trung — đó là chuyện bình thường, không phải hồi quy.

---

## Bước 5 ✅ — 73 call site `pick()` ở backend

**File:** [packages/studio/src/api/server.ts](../packages/studio/src/api/server.ts)

**Hạ tầng:** `pick(lang, zh, en, vi?)`.

Đây là text API trả về cho UI: thông báo lỗi, lý do từ chối, nội dung confirmation card. Người dùng gặp khi có sự cố — nên quan trọng hơn vẻ ngoài.

Hai site cần xử riêng, không theo khuôn chung:
- khối ngữ cảnh tác vụ chạy nền (mảng nhiều dòng rồi `.join("\n")`) — thêm hẳn một nhánh vi thứ ba.
- chuỗi `"Upstream response"` có escape `\n` trong chính nguồn.

Cùng với đó đã tách `surfaceLanguage` thành `resolveSurfaceLanguages()`. Nó nhận **ba** nguồn, không phải hai: `requestedLanguage` là yêu cầu **nội dung** từ client nên không bao giờ được chạm tới `pick()`, nếu không payload của client đổi được ngôn ngữ giao diện.

Liệt kê (cùng cách đếm như Bước 4, `grep -n 'pick(lang'` chỉ bắt được 46/73 vì phần còn lại viết nhiều dòng):
```bash
python docs/scripts/pick-scan.py packages/studio/src/api/server.ts
```

**Nghiệm thu:** cố tình gây lỗi → thông báo lỗi hiện tiếng Việt. Đã kiểm qua HTTP thật trên project `language: "vi"`:
```bash
curl -s -X POST localhost:4591/api/v1/services/does-not-exist/test -H 'Content-Type: application/json' -d '{}'
# {"ok":false,"error":"Dịch vụ lạ: does-not-exist"}
```
Cùng endpoint với `zh` cho `未知服务商`, với `en` cho `Unknown service` — không hồi quy.

---

## Bước 6 ✅ — Output CLI (lệnh thường, không phải TUI)

**Quyết định đã chốt về `--lang`:** cờ này giữ nghĩa **ngôn ngữ nội dung** (`zh|en`), không đổi, không thêm cờ mới. Ngôn ngữ **giao diện** đọc từ `INKOS_LOCALE`.

Không thêm `INKOS_UI_LOCALE`. Lý do: `INKOS_LOCALE` vốn **đã là** biến UI locale — `tui/i18n.ts` đọc nó và nhận `vi`, còn `localization.ts` cũng đọc nhưng lọc mất `vi`. Lỗi là một reader hẹp hơn reader kia, không phải biến bị quá tải. Thêm tên thứ ba làm một khái niệm có ba biến env. `INKOS_TUI_LOCALE` giữ nguyên vai override riêng cho TUI.

**Một type, một hàm resolve.** `CliLanguage = "zh" | "en" | "vi"` dùng cho mọi text hiển thị; `toContentLanguage()` thu hẹp về `zh|en` ở đúng biên rót vào `BookConfig.language`.

`resolveCliLanguage()` **ưu tiên env trước**, rồi tham số `preferred`, rồi `LANG`. Lý do: `preferred` ở các call site là ngôn ngữ của **sách** hoặc của **project**, không phải thứ người dùng yêu cầu ở lệnh này — nên `INKOS_LOCALE=vi` phải Việt hóa được chrome của cả sách zh/en.

**Ngoại lệ là `--lang`**: đó là ý định rõ ràng về ngôn ngữ **viết**, nên nó không được để env đè. Các lệnh rót vào `BookConfig.language` tự parse cờ bằng `normalizeCliLanguageTag(opts.lang)` trước, chỉ khi không có cờ mới gọi `resolveCliLanguage(config.language)`:

```ts
language: toContentLanguage(
  normalizeCliLanguageTag(opts.lang) ?? resolveCliLanguage(config.language),
),
```

**File đã sửa:**
- [localization.ts](../packages/cli/src/localization.ts) — `CliLanguage` nới thành `zh|en|vi`; thêm `toContentLanguage()` và `normalizeCliLanguageTag()` (export); export `localize` thành `pickCliText(language, {zh, en, vi?})`; điền vi cho 49 chuỗi message
- [tui/effects.ts](../packages/cli/src/tui/effects.ts) — 4 site ternary thành `Record<TuiLocale, …>`: `INTENT_BADGES`, `HELP_SECTIONS` (toàn bộ `/help`), `HELP_FOOTERS`, `THEME_LABELS`
- [tui/agent-input.ts](../packages/cli/src/tui/agent-input.ts) — 17 site; bỏ chỗ ép `vi → zh` ở `:57`; 3 signature đổi sang `CliLanguage`
- [tui/slash-autocomplete.ts](../packages/cli/src/tui/slash-autocomplete.ts) — variant nhận `vi?`; `buildSlashCommands` nhận `TuiLocale`
- [tui/dashboard.tsx](../packages/cli/src/tui/dashboard.tsx) — dựng danh sách lệnh từ `props.locale` thay vì hằng `SLASH_COMMANDS` đóng cứng zh (lỗi này có từ trước, ảnh hưởng cả người dùng en)
- [commands/*.ts](../packages/cli/src/commands) — `status` và `book list` trước đây hard-code tiếng Anh cho mọi ngôn ngữ, nay đủ zh/en/vi. `book update --lang` trước đây **không validate gì** — ghi thẳng string vào config sách rồi bị mọi reader ép lại; nay parse qua `normalizeCliLanguageTag` và báo lỗi nếu sai
- [project-bootstrap.ts](../packages/cli/src/project-bootstrap.ts), [commands/init.ts](../packages/cli/src/commands/init.ts), [commands/studio.ts](../packages/cli/src/commands/studio.ts), [tui/setup.ts](../packages/cli/src/tui/setup.ts) — cả 3 đường init trước đây ghi cứng `language: "zh"`, nay ghi locale đã resolve

**Đã xóa `progress-text.ts`:** không file src/test nào import, package chỉ có `bin` không có `exports`, và 5 ternary trong đó trùng nguyên văn `formatImportChaptersComplete`.

**Cạm bẫy đã gặp:** `--lang` có default `"zh"` của commander, nên cờ luôn có giá trị và không bao giờ rơi xuống `INKOS_LOCALE`. Đã bỏ default, giá trị mặc định ghi vào phần mô tả cờ.

**Nghiệm thu** (đã chạy thật):
```bash
INKOS_LOCALE=vi inkos init     # inkos.json có "language": "vi"
INKOS_LOCALE=vi inkos status   # "Dự án InkOS: …", "Số tác phẩm: 0"
INKOS_LOCALE=vi inkos book list
INKOS_LOCALE=vi inkos          # /help và nhãn spinner tiếng Việt
```
Không hồi quy: không set env → `zh`; `INKOS_LOCALE=en` → `en`; `--lang en` thắng `INKOS_LOCALE=vi` cho ngôn ngữ nội dung.

**Phần CLI còn tiếng Anh cho mọi ngôn ngữ** (không phải lỗi vi, có từ trước): các dòng "Next steps:", "Global LLM config detected" trong `init.ts`, và nhãn trong `status --chapters`. Dịch chúng là việc riêng, cần cả zh.

---

## Bước 7 — Tool sinh nội dung (phần lớn nhất, CHƯA LÀM)

Đây là phần làm LLM **viết truyện bằng tiếng Việt**, không chỉ hiển thị tiếng Việt. 118 site trong 36 file.

**Chiến lược nội dung đã chốt — khác Bước 4/5:** chuỗi vi để trong **file riêng** `locale-vi.ts`, không inline. File gốc chỉ đổi type + 1 lệnh gọi hàm. Lý do: prompt là khối nhiều dòng, upstream sửa chúng liên tục; inline sẽ conflict mỗi lần rebase. Xem mục 3 của [fork-vi-support-guide.md](fork-vi-support-guide.md).

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
packages/core/src/models/book.ts                        (dòng 32)
packages/core/src/models/runtime-state.ts               (dòng 3)
packages/core/src/play/play-store.ts                    (dòng 39)
packages/core/src/forecast/schema.ts                    (dòng 58)
packages/core/src/interaction/action-envelope.ts        (7 chỗ: 39, 59, 71, 147, 166, 180, 196)
packages/core/src/interaction/session-transcript-schema.ts (dòng 82)
packages/core/src/pipeline/short-production-state.ts    (dòng 28)
```
(`models/project.ts` đã làm ở Bước 2.)

Đây là thay đổi máy móc, rủi ro thấp. Chạy `pnpm --filter @actalk/inkos-core build` sau mỗi file.

**Lệch đang có, cần biết trước:** `ProjectConfig.language` là `zh|en|vi` còn `BookConfig.language` là `zh|en`, mà không ai báo lỗi. Handoff ở `core/src/state/manager.ts:395` truyền `config.language` vào `createWorkManifest`, typecheck qua được chỉ vì `WorkManifestSchema.language` là `z.string().min(1)` — nên `"vi"` sống sót vào work manifest nhưng không bao giờ tới được `BookConfig`.

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

**Hình dạng hiện tại của cả 7 file giống nhau:** tham số kiểu `"zh" | "en"`, và một ternary `=== "en"` với **chuỗi tiếng Trung ở nhánh else**. Không có bảng tra, không có registry. Nghĩa là mọi giá trị khác `"en"` đều lặng lẽ ra tiếng Trung.

Thứ gần nhất với một helper đã tồn tại là `heading(en, zh)` ở `settler-prompts.ts:30` — một arrow function cục bộ trong thân một hàm, 2 nhánh, không export.

**Cách sửa mỗi file:** đổi type `"zh" | "en"` → `LanguageCode`, đổi ternary 2 nhánh → `pickByLanguage(language, { zh, en, vi })` với 3 nhánh trỏ sang `locale-vi.ts`.

**Chất lượng prompt quan trọng hơn bản dịch.** Prompt `zh` có thuật ngữ nghề viết web novel Trung (伏笔 = cài cắm, 爽点 = điểm thỏa mãn, 金手指 = lợi thế nhân vật chính). Đừng dịch máy móc. Viết lại bằng thuật ngữ truyện Việt / truyện mạng Việt mà người viết thật dùng. Prompt là bản thiết kế, không phải chuỗi UI.

**⚠️ Cảnh báo đo độ dài:** hệ thống đếm `zh_chars` cho tiếng Trung, `en_words` cho tiếng Anh. Tiếng Việt dùng khoảng trắng nên phải đếm theo **từ** như `en` — Bước 6 đã route `vi → en_words`, đó là **chế độ đúng**. Nhưng tokenizer đằng sau nó thì sai:

```ts
// utils/length-metrics.ts — regex chỉ nhận ASCII
const words = normalized.match(/[A-Za-z0-9]+(?:'[A-Za-z0-9]+)?/g);
```

`tiếng` bị tách thành `ti` + `ng`, `Việt` thành `Vi` + `t`. Phải sửa regex (ví dụ `\p{L}` với cờ `u`) **trong bước này**, không sửa sớm hơn — đổi nó làm thay đổi số đếm của sách tiếng Anh đang có.

Và mật độ thông tin mỗi từ khác tiếng Anh: 1 chương 3000 từ tiếng Việt không tương đương 3000 từ tiếng Anh. Phải để lại núm điều chỉnh (`--words`) và đo bằng bản thảo thật, đừng tin con số mặc định copy từ `en`.

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
packages/core/src/agents/writer.ts                     11
packages/core/src/play/play-runner.ts                   6
packages/core/src/play/play-agents.ts                   6
packages/core/src/pipeline/script-storyboard-runner.ts   5
packages/core/src/state/*.ts                           11
packages/core/src/utils/narrative-control.ts            3
packages/core/src/forecast/*.ts                         3
... (xem danh sách đầy đủ bằng lệnh grep bên dưới)
```

```bash
grep -roc '"zh" | "en"' packages/core/src --include=*.ts | grep -v ':0' | sort -t: -k2 -rn
```

---

## Bước 8 — Mở `book.language = "vi"` đi hết đường

Sau khi 7b đạt, mới mở cửa cho người dùng chọn tiếng Việt làm ngôn ngữ **viết**:

- [packages/studio/src/api/server.ts](../packages/studio/src/api/server.ts) — bỏ `toContentLanguage()`, mở whitelist `body.language === "en" || body.language === "zh"` ở route tạo sách; `resolveSurfaceLanguages()` cho `content` nhận `vi`
- [packages/studio/src/api/book-create.ts](../packages/studio/src/api/book-create.ts) — `language: "zh" | "en"` → `LanguageCode` (2 chỗ: dòng 48 và 51)
- [packages/studio/src/pages/BookCreate.tsx](../packages/studio/src/pages/BookCreate.tsx) — `PAGE_COPY` đã có `vi`; còn lại: cho `contentLang` nhận `vi`, thêm `vi` vào `defaultChapterWordsForLanguage()` và `platformOptionsForLanguage()`, thêm `PLATFORMS_VI` (Wattpad, Truyenfull, Metruyenchu...) cạnh `PLATFORMS_ZH` / `PLATFORMS_EN`. Test `book-create-i18n.test.ts` hiện **khẳng định** project vi vẫn gửi `language: "en"` — phải cập nhật test đó cùng lúc, nó là chốt chống làm sớm
- [packages/studio/src/pages/BookDetail.tsx](../packages/studio/src/pages/BookDetail.tsx), [Dashboard.tsx](../packages/studio/src/pages/Dashboard.tsx) — các check `book.language === "en"`
- [packages/cli/src/localization.ts](../packages/cli/src/localization.ts) — `CliLanguage` đã nhận `vi` sẵn; việc cần làm là cho `toContentLanguage()` trả `vi` thay vì thu hẹp về `en`, rồi bỏ dần nó ở các biên. Test `cli-language.test.ts` hiện **khẳng định** `toContentLanguage("vi") === "en"` — chốt chống làm sớm, phải cập nhật cùng lúc
- [packages/cli/src/commands/book.ts](../packages/cli/src/commands/book.ts), [init.ts](../packages/cli/src/commands/init.ts), [short-fiction.ts](../packages/cli/src/commands/short-fiction.ts) — `--lang` nhận `vi`

**Vá luôn khi làm bước này:** `book.ts:148,161` (`book update`) **không validate gì** — `--lang vi` ghi thẳng `"vi"` vào config sách rồi bị mọi reader ép về `"zh"`. Đây là đường duy nhất hiện lưu được `vi` vào content, và lưu sai.

Không cần làm gì cho thể loại: `GenreSchema` là `z.string().min(1)`, thể loại truyện Việt gõ thẳng vào được. Phương pháp sáng tác thể loại Việt nên viết thành Skill (`SKILL.md`) thay vì hard-code.

**Nghiệm thu:** tạo sách bằng Studio với ngôn ngữ Việt, viết 3 chương liên tiếp, state/truth file sinh ra đúng, `inkos export --format epub` ra file đọc được.

---

## Bước 9 ✅ — Test và chống hồi quy

Đã thêm, canh đúng Bước 4/5/6:

| Test | Canh |
|---|---|
| [cli/__tests__/cli-language.test.ts](../packages/cli/src/__tests__/cli-language.test.ts) | `resolveCliLanguage` nhận vi và **env thắng tham số preferred**; `normalizeCliLanguageTag` parse cờ không đọc env; `toContentLanguage` đưa vi → en nên `BookConfig.language` **không bao giờ** nhận vi; `pickCliText` fallback về en chứ không `undefined` |
| [cli/__tests__/tui-effects-i18n.test.ts](../packages/cli/src/__tests__/tui-effects-i18n.test.ts) | output vi **không chứa ký tự Hán** |
| [cli/__tests__/tui-slash-autocomplete.test.ts](../packages/cli/src/__tests__/tui-slash-autocomplete.test.ts) | danh sách vi không có Hán, stem lệnh giống zh |
| [studio/__tests__/app-language-vi.test.ts](../packages/studio/src/__tests__/app-language-vi.test.ts) | `tr()` fallback; `foundationFileLabel` vi; message runtime giữ tiếng Anh dưới vi; `PAGE_COPY.vi` không Hán |
| [studio/__tests__/surface-language.test.ts](../packages/studio/src/__tests__/surface-language.test.ts) | `resolveSurfaceLanguages`: config vi → `{ui:"vi", content:"en"}`, **không phải** `"zh"`; `requestedLanguage` không đổi được chrome |

**Vì sao không viết test parity cho `use-i18n.ts`:** typecheck đã phủ (xem Bước 1). Bản runtime trùng lặp thêm một file mà không canh được gì.

**Kiểu assertion đáng dùng nhất** là "không ký tự Hán khi vi":
```ts
const HAN = /[㐀-䶿一-鿿]/;
expect(HAN.test(JSON.stringify(buildStyledHelpSections("vi")))).toBe(false);
```
Một predicate này bắt **cả lớp lỗi** — mọi `locale === "en" ? … : <tiếng Trung>` mà vi rơi vào nhánh else — và không vỡ khi câu chữ đổi.

Chạy đủ bộ trước khi push:
```bash
pnpm -r build && pnpm -r typecheck && pnpm -r test
```
(Repo không có script `lint`, nên `pnpm -r lint` là no-op.)

**Fail có sẵn, không liên quan vi:** `core/__tests__/skill-agent-tool.test.ts` fail 2 ca về symlink trên Windows (cần quyền tạo symlink). Có sẵn từ commit `3fea40a3`.

---

## Bước 10 ✅ — Giữ đồng bộ với upstream

**Đã làm:** thêm `feature/vi-support` vào cả hai danh sách branch trong [.github/workflows/ci.yml](../.github/workflows/ci.yml). Trước đó workflow chỉ trigger trên `master|main` nên nhánh fork **không có CI nào chạy**. Một dòng này mua được build + typecheck + test trên 2 OS × 2 bản Node.

**Không đưa grep vào CI.** Hai lệnh grep từng ghi ở đây đã bỏ:
- `grep 'zh:.*en:' use-i18n.ts | grep -v 'vi:'` — **thừa**, typecheck đã fail.
- `grep 'tr("' --include=*.tsx | grep -v '", *"[^"]*", *"'` — **viết sai**: 17 call site dùng template literal mà pattern không thấy, call site nhiều dòng thì báo nhầm. Và nó sẽ đỏ suốt cả giai đoạn rollout theo thiết kế (vi là optional có chủ ý) — check đỏ vĩnh viễn thì bị ngó lơ rồi bị xóa.

**Thay bằng:** assertion "không ký tự Hán khi vi" ở Bước 9 (chỉ fail khi một đường vi thật sự chạy tới được mà ra tiếng Trung) cộng với compiler, vốn canh sẵn mọi bảng có `vi` bắt buộc.

**Sau mỗi lần rebase**, dùng bộ đếm cân bằng ngoặc thay vì grep:
```bash
python docs/scripts/tr-scan.py $(grep -rl 'tr(' packages/studio/src --include=*.tsx --include=*.ts)
python docs/scripts/pick-scan.py packages/studio/src/api/server.ts
```
Chi tiết quy trình rebase: [fork-vi-support-guide.md](fork-vi-support-guide.md).

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
| 4 | 321 call site `tr()` | ✅ Xong |
| 5 | 73 call site `pick()` + tách `surfaceLanguage` | ✅ Xong |
| 6 | ~104 site output CLI + `CliLanguage` nới thành zh/en/vi | ✅ Xong |
| 7 | 118 site prompt nội dung trong 36 file core | ❌ |
| 8 | Mở `book.language = vi` toàn hệ | ❌ |
| 9-10 | Test + CI chống tụt hậu | ✅ Xong |

Toàn bộ giao diện đã Việt hóa và dùng được. Phần nặng còn lại là Bước 7 — và đó là phần cần người biết nghề viết, không chỉ biết code.
