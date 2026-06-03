import { ReviewPracticeRunner } from "@/app/components/ReviewPracticeRunner";
import { getAllUsefulVocabularyEntries } from "@/lib/vocabulary";

export default function ReviewPage() {
  const vocabulary = getAllUsefulVocabularyEntries();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-12 sm:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Review
          </p>
          <h1 className="mt-2 text-4xl font-bold leading-tight sm:text-5xl">
            ทบทวนคำศัพท์ตามรอบเวลา
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
            ระบบจะเลือกคำที่ถึงเวลาทบทวน โดยให้ความสำคัญกับคำอ่อน
            คำใกล้เชี่ยวชาญ และคำที่เชี่ยวชาญแล้วซึ่งครบกำหนดทบทวน
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-10 sm:px-8">
        <ReviewPracticeRunner vocabulary={vocabulary} />
      </section>
    </main>
  );
}
