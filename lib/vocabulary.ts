import fs from "node:fs";
import path from "node:path";

export type VocabularyEntry = {
  id: string;
  english: string;
  thai: string;
  searchThai: string;
  partOfSpeech: string;
  synonymThai: string;
  exampleThai: string;
  antonymThai: string;
  definitionThai: string;
  relatedEnglish: string;
  classifierThai: string;
  notes: string;
};

export type VocabularyPoolEntry = Pick<
  VocabularyEntry,
  | "id"
  | "english"
  | "thai"
  | "searchThai"
  | "partOfSpeech"
  | "definitionThai"
  | "exampleThai"
  | "relatedEnglish"
>;

const MAX_SAMPLE_SIZE = 24;
const DEFAULT_SAMPLE_SIZE = 12;
const MAX_PAGE_SIZE = 100;

let cachedSample: VocabularyEntry[] | undefined;
let cachedVocabularyEntries: VocabularyEntry[] | undefined;
let cachedPartOfSpeechOptions: string[] | undefined;

function getCsvPath() {
  const preferredPath = path.join(process.cwd(), "data", "vocabulary.csv");
  const fallbackPath = path.join(process.cwd(), "app", "data", "vocabulary.csv");

  if (fs.existsSync(preferredPath)) {
    return preferredPath;
  }

  return fallbackPath;
}

function cleanHeader(value: string) {
  return value.replace(/^\uFEFF/, "").trim();
}

function getValue(
  row: string[],
  columnIndexes: Record<string, number>,
  columnName: string,
) {
  const index = columnIndexes[columnName];

  if (index === undefined) {
    return "";
  }

  return (row[index] ?? "").trim();
}

// Category normalization helpers
const VALID_TCATS = new Set<string>([
  "N",
  "V",
  "ADJ",
  "ADV",
  "AUX",
  "CLAS",
  "CONJ",
  "DET",
  "END",
  "INT",
  "NEG",
  "PREP",
  "PRON",
  "QUES",
]);

function containsThaiCharacters(value: string) {
  return /[\u0E00-\u0E7F]/.test(value);
}

export function normalizeTcat(value: string | null | undefined): string | null {
  if (!value) return null;
  let v = String(value).trim().toUpperCase();
  if (!v) return null;

  // Quickly reject anything containing Thai script or unusual punctuation
  if (containsThaiCharacters(v)) return null;

  // Normalize common separators and punctuation to spaces
  v = v.replace(/[^A-Z0-9\s/\-]/g, " ").replace(/[\s/\-]+/g, " ").trim();

  // Map obvious typos
  if (v === "AVD") v = "ADV";

  // If value contains multiple tokens, pick the first token that matches VALID_TCATS
  const tokens = v.split(" ").filter(Boolean);
  for (const t of tokens) {
    if (VALID_TCATS.has(t)) return t;
  }

  // If whole normalized value matches, accept it
  if (VALID_TCATS.has(v)) return v;

  return null;
}

export function isValidTcat(value: string | null | undefined): boolean {
  return Boolean(normalizeTcat(value));
}

export function getCleanVocabularyCategories() {
  if (cachedPartOfSpeechOptions) return cachedPartOfSpeechOptions;

  const options = new Set<string>();

  for (const entry of getAllVocabularyEntries()) {
    const normalized = normalizeTcat(entry.partOfSpeech);
    if (normalized) options.add(normalized);
  }

  cachedPartOfSpeechOptions = [...options].sort((a, b) => a.localeCompare(b));
  return cachedPartOfSpeechOptions;
}

function createVocabularyEntry(
  row: string[],
  columnIndexes: Record<string, number>,
): VocabularyEntry {
  return {
    id: getValue(row, columnIndexes, "id"),
    english: getValue(row, columnIndexes, "e-entry"),
    thai: getValue(row, columnIndexes, "t-entry"),
    searchThai: getValue(row, columnIndexes, "t-search"),
    partOfSpeech: normalizeTcat(getValue(row, columnIndexes, "t-cat")) || "",
    synonymThai: getValue(row, columnIndexes, "t-syn"),
    exampleThai: getValue(row, columnIndexes, "t-sample"),
    antonymThai: getValue(row, columnIndexes, "t-ant"),
    definitionThai: getValue(row, columnIndexes, "t-def"),
    relatedEnglish: getValue(row, columnIndexes, "e-related"),
    classifierThai: getValue(row, columnIndexes, "t-num"),
    notes: getValue(row, columnIndexes, "notes"),
  };
}

function isUsefulEntry(entry: VocabularyEntry) {
  return Boolean(entry.english && entry.thai);
}

function isCompleteUsefulEntry(entry: VocabularyEntry) {
  return Boolean(entry.id && entry.english && entry.thai && entry.partOfSpeech);
}

function matchesSearch(entry: VocabularyEntry, query: string) {
  if (!query) {
    return true;
  }

  const searchText = [
    entry.english,
    entry.thai,
    entry.searchThai,
    entry.relatedEnglish,
  ]
    .join(" ")
    .toLocaleLowerCase();

  return searchText.includes(query.toLocaleLowerCase());
}

function matchesAnyKeyword(entry: VocabularyEntry, keywords: string[]) {
  const normalizedKeywords = keywords
    .map((keyword) => keyword.trim().toLocaleLowerCase())
    .filter(Boolean);

  if (!normalizedKeywords.length) {
    return true;
  }

  const searchText = [
    entry.english,
    entry.thai,
    entry.searchThai,
    entry.relatedEnglish,
    entry.definitionThai,
    entry.exampleThai,
  ]
    .join(" ")
    .toLocaleLowerCase();

  return normalizedKeywords.some((keyword) => searchText.includes(keyword));
}

function toVocabularyPoolEntry(entry: VocabularyEntry): VocabularyPoolEntry {
  return {
    id: entry.id,
    english: entry.english,
    thai: entry.thai,
    searchThai: entry.searchThai,
    partOfSpeech: entry.partOfSpeech,
    definitionThai: entry.definitionThai,
    exampleThai: entry.exampleThai,
    relatedEnglish: entry.relatedEnglish,
  };
}

function matchesPartOfSpeech(entry: VocabularyEntry, partOfSpeech: string) {
  if (!partOfSpeech) return true;
  const normalized = normalizeTcat(partOfSpeech) || "";
  return entry.partOfSpeech === normalized;
}

function readVocabularyEntries(
  onEntry: (entry: VocabularyEntry) => boolean | void,
) {
  const csv = fs.readFileSync(getCsvPath(), "utf8");
  let headers: string[] | undefined;
  let columnIndexes: Record<string, number> = {};
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let shouldStop = false;

  function finishField() {
    row.push(field);
    field = "";
  }

  function finishRow() {
    finishField();

    if (!headers) {
      headers = row.map(cleanHeader);
      columnIndexes = Object.fromEntries(
        headers.map((header, index) => [header, index]),
      );
    } else {
      const entry = createVocabularyEntry(row, columnIndexes);

      if (isUsefulEntry(entry)) {
        shouldStop = onEntry(entry) === true;
      }
    }

    row = [];
  }

  for (let index = 0; index < csv.length && !shouldStop; index += 1) {
    const char = csv[index];
    const nextChar = csv[index + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }

      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      finishField();
    } else if (char === "\n") {
      finishRow();
    } else if (char === "\r") {
      if (nextChar === "\n") {
        index += 1;
      }

      finishRow();
    } else {
      field += char;
    }
  }

  if ((field || row.length > 0) && !shouldStop) {
    finishRow();
  }
}

export function getVocabularyEntries({
  limit = MAX_PAGE_SIZE,
  query = "",
  partOfSpeech = "",
}: {
  limit?: number;
  query?: string;
  partOfSpeech?: string;
} = {}) {
  return getVocabularySearchResult({ limit, query, partOfSpeech }).entries;
}

export function getAllVocabularyEntries() {
  if (cachedVocabularyEntries) {
    return cachedVocabularyEntries;
  }

  const vocabulary: VocabularyEntry[] = [];

  readVocabularyEntries((entry) => {
    vocabulary.push(entry);
  });

  cachedVocabularyEntries = vocabulary;

  return vocabulary;
}

export function getAllUsefulVocabularyEntries() {
  return getAllVocabularyEntries().filter(isCompleteUsefulEntry);
}

export function getVocabularyByPartOfSpeech(partOfSpeech: string) {
  const selectedPartOfSpeech = partOfSpeech.trim();

  if (!selectedPartOfSpeech) {
    return [];
  }

  return getAllUsefulVocabularyEntries().filter(
    (entry) => entry.partOfSpeech === selectedPartOfSpeech,
  );
}

export function getVocabularyTotalCount() {
  return getAllUsefulVocabularyEntries().length;
}

export function getVocabularyByIds(ids: string[]) {
  const wantedIds = new Set(ids);

  return getAllUsefulVocabularyEntries().filter((entry) => wantedIds.has(entry.id));
}

export function getVocabularySearchResult({
  limit = MAX_PAGE_SIZE,
  query = "",
  partOfSpeech = "",
}: {
  limit?: number;
  query?: string;
  partOfSpeech?: string;
} = {}) {
  const pageSize = Math.min(Math.max(limit, 1), MAX_PAGE_SIZE);
  const trimmedQuery = query.trim();
  const trimmedPartOfSpeech = partOfSpeech.trim();
  const matches = getAllVocabularyEntries().filter(
    (entry) =>
      matchesSearch(entry, trimmedQuery) &&
      matchesPartOfSpeech(entry, trimmedPartOfSpeech),
  );

  return {
    entries: matches.slice(0, pageSize),
    totalCount: matches.length,
  };
}

export function getVocabularyPartOfSpeechOptions() {
  return getCleanVocabularyCategories();
}

export function getVocabularyPoolForLesson(keywords: string[], limit = 200) {
  const poolSize = Math.min(Math.max(limit, 1), 200);
  const seen = new Set<string>();

  return getAllVocabularyEntries()
    .filter((entry) => {
      if (!entry.english || !entry.thai) {
        return false;
      }

      if (!matchesAnyKeyword(entry, keywords)) {
        return false;
      }

      const key = `${entry.english.toLocaleLowerCase()}-${entry.thai}`;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .sort((first, second) => {
      const firstScore =
        Number(Boolean(first.definitionThai)) + Number(Boolean(first.exampleThai));
      const secondScore =
        Number(Boolean(second.definitionThai)) + Number(Boolean(second.exampleThai));

      return secondScore - firstScore;
    })
    .slice(0, poolSize)
    .map(toVocabularyPoolEntry);
}

export function getVocabularySample(limit = DEFAULT_SAMPLE_SIZE) {
  const sampleSize = Math.min(Math.max(limit, 1), MAX_SAMPLE_SIZE);

  if (!cachedSample || cachedSample.length < sampleSize) {
    cachedSample = getVocabularyEntries({ limit: MAX_SAMPLE_SIZE });
  }

  return cachedSample.slice(0, sampleSize);
}
