# Fork InkOS thêm ngôn ngữ "vi" — vẫn sync update upstream

Hướng dẫn maintain fork riêng (thêm hỗ trợ tiếng Việt) trong khi vẫn kéo được update mới từ `Narcooo/inkos`.

## 1. Setup remote

```bash
git clone https://github.com/<yourname>/inkos.git
cd inkos
git remote add upstream https://github.com/Narcooo/inkos.git
git remote -v   # origin = fork, upstream = repo gốc
```

## 2. Nguyên tắc branch

- `master`: luôn sạch, là bản sao y hệt upstream, không commit gì lên đây.
- `feature/vi-support`: toàn bộ code "vi" nằm ở đây.

```bash
git checkout -b feature/vi-support master
```

## 3. Cách code "vi" để giảm conflict

Core hard-code `"zh" | "en"` rải khắp nhiều file prompt (`writer-prompts.ts`, `settler-prompts.ts`, `tui/i18n.ts`...). Sửa ternary tại chỗ → conflict mỗi lần upstream đổi prompt.

Tách 2 phần:

- **Structural change** (bắt buộc đụng file gốc, nhưng diff ngắn): đổi type `"zh" | "en"` → `"zh" | "en" | "vi"`, thay ternary 2 nhánh bằng hàm `pick(language, {en, zh, vi})` lookup map.
- **Content** (toàn bộ nội dung tiếng Việt): để trong file mới, ví dụ `packages/core/src/agents/locale-vi.ts`. Upstream không đụng file này → không bao giờ conflict.

Mục tiêu: mỗi file gốc chỉ đổi 1-2 dòng (type + 1 lệnh gọi hàm), conflict khi rebase dễ resolve bằng tay trong vài giây.

## 4. Sync update từ upstream (lặp định kỳ)

```bash
# cập nhật master
git fetch upstream
git checkout master
git merge upstream/master   # fast-forward
git push origin master

# replay code vi lên bản mới nhất
git checkout feature/vi-support
git rebase master
# có conflict: sửa file, rồi
git add <file>
git rebase --continue
git push origin feature/vi-support --force-with-lease
```

Dùng `rebase` cho feature branch (không `merge`) → lịch sử thẳng, conflict hiện rõ từng commit, dễ resolve hơn merge dồn cục.

## 5. Tự động cảnh báo khi upstream có update mới

`.github/workflows/upstream-sync-check.yml`:

```yaml
on:
  schedule:
    - cron: '0 0 * * 1'
  workflow_dispatch:
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - run: |
          git remote add upstream https://github.com/Narcooo/inkos.git
          git fetch upstream
          git log HEAD..upstream/master --oneline | tee changes.txt
          if [ -s changes.txt ]; then echo "::warning::upstream có commit mới"; fi
```

## 6. Checklist mỗi lần rebase

- [ ] `git fetch upstream` trước khi bắt đầu
- [ ] Merge upstream/master vào master, push
- [ ] Rebase `feature/vi-support` lên master mới
- [ ] Conflict chỉ nên rơi vào 1-2 dòng structural change đã note ở mục 3 — nếu conflict lan rộng hơn, nghĩa là code vi đang chạm quá nhiều vào logic chung, cần tách thêm
- [ ] Chạy lại test (`pnpm test`) sau rebase trước khi push

## 7. Hướng lâu dài — tránh fork-diverge vĩnh viễn

Mở PR lên upstream đổi `"zh" | "en"` → kiểu mở (`string` + locale registry), kèm theo cơ chế cắm thêm ngôn ngữ qua file/config thay vì hard-code. Nếu được merge, fork không cần giữ structural diff nữa — chỉ còn file locale riêng, gần như zero conflict về sau.
