"use client";

import {
  loadProgressStore,
  saveProgressStore,
  type WordProgress,
} from "@/lib/progress";
import { supabase } from "@/lib/supabase/client";
import {
  toDatabaseWordProgress,
  fromDatabaseWordProgress,
  type DatabaseWordProgress,
} from "@/lib/progressFieldMapper";

const SYNC_COMPLETED_PREFIX = "english-learning-cloud-sync-completed";

/**
 * Get the currently authenticated user
 */
export async function getCurrentUser() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

/**
 * Check if user has synced local progress to cloud
 */
function hasSyncCompleted(userId: string): boolean {
  try {
    if (typeof window === "undefined") return false;
    const key = `${SYNC_COMPLETED_PREFIX}:${userId}`;
    return window.localStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}

/**
 * Mark that user has completed initial sync
 */
function markSyncCompleted(userId: string): void {
  try {
    if (typeof window === "undefined") return;
    const key = `${SYNC_COMPLETED_PREFIX}:${userId}`;
    window.localStorage.setItem(key, "true");
  } catch {
    // Ignore storage errors
  }
}

/**
 * Load all word progress from Supabase for the authenticated user
 */
async function loadCloudProgress(): Promise<Map<string, DatabaseWordProgress>> {
  try {
    const user = await getCurrentUser();
    if (!user) return new Map();

    const { data, error } = await supabase
      .from("word_progress")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      console.error("Error loading cloud progress:", error);
      return new Map();
    }

    return new Map(
      (data as DatabaseWordProgress[]).map((p) => [p.word_id, p]),
    );
  } catch (error) {
    console.error("Exception loading cloud progress:", error);
    return new Map();
  }
}

/**
 * Merge local and cloud progress using smart conflict resolution
 */
function mergeProgress(
  local: WordProgress,
  cloud: DatabaseWordProgress,
): DatabaseWordProgress {
  // Use max counts (never decrease)
  const correctCount = Math.max(local.correctCount, cloud.correct_count);
  const wrongCount = Math.max(local.wrongCount, cloud.wrong_count);

  // Union practiced and correct types
  const practicedTypes = Array.from(
    new Set([...local.practicedTypes, ...cloud.practiced_types]),
  );
  const correctTypes = Array.from(
    new Set([...local.correctTypes, ...cloud.correct_types]),
  );

  // Use strongest status (order: new < learning < strong < mastered)
  const statusOrder = { new: 0, learning: 1, strong: 2, mastered: 3 };
  const localStatus = statusOrder[local.status] || 0;
  const cloudStatus = statusOrder[cloud.status] || 0;
  const status =
    (Object.keys(statusOrder).find(
      (k) => statusOrder[k as keyof typeof statusOrder] === Math.max(localStatus, cloudStatus),
    ) as "new" | "learning" | "strong" | "mastered") || "new";

  // Use latest dates for last practiced/wrong
  const lastPracticedAt = getLatestDate(
    local.lastPracticedAt,
    cloud.last_practiced_at,
  );
  const lastWrongAt = getLatestDate(local.lastWrongAt, cloud.last_wrong_at);

  // Use earliest mastered date (first to reach mastery wins)
  const masteredAt = getEarliestDate(local.masteredAt, cloud.mastered_at);

  // Use earliest next review date
  const nextReviewAt = getEarliestDate(local.nextReviewAt, cloud.next_review_at);

  // Use max for review tracking
  const reviewLevel = Math.max(local.reviewLevel || 0, cloud.review_level);
  const reviewCount = Math.max(local.reviewCount || 0, cloud.review_count);

  return {
    user_id: cloud.user_id,
    word_id: cloud.word_id,
    correct_count: correctCount,
    wrong_count: wrongCount,
    practiced_types: practicedTypes,
    correct_types: correctTypes,
    status,
    last_practiced_at: lastPracticedAt,
    last_wrong_at: lastWrongAt,
    mastered_at: masteredAt,
    next_review_at: nextReviewAt,
    review_level: reviewLevel,
    review_count: reviewCount,
    created_at: cloud.created_at,
    updated_at: new Date().toISOString(),
  };
}

function getLatestDate(
  date1: string | undefined,
  date2: string | null,
): string | null {
  if (!date1 && !date2) return null;
  if (!date1) return date2;
  if (!date2) return date1;
  return new Date(date1) > new Date(date2) ? date1 : date2;
}

function getEarliestDate(
  date1: string | undefined,
  date2: string | null,
): string | null {
  if (!date1 && !date2) return null;
  if (!date1) return date2;
  if (!date2) return date1;
  return new Date(date1) < new Date(date2) ? date1 : date2;
}

/**
 * Save merged progress to Supabase (upsert)
 */
async function saveCloudProgress(
  mergedData: DatabaseWordProgress[],
): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user) return false;

    const { error } = await supabase.from("word_progress").upsert(
      mergedData.map((d) => ({
        ...d,
        user_id: user.id,
      })),
      { onConflict: "user_id,word_id" },
    );

    if (error) {
      console.error("Error saving cloud progress:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Exception saving cloud progress:", error);
    return false;
  }
}

/**
 * Sync local progress to cloud on first login
 */
export async function syncLocalProgressToCloud(): Promise<void> {
  try {
    const user = await getCurrentUser();
    if (!user) return;

    // Check if already synced
    if (hasSyncCompleted(user.id)) {
      return;
    }

    // Load local and cloud progress
    const localStore = loadProgressStore();
    const cloudMap = await loadCloudProgress();

    if (Object.keys(localStore.words).length === 0) {
      // No local progress to sync
      markSyncCompleted(user.id);
      return;
    }

    // Merge progress without needing vocabulary context
    const mergedData: DatabaseWordProgress[] = [];

    for (const [wordId, localProgress] of Object.entries(localStore.words)) {
      const cloudProgress = cloudMap.get(wordId);

      if (cloudProgress) {
        // Merge local and cloud
        const merged = mergeProgress(localProgress, cloudProgress);
        mergedData.push(merged);
      } else {
        // Only local, convert to cloud format
        const cloudProgress = toDatabaseWordProgress(localProgress, user.id);
        mergedData.push(cloudProgress);
      }
    }

    // Save merged data to cloud
    if (mergedData.length > 0) {
      const success = await saveCloudProgress(mergedData);
      if (success) {
        markSyncCompleted(user.id);
      }
    } else {
      markSyncCompleted(user.id);
    }
  } catch (error) {
    console.error("Error in syncLocalProgressToCloud:", error);
  }
}

/**
 * Check if cloud progress is enabled (user is logged in)
 */
export async function isCloudProgressEnabled(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user;
}

/**
 * Load all progress (cloud if logged in, otherwise localStorage)
 */
export async function loadProgress(): Promise<
  Map<string, WordProgress> | null
> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      // Not logged in, use localStorage
      return null;
    }

    // Load from Supabase
    const cloudData = await loadCloudProgress();
    if (cloudData.size === 0) {
      return null;
    }

    // Convert to WordProgress format (without requiring vocabulary lookup)
    const result = new Map<string, WordProgress>();

    for (const [wordId, dbProgress] of cloudData) {
      const wordProgress: WordProgress = {
        id: dbProgress.word_id,
        english: "",
        thai: "",
        partOfSpeech: "",
        correctCount: dbProgress.correct_count,
        wrongCount: dbProgress.wrong_count,
        attemptedCount: dbProgress.correct_count + dbProgress.wrong_count,
        mastered: dbProgress.status === "mastered",
        status: dbProgress.status,
        masteredAt: dbProgress.mastered_at || undefined,
        practicedTypes: dbProgress.practiced_types || [],
        correctTypes: dbProgress.correct_types || [],
        lastPracticedAt: dbProgress.last_practiced_at || undefined,
        lastWrongAt: dbProgress.last_wrong_at || undefined,
        nextReviewAt: dbProgress.next_review_at || undefined,
        reviewLevel: dbProgress.review_level || 0,
        reviewCount: dbProgress.review_count || 0,
      };
      result.set(wordId, wordProgress);
    }

    return result;
  } catch (error) {
    console.error("Error loading progress:", error);
    return null;
  }
}

/**
 * Get single word progress
 */
export async function getWordProgress(
  wordId: string,
  english: string,
  thai: string,
  partOfSpeech: string,
): Promise<WordProgress | null> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from("word_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("word_id", wordId)
      .single();

    if (error || !data) {
      return null;
    }

    return fromDatabaseWordProgress(
      data as DatabaseWordProgress,
      english,
      thai,
      partOfSpeech,
    );
  } catch (error) {
    console.error("Error loading word progress:", error);
    return null;
  }
}

/**
 * Save single word progress
 */
export async function saveWordProgress(
  progress: WordProgress,
): Promise<boolean> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      // Save to localStorage instead
      const store = loadProgressStore();
      store.words[progress.id] = progress;
      saveProgressStore(store);
      return true;
    }

    const dbProgress = toDatabaseWordProgress(progress, user.id);

    const { error } = await supabase
      .from("word_progress")
      .upsert([dbProgress], { onConflict: "user_id,word_id" });

    if (error) {
      console.error("Error saving word progress:", error);
      // Fallback to localStorage
      const store = loadProgressStore();
      store.words[progress.id] = progress;
      saveProgressStore(store);
      return false;
    }

    // Also update localStorage as cache
    const store = loadProgressStore();
    store.words[progress.id] = progress;
    saveProgressStore(store);

    return true;
  } catch (error) {
    console.error("Exception saving word progress:", error);
    // Fallback to localStorage
    const store = loadProgressStore();
    store.words[progress.id] = progress;
    saveProgressStore(store);
    return false;
  }
}

/**
 * Save multiple word progress records
 */
export async function saveManyWordProgress(
  progressList: WordProgress[],
): Promise<boolean> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      // Save to localStorage
      const store = loadProgressStore();
      for (const progress of progressList) {
        store.words[progress.id] = progress;
      }
      saveProgressStore(store);
      return true;
    }

    const dbList = progressList.map((p) => toDatabaseWordProgress(p, user.id));

    const { error } = await supabase
      .from("word_progress")
      .upsert(dbList, { onConflict: "user_id,word_id" });

    if (error) {
      console.error("Error saving many word progress:", error);
      // Fallback to localStorage
      const store = loadProgressStore();
      for (const progress of progressList) {
        store.words[progress.id] = progress;
      }
      saveProgressStore(store);
      return false;
    }

    // Also update localStorage as cache
    const store = loadProgressStore();
    for (const progress of progressList) {
      store.words[progress.id] = progress;
    }
    saveProgressStore(store);

    return true;
  } catch (error) {
    console.error("Exception saving many word progress:", error);
    // Fallback to localStorage
    const store = loadProgressStore();
    for (const progress of progressList) {
      store.words[progress.id] = progress;
    }
    saveProgressStore(store);
    return false;
  }
}

/**
 * Reset single word progress
 */
export async function resetWordProgress(wordId: string): Promise<boolean> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      // Delete from localStorage
      const store = loadProgressStore();
      delete store.words[wordId];
      saveProgressStore(store);
      return true;
    }

    const { error } = await supabase
      .from("word_progress")
      .delete()
      .eq("user_id", user.id)
      .eq("word_id", wordId);

    if (error) {
      console.error("Error resetting word progress:", error);
      return false;
    }

    // Also remove from localStorage
    const store = loadProgressStore();
    delete store.words[wordId];
    saveProgressStore(store);

    return true;
  } catch (error) {
    console.error("Exception resetting word progress:", error);
    return false;
  }
}

/**
 * Reset all progress
 */
export async function resetAllProgress(): Promise<boolean> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      // Clear localStorage
      const store = loadProgressStore();
      store.words = {};
      saveProgressStore(store);
      return true;
    }

    const { error } = await supabase
      .from("word_progress")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      console.error("Error resetting all progress:", error);
      return false;
    }

    // Also clear localStorage
    const store = loadProgressStore();
    store.words = {};
    saveProgressStore(store);

    return true;
  } catch (error) {
    console.error("Exception resetting all progress:", error);
    return false;
  }
}
