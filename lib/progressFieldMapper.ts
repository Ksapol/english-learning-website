import type { WordProgress } from "@/lib/progress";

/**
 * Database representation of word progress (snake_case)
 */
export type DatabaseWordProgress = {
  user_id: string;
  word_id: string;
  correct_count: number;
  wrong_count: number;
  practiced_types: string[];
  correct_types: string[];
  status: "new" | "learning" | "strong" | "mastered";
  last_practiced_at: string | null;
  last_wrong_at: string | null;
  mastered_at: string | null;
  next_review_at: string | null;
  review_level: number;
  review_count: number;
  created_at: string;
  updated_at: string;
};

/**
 * Convert camelCase WordProgress to snake_case DatabaseWordProgress
 */
export function toDatabaseWordProgress(
  progress: WordProgress,
  userId: string,
): DatabaseWordProgress {
  return {
    user_id: userId,
    word_id: progress.id,
    correct_count: progress.correctCount,
    wrong_count: progress.wrongCount,
    practiced_types: progress.practicedTypes,
    correct_types: progress.correctTypes,
    status: progress.status,
    last_practiced_at: progress.lastPracticedAt || null,
    last_wrong_at: progress.lastWrongAt || null,
    mastered_at: progress.masteredAt || null,
    next_review_at: progress.nextReviewAt || null,
    review_level: progress.reviewLevel || 0,
    review_count: progress.reviewCount || 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Convert snake_case DatabaseWordProgress to camelCase WordProgress
 */
export function fromDatabaseWordProgress(
  db: DatabaseWordProgress,
  english: string,
  thai: string,
  partOfSpeech: string,
): WordProgress {
  const correctCount = db.correct_count || 0;
  const wrongCount = db.wrong_count || 0;
  const attemptedCount = correctCount + wrongCount;

  return {
    id: db.word_id,
    english,
    thai,
    partOfSpeech,
    correctCount,
    wrongCount,
    attemptedCount,
    mastered: db.status === "mastered",
    status: db.status,
    masteredAt: db.mastered_at || undefined,
    practicedTypes: db.practiced_types || [],
    correctTypes: db.correct_types || [],
    lastPracticedAt: db.last_practiced_at || undefined,
    lastWrongAt: db.last_wrong_at || undefined,
    nextReviewAt: db.next_review_at || undefined,
    reviewLevel: db.review_level || 0,
    reviewCount: db.review_count || 0,
  };
}
