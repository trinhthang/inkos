<p align="center">
  <img src="assets/logo.svg" width="120" height="120" alt="InkOS Logo">
  <img src="assets/inkos-text.svg" width="240" height="65" alt="InkOS">
</p>

<h1 align="center">AI Agent Sáng Tác Truyện<br><sub>Hệ thống sáng tác truyện dài, truyện ngắn, kịch bản, phim/game tương tác, nội dung IP và dịch đa ngôn ngữ</sub></h1>

<p align="center">
  <a href="https://www.npmjs.com/package/@actalk/inkos"><img src="https://img.shields.io/npm/v/@actalk/inkos.svg?color=cb3837&logo=npm" alt="npm version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-AGPL%20v3-blue.svg" alt="License: AGPL-3.0"></a>
  <a href="https://github.com/Narcooo/inkos/stargazers"><img src="https://img.shields.io/github/stars/Narcooo/inkos?style=flat&logo=github&color=yellow" alt="GitHub stars"></a>
  <a href="https://www.npmjs.com/package/@actalk/inkos"><img src="https://img.shields.io/npm/dm/@actalk/inkos?color=cb3837&logo=npm&label=downloads" alt="npm downloads"></a>
</p>

<p align="center">
  <a href="README.md">中文</a> | <a href="README.en.md">English</a> | <a href="README.ja.md">日本語</a> | Tiếng Việt
</p>

---

InkOS là hệ thống AI Agent để sáng tác truyện và dịch đa ngôn ngữ: tiểu thuyết dài, truyện ngắn độc lập, kịch bản, phân cảnh, fanfic, ngoại truyện, nhại văn phong, viết tiếp, phim tương tác, thế giới mở và dịch tài liệu dài — tất cả bắt đầu từ cùng một bàn làm việc. Studio Chat, CLI và TUI dùng chung một bề mặt hành động: thảo luận, xác nhận hành động, sinh nội dung, soát bản, sửa có lưu vết, và xuất bản đa ngôn ngữ.

> ### 🇻🇳 Trạng thái tiếng Việt
>
> - **Giao diện tiếng Việt**: đã có. Studio và TUI chạy tiếng Việt — chọn "Sáng Tác Tiếng Việt" ở màn đầu, hoặc bấm **VI** trên header.
> - **Dịch sang tiếng Việt**: đã có. `inkos translate` nhận ngôn ngữ đích tự do, dịch truyện Trung/Anh/Nhật sang tiếng Việt chạy được ngay.
> - **Sáng tác gốc bằng tiếng Việt**: đang làm. Hiện LLM viết chính văn bằng `zh` hoặc `en`; chọn giao diện tiếng Việt thì nội dung tạm fallback sang tiếng Anh.
>
> Lộ trình chi tiết: [docs/viet-hoa-roadmap.md](docs/viet-hoa-roadmap.md). Hướng dẫn dùng từ A-Z: [docs/huong-dan-su-dung.md](docs/huong-dan-su-dung.md).

## Yêu cầu hệ thống

**Node.js 22.16 trở lên.**

## Cài đặt

```bash
npm i -g @actalk/inkos
```

## Bắt đầu nhanh

```bash
inkos init truyen-cua-toi
cd truyen-cua-toi
inkos
```

Lệnh `inkos` (không tham số) mở Studio — bàn làm việc web ở địa chỉ local in ra khi khởi động (mặc định cổng 4567). Chọn ngôn ngữ, cấu hình mô hình, rồi tạo tác phẩm đầu tiên.

## Cấu hình mô hình

InkOS tách hai đường cấu hình, **không ghi đè nhau**: Studio dùng cấu hình dịch vụ trực quan, còn CLI / daemon / triển khai dùng biến môi trường.

### Cách 1: Cấu hình trong Studio (khuyến nghị khi viết tại máy)

Vào mục **Cấu hình mô hình**:

1. Chọn dịch vụ — có trên 40 endpoint dựng sẵn: OpenAI, Anthropic, Google Gemini, Moonshot (Kimi), MiniMax, DeepSeek, Zhipu (GLM), Bailian, Volcengine, Hunyuan, Wenxin, Spark, SiliconCloud, ModelScope, Mistral, xAI, OpenRouter, kkaiapi, newapi, Ollama, LM Studio, GitHub Copilot, các gói CodingPlan... hoặc `custom` cho mọi endpoint tương thích OpenAI.
2. Dán API key và bấm kiểm tra kết nối.
3. Chọn mô hình khả dụng rồi lưu.

API key lưu ở `.inkos/secrets.json`, **không** ghi vào `inkos.json`. File `.env` không ghi đè dịch vụ/mô hình đã chọn trong Studio.

### Cách 2: Biến môi trường cho CLI / daemon

```bash
inkos config set-global \
  --provider <openai|anthropic|custom> \
  --base-url <địa chỉ API> \
  --api-key <API key của bạn> \
  --model <tên mô hình>
```

Lưu vào `~/.inkos/.env`. Hoặc sửa tay `~/.inkos/.env` (toàn cục) / `.env` (trong dự án):

```bash
# Bắt buộc
INKOS_LLM_PROVIDER=          # openai / anthropic / custom (custom cho mọi API tương thích OpenAI)
INKOS_LLM_BASE_URL=          # địa chỉ API
INKOS_LLM_API_KEY=           # API key
INKOS_LLM_MODEL=             # tên mô hình

# Tùy chọn
# INKOS_DEFAULT_LANGUAGE=en  # ngôn ngữ viết mặc định: en hoặc zh
# INKOS_LLM_TEMPERATURE=0.7
# INKOS_LLM_THINKING_BUDGET=0  # ngân sách suy nghĩ mở rộng của Anthropic
```

Thứ tự ưu tiên khi CLI đọc cấu hình: cấu hình dịch vụ Studio/dự án → secret dịch vụ → env toàn cục → env dự án → env tiến trình → cờ dòng lệnh.

### Cách 3: Định tuyến nhiều mô hình (tùy chọn)

Gán mô hình khác nhau cho từng agent để cân đối chất lượng và chi phí:

```bash
inkos config set-model writer <model> --provider <provider> --base-url <url> --api-key-env <BIẾN_ENV>
inkos config set-model auditor <model> --provider <provider>
inkos config show-models
```

Agent không có cấu hình riêng sẽ dùng mô hình toàn cục.

### Chẩn đoán cấu hình

```bash
inkos doctor
```

In ra chế độ cấu hình đang hiệu lực, nguồn của dịch vụ / mô hình / API key, và kiểm tra kết nối API.

| Chế độ | Nghĩa |
|--------|-------|
| `studio-project` | Đang chạy Studio: chỉ dùng cấu hình và secret của Studio/dự án |
| `cli-project` | Đang chạy CLI: lấy cấu hình Studio làm nền, env và cờ CLI chồng lên |
| `environment` | CLI / daemon dùng trực tiếp cấu hình môi trường hiện tại |

Nếu kiểm tra dịch vụ thất bại, xem lại dịch vụ, mô hình và protocol có khớp nhau không. API key Google Gemini AI Studio dùng được với endpoint tương thích OpenAI của Gemini — InkOS tự tắt tham số `store` mà Google không hỗ trợ. MiniMax dùng endpoint chính thức `/v1/chat/completions` và tự chọn transport không stream khi stream trả về rỗng.

## Viết cuốn sách đầu tiên

```bash
inkos book create --title "Kẻ Đào Hầm Cuối Cùng" --genre litrpg
inkos write next                      # viết và lưu chương tiếp theo
inkos status                          # xem trạng thái
inkos review                          # xem các quan sát soát bản đã lưu
inkos export --format epub            # xuất EPUB để đọc trên điện thoại/Kindle
```

`[book-id]` tự nhận diện khi dự án chỉ có một cuốn. Ngôn ngữ viết mặc định theo thể loại; ghi đè bằng `--lang en` hoặc `--lang zh`.

## Dịch truyện sang tiếng Việt

Phần này dùng được ngay, không phụ thuộc lộ trình Việt hóa:

```bash
inkos translate init --from truyen.epub --source zh --target vi
inkos translate run <project-id>
inkos translate export <project-id> --format epub
```

Nhận EPUB / PDF / TXT / Markdown. Dịch theo lô, giữ nhất quán tên riêng và thuật ngữ qua glossary của dự án, sinh báo cáo soát lỗi, rồi xuất file.

## Viết truyện ngắn hoàn chỉnh

Nói trong Studio Chat, hoặc chạy CLI:

```bash
inkos short run \
  --direction "truyện ngắn đô thị, nữ chính phản đòn bằng bằng chứng" \
  --chapters 12 \
  --chars 1000
```

Kết quả lưu ở `shorts/<tên-truyện>/final/`, gồm `full.md`, `sales-package.md`, `cover-prompt.md`, và `cover.png` nếu đã cấu hình dịch vụ tạo bìa.

## Các chế độ sáng tác chính

**Tiểu thuyết dài** — từ một bản mô tả ý tưởng, sinh nền tảng, ý đồ từng chương, gói context, chính văn, soát bản, sửa chương, và chốt trạng thái. Context được quản lý theo lớp bảo vệ / lớp nén được, nên sách dài vẫn điều khiển được.

**Dự báo mạch truyện** — trước khi viết chương sau, sinh 2-5 nhánh tương lai độc lập từ canon hiện tại rồi so sánh nhịp chương, quyết định nhân vật, thay đổi dự kiến, rủi ro và độ khớp với ý đồ tác giả. Chọn một nhánh chỉ ghi `selected-branch-plan.md`, không đổi chính văn hay trạng thái canon.

**InkOS Short** — gói truyện ngắn độc lập hoàn chỉnh: bản thảo đầy đủ, hồ sơ đề cương, hồ sơ soát bản, tóm tắt, điểm bán, prompt bìa và ảnh bìa.

**InkOS Play** — thế giới mở hoặc truyện tương tác phân nhánh từ hợp đồng thế giới viết bằng ngôn ngữ tự nhiên: dòng thời gian, nhân vật tự hành, vật phẩm, bằng chứng, quan hệ, trạng thái cảnh, quy tắc hình ảnh, lựa chọn dẫn hướng, hành động tự do, sinh ảnh tùy chọn.

**Phim / game tương tác** — biến ý tưởng, kịch bản hoặc văn bản tham khảo thành cảnh phân nhánh, biến số, kết thúc, prompt ảnh, ảnh từng node, và gói dự án xuất được.

**Studio Chat** — mặt chat lâu dài: trả lời câu hỏi, đề xuất hành động, tạo sách, chạy Short / Play, sinh bìa, sửa file văn bản. Hành động nặng luôn hiện thẻ xác nhận; hệ thống không nói "đã xong" trước khi có kết quả tool thật.

**Agent Skills** — thêm gói `SKILL.md` chuẩn vào `skills/`, `.agents/skills/`, `~/.agents/skills/` hoặc `~/.openclaw/skills/`; hoặc trỏ `INKOS_SKILL_DIRS=/đường/dẫn`. Ép dùng một skill trong lượt hiện tại bằng `@skill-id`. Skill chỉ cấp chỉ dẫn và tài liệu tĩnh, **không** cấp thêm quyền thực thi — tạo, viết, sửa, sinh ảnh vẫn đi qua tool và cổng xác nhận của InkOS.

Có 20 Skill nghiệp vụ dựng sẵn trong [packages/core/skills/](packages/core/skills/): viết truyện dài / ngắn / viết tiếp / fanfic / ngoại truyện / nhại văn phong, kịch bản, phân cảnh, phim tương tác, thế giới Play, minh họa Play, soát bản, phân tích truyện, nghiên cứu thị trường, nhập liệu, bìa truyện, làm sạch văn AI, và dịch thuật. Nhập một Skill cùng ID vào dự án sẽ ghi đè phương pháp dựng sẵn.

`SKILL.md` tối giản:

```md
---
name: Detective Play
description: Thế giới trinh thám với chuỗi bằng chứng và bảng nghi phạm.
---
Dùng chuỗi bằng chứng; đừng biến manh mối thành không khí chung chung.
```

## Kiến trúc hoạt động

InkOS dùng harness pi-agent làm hạt nhân suy luận và gọi tool. Agent hiểu ý người dùng rồi phát ra hành động có kiểu; phần host thực thi tool tất định, cưỡng chế xác nhận và quyền, quản trạng thái, và chỉ coi là hoàn thành khi có file và kết quả tool thật.

Một chương truyện dài đi qua nhiều agent theo thứ tự:

| Agent | Trách nhiệm |
|-------|-------------|
| **Radar** | Quét xu hướng nền tảng và thị hiếu người đọc để định hướng (cắm thêm được, bỏ qua được) |
| **Planner** | Đọc ý đồ tác giả + tiêu điểm hiện tại + kết quả truy hồi bộ nhớ, sinh ý đồ chương (phải giữ / phải tránh) |
| **Composer** | Chọn context liên quan tới nhiệm vụ từ trạng thái có cấu trúc, tài liệu điều khiển và bản chiếu Markdown, rồi biên dịch stack quy tắc |
| **Architect** | Sinh file nền tảng khi tạo sách, nhập liệu hoặc lập ngoại truyện: khung truyện, quy tắc, nhân vật |
| **Writer** | Viết chính văn từ context đã biên dịch (có quản độ dài, ưu tiên đối thoại) |
| **Observer** | Trích xuất 9 nhóm dữ kiện từ văn bản chương (nhân vật, địa điểm, tài nguyên, quan hệ, cảm xúc, thông tin, cài cắm, thời gian, trạng thái thể chất) |
| **Reflector** | Xuất delta JSON (không phải markdown đầy đủ); tầng code validate bằng Zod rồi ghi bất biến |
| **Continuity Auditor** | Đối chiếu bản nháp với trạng thái có cấu trúc, tài liệu điều khiển và context chương |
| **Reviser** | Thực hiện yêu cầu sửa cụ thể từ người dùng, Agent hoặc quan sát soát bản đã lưu, rồi ghi phiên bản mới có lưu vết |

Chính văn và trạng thái truyện được commit **nguyên khối** sau khi validate; không bao giờ xảy ra cảnh trạng thái tiến lên mà chính văn lưu thất bại.

### Bộ nhớ dài hạn

| Lớp | Vai trò |
|-----|---------|
| `story/state/*.json` | Trạng thái có cấu trúc, là nguồn sự thật: trạng thái hiện tại, cài cắm, tóm tắt chương — validate bằng Zod |
| `story/*.md` | Bản chiếu cho người đọc: `current_state.md`, `pending_hooks.md`, `chapter_summaries.md`, `character_matrix.md` |
| `story/memory.db` | Bản chiếu truy hồi SQLite FTS5/BM25, dựng lại được; **không** phải nguồn sự thật |

Continuity Auditor đối chiếu bản nháp với trạng thái này. Nhân vật "nhớ" việc chưa từng chứng kiến, hay rút ra thanh vũ khí đã mất hai chương trước — auditor bắt được.

### Tài liệu điều khiển

- `story/author_intent.md` — ý đồ tác giả trên đường dài
- `story/current_focus.md` — điều cần kéo chú ý về trong 1-3 chương tới
- `story/runtime/chapter-XXXX.intent.md` — mục tiêu chương, danh sách giữ/tránh
- `story/runtime/chapter-XXXX.context.json` — context thực tế được chọn cho chương
- `story/runtime/chapter-XXXX.trace.json` — vết biên dịch của chương

Nghĩa là brief, node đề cương, quy tắc sách và yêu cầu hiện tại không bị trộn thành một khối prompt — InkOS biên dịch trước, rồi mới viết.

### Quản độ dài

- `--words` đặt dải mục tiêu, không phải cam kết cứng
- Chương tiếng Trung đếm `zh_chars`, chương tiếng Anh đếm `en_words`
- InkOS không bao giờ cắt ngang chính văn hay đánh dấu chương thất bại vì lệch độ dài
- Chương lệch khỏi dải vẫn được lưu, kèm số đo có cấu trúc và một quan sát

## Bốn chế độ sử dụng

### 1. Toàn bộ dây chuyền trong một lệnh

```bash
inkos write next                  # lập kế hoạch → ráp context → viết → soát → commit nguyên khối
inkos write next --count 5        # viết 5 chương liên tiếp
inkos auto 50                     # viết tự động tới khi đạt chương 50
```

### 2. Lệnh năng lực tường minh

```bash
inkos write rewrite 31            # viết lại chương 31 (phục hồi snapshot trạng thái)
inkos revise 31 --json            # sửa chương 31
inkos review --json
inkos export --format epub
```

### 3. Agent ngôn ngữ tự nhiên

```bash
inkos agent "Viết tiểu thuyết LitRPG, nhân vật chính là hệ chữa trị trong thế giới hầm ngục"
inkos agent "Viết chương tiếp, tập trung vào trận đánh boss và chia chiến lợi phẩm"
inkos interact --json --message "viết tiếp cuốn hiện tại, nhưng nhịp dồn hơn"
```

`inkos interact` là cửa vào có cấu trúc cho OpenClaw và các agent ngoài, dùng chung bộ não điều khiển với TUI và Studio.

### 4. Studio Play

Chọn **Thế giới mở** hoặc **Nhánh tương tác** trong Studio, rồi mô tả thế giới bằng ngôn ngữ tự nhiên — không cần tạo sách trước.

## Tham chiếu CLI

| Lệnh | Mô tả |
|------|-------|
| `inkos init [name]` | Khởi tạo dự án (bỏ tên để khởi tạo thư mục hiện tại; `--lang zh/en`) |
| `inkos` / `inkos studio` | Mở bàn làm việc web (`-p` cổng, mặc định 4567; `--project <path>`) |
| `inkos tui` | Mở giao diện terminal toàn màn hình |
| `inkos book create` | Tạo sách (`--genre`, `--platform`, `--chapter-words`, `--target-chapters`, `--brief <file>`, `--lang en/zh`) |
| `inkos book update [id]` | Cập nhật cấu hình sách (`--chapter-words`, `--target-chapters`, `--status`, `--lang`) |
| `inkos book list` | Liệt kê sách |
| `inkos book delete <id>` | Xóa sách và toàn bộ dữ liệu (`--force` để bỏ xác nhận) |
| `inkos book backup <id>` / `restore <id> <backup-id>` | Sao lưu / phục hồi sách |
| `inkos write next [id]` | Viết chương tiếp (`--count`, `--words`, `--context`, `--context-file`, `-q`, `--notify`) |
| `inkos write rewrite [id] <n>` | Viết lại chương N (`--force`, `--words`, `--brief`) |
| `inkos write sync [id] <n>` | Đồng bộ trạng thái từ chương đã sửa tay |
| `inkos auto [id] <target>` | Viết tự động tới chương mục tiêu |
| `inkos revise [id] [n]` | Sửa một chương cụ thể |
| `inkos review [id]` | Xem quan sát soát bản đã lưu |
| `inkos chapter sync` / `chapter delete` | Đếm lại số từ / xóa chương mới nhất và lùi trạng thái |
| `inkos status [id]` | Trạng thái dự án |
| `inkos export [id]` | Xuất sách (`--format txt/md/epub`, `--output <path>`) |
| `inkos short run` | Sinh gói truyện ngắn độc lập (`--direction`, `--chapters`, `--chars`, `--lang`, `--no-cover`) |
| `inkos short revise <story-id>` | Sửa lại toàn truyện ngắn (`--chapters`, `--chars`) |
| `inkos translate init` | Tạo dự án dịch (`--from`, `--source`, `--target`, `--segment-max-chars`) |
| `inkos translate run <id>` | Chạy dịch (`--batch-size`, `--max-tokens`) |
| `inkos translate export <id>` | Xuất bản dịch (`--format md/txt/epub`) |
| `inkos forecast create/show/select` | Tạo, soát lại, chọn nhánh dự báo (chọn chỉ lưu kế hoạch ứng viên) |
| `inkos fanfic init` | Tạo sách fanfic từ nguyên tác (`--from`, `--mode canon/au/ooc/cp`) |
| `inkos import canon [id] --from <parent>` | Nhập nguyên tác vào sách ngoại truyện |
| `inkos import chapters [id] --from <path>` | Nhập chương có sẵn để viết tiếp (`--split`, `--resume-from`) |
| `inkos style analyze <file>` / `style import <file> [id]` | Phân tích văn phong tham khảo / áp vào sách |
| `inkos work list` / `work show` / `work migrate` | Xem Work, artifact, revision, Episode; di trú dự án 1.x |
| `inkos radar scan` | Quét thị trường / xu hướng để định hướng sách mới |
| `inkos analytics [id]` | Phân tích sách (quan sát, độ dài chương, token) |
| `inkos detect [id] [n]` | Kiểm tra AIGC (`--all`, `--stats`) |
| `inkos agent <chỉ dẫn>` | Chế độ agent ngôn ngữ tự nhiên |
| `inkos interact` | Cửa vào cho agent ngoài (`--json`, `--message`, `--book`) |
| `inkos config set-global` / `show-global` | Cấu hình LLM toàn cục (`~/.inkos/.env`) |
| `inkos config set` / `show` | Xem, sửa cấu hình dự án |
| `inkos config set-model <agent> <model>` / `remove-model` / `show-models` | Định tuyến mô hình theo agent |
| `inkos config list-models <service>` | Liệt kê mô hình của một dịch vụ |
| `inkos doctor` | Chẩn đoán cấu hình (kiểm tra kết nối API + gợi ý tương thích) |
| `inkos up` / `inkos down` | Bật / tắt daemon (`-q`, tự ghi `inkos.log`) |
| `inkos update` | Cập nhật bản mới nhất |

Cờ ghi đè LLM dùng một lần cho mọi lệnh: `--service`, `--model`, `--api-key-env`, `--base-url`, `--api-format <chat|responses|anthropic>`, `--stream`, `--no-stream`.

```bash
inkos write next --service google --model gemini-2.5-flash
inkos up --service moonshot --model kimi-k2.5 --api-key-env MOONSHOT_API_KEY
```

## Daemon và thông báo

`inkos up` chạy vòng lặp nền tự động viết chương theo lịch. Dây chuyền đi tiếp qua các vấn đề không nghiêm trọng, và dừng lại kèm kết quả xem được khi cần người quyết định. Thông báo qua Telegram, Lark (Feishu), WeCom, Webhook (ký HMAC-SHA256 + lọc sự kiện). Log ghi `inkos.log` dạng JSON Lines, `-q` để chạy im.

## Thể loại và nền tảng

Từ bản 2.0, `--genre` là **chuỗi tự do** — không còn danh sách thể loại cố định trong code. Phương pháp sáng tác đến từ Skill đang bật và ràng buộc Work của người dùng, không phải từ luật tính điểm cứng. Tài liệu tham khảo cho thể loại truyện mạng tiếng Anh (LitRPG, Progression Fantasy, Isekai, Cultivation, Romantasy...) và tiếng Trung (xuanhuan, xianxia, urban, horror) nằm trong các gói Skill.

Nền tảng đích (`--platform`) hiện có: `tomato` / `qidian` / `feilu` / `other` cho tiếng Trung, `royal-road` / `kindle-unlimited` / `scribble-hub` / `other` cho tiếng Anh. Chưa có nền tảng Việt — dùng `other`.

## Phát triển

```bash
pnpm install
pnpm dev          # watch toàn bộ package
pnpm test         # chạy test
pnpm typecheck    # kiểm tra kiểu, không sinh file
```

## Ghi nhận

Runtime agent của InkOS dựng trên [pi](https://github.com/badlogic/pi-mono) (`@mariozechner/pi-ai` và `@mariozechner/pi-agent-core`) của Mario Zechner.

## Giấy phép

[AGPL-3.0](LICENSE)
