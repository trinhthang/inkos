# Hướng dẫn dùng InkOS từ A đến Z

Từ lúc chưa cài gì tới lúc có chương truyện đầu tiên. Mọi lệnh trong tài liệu này đã đối chiếu với code thật trong repo.

---

## Bước 1 — Kiểm tra môi trường

Yêu cầu **Node.js 22.16 trở lên**.

```bash
node -v
```

Thấp hơn 22.16 thì cài lại Node từ [nodejs.org](https://nodejs.org) hoặc qua nvm. InkOS sẽ không chạy trên Node cũ.

---

## Bước 2 — Gỡ bản global, chạy fork từ source

Tài liệu này giả định bạn chạy **fork trên máy cá nhân** (Windows + PowerShell), không dùng bản phát hành npm.

### 2.1 — Gỡ `@actalk/inkos` đã cài global

Nếu máy từng `npm i -g @actalk/inkos`, lệnh `inkos` sẽ chạy **bản npm cũ** chứ không phải fork. Gỡ trước.

```powershell
npm ls -g --depth=0              # xem @actalk/inkos có trong danh sách không
npm uninstall -g @actalk/inkos
```

Kiểm tra đã sạch — lệnh dưới **không ra kết quả nào** là đúng:

```powershell
Get-Command inkos -All
```

Còn sót thì xóa tay 3 file `inkos`, `inkos.cmd`, `inkos.ps1` trong thư mục global bin (`npm prefix -g` in ra đường dẫn, thường là `C:\Users\<bạn>\AppData\Roaming\npm`).

Gỡ global **không** đụng tới dữ liệu của bạn:

- `~/.inkos/.env` — cấu hình LLM toàn cục, giữ nguyên, fork dùng lại được ngay.
- Thư mục dự án truyện, kể cả `.inkos/secrets.json` bên trong.

Trước đây từng `npm link` từ source cũng gỡ bằng đúng lệnh trên (cùng tên gói `@actalk/inkos`).

### 2.2 — Chuẩn bị pnpm

Repo khóa `pnpm@9.15.9` qua trường `packageManager`. Đừng cài pnpm bằng `npm i -g pnpm` — dễ lệch phiên bản.

```powershell
corepack enable                  # PowerShell quyền Administrator
pnpm -v                          # 9.15.9
```

`corepack enable` báo lỗi quyền (EPERM) thì bỏ qua nó, prefix mọi lệnh bằng `corepack`:

```powershell
corepack pnpm -v
```

Các lệnh dưới đây viết dạng `pnpm ...`; nếu bạn đi đường `corepack` thì đọc thành `corepack pnpm ...`.

### 2.3 — Cài dependency và build

```powershell
cd D:\Projects\inkos
pnpm install
pnpm -r build                    # build cả core, cli, studio
node packages/cli/dist/index.js --version
```

**Phải build cả gói `studio`.** CLI tìm server Studio ở `packages/studio/dist/api/index.js`; thiếu file đó thì lệnh `inkos` (mở Studio) sẽ fail.

### 2.4 — Gọi `inkos` trỏ vào fork

Cách A — `npm link`, dùng như lệnh global nhưng chạy code trong repo:

```powershell
cd D:\Projects\inkos\packages\cli
npm link
cd D:\Projects\inkos
inkos --version                  # 2.0.0
```

Cách B — hàm PowerShell, không đụng npm global chút nào. Mở `notepad $PROFILE` và thêm:

```powershell
function inkos { node D:\Projects\inkos\packages\cli\dist\index.js @args }
```

Mở terminal mới là dùng được. Gỡ = xóa dòng đó.

Cả hai cách đều trỏ thẳng vào `dist/`, nên **sau mỗi lần sửa code chỉ cần build lại**, không cần link lại:

```powershell
pnpm -r build                              # hoặc chỉ gói đã sửa:
pnpm --filter @actalk/inkos-core build
```

### 2.5 — Dev Studio có hot reload

Script `dev` của Studio viết bằng cú pháp bash (`&`, `kill %1`), **không chạy được trong PowerShell**. Hai đường:

Đường 1 — chạy trong Git Bash:

```bash
pnpm --filter @actalk/inkos-studio dev
# client: http://localhost:4567 — server API: cổng 4569
```

Đường 2 — PowerShell, hai cửa sổ terminal:

```powershell
# cửa sổ 1 — API server
$env:INKOS_STUDIO_PORT = "4569"
$env:INKOS_PROJECT_ROOT = "../.."
pnpm --filter @actalk/inkos-studio exec tsx watch src/api/index.ts
```

```powershell
# cửa sổ 2 — client
pnpm --filter @actalk/inkos-studio dev:client
```

Không cần hot reload thì build rồi chạy thẳng:

```powershell
pnpm --filter @actalk/inkos-studio build
inkos
```

### 2.6 — Sau mỗi lần đồng bộ upstream

Nhánh làm việc hiện tại là `feature/vi-support`. Quy trình rebase lên `master` xem ở [fork-vi-support-guide.md](fork-vi-support-guide.md). Kéo xong thì:

```powershell
pnpm install                     # lockfile có thể đã đổi
pnpm -r build
pnpm test
```

---

## Bước 3 — Tạo dự án

Một "dự án" là một thư mục chứa nhiều tác phẩm, cấu hình mô hình và bộ nhớ truyện.

```bash
inkos init truyen-cua-toi
cd truyen-cua-toi
```

Tạo ra:

```
truyen-cua-toi/
├── inkos.json      # cấu hình dự án (tên, ngôn ngữ, llm, daemon)
├── .env            # biến môi trường cục bộ (nếu chưa có cấu hình toàn cục)
├── .gitignore
├── works/          # tác phẩm
└── radar/          # kết quả quét thị trường
```

Muốn khởi tạo ngay trong thư mục hiện tại thì bỏ tên: `inkos init`.

---

## Bước 4 — Mở Studio và chọn ngôn ngữ

```bash
inkos
```

Lệnh `inkos` không tham số = mở Studio (mặc định http://localhost:4567). Đổi cổng bằng `inkos studio -p 5000`.

Lần đầu mở, Studio hiện màn chọn ngôn ngữ — chọn **Sáng Tác Tiếng Việt** để có giao diện tiếng Việt. Đổi lại sau bằng nút `中 / EN / VI` trên header.

Thích làm việc trong terminal hơn:

```bash
inkos tui                        # giao diện terminal toàn màn hình
INKOS_TUI_LOCALE=vi inkos tui    # TUI tiếng Việt
```

---

## Bước 5 — Cấu hình mô hình AI

**Chưa có bước này thì không viết được gì.** InkOS không kèm mô hình, bạn phải có API key của một nhà cung cấp.

### Cách A: Cấu hình trong Studio (khuyến nghị)

1. Vào **Cấu hình mô hình** ở sidebar.
2. Chọn dịch vụ. Code hiện có **trên 40 endpoint dựng sẵn** (`packages/core/src/llm/providers/endpoints/`): OpenAI, Anthropic, Google Gemini, Moonshot (Kimi), MiniMax, DeepSeek, Zhipu (GLM), Bailian, Volcengine, Tencent Hunyuan, Baidu ERNIE (Wenxin), iFlytek Spark, SiliconCloud, ModelScope, Mistral, xAI, OpenRouter, kkaiapi, newapi, Ollama, LM Studio, GitHub Copilot, các gói CodingPlan (Kimi / GLM / MiniMax / Bailian / Volcengine)... Hoặc chọn `custom` cho mọi endpoint tương thích OpenAI.
3. Dán API key → bấm kiểm tra kết nối.
4. Chọn mô hình khả dụng → Lưu.

API key lưu ở `.inkos/secrets.json` trong dự án, **không** ghi vào `inkos.json`. Đừng commit file này lên git.

### Cách B: Cấu hình bằng dòng lệnh (dùng cho CLI, daemon, server)

```bash
inkos config set-global \
  --provider openai \
  --base-url https://api.moonshot.cn/v1 \
  --api-key sk-xxxxx \
  --model kimi-k2.5
```

Bốn cờ trên là bắt buộc. `--provider` nhận `openai`, `anthropic`, hoặc `custom` (dùng `custom` cho mọi API tương thích OpenAI). Cấu hình lưu vào `~/.inkos/.env`, dùng chung cho mọi dự án.

Xem lại:

```bash
inkos config show-global
```

Hoặc sửa tay `~/.inkos/.env`:

```bash
INKOS_LLM_PROVIDER=custom
INKOS_LLM_BASE_URL=https://api.moonshot.cn/v1
INKOS_LLM_API_KEY=sk-xxxxx
INKOS_LLM_MODEL=kimi-k2.5
```

### Tiết kiệm chi phí: định tuyến mô hình theo agent (tùy chọn)

Mô hình đắt chỉ dùng để viết chính văn, việc soát bản dùng mô hình rẻ:

```bash
inkos config set-model writer kimi-k2.5 --provider custom
inkos config set-model auditor deepseek-chat --provider custom --api-key-env DEEPSEEK_KEY
inkos config show-models
```

Agent không cấu hình riêng thì dùng mô hình toàn cục.

---

## Bước 6 — Kiểm tra cấu hình trước khi viết

```bash
inkos doctor
```

In ra: chế độ cấu hình đang hiệu lực, dịch vụ / mô hình / API key lấy từ đâu, và kết quả gọi thử API.

| Chế độ | Nghĩa |
|--------|-------|
| `studio-project` | Đang chạy Studio: chỉ dùng cấu hình và secret của Studio/dự án |
| `cli-project` | Đang chạy CLI: lấy cấu hình Studio làm nền, env và cờ CLI chồng lên |
| `environment` | CLI / daemon dùng trực tiếp biến môi trường hiện tại |

Lỗi kết nối thì kiểm tra theo thứ tự: API key còn hạn → base URL đúng dịch vụ → mô hình thuộc dịch vụ đó (ví dụ `--service google --model kimi-k2.5` sẽ bị chặn ngay vì sai chủ).

---

## Bước 7 — Tạo tác phẩm đầu tiên

### Trong Studio

Chọn một lối vào ở sidebar: **Tiểu thuyết dài**, **Truyện ngắn**, **Kịch bản**, **Phân cảnh**, **Phim tương tác**, **Thế giới mở**, **Nhánh tương tác**, **Fanfic**, **Viết tiếp**, **Ngoại truyện**, **Nhại văn phong**, **Dịch thuật**.

Hoặc gõ thẳng trong Studio Chat:

```
Tạo một cuốn tiểu thuyết LitRPG, nhân vật chính là hệ chữa trị bị kẹt trong hầm ngục tầng 7.
```

Hành động nặng (tạo sách, viết chương) sẽ hiện **thẻ xác nhận** — phải bấm đồng ý mới chạy. Hệ thống không báo "đã xong" trước khi có kết quả thật.

### Bằng dòng lệnh

```bash
inkos book create --title "Kẻ Đào Hầm Cuối Cùng" --genre litrpg
```

Các cờ hữu ích:

| Cờ | Ý nghĩa | Mặc định |
|----|---------|----------|
| `--genre <tên>` | Thể loại | `xuanhuan` |
| `--lang en` hoặc `--lang zh` | Ngôn ngữ viết | theo thể loại |
| `--chapter-words <n>` | Số từ mỗi chương | `3000` |
| `--target-chapters <n>` | Tổng số chương dự kiến | `200` |
| `--platform <tên>` | Nền tảng đích | `tomato` |
| `--brief <file.md>` | File ý tưởng của bạn — Architect dựng từ đó thay vì tự nghĩ | — |

`--brief` là cờ đáng dùng nhất. Viết sẵn một file markdown: bối cảnh, nhân vật, mạch chính, điều bạn muốn và không muốn. Chất lượng sách phụ thuộc vào đây nhiều hơn vào việc chọn mô hình.

**Về `--genre`:** từ bản 2.0, thể loại là **chuỗi tự do** (`z.string().min(1)`), không phải danh sách cố định — không có lệnh `inkos genre list`. Gõ gì cũng được: `litrpg`, `xianxia`, `trinh-tham`, `ngôn tình`. Phương pháp sáng tác không đến từ chuỗi này mà đến từ Skill đang bật và ràng buộc trong `book_rules`. Mặc định là `xuanhuan`.

**Về `--platform`:** Studio đang có 4 lựa chọn cho mỗi ngôn ngữ — `tomato` / `qidian` / `feilu` / `other` (zh) và `royal-road` / `kindle-unlimited` / `scribble-hub` / `other` (en). Chưa có nền tảng Việt; tạm dùng `other`.

> **Về tiếng Việt:** hiện `--lang` chỉ nhận `zh` hoặc `en` — LLM chưa viết chính văn tiếng Việt. Xem [viet-hoa-roadmap.md](viet-hoa-roadmap.md) Bước 7-8 để biết tiến độ. Muốn có truyện tiếng Việt ngay thì xem Bước 11 bên dưới (dịch).

---

## Bước 8 — Viết chương

```bash
inkos write next                    # viết 1 chương tiếp theo
inkos write next --count 5          # viết 5 chương liên tiếp
inkos write next --words 4000       # ghi đè độ dài cho lần này
inkos write next --context "chương này tập trung vào trận đánh boss, đừng mở tuyến tình cảm mới"
inkos write next --context-file huong-dan-chuong.md
```

`[book-id]` tự nhận diện khi dự án chỉ có một cuốn. Nhiều cuốn thì ghi rõ: `inkos write next ke-dao-ham-cuoi-cung`.

Một chương đi qua: **lập kế hoạch → ráp context → viết → soát bản → commit nguyên khối**. Chương và trạng thái truyện được lưu cùng lúc hoặc không lưu gì cả, nên không bao giờ xảy ra cảnh trạng thái tiến lên mà chương mất.

Viết tự động tới mốc:

```bash
inkos auto 50                        # viết liên tục tới khi đạt chương 50
```

Theo dõi:

```bash
inkos status                         # trạng thái dự án
inkos analytics                      # số chương, độ dài, token đã dùng
```

---

## Bước 9 — Đọc, soát, sửa

```bash
inkos review                         # xem các quan sát soát bản đã lưu
inkos revise 31                      # sửa chương 31 theo quan sát
inkos write rewrite 31               # viết lại hẳn chương 31 (phục hồi snapshot trạng thái trước)
inkos write rewrite 31 --brief "giữ cảnh mở đầu, làm lại đoạn đối thoại cuối"
```

Soát bản **không** cho điểm, không tự ý viết lại. Nó ghi lại quan sát có bằng chứng; sửa là hành động tường minh của bạn.

Sửa tay chương trong Studio hoặc editor, rồi đồng bộ lại trạng thái:

```bash
inkos write sync 31
```

Xóa chương mới nhất và lùi trạng thái:

```bash
inkos chapter delete
```

---

## Bước 10 — Xuất bản thảo

```bash
inkos export --format epub           # đọc trên điện thoại/Kindle
inkos export --format md
inkos export --format txt --output ban-thao.txt
```

---

## Bước 11 — Dịch truyện sang tiếng Việt

Phần này **chạy được ngay**, không chờ lộ trình Việt hóa — ngôn ngữ đích là chuỗi tự do.

```bash
inkos translate init --from truyen-goc.epub --source zh --target vi
# ghi ra project-id, dùng cho 2 lệnh sau

inkos translate run <project-id>
inkos translate export <project-id> --format epub
```

Nhận EPUB / PDF / TXT / Markdown. Dịch theo lô, giữ nhất quán tên riêng và thuật ngữ bằng glossary của dự án, sinh báo cáo soát lỗi.

Cờ hữu ích: `--segment-max-chars <n>` (cắt đoạn dài), `--batch-size <n>` (số đoạn mỗi lần gọi mô hình), `--max-tokens <n>`.

Làm được trong Studio: vào **Dịch thuật**, tải file lên, chọn nguồn/đích, chạy, xem đối chiếu song song.

---

## Bước 12 — Truyện ngắn, thế giới mở

### Truyện ngắn hoàn chỉnh

```bash
inkos short run \
  --direction "truyện ngắn đô thị, nữ chính phản đòn bằng bằng chứng" \
  --chapters 12 \
  --chars 1000
```

Kết quả ở `shorts/<tên-truyện>/final/`: `full.md`, `sales-package.md`, `cover-prompt.md`, và `cover.png` nếu đã cấu hình dịch vụ tạo ảnh. Bỏ bìa: `--no-cover`.

### Thế giới mở / truyện tương tác

Trong Studio chọn **Thế giới mở** hoặc **Nhánh tương tác**, rồi mô tả bằng ngôn ngữ tự nhiên:

```
Tạo thế giới mở kiểu tháp canh biên giới. Thời gian không cố định mỗi lượt: đi tuần mất một giờ,
luyện tập có thể mất vài ngày. Trang bị có độ hiếm nhưng không có bảng chỉ số — thể hiện độ hiếm
qua chất liệu, ánh sáng và không khí.
```

Không cần tạo sách trước. InkOS dựng thế giới, nhân vật, vật phẩm, quan hệ, cảnh hiện tại và gợi ý hành động.

---

## Bước 13 — Chạy nền tự động (tùy chọn)

```bash
inkos up          # bật daemon, viết chương theo lịch
inkos up -q       # chạy im, chỉ ghi inkos.log
inkos down        # tắt
```

Lịch cấu hình trong `inkos.json` (`daemon.schedule.writeCron`, `radarCron`). Thông báo qua Telegram / Lark / WeCom / Webhook — cấu hình ở **Cài đặt dự án → Kênh thông báo** trong Studio.

Daemon đi tiếp qua các vấn đề nhỏ xử lý được, và dừng kèm kết quả xem được khi cần bạn quyết định.

---

## Cấu trúc dự án sau khi chạy

```
truyen-cua-toi/
├── inkos.json                      # cấu hình dự án
├── .inkos/secrets.json             # API key — KHÔNG commit
├── works/<work-id>/
│   ├── work.json                   # manifest của Work (loại, ngôn ngữ, artifact, episode)
│   └── source/
│       ├── book.json               # cấu hình sách
│       ├── chapters/
│       │   ├── index.json          # chỉ mục chương
│       │   └── ...                 # chính văn từng chương
│       └── story/
│           ├── author_intent.md    # ý đồ tác giả đường dài — sửa tay được
│           ├── current_focus.md    # tiêu điểm 1-3 chương tới — sửa tay được
│           ├── book_rules.md       # quy tắc sách (bản đọc được)
│           ├── current_state.md    # bản chiếu trạng thái hiện tại
│           ├── pending_hooks.md    # cài cắm chưa trả
│           ├── outline/
│           │   ├── story_frame.md  # khung truyện
│           │   └── volume_map.md   # bản đồ quyển
│           ├── state/*.json        # trạng thái có cấu trúc — NGUỒN SỰ THẬT
│           ├── runtime/            # intent / context / trace từng chương
│           ├── snapshots/<n>/      # snapshot trạng thái theo chương
│           └── memory.db           # chỉ mục truy hồi SQLite (dựng lại được)
├── shorts/                         # truyện ngắn
├── covers/                         # bìa
└── radar/                          # kết quả quét thị trường
```

Hai file đáng sửa tay nhất: `story/author_intent.md` và `story/current_focus.md`. Đó là nơi bạn điều khiển hướng truyện mà không cần can thiệp từng chương.

Thứ tự tin cậy khi có xung đột: `story/state/*.json` là nguồn sự thật; các file `.md` là bản chiếu đọc được; `memory.db` chỉ là chỉ mục truy hồi, xóa đi dựng lại được. Đừng sửa tay `state/*.json` trừ khi biết rõ schema — sửa sai sẽ bị Zod chặn ở lần viết sau.

---

## Lỗi thường gặp

| Hiện tượng | Nguyên nhân thường gặp | Cách xử lý |
|------------|------------------------|------------|
| `inkos` không nhận lệnh | Chưa link, hoặc npm global bin chưa vào PATH | Làm Bước 2.4; hoặc gọi thẳng `node packages/cli/dist/index.js` |
| Báo thiếu cấu hình LLM | Chưa cấu hình, hoặc Studio và CLI đọc nguồn khác nhau | `inkos doctor` để xem nguồn thật đang dùng |
| Gọi API lỗi 401 / 403 | API key sai, hết hạn, hoặc sai dịch vụ | Kiểm tra lại key; thử `inkos config list-models <service>` |
| Mô hình không thuộc dịch vụ | Ví dụ `--service google --model kimi-k2.5` | InkOS chặn chủ động — chọn mô hình đúng chủ |
| Chương lệch độ dài nhiều | `--words` chỉ là dải mục tiêu | Chương vẫn được lưu kèm quan sát; điều chỉnh `--words` và `current_focus.md` |
| Stream trả rỗng (MiniMax) | Vấn đề transport của dịch vụ | InkOS tự dò transport không stream; hoặc thêm `--no-stream` |
| Studio mở trắng khi chạy từ source | Chưa build client | `pnpm --filter @actalk/inkos-studio build` |
| `pnpm install --frozen-lockfile` fail | pnpm mới không đọc `pnpm.overrides` trong `package.json` | Dùng pnpm 9.x: `corepack use pnpm@9` |
| `inkos --version` ra số cũ (vd `1.8.0`) | Bản npm global vẫn còn, che mất fork | Làm lại Bước 2.1, rồi `Get-Command inkos -All` kiểm tra |
| `pnpm` không nhận lệnh | corepack chưa bật shim | `corepack enable` (Administrator), hoặc gõ `corepack pnpm ...` |
| `corepack enable` báo EPERM | Không có quyền ghi vào thư mục Node | Bỏ qua, prefix mọi lệnh bằng `corepack` |
| Mở Studio báo không tìm thấy server | Chưa build gói `studio` | `pnpm --filter @actalk/inkos-studio build` |
| `pnpm --filter ... dev` lỗi cú pháp trong PowerShell | Script `dev` của Studio viết bằng bash | Chạy trong Git Bash, hoặc tách 2 terminal như Bước 2.5 |
| Sửa code mà `inkos` không đổi hành vi | Đang chạy `dist/` cũ | `pnpm -r build` lại; không cần `npm link` lại |

---

## Đọc tiếp

- [README.vi.md](../README.vi.md) — tổng quan tính năng và tham chiếu CLI đầy đủ
- [viet-hoa-roadmap.md](viet-hoa-roadmap.md) — lộ trình Việt hóa từng bước
- [fork-vi-support-guide.md](fork-vi-support-guide.md) — quy trình fork và đồng bộ upstream
