import Link from "next/link";
import { LessonExerciseRunner } from "@/app/components/LessonExerciseRunner";
import {
  getVocabularyPoolForLesson,
  getVocabularySearchResult,
} from "@/lib/vocabulary";
import type { Lesson } from "./lessons-data";

function getLessonVocabulary(lesson: Lesson) {
  const vocabularyById = new Map<string, ReturnType<typeof getVocabularySearchResult>["entries"][number]>();
  const keywords = lesson.vocabularyKeywords.length
    ? lesson.vocabularyKeywords
    : [lesson.vocabularyQuery];

  for (const keyword of keywords) {
    const { entries } = getVocabularySearchResult({
      limit: 6,
      query: keyword,
    });

    for (const entry of entries) {
      vocabularyById.set(entry.id || `${entry.english}-${entry.thai}`, entry);

      if (vocabularyById.size >= 6) {
        return [...vocabularyById.values()];
      }
    }
  }

  return [...vocabularyById.values()];
}

export function LessonDetail({ lesson }: { lesson: Lesson }) {
  const vocabulary = getLessonVocabulary(lesson);
  const vocabularyPool = getVocabularyPoolForLesson(lesson.vocabularyKeywords, 200);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-12 sm:px-8">
          <nav className="flex flex-wrap gap-3 text-sm font-semibold text-emerald-700">
            <Link href="/" className="transition hover:text-emerald-900">
              หน้าแรก
            </Link>
            <Link href="/lessons" className="transition hover:text-emerald-900">
              บทเรียนทั้งหมด
            </Link>
            <Link href="/vocabulary" className="transition hover:text-emerald-900">
              คำศัพท์ทั้งหมด
            </Link>
          </nav>
          <div className="mt-6 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              {lesson.title}
            </p>
            <h1 className="mt-2 text-4xl font-bold leading-tight sm:text-5xl">
              {lesson.thaiTitle}
            </h1>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              {lesson.description}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="rounded-full bg-sky-100 px-4 py-2 text-sm font-semibold text-sky-800">
                ระดับ: {lesson.difficulty}
              </span>
              <span className="rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-900">
                เวลาเรียน: {lesson.duration}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-5xl gap-6 px-6 py-10 sm:px-8 lg:grid-cols-[1fr_0.85fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold">คำอธิบายภาษาไทย</h2>
          <p className="mt-4 leading-8 text-slate-600">{lesson.explanation}</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold">วลีที่ใช้บ่อย</h2>
          <ul className="mt-4 space-y-3">
            {lesson.phrases.map((phrase) => (
              <li
                key={phrase}
                className="rounded-lg bg-emerald-50 p-3 text-sm font-medium leading-6 text-emerald-900"
              >
                {phrase}
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 pb-10 sm:px-8">
        <div className="mb-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Vocabulary
          </p>
          <h2 className="mt-2 text-2xl font-bold">คำศัพท์จากคลังคำ</h2>
        </div>

        {vocabulary.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {vocabulary.map((item) => (
              <article
                key={item.id || `${item.english}-${item.thai}`}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold">{item.english}</h3>
                    <p className="mt-1 text-slate-700">{item.thai}</p>
                  </div>
                  {item.partOfSpeech ? (
                    <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800">
                      {item.partOfSpeech}
                    </span>
                  ) : null}
                </div>
                {item.definitionThai ? (
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {item.definitionThai}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-5 text-slate-600 shadow-sm">
            ยังไม่มีคำศัพท์ที่ตรงกับหัวข้อนี้จากไฟล์ CSV
          </div>
        )}
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 pb-14 sm:px-8">
        <LessonExerciseRunner
          lessonTitle={lesson.thaiTitle}
          vocabularyPool={vocabularyPool}
        />
        {vocabularyPool.length < 10 ? (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            หมายเหตุ: บทเรียนนี้พบคำศัพท์ที่ตรงหัวข้อน้อยกว่า 10 คำ
            แบบฝึกอาจมีจำนวนข้อน้อยลงหรือมีตัวเลือกซ้ำน้อยกว่าปกติ
          </p>
        ) : null}
      </section>
    </main>
  );
}
