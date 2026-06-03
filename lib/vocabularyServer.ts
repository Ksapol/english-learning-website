import { VocabularyEntry, VocabularyPoolEntry, getAllUsefulVocabularyEntries } from "@/lib/vocabulary";

export function getVocabularyPage({
  page = 1,
  pageSize = 50,
  query = "",
  partOfSpeech = "",
}: {
  page?: number;
  pageSize?: number;
  query?: string;
  partOfSpeech?: string;
} = {}) {
  const all = getAllUsefulVocabularyEntries();

  const normalizedQuery = query.trim().toLocaleLowerCase();
  const normalizedPart = partOfSpeech.trim();

  const matches = all.filter((entry: VocabularyEntry) => {
    if (normalizedPart && entry.partOfSpeech !== normalizedPart) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const hay = [entry.id, entry.english, entry.thai, entry.relatedEnglish]
      .join(" ")
      .toLocaleLowerCase();

    return hay.includes(normalizedQuery);
  });

  const totalCount = matches.length;
  const start = Math.max(0, (page - 1) * pageSize);
  const end = start + pageSize;

  const entries: VocabularyPoolEntry[] = matches.slice(start, end).map((e) => ({
    id: e.id,
    english: e.english,
    thai: e.thai,
    searchThai: e.searchThai,
    partOfSpeech: e.partOfSpeech,
    definitionThai: e.definitionThai,
    exampleThai: e.exampleThai,
    relatedEnglish: e.relatedEnglish,
  }));

  return { entries, totalCount };
}

export function getVocabularyCountsByPartOfSpeech() {
  const all = getAllUsefulVocabularyEntries();
  const counts: Record<string, number> = {};

  for (const entry of all) {
    const key = entry.partOfSpeech || "(unknown)";
    counts[key] = (counts[key] ?? 0) + 1;
  }

  return counts;
}
