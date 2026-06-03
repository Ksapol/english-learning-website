import Link from "next/link";
import { lessons } from "./lessons-data";

export default function LessonsPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-12 sm:px-8">
          <nav className="flex flex-wrap gap-3 text-sm font-semibold text-emerald-700">
            <Link href="/" className="transition hover:text-emerald-900">
              หน้าแรก
            </Link>
            <Link href="/vocabulary" className="transition hover:text-emerald-900">
              คำศัพท์ทั้งหมด
            </Link>
          </nav>
          <div className="mt-6 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Lessons
            </p>
            <h1 className="mt-2 text-4xl font-bold leading-tight sm:text-5xl">
              บทเรียนภาษาอังกฤษสำหรับผู้เริ่มต้น
            </h1>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              เลือกบทเรียนที่ใช้ได้จริงในชีวิตประจำวัน ฝึกจากคำศัพท์ วลีตัวอย่าง
              คำอธิบายภาษาไทย และควิซสั้นๆ
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-12 sm:px-8">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {lessons.map((lesson) => (
            <Link
              key={lesson.slug}
              href={`/lessons/${lesson.slug}`}
              className="flex min-h-full flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <p className="text-sm font-semibold text-emerald-700">
                {lesson.title}
              </p>
              <h2 className="mt-2 text-2xl font-bold">{lesson.thaiTitle}</h2>
              <p className="mt-3 flex-1 leading-7 text-slate-600">
                {lesson.description}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800">
                  {lesson.difficulty}
                </span>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                  {lesson.duration}
                </span>
              </div>

              <span className="mt-6 rounded-lg bg-emerald-600 px-5 py-3 text-center font-semibold text-white shadow-sm transition hover:bg-emerald-700">
                เริ่มบทเรียน
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
