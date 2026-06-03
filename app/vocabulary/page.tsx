import Link from "next/link";
import {
  getVocabularySearchResult,
  getVocabularyPartOfSpeechOptions,
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

export default async function VocabularyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = getSearchParam(params, "q").trim();
  const partOfSpeech = getSearchParam(params, "partOfSpeech").trim();
  const { entries: vocabulary, totalCount } = getVocabularySearchResult({
    limit: 100,
    query,
    partOfSpeech,
  });
  const partOfSpeechOptions = getVocabularyPartOfSpeechOptions();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-12 sm:px-8">
          <nav className="flex flex-wrap gap-3 text-sm font-semibold text-emerald-700">
            <Link href="/" className="transition hover:text-emerald-900">
              หน้าแรก
            </Link>
            <Link href="/lessons" className="transition hover:text-emerald-900">
              บทเรียนทั้งหมด
            </Link>
          </nav>
          <div className="mt-6 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Vocabulary
            </p>
            <h1 className="mt-2 text-4xl font-bold leading-tight sm:text-5xl">
              คลังคำศัพท์อังกฤษสำหรับผู้เริ่มต้น
            </h1>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              ค้นหาคำศัพท์จากไฟล์ CSV ด้วยคำอังกฤษ คำไทย คำค้นภาษาไทย
              หรือคำอังกฤษที่เกี่ยวข้อง โดยแสดงครั้งละไม่เกิน 100 รายการเพื่อให้หน้าเว็บเบาและใช้งานง่าย
            </p>
          </div>

          <form
            action="/vocabulary"
            className="mt-8 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[1fr_220px_auto] sm:items-end"
          >
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">ค้นหาคำศัพท์</span>
              <input
                name="q"
                type="search"
                defaultValue={query}
                placeholder="เช่น hello, ขอบคุณ, email"
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">ชนิดคำ</span>
              <select
                name="partOfSpeech"
                defaultValue={partOfSpeech}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="">ทั้งหมด</option>
                {partOfSpeechOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-700 sm:flex-none"
              >
                ค้นหา
              </button>
              <Link
                href="/vocabulary"
                className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-center font-semibold text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700"
              >
                ล้าง
              </Link>
            </div>
          </form>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-10 sm:px-8">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">ผลลัพธ์คำศัพท์</h2>
            <p className="mt-2 text-slate-600">
              พบ {vocabulary.length} รายการแรกจากทั้งหมด{" "}
              {totalCount.toLocaleString()} รายการ
            </p>
          </div>
          <p className="rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-900">
            จำกัด 100 รายการต่อหน้า
          </p>
        </div>

        {vocabulary.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {vocabulary.map((item) => (
              <article
                key={item.id || `${item.english}-${item.thai}`}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold text-slate-950">{item.english}</h3>
                    <p className="mt-1 text-lg text-slate-700">{item.thai}</p>
                  </div>
                  {item.partOfSpeech ? (
                    <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800">
                      {item.partOfSpeech}
                    </span>
                  ) : null}
                </div>

                {item.definitionThai ? (
                  <p className="mt-4 text-sm leading-6 text-slate-600">
                    <span className="font-semibold text-slate-800">ความหมาย: </span>
                    {item.definitionThai}
                  </p>
                ) : null}

                {item.exampleThai ? (
                  <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-600">
                    <span className="font-semibold text-slate-800">ตัวอย่าง: </span>
                    {item.exampleThai}
                  </p>
                ) : null}

                {item.relatedEnglish ? (
                  <p className="mt-3 text-sm leading-6 text-emerald-700">
                    <span className="font-semibold">คำที่เกี่ยวข้อง: </span>
                    {item.relatedEnglish}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-2xl font-bold">ไม่พบคำศัพท์ที่ค้นหา</h2>
            <p className="mt-3 text-slate-600">
              ลองใช้คำค้นที่สั้นลง หรือเปลี่ยนชนิดคำแล้วค้นหาอีกครั้ง
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
