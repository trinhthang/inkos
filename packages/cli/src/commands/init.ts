import { Command } from "commander";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { log, logError } from "../utils.js";
import { initializeProjectDirectory } from "../project-bootstrap.js";
import { normalizeCliLanguageTag, pickCliText, resolveCliLanguage } from "../localization.js";

export const initCommand = new Command("init")
  .description("Initialize an InkOS project (current directory by default)")
  .argument("[name]", "Project name (creates subdirectory). Omit to init current directory.")
  .option("--lang <language>", "Project language, also the default writing language: zh, en, or vi. Defaults to INKOS_LOCALE, else zh.")
  .action(async (name: string | undefined, opts: { lang?: string }) => {
    const projectDir = name ? resolve(process.cwd(), name) : process.cwd();

    // An explicit --lang wins; otherwise fall back to INKOS_LOCALE, then zh. No
    // narrowing here: project.language may be vi, unlike BookConfig.language.
    const language = normalizeCliLanguageTag(opts.lang) ?? resolveCliLanguage();

    try {
      await mkdir(projectDir, { recursive: true });
      await initializeProjectDirectory(projectDir, {
        language,
        overwriteSupportFiles: true,
      });

      log(pickCliText(language, {
        zh: `项目已初始化：${projectDir}`,
        en: `Project initialized at ${projectDir}`,
        vi: `Đã khởi tạo dự án tại ${projectDir}`,
      }));
      log("");
      const exampleCreateLines = language === "en"
        ? ["  inkos book create --title 'My Novel' --genre progression --platform royalroad --lang en"]
        : language === "vi"
          ? [
            // Writing language is still en: the drafting agents cannot produce Vietnamese prose yet.
            "  inkos book create --title 'Tiểu Thuyết Của Tôi' --genre other --platform other --lang en",
            "  # Giao diện tiếng Việt, nội dung vẫn sinh bằng tiếng Anh.",
          ]
          : [
            "  inkos book create --title '我的小说' --genre xuanhuan --platform tomato",
            "  # English project? Re-run with: inkos init --lang en",
          ];
      if (global) {
        log("Global LLM config detected. Ready to go!");
        log("");
        log("Next steps:");
        if (name) log(`  cd ${name}`);
        for (const line of exampleCreateLines) log(line);
      } else {
        log("Next steps:");
        if (name) log(`  cd ${name}`);
        log("  # Option 1: Set global config (recommended, one-time):");
        log("  inkos config set-global --provider openai --base-url <your-api-url> --api-key <your-key> --model <your-model>");
        log("  # Option 2: Edit .env for this project only");
        log("");
        for (const line of exampleCreateLines) log(line);
      }
      log("  inkos write next <book-id>");
    } catch (e) {
      logError(`Failed to initialize project: ${e}`);
      process.exit(1);
    }
  });
