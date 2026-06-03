import Link from "next/link";
import { getVocabularySample } from "@/lib/vocabulary";

const practiceFlow = [
  {
    title: "เลือกกลุ่มคำ",
    description: "เริ่มจากเลือกชนิดคำจาก CSV เช่น N, V, ADJ หรือ ADV",
  },
  {
    title: "ฝึกคำศัพท์แบบสุ่ม",
    description: "ระบบสุ่มคำจากกลุ่มที่เลือก และสร้างคำถามหลายรูปแบบ",
  },
  {
    title: "ตอบถูกหลายรูปแบบ",
    description: "ฝึกทั้งเลือกคำตอบ พิมพ์อังกฤษ พิมพ์ไทย และอ่านคำจำกัดความ",
  },
  {
    title: "สะสมคำที่เชี่ยวชาญแล้ว",
    description: "คำจะเชี่ยวชาญเมื่อถูก 10 ครั้ง และถูกอย่างน้อย 3 รูปแบบคำถาม",
  },
];

const lessons = [
  {
    title: "Greeting",
    thaiTitle: "การทักทาย",
    description: "เริ่มพูดประโยคง่ายๆ เช่น Hello, Good morning และ How are you?",
    example: "Hello! Nice to meet you.",
  },
  {
    title: "Self Introduction",
    thaiTitle: "การแนะนำตัว",
    description: "ฝึกบอกชื่อ งาน บ้านเกิด และสิ่งที่ชอบด้วยประโยคสั้นๆ",
    example: "My name is Mali.",
  },
  {
    title: "Office English",
    thaiTitle: "อังกฤษในที่ทำงาน",
    description: "คำและประโยคที่ใช้คุยกับเพื่อนร่วมงาน ประชุม และขอความช่วยเหลือ",
    example: "Could you help me, please?",
  },
  {
    title: "Email English",
    thaiTitle: "อังกฤษสำหรับอีเมล",
    description: "เรียนรูปแบบอีเมลสุภาพ ตั้งแต่คำขึ้นต้นถึงคำลงท้าย",
    example: "Thank you for your email.",
  },
  {
    title: "Travel English",
    thaiTitle: "อังกฤษสำหรับเดินทาง",
    description: "ประโยคจำเป็นสำหรับสนามบิน โรงแรม ร้านอาหาร และการถามทาง",
    example: "Where is the train station?",
  },
];

export default function Home() {
  const vocabulary = getVocabularySample(12);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="bg-white">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-16 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
          <div>
            <p className="mb-4 inline-flex rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-800">
              เรียนอังกฤษพื้นฐานสำหรับคนไทย
            </p>
            <h1 className="text-4xl font-bold leading-tight text-slate-950 sm:text-5xl">
              เริ่มพูดอังกฤษได้ทีละนิด ด้วยบทเรียนที่เข้าใจง่าย
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              เว็บไซต์นี้ออกแบบสำหรับผู้เริ่มต้นชาวไทย เน้นคำศัพท์ใกล้ตัว
              ประโยคใช้งานจริง และแบบฝึกหัดสั้นๆ เพื่อให้กล้าพูดมากขึ้นทุกวัน
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/practice"
                className="rounded-lg bg-emerald-600 px-6 py-3 text-center font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                เริ่มฝึกคำศัพท์
              </Link>
              <Link
                href="#quiz"
                className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-center font-semibold text-slate-800 transition hover:border-emerald-500 hover:text-emerald-700"
              >
                ลองทำควิซ
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">Today&apos;s phrase</p>
              <p className="mt-3 text-3xl font-bold text-emerald-700">
                Nice to meet you.
              </p>
              <p className="mt-2 text-slate-600">ยินดีที่ได้รู้จัก</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-amber-100 p-4">
                <p className="text-2xl font-bold text-amber-800">5</p>
                <p className="text-sm text-amber-900">บทเรียนเริ่มต้น</p>
              </div>
              <div className="rounded-xl bg-sky-100 p-4">
                <p className="text-2xl font-bold text-sky-800">10 นาที</p>
                <p className="text-sm text-sky-900">ฝึกได้ทุกวัน</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="lessons" className="mx-auto w-full max-w-6xl px-6 py-14 sm:px-8">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Lessons
          </p>
          <h2 className="mt-2 text-3xl font-bold">เส้นทางฝึกคำศัพท์แบบใหม่</h2>
          <p className="mt-3 max-w-2xl text-slate-600">
            เลือกกลุ่มคำ ฝึกคำศัพท์แบบสุ่ม ตอบถูกหลายรูปแบบ
            แล้วสะสมคำที่เชี่ยวชาญแล้วในเครื่องของคุณ
          </p>
        </div>

        <div className="mb-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {practiceFlow.map((step, index) => (
            <article
              key={step.title}
              className="rounded-xl border border-emerald-100 bg-white p-5 shadow-sm"
            >
              <p className="text-sm font-bold text-emerald-700">Step {index + 1}</p>
              <h3 className="mt-2 text-xl font-bold">{step.title}</h3>
              <p className="mt-3 leading-7 text-slate-600">{step.description}</p>
            </article>
          ))}
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {lessons.map((lesson) => (
            <article
              key={lesson.title}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <p className="text-sm font-semibold text-emerald-700">{lesson.title}</p>
              <h3 className="mt-2 text-xl font-bold">{lesson.thaiTitle}</h3>
              <p className="mt-3 leading-7 text-slate-600">{lesson.description}</p>
              <p className="mt-4 rounded-lg bg-slate-100 p-3 text-sm font-medium text-slate-700">
                ตัวอย่าง: {lesson.example}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-14 sm:px-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                Vocabulary
              </p>
              <h2 className="mt-2 text-3xl font-bold">ตัวอย่างคำศัพท์จากคลังคำ</h2>
              <p className="mt-3 max-w-2xl text-slate-600">
                แสดงตัวอย่างเพียงบางส่วนจากไฟล์ CSV เพื่อให้หน้าแรกโหลดง่ายและอ่านสบาย
              </p>
            </div>
            <Link
              href="/vocabulary"
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-3 text-center font-semibold text-emerald-800 transition hover:border-emerald-500 hover:bg-emerald-100"
            >
              ดูคำศัพท์ทั้งหมด
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {vocabulary.map((item) => (
              <article
                key={item.id || `${item.english}-${item.thai}`}
                className="rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-sm"
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
                  <p className="mt-3 rounded-lg bg-white p-3 text-sm leading-6 text-slate-600">
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
        </div>
      </section>

      <section id="quiz" className="mx-auto w-full max-w-6xl px-6 py-14 sm:px-8">
        <div className="rounded-2xl bg-emerald-700 p-6 text-white shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-100">
            Quick Quiz
          </p>
          <h2 className="mt-2 text-3xl font-bold">ควิซสั้นๆ</h2>
          <p className="mt-3 text-emerald-50">
            คำว่า &quot;Thank you&quot; แปลว่าอะไร?
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-white px-4 py-3 font-semibold text-slate-800">
              ขอบคุณ
            </div>
            <div className="rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white ring-1 ring-white/30">
              สวัสดี
            </div>
            <div className="rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white ring-1 ring-white/30">
              ลาก่อน
            </div>
          </div>

          <p className="mt-5 rounded-lg bg-white/15 p-4 text-sm leading-6 text-emerald-50">
            เฉลย: &quot;Thank you&quot; แปลว่า &quot;ขอบคุณ&quot;
          </p>
        </div>
      </section>
    </main>
  );
}
