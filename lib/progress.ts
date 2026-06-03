export type WordProgress = {
  id: string;
  english: string;
  thai: string;
  partOfSpeech: string;
  correctCount: number;
  wrongCount: number;
  attemptedCount: number;
  mastered: boolean;
  status: WordProgressStatus;
  masteredAt?: string;
  practicedTypes: string[];
  correctTypes: string[];
  lastAskedAt?: string;
  lastAnsweredAt?: string;
  lastPracticedAt?: string;
  lastWrongAt?: string;
  nextReviewAt?: string;
  reviewLevel?: number;
  reviewCount?: number;
};

export type WordProgressStatus = "new" | "learning" | "strong" | "mastered";

export type ProgressStore = {
  userId: string;
  words: Record<string, WordProgress>;
};

export type ProgressVocabularyWord = {
  id: string;
  english: string;
  thai: string;
  partOfSpeech: string;
};

const USER_ID_KEY = "english-learning-user-id";
const PROGRESS_KEY = "english-learning-word-progress";

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function createUserId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `user-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getAnonymousUserId() {
  if (!canUseStorage()) {
    return "";
  }

  const existingUserId = window.localStorage.getItem(USER_ID_KEY);

  if (existingUserId) {
    return existingUserId;
  }

  const userId = createUserId();
  window.localStorage.setItem(USER_ID_KEY, userId);
  return userId;
}

export function loadProgressStore(): ProgressStore {
  const userId = getAnonymousUserId();

  if (!canUseStorage()) {
    return { userId, words: {} };
  }

  const rawStore = window.localStorage.getItem(PROGRESS_KEY);

  if (!rawStore) {
    return { userId, words: {} };
  }

  try {
    const parsedStore = JSON.parse(rawStore) as ProgressStore;

    if (parsedStore.userId !== userId) {
      return { userId, words: parsedStore.words ?? {} };
    }

    return {
      userId,
      words: parsedStore.words ?? {},
    };
  } catch {
    return { userId, words: {} };
  }
}

export function saveProgressStore(store: ProgressStore) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(store));
}

export function isWordMastered(progress: WordProgress) {
  return progress.correctCount >= 10 && progress.correctTypes.length >= 3;
}

export function getWordStatus(progress: Pick<WordProgress, "attemptedCount" | "correctCount" | "correctTypes">) {
  if (progress.correctCount >= 10 && progress.correctTypes.length >= 3) {
    return "mastered";
  }

  if (progress.correctCount >= 7 || progress.correctTypes.length >= 2) {
    return "strong";
  }

  if (progress.attemptedCount > 0) {
    return "learning";
  }

  return "new";
}

export function isWeakWord(progress?: Pick<WordProgress, "correctCount" | "wrongCount">) {
  if (!progress) {
    return false;
  }

  return progress.wrongCount > progress.correctCount || progress.wrongCount >= 3;
}

export function isNearMasteredWord(progress?: Pick<WordProgress, "correctCount" | "mastered">) {
  if (!progress) {
    return false;
  }

  return progress.correctCount >= 7 && !progress.mastered;
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate.toISOString();
}

function getReviewDelayDays(reviewLevel: number | undefined) {
  if (!reviewLevel || reviewLevel <= 0) {
    return 1;
  }

  if (reviewLevel === 1) {
    return 3;
  }

  if (reviewLevel === 2) {
    return 7;
  }

  if (reviewLevel === 3) {
    return 14;
  }

  if (reviewLevel === 4) {
    return 30;
  }

  return 60;
}

export function isDueForReview(progress?: Pick<WordProgress, "attemptedCount" | "nextReviewAt">) {
  if (!progress || progress.attemptedCount <= 0) {
    return false;
  }

  if (!progress.nextReviewAt) {
    return true;
  }

  return new Date(progress.nextReviewAt).getTime() <= Date.now();
}

export function getWordProgress(
  store: ProgressStore,
  word: ProgressVocabularyWord,
): WordProgress {
  const existingProgress = store.words[word.id];

  if (!existingProgress) {
    return {
      id: word.id,
      english: word.english,
      thai: word.thai,
      partOfSpeech: word.partOfSpeech,
      correctCount: 0,
      wrongCount: 0,
      attemptedCount: 0,
      mastered: false,
      status: "new" as const,
      practicedTypes: [],
      correctTypes: [],
      reviewLevel: 0,
      reviewCount: 0,
    };
  }

  const correctTypes = existingProgress.correctTypes ?? existingProgress.practicedTypes ?? [];
  const normalizedProgress: WordProgress = {
    ...existingProgress,
    english: word.english,
    thai: word.thai,
    partOfSpeech: word.partOfSpeech,
    correctCount: existingProgress.correctCount ?? 0,
    wrongCount: existingProgress.wrongCount ?? 0,
    attemptedCount: existingProgress.attemptedCount ?? 0,
    practicedTypes: existingProgress.practicedTypes ?? [],
    correctTypes,
    mastered: existingProgress.mastered ?? false,
    status: existingProgress.status ?? "new",
    reviewLevel: existingProgress.reviewLevel ?? 0,
    reviewCount: existingProgress.reviewCount ?? 0,
  };
  const mastered = isWordMastered(normalizedProgress);

  return {
    ...normalizedProgress,
    mastered,
    status: getWordStatus({
      attemptedCount: normalizedProgress.attemptedCount,
      correctCount: normalizedProgress.correctCount,
      correctTypes: normalizedProgress.correctTypes,
    }),
  };
}

export function recordWordAnswer({
  store,
  word,
  questionType,
  correct,
}: {
  store: ProgressStore;
  word: ProgressVocabularyWord;
  questionType: string;
  correct: boolean;
}) {
  const now = new Date().toISOString();
  const currentProgress = getWordProgress(store, word);
  const practicedTypes = Array.from(
    new Set([...currentProgress.practicedTypes, questionType]),
  );
  const correctTypes = correct
    ? Array.from(new Set([...currentProgress.correctTypes, questionType]))
    : currentProgress.correctTypes;
  const nextProgress: WordProgress = {
    ...currentProgress,
    english: word.english,
    thai: word.thai,
    partOfSpeech: word.partOfSpeech,
    attemptedCount: currentProgress.attemptedCount + 1,
    correctCount: currentProgress.correctCount + (correct ? 1 : 0),
    wrongCount: currentProgress.wrongCount + (correct ? 0 : 1),
    practicedTypes,
    correctTypes,
    lastAnsweredAt: now,
    lastPracticedAt: now,
    lastWrongAt: correct ? currentProgress.lastWrongAt : now,
    reviewLevel: correct
      ? Math.min((currentProgress.reviewLevel ?? 0) + 1, 5)
      : Math.max((currentProgress.reviewLevel ?? 0) - 1, 0),
    reviewCount: currentProgress.reviewCount ?? 0,
  };
  nextProgress.reviewCount = correct
    ? (currentProgress.reviewCount ?? 0) + 1
    : currentProgress.reviewCount ?? 0;
  nextProgress.nextReviewAt = addDays(
    new Date(now),
    correct ? getReviewDelayDays(nextProgress.reviewLevel) : 1,
  );
  const mastered = isWordMastered(nextProgress);

  nextProgress.mastered = mastered && !isWeakWord(nextProgress);
  nextProgress.status = getWordStatus(nextProgress);

  if (isWeakWord(nextProgress) && nextProgress.status === "mastered") {
    nextProgress.status =
      nextProgress.correctCount >= 7 || nextProgress.correctTypes.length >= 2
        ? "strong"
        : "learning";
  }

  if (mastered && !currentProgress.masteredAt) {
    nextProgress.masteredAt = now;
  }

  return {
    ...store,
    words: {
      ...store.words,
      [word.id]: nextProgress,
    },
  };
}

export function markWordAsked(
  store: ProgressStore,
  word: ProgressVocabularyWord,
): ProgressStore {
  const currentProgress = getWordProgress(store, word);

  return {
    ...store,
    words: {
      ...store.words,
      [word.id]: {
        ...currentProgress,
        lastAskedAt: new Date().toISOString(),
      },
    },
  };
}

export function resetWordProgress(store: ProgressStore, vocabularyId: string) {
  const nextWords = { ...store.words };
  delete nextWords[vocabularyId];

  return {
    ...store,
    words: nextWords,
  };
}

export function resetAllProgress(store: ProgressStore) {
  return {
    ...store,
    words: {},
  };
}
