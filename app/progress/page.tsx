import { ProgressDashboard } from "@/app/components/ProgressDashboardClient";
import {
  getVocabularyPartOfSpeechOptions,
  getVocabularyTotalCount,
} from "@/lib/vocabulary";
import { getVocabularyCountsByPartOfSpeech } from "@/lib/vocabularyServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function ProgressPage() {
  const totalVocabularyCount = getVocabularyTotalCount();
  const partOfSpeechOptions = getVocabularyPartOfSpeechOptions();
  const countsByPartOfSpeech = getVocabularyCountsByPartOfSpeech();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-12 sm:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Progress
          </p>
          <h1 className="mt-2 text-4xl font-bold leading-tight sm:text-5xl">
            ความคืบหน้าการฝึกคำศัพท์
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
            ความคืบหน้านี้เก็บใน localStorage ของเครื่องนี้เท่านั้น
            ยังไม่มีบัญชีผู้ใช้หรือฐานข้อมูล
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-10 sm:px-8">
        <ProgressDashboard
          partOfSpeechOptions={partOfSpeechOptions}
          totalVocabularyCount={totalVocabularyCount}
          countsByPartOfSpeech={countsByPartOfSpeech}
        />
      </section>
    </main>
  );
}
