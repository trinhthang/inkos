import { Command } from "commander";
import { StateManager, formatLengthCount, resolveLengthCountingMode } from "@actalk/inkos-core";
import { findProjectRoot, log, logError } from "../utils.js";
import { pickCliText, resolveCliLanguage } from "../localization.js";

export const statusCommand = new Command("status")
  .description("Show project status")
  .argument("[book-id]", "Book ID (optional, shows all if omitted)")
  .option("--chapters", "Show per-chapter status and observations")
  .option("--json", "Output JSON")
  .action(async (bookIdArg: string | undefined, opts) => {
    // Status can run with no book selected, so the chrome follows the environment.
    // Hoisted above the try because the catch block reports in the same language.
    const language = resolveCliLanguage();

    try {
      const root = findProjectRoot();
      const state = new StateManager(root);

      const allBookIds = await state.listBooks();
      const bookIds = bookIdArg ? [bookIdArg] : allBookIds;

      if (bookIdArg && !allBookIds.includes(bookIdArg)) {
        throw new Error(
          `Book "${bookIdArg}" not found. Available: ${allBookIds.join(", ") || "(none)"}`,
        );
      }

      const booksData = [];

      if (!opts.json) {
        log(`${pickCliText(language, { zh: "InkOS 项目", en: "InkOS Project", vi: "Dự án InkOS" })}: ${root}`);
        log(`${pickCliText(language, { zh: "作品数", en: "Books", vi: "Số tác phẩm" })}: ${allBookIds.length}`);
        log("");
      }

      for (const id of bookIds) {
        const book = await state.loadBookConfig(id);
        const index = await state.loadChapterIndex(id);
        const persistedChapterCount = await state.getPersistedChapterCount(id);
        const countingMode = resolveLengthCountingMode(book.language);

        const observationCount = index.reduce((sum, chapter) => sum + chapter.observations.length, 0);
        const chaptersWithObservations = index.filter((chapter) => chapter.observations.length > 0).length;
        const totalWords = index.reduce((sum, ch) => sum + ch.wordCount, 0);
        const avgWords = index.length > 0 ? Math.round(totalWords / index.length) : 0;

        booksData.push({
          id,
          title: book.title,
          status: book.status,
          genre: book.genre,
          platform: book.platform,
          chapters: index.length,
          chapterFiles: persistedChapterCount,
          targetChapters: book.targetChapters,
          totalWords,
          avgWordsPerChapter: avgWords,
          observationCount,
          chaptersWithObservations,
          ...(opts.chapters ? {
            chapterList: index.map((ch) => ({
              number: ch.number,
              title: ch.title,
              wordCount: ch.wordCount,
              provenance: ch.provenance,
              observations: ch.observations,
            })),
          } : {}),
        });

        if (!opts.json) {
          log(`  ${book.title} (${id})`);
          log(`    ${pickCliText(language, { zh: "状态", en: "Status", vi: "Trạng thái" })}: ${book.status}`);
          log(`    ${pickCliText(language, { zh: "平台", en: "Platform", vi: "Nền tảng" })}: ${book.platform} | ${pickCliText(language, { zh: "题材", en: "Genre", vi: "Thể loại" })}: ${book.genre}`);
          log(`    ${pickCliText(language, { zh: "章节", en: "Chapters", vi: "Chương" })}: ${index.length} / ${book.targetChapters}`);
          if (persistedChapterCount !== index.length) {
            log(`    ${pickCliText(language, {
              zh: `章节文件：${persistedChapterCount}；文件数与章节索引不一致。`,
              en: `Chapter files: ${persistedChapterCount}; the file count differs from the chapter index.`,
              vi: `File chương: ${persistedChapterCount}; số file không khớp với index chương.`,
            })}`);
          }
          log(`    ${pickCliText(language, {
            zh: `字数：${totalWords.toLocaleString()}（平均 ${avgWords}/章）`,
            en: `Words: ${totalWords.toLocaleString()} (avg ${avgWords}/ch)`,
            vi: `Độ dài: ${totalWords.toLocaleString()} (trung bình ${avgWords}/chương)`,
          })}`);
          log(`    ${pickCliText(language, {
            zh: `审查观察：${observationCount} 条，涉及 ${chaptersWithObservations} 章`,
            en: `Review observations: ${observationCount} across ${chaptersWithObservations} chapter(s)`,
            vi: `Ghi nhận soát duyệt: ${observationCount}, trên ${chaptersWithObservations} chương`,
          })}`);

          if (opts.chapters && index.length > 0) {
            log("");
            for (const ch of index) {
              const icon = ch.observations.length > 0 ? "!" : "+";
              log(`    [${icon}] Ch.${ch.number} "${ch.title}" | ${formatLengthCount(ch.wordCount, countingMode)} | ${ch.provenance}`);
              for (const observation of ch.observations) {
                log(`        ${observation.code}: ${observation.summary}`);
              }
            }
          }
          log("");
        }
      }

      if (opts.json) {
        log(JSON.stringify({ project: root, books: booksData }, null, 2));
      }
    } catch (e) {
      if (opts.json) {
        log(JSON.stringify({ error: String(e) }));
      } else {
        logError(pickCliText(language, {
          zh: `读取状态失败：${e}`,
          en: `Failed to get status: ${e}`,
          vi: `Không đọc được trạng thái: ${e}`,
        }));
      }
      process.exit(1);
    }
  });
