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
            {process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ? (
              "ความคืบหน้าจะซิงก์กับบัญชีผู้ใช้เมื่อคุณเข้าสู่ระบบ (ไม่รวมระหว่างผู้ใช้)"
            ) : (
              "ตอนนี้บันทึกบนเครื่องนี้เท่านั้น — เข้าสู่ระบบเพื่อซิงก์ข้ามอุปกรณ์"
            )}
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
