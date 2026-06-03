"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getWordProgress,
  isDueForReview,
  isNearMasteredWord,
  isWeakWord,
  loadProgressStore,
  resetAllProgress,
  resetWordProgress,
  saveProgressStore,
  type ProgressStore,
  type ProgressVocabularyWord,
  type WordProgress,
} from "@/lib/progress";
import { getCurrentUser, isCloudProgressEnabled } from "@/lib/progressRepository";
import { AuthButton } from "@/app/components/AuthButton";
import type { VocabularyPoolEntry } from "@/lib/vocabulary";

type ProgressDashboardProps = {
  partOfSpeechOptions: string[];
  totalVocabularyCount: number;
  countsByPartOfSpeech: Record<string, number>;
};

type StatusFilter = "all" | "mastered" | "learning" | "strong" | "weak" | "unseen" | "near-mastered";

function toProgressWord(entry: VocabularyPoolEntry): ProgressVocabularyWord {
  return {
    id: entry.id,
    english: entry.english,
    thai: entry.thai,
    partOfSpeech: entry.partOfSpeech,
  };
}

function getPercent(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

export function ProgressDashboard({
  partOfSpeechOptions,
  totalVocabularyCount,
  countsByPartOfSpeech,
}: ProgressDashboardProps) {
  const [store, setStore] = useState<ProgressStore | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [partOfSpeechFilter, setPartOfSpeechFilter] = useState("");
  const [isCloudEnabled, setIsCloudEnabled] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ email?: string } | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [entries, setEntries] = useState<VocabularyPoolEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setStore(loadProgressStore());
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const enabled = await isCloudProgressEnabled();
      setIsCloudEnabled(enabled);
      if (enabled) {
        const user = await getCurrentUser();
        setCurrentUser(user);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const qs = new URLSearchParams();
    qs.set("page", String(page));
    qs.set("pageSize", String(pageSize));
    if (query) qs.set("query", query);
    if (partOfSpeechFilter) qs.set("partOfSpeech", partOfSpeechFilter);

    fetch(`/api/progress-words?${qs.toString()}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setEntries(data.entries ?? []);
        setTotalCount(data.totalCount ?? 0);
      });

    return () => {
      cancelled = true;
    };
  }, [page, pageSize, query, partOfSpeechFilter]);

  const getProgressForEntry = (entry: VocabularyPoolEntry) => {
    if (!store) return undefined;
    return getWordProgress(store, toProgressWord(entry));
  };

  const attemptedWordsCount = useMemo(() => {
    if (!store) return 0;
    return Object.values(store.words).filter((w) => w.attemptedCount > 0).length;
  }, [store]);

  const summary = useMemo(() => {
    if (!store) {
      return {
        mastered: 0,
        learning: 0,
        unseen: totalVocabularyCount,
        weak: 0,
        nearMastered: 0,
        dueReview: 0,
      };
    }

    let mastered = 0;
    let learning = 0;
    let weak = 0;
    let nearMastered = 0;
    let dueReview = 0;

    for (const p of Object.values(store.words)) {
      if (p.mastered) mastered += 1;
      if (p.attemptedCount > 0 && !p.mastered) learning += 1;
      if (isWeakWord(p)) weak += 1;
      if (isNearMasteredWord(p)) nearMastered += 1;
      if (isDueForReview(p)) dueReview += 1;
    }

    const unseen = Math.max(0, totalVocabularyCount - attemptedWordsCount);

    return { mastered, learning, unseen, weak, nearMastered, dueReview };
  }, [store, totalVocabularyCount, attemptedWordsCount]);

  const categoryCounts = useMemo(() => {
    const totals: Record<string, { mastered: number; total: number; learning: number; unseen: number }> = {};

    // initialize totals from server counts
    for (const [pos, total] of Object.entries(countsByPartOfSpeech || {})) {
      totals[pos] = { mastered: 0, total, learning: 0, unseen: total };
    }

    // account for attempted words in store
    if (store) {
      for (const p of Object.values(store.words)) {
      const pos = p.partOfSpeech || "(unknown)";
      const posTotal = countsByPartOfSpeech[pos] ?? 0;
      if (!totals[pos]) {
        totals[pos] = { mastered: 0, total: posTotal, learning: 0, unseen: posTotal };
      }
      totals[pos].total = totals[pos].total ?? posTotal;

      if (p.mastered) {
        totals[pos].mastered += 1;
      } else if (p.attemptedCount > 0) {
        totals[pos].learning += 1;
      }

      if (p.attemptedCount > 0) {
        totals[pos].unseen = Math.max(0, (countsByPartOfSpeech[pos] ?? 0) - Object.values(store.words).filter((w) => w.partOfSpeech === pos && w.attemptedCount > 0).length);
      }
    }
    }

    return totals;
  }, [store, countsByPartOfSpeech]);

  function updateStore(nextStore: ProgressStore) {
    saveProgressStore(nextStore);
    setStore(nextStore);
  }

  const summaryCards = [
    {
      label: "เชี่ยวชาญแล้ว",
      value: `${summary.mastered.toLocaleString()} / ${totalVocabularyCount.toLocaleString()}`,
      helper: "mastered words / total useful words",
    },
    {
      label: "กำลังเรียน",
      value: summary.learning.toLocaleString(),
      helper: "เคยฝึกแล้วแต่ยังไม่ mastered",
    },
    {
      label: "ยังไม่เคยเห็น",
      value: summary.unseen.toLocaleString(),
      helper: "ยังไม่มี attempt",
    },
    {
      label: "คำอ่อน",
      value: summary.weak.toLocaleString(),
      helper: "wrong > correct หรือ wrong >= 3",
    },
    {
      label: "ใกล้เชี่ยวชาญ",
      value: summary.nearMastered.toLocaleString(),
      helper: "correct >= 7 แต่ยังไม่ mastered",
    },
    {
      label: "เปอร์เซ็นต์รวม",
      value: `${getPercent(summary.mastered, totalVocabularyCount)}%`,
      helper: "mastered / total useful words",
    },
    {
      label: "ครบกำหนดทบทวน",
      value: summary.dueReview.toLocaleString(),
      helper: "คำที่มี nextReviewAt ถึงวันนี้แล้ว",
    },
  ];

  const filteredEntries = useMemo(() => {
    if (!entries) return [];

    return entries.filter((entry) => {
      const progress = getProgressForEntry(entry) as WordProgress | undefined;

      if (partOfSpeechFilter && entry.partOfSpeech !== partOfSpeechFilter) return false;

      if (statusFilter === "mastered" && !progress?.mastered) return false;
      if (statusFilter === "learning" && progress?.status !== "learning") return false;
      if (statusFilter === "strong" && progress?.status !== "strong") return false;
      if (statusFilter === "weak" && !isWeakWord(progress)) return false;
      if (statusFilter === "unseen" && progress?.attemptedCount !== 0) return false;
      if (statusFilter === "near-mastered" && !isNearMasteredWord(progress)) return false;

      return true;
    });
  }, [entries, partOfSpeechFilter, statusFilter, store, getProgressForEntry]);

  return (
    <div className="space-y-8">
      {/* Sync Status / Login Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-slate-600">สถานะบันทึกความคืบหน้า</p>
            <p className="mt-2 text-lg font-bold text-slate-950">
              {isCloudEnabled ? (
                <span className="text-emerald-700">✓ กำลังบันทึกไปยังบัญชี ({currentUser?.email || "ผู้ใช้งาน"})</span>
              ) : (
                <span className="text-amber-700">เฉพาะเครื่องนี้ (localStorage)</span>
              )}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {isCloudEnabled
                ? "ความคืบหน้าของคุณจะถูกบันทึกในบัญชีและสามารถเข้าจากอุปกรณ์อื่นได้"
                : "เข้าสู่ระบบด้วย Google เพื่อบันทึกความคืบหน้าข้ามอุปกรณ์"}
            </p>
          </div>
          {!isCloudEnabled && (
            <div>
              <AuthButton />
            </div>
          )}
        </div>
      </section>

      {/* Summary Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-600">{card.label}</p>
            <p className="mt-2 text-3xl font-bold text-emerald-700">{card.value}</p>
            <p className="mt-2 text-sm text-slate-500">{card.helper}</p>
          </div>
        ))}
      </section>

      {/* Part of Speech Progress */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-bold">ความคืบหน้าตามชนิดคำ</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {partOfSpeechOptions.map((partOfSpeech) => {
            const counts = categoryCounts[partOfSpeech] ?? { mastered: 0, total: countsByPartOfSpeech[partOfSpeech] ?? 0, learning: 0, unseen: countsByPartOfSpeech[partOfSpeech] ?? 0 };

            return (
              <div key={partOfSpeech} className="rounded-xl bg-slate-50 p-4">
                <p className="text-lg font-bold">{partOfSpeech}</p>
                <p className="mt-1 text-sm text-slate-600">mastered {counts.mastered.toLocaleString()} / {counts.total.toLocaleString()} คำ</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-emerald-600" style={{ width: `${getPercent(counts.mastered, counts.total)}%` }} />
                </div>
                <p className="mt-2 text-sm font-semibold text-emerald-700">{getPercent(counts.mastered, counts.total)}%</p>
                <p className="mt-1 text-xs text-slate-500">learning {counts.learning.toLocaleString()} | unseen {counts.unseen.toLocaleString()}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Vocabulary Filter and Management */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <label className="flex-1">
            <span className="text-sm font-semibold text-slate-700">ค้นหา</span>
            <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" placeholder="ค้นด้วย id, English, Thai" />
          </label>
          <label>
            <span className="text-sm font-semibold text-slate-700">สถานะ</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100">
              <option value="all">ทั้งหมด</option>
              <option value="mastered">mastered</option>
              <option value="learning">learning</option>
              <option value="strong">strong</option>
              <option value="weak">weak</option>
              <option value="unseen">unseen</option>
              <option value="near-mastered">near-mastered</option>
            </select>
          </label>
          <label>
            <span className="text-sm font-semibold text-slate-700">ชนิดคำ</span>
            <select value={partOfSpeechFilter} onChange={(event) => { setPartOfSpeechFilter(event.target.value); setPage(1); }} className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100">
              <option value="">ทั้งหมด</option>
              {partOfSpeechOptions.map((partOfSpeech) => (
                <option key={partOfSpeech} value={partOfSpeech}>{partOfSpeech}</option>
              ))}
            </select>
          </label>
          <button type="button" onClick={() => { if (window.confirm("ต้องการล้างความคืบหน้าทั้งหมดใช่ไหม?")) { updateStore(resetAllProgress(store!)); } }} className="rounded-lg border border-rose-200 bg-rose-50 px-5 py-3 font-semibold text-rose-700 transition hover:bg-rose-100">Reset all</button>
        </div>

        {/* Vocabulary Table */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[1250px] border-separate border-spacing-y-2 text-left text-sm">
            <thead>
              <tr className="text-slate-600">
                <th className="px-3 py-2">id</th>
                <th className="px-3 py-2">English</th>
                <th className="px-3 py-2">Thai</th>
                <th className="px-3 py-2">ชนิดคำ</th>
                <th className="px-3 py-2">ถูก</th>
                <th className="px-3 py-2">ผิด</th>
                <th className="px-3 py-2">attempts</th>
                <th className="px-3 py-2">correct types</th>
                <th className="px-3 py-2">attempted types</th>
                <th className="px-3 py-2">status</th>
                <th className="px-3 py-2">next review</th>
                <th className="px-3 py-2">level</th>
                <th className="px-3 py-2">reviews</th>
                <th className="px-3 py-2">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => {
                const progress = getProgressForEntry(entry) as WordProgress;

                return (
                  <tr key={entry.id} className="bg-slate-50">
                    <td className="rounded-l-lg px-3 py-3">{entry.id}</td>
                    <td className="px-3 py-3 font-semibold">{entry.english}</td>
                    <td className="px-3 py-3">{entry.thai}</td>
                    <td className="px-3 py-3">{entry.partOfSpeech}</td>
                    <td className="px-3 py-3">{progress?.correctCount ?? 0}</td>
                    <td className="px-3 py-3">{progress?.wrongCount ?? 0}</td>
                    <td className="px-3 py-3">{progress?.attemptedCount ?? 0}</td>
                    <td className="px-3 py-3">{progress?.correctTypes?.join(", ") || "-"}</td>
                    <td className="px-3 py-3">{progress?.practicedTypes?.join(", ") || "-"}</td>
                    <td className="px-3 py-3">{progress?.mastered ? "mastered" : progress?.status ?? "new"}</td>
                    <td className="px-3 py-3">{progress?.nextReviewAt ? new Date(progress.nextReviewAt).toLocaleDateString() : "-"}</td>
                    <td className="px-3 py-3">{progress?.reviewLevel ?? 0}</td>
                    <td className="px-3 py-3">{progress?.reviewCount ?? 0}</td>
                    <td className="rounded-r-lg px-3 py-3">
                      <button type="button" onClick={() => { if (window.confirm(`Reset progress for ${entry.english}?`)) { updateStore(resetWordProgress(store!, entry.id)); } }} className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-700 transition hover:border-rose-300 hover:text-rose-700">Reset</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">แสดงรายการ {Math.min((page-1)*pageSize + 1, totalCount)} - {Math.min(page*pageSize, totalCount)} จาก {totalCount.toLocaleString()}</p>

          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded border px-3 py-2">Prev</button>
            <span>หน้า {page}</span>
            <button disabled={page * pageSize >= totalCount} onClick={() => setPage((p) => p + 1)} className="rounded border px-3 py-2">Next</button>
            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="ml-2 rounded border px-2 py-1">
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-500">หน้าโหลดเฉพาะ {pageSize} รายการต่อหน้าเพื่อหลีกเลี่ยงการส่งข้อมูลจำนวนมาก</p>
      </section>
    </div>
  );
}
