import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import type { UniDicRawToken } from "@ssml-utilities/accent-ir";

const DEFAULT_MECAB_COMMAND = process.env.MECAB_COMMAND ?? "mecab";
const DEFAULT_MECABRC = process.env.MECABRC ?? "/etc/mecabrc";
const DEFAULT_MECAB_DICDIR =
  process.env.MECAB_DICDIR ?? "/var/lib/mecab/dic/unidic";
const DEFAULT_MECAB_OUTPUT_FORMAT =
  process.env.MECAB_OUTPUT_FORMAT ?? "unidic22";

export class UniDicConfigurationError extends Error {}

export class MeCabExecutionError extends Error {}

export const analyzeTextWithMeCab = async (
  text: string
): Promise<UniDicRawToken[]> => {
  await assertRuntimeConfigured(DEFAULT_MECAB_DICDIR);

  const output = await runMeCab(text, {
    command: DEFAULT_MECAB_COMMAND,
    mecabrc: DEFAULT_MECABRC,
    dicDir: DEFAULT_MECAB_DICDIR,
    outputFormat: DEFAULT_MECAB_OUTPUT_FORMAT,
  });

  return parseUniDic22Output(output);
};

export const parseUniDic22Output = (output: string): UniDicRawToken[] =>
  output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && line !== "EOS")
    .map(parseUniDic22Line);

interface MeCabRuntimeOptions {
  command: string;
  mecabrc: string;
  dicDir: string;
  outputFormat: string;
}

const assertRuntimeConfigured = async (dicDir: string): Promise<void> => {
  try {
    await access(dicDir);
  } catch {
    throw new UniDicConfigurationError(
      `UniDic dictionary directory is not available: ${dicDir}`
    );
  }
};

const runMeCab = (
  text: string,
  options: MeCabRuntimeOptions
): Promise<string> =>
  new Promise((resolve, reject) => {
    const child = spawn(
      options.command,
      [
        "-r",
        options.mecabrc,
        "-d",
        options.dicDir,
        `-O${options.outputFormat}`,
      ],
      {
        stdio: ["pipe", "pipe", "pipe"],
      }
    );

    let stdout = "";
    let stderr = "";

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");

    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });

    child.on("error", (error) => {
      reject(
        new MeCabExecutionError(
          error instanceof Error
            ? error.message
            : "Failed to start mecab process."
        )
      );
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
        return;
      }

      reject(
        new MeCabExecutionError(
          stderr.trim() || `mecab exited with status ${code ?? "unknown"}.`
        )
      );
    });

    child.stdin.end(text);
  });

const parseUniDic22Line = (line: string): UniDicRawToken => {
  const tabIndex = line.indexOf("\t");
  if (tabIndex < 0) {
    throw new MeCabExecutionError(`Unexpected MeCab output line: ${line}`);
  }

  const surface = line.slice(0, tabIndex);
  const rawFeatures = parseCsvLine(line.slice(tabIndex + 1));

  const token: UniDicRawToken = {
    surface,
    lemma: readFeature(rawFeatures, 7),
    orthBase: readFeature(rawFeatures, 10),
    reading:
      readFeature(rawFeatures, 20) ??
      readFeature(rawFeatures, 6) ??
      readFeature(rawFeatures, 9),
    pronunciation: readFeature(rawFeatures, 9),
    partOfSpeech: {
      level1: readFeature(rawFeatures, 0) ?? "*",
      level2: readFeature(rawFeatures, 1),
      level3: readFeature(rawFeatures, 2),
      level4: readFeature(rawFeatures, 3),
    },
    inflection: buildInflection(rawFeatures),
    accent: buildAccent(rawFeatures),
    source: {
      dictionary: "unidic",
      rawFeatures,
    },
  };

  return cleanupToken(token);
};

const parseCsvLine = (value: string): string[] => {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    const next = value[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
        continue;
      }

      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      fields.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  fields.push(current);
  return fields;
};

const buildInflection = (
  rawFeatures: readonly string[]
): UniDicRawToken["inflection"] | undefined => {
  const type = readFeature(rawFeatures, 4);
  const form = readFeature(rawFeatures, 5);

  if (!type && !form) {
    return undefined;
  }

  return {
    type,
    form,
  };
};

const buildAccent = (
  rawFeatures: readonly string[]
): UniDicRawToken["accent"] | undefined => {
  const accentType = readFeature(rawFeatures, 24);
  const accentConnectionType = readFeature(rawFeatures, 25);
  const accentModificationType = readFeature(rawFeatures, 26);

  if (!accentType && !accentConnectionType && !accentModificationType) {
    return undefined;
  }

  return {
    accentType,
    accentConnectionType,
    accentModificationType,
  };
};

const readFeature = (
  rawFeatures: readonly string[],
  index: number
): string | undefined => {
  const value = rawFeatures[index];
  if (!value || value === "*") {
    return undefined;
  }

  return value;
};

const cleanupToken = (token: UniDicRawToken): UniDicRawToken => ({
  ...token,
  ...(token.inflection ? { inflection: token.inflection } : {}),
  ...(token.accent ? { accent: token.accent } : {}),
});
