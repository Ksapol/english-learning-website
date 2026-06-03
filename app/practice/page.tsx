import Link from "next/link";
import { WordPracticeRunner } from "@/app/components/WordPracticeRunner";
import {
  getAllUsefulVocabularyEntries,
  getVocabularyByPartOfSpeech,
  getVocabularyPartOfSpeechOptions,
  getVocabularyTotalCount,
} from "@/lib/vocabulary";

function getSearchParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];

  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default async function PracticePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const selectedCategory = getSearchParam(params, "cat").trim();
  const categories = getVocabularyPartOfSpeechOptions();
  const vocabulary = selectedCategory
    ? getVocabularyByPartOfSpeech(selectedCategory)
    : [];
  const totalCount = getVocabularyTotalCount();
  const categoryCounts = getAllUsefulVocabularyEntries().reduce<Record<string, number>>(
    (counts, entry) => {
      counts[entry.partOfSpeech] = (counts[entry.partOfSpeech] ?? 0) + 1;
      return counts;
    },
    {},
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-12 sm:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Practice
          </p>
          <h1 className="mt-2 text-4xl font-bold leading-tight sm:text-5xl">
            ฝึกคำศัพท์ตามชนิดคำ
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
            เลือกกลุ่มคำจากช่อง t-cat ในไฟล์ CSV แล้วฝึกคำศัพท์แบบสุ่ม
            คำจะเชี่ยวชาญเมื่อคุณตอบถูก 10 ครั้ง และเคยตอบถูกอย่างน้อย 3 รูปแบบคำถาม
          </p>
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-600">
              จำนวนคำศัพท์ทั้งหมดจาก CSV
            </p>
            <p className="mt-1 text-3xl font-bold text-emerald-700">
              {totalCount.toLocaleString()} คำ
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-10 sm:px-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">เลือกกลุ่มคำ</h2>
          <p className="mt-2 text-slate-600">
            กลุ่มคำมาจากคอลัมน์ t-cat เช่น N, V, ADJ, ADV
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category}
              href={`/practice?cat=${encodeURIComponent(category)}`}
              className={`rounded-xl border p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md ${
                selectedCategory === category
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-slate-200 bg-white"
              }`}
            >
              <p className="text-xl font-bold">{category}</p>
              <p className="mt-1 text-sm text-slate-600">
                {(categoryCounts[category] ?? 0).toLocaleString()} คำ
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-14 sm:px-8">
        {selectedCategory ? (
          <WordPracticeRunner
            partOfSpeech={selectedCategory}
            vocabulary={vocabulary}
          />
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-2xl font-bold">เริ่มจากเลือกกลุ่มคำ</h2>
            <p className="mt-3 text-slate-600">
              เมื่อเลือก N, V, ADJ หรือกลุ่มอื่น ระบบจะสุ่มคำศัพท์จากกลุ่มนั้นให้ฝึก
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
