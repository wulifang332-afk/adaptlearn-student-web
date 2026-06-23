import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const SHARED_ROOT = resolve(new URL("..", import.meta.url).pathname);
const SRC_ROOT = resolve(SHARED_ROOT, "src");
const SCRIPTS_ROOT = resolve(SHARED_ROOT, "scripts");
const TESTS_ROOT = resolve(SHARED_ROOT, "tests");

const forbiddenPatterns = [
  /parent portal/i,
  /paid feature/i,
  /reinforcement learning/i,
  /free-form chatbot/i,
  /real LMS connection/i,
  /real BKT result/i,
  /real IRT result/i,
];

const collectFiles = (directory: string): string[] => {
  const files: string[] = [];
  for (const entry of readdirSync(directory)) {
    const fullPath = join(directory, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      files.push(...collectFiles(fullPath));
    } else if (fullPath.endsWith(".ts")) {
      files.push(fullPath);
    }
  }
  return files;
};

const files = [SRC_ROOT, SCRIPTS_ROOT, TESTS_ROOT]
  .flatMap((directory) => collectFiles(directory))
  .filter((file) => relative(SHARED_ROOT, file) !== "scripts/lint.ts");
const failures: string[] = [];

for (const file of files) {
  const content = readFileSync(file, "utf8");
  if (content.includes("\t")) {
    failures.push(`${relative(SHARED_ROOT, file)} contains a tab character`);
  }

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(content)) {
      failures.push(`${relative(SHARED_ROOT, file)} matches forbidden scope pattern ${pattern}`);
    }
  }
}

if (failures.length > 0) {
  throw new Error(`Lint failed:\n${failures.join("\n")}`);
}

console.log(`Lint passed for ${files.length} TypeScript files`);
