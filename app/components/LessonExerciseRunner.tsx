"use client";

import { useEffect, useMemo, useState } from "react";
import type { VocabularyPoolEntry } from "@/lib/vocabulary";

type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

type GeneratedExercise = {
  id: string;
  type:
    | "multiple-choice"
    | "vocabulary-choice"
    | "fill-in-the-blank"
    | "translation-en-to-th"
    | "translation-th-to-en"
    | "sentence-ordering";
  instructionTh: string;
  question: string;
  choices?: string[];
  correctAnswer?: string;
  correctAnswers?: string[];
  explanationTh: string;
};

type LessonExerciseRunnerProps = {
  lessonTitle: string;
  vocabularyPool: VocabularyPoolEntry[];
};

const QUIZ_SIZE = 10;
const MIN_CHOICE_POOL_SIZE = 4;

const difficultyOptions: Array<{
  level: DifficultyLevel;
  label: string;
  description: string;
  instruction: string;
}> = [
  {
    level: 1,
    label: "Level 1",
    description: "ง่ายมาก",
    instruction: "เห็นคำอังกฤษ แล้วเลือกความหมายภาษาไทยจาก 4 ตัวเลือก",
  },
  {
    level: 2,
    label: "Level 2",
    description: "ง่าย",
    instruction: "เห็นความหมายภาษาไทย แล้วเลือกคำอังกฤษจาก 4 ตัวเลือก",
  },
  {
    level: 3,
    label: "Level 3",
    description: "ปานกลาง",
    instruction: "พิมพ์คำอังกฤษจากความหมายหรือคำอธิบายภาษาไทย",
  },
  {
    level: 4,
    label: "Level 4",
    description: "ยาก",
    instruction: "ฝึกแบบผสม มีทั้งเลือกคำศัพท์ เติมคำ และแปลไทยเป็นอังกฤษ",
  },
  {
    level: 5,
    label: "Level 5",
    description: "ท้าทาย",
    instruction: "เน้นพิมพ์คำตอบ แปลสองทาง และเรียงคำเมื่อคำศัพท์เป็นวลี",
  },
];

function normalizeAnswer(value: string) {
  return value
    .trim()
    .toLocaleLowerCase()
    .replace(/[.?!,:;"'()[\]{}\-_/\\]/g, "")
    .replace(/\s+/g, " ");
}

function normalizeChoice(value: string) {
  return normalizeAnswer(value);
}

function shuffle<T>(items: T[]) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }

  return copy;
}

function getAnswerKey(entry: VocabularyPoolEntry) {
  return entry.id || `${entry.english}-${entry.thai}`;
}

function getUniqueVocabularyPool(pool: VocabularyPoolEntry[]) {
  const seen = new Set<string>();

  return pool.filter((entry) => {
    if (!entry.english.trim() || !entry.thai.trim()) {
      return false;
    }

    const key = `${normalizeAnswer(entry.english)}-${normalizeAnswer(entry.thai)}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function uniqueValues(values: string[]) {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const value of values) {
    const trimmedValue = value.trim();
    const key = normalizeChoice(trimmedValue);

    if (!trimmedValue || seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(trimmedValue);
  }

  return unique;
}

function makeChoices(
  pool: VocabularyPoolEntry[],
  current: VocabularyPoolEntry,
  field: "english" | "thai",
) {
  const correctAnswer = current[field].trim();
  const wrongChoices = uniqueValues(
    shuffle(pool)
      .filter((entry) => getAnswerKey(entry) !== getAnswerKey(current))
      .map((entry) => entry[field]),
  ).filter((choice) => normalizeChoice(choice) !== normalizeChoice(correctAnswer));
  const choices = uniqueValues([correctAnswer, ...wrongChoices]).slice(0, 4);

  if (!choices.some((choice) => normalizeChoice(choice) === normalizeChoice(correctAnswer))) {
    choices.unshift(correctAnswer);
  }

  return shuffle(choices).slice(0, 4);
}

function makeExplanation(entry: VocabularyPoolEntry) {
  const details = entry.definitionThai || entry.exampleThai || entry.relatedEnglish;

  return details
    ? `${entry.english} แปลว่า ${entry.thai}. ${details}`
    : `${entry.english} แปลว่า ${entry.thai}`;
}

function getPhraseWords(entry: VocabularyPoolEntry) {
  const source = entry.english.trim();

  if (!source.includes(" ")) {
    return [];
  }

  return source.split(/\s+/).filter(Boolean);
}

function getTypesForLevel(
  level: DifficultyLevel,
  canOrderSentence: boolean,
): GeneratedExercise["type"][] {
  if (level === 1) {
    return ["multiple-choice"];
  }

  if (level === 2) {
    return ["vocabulary-choice"];
  }

  if (level === 3) {
    return ["fill-in-the-blank"];
  }

  if (level === 4) {
    return ["vocabulary-choice", "fill-in-the-blank", "translation-th-to-en"];
  }

  return canOrderSentence
    ? ["translation-th-to-en", "translation-en-to-th", "sentence-ordering"]
    : ["translation-th-to-en", "translation-en-to-th", "fill-in-the-blank"];
}

function createExercise(
  entry: VocabularyPoolEntry,
  pool: VocabularyPoolEntry[],
  level: DifficultyLevel,
  index: number,
): GeneratedExercise | null {
  const phraseWords = getPhraseWords(entry);
  const canOrderSentence = phraseWords.length >= 3 && phraseWords.length <= 7;
  const types = getTypesForLevel(level, canOrderSentence);
  const type = types[index % types.length];

  if (type === "multiple-choice") {
    const choices = makeChoices(pool, entry, "thai");

    if (choices.length < MIN_CHOICE_POOL_SIZE) {
      return null;
    }

    return {
      id: `${entry.id}-${level}-${index}-en-th-choice`,
      type,
      instructionTh: "เลือกความหมายภาษาไทยที่ถูกต้อง",
      question: entry.english,
      choices,
      correctAnswer: entry.thai,
      explanationTh: makeExplanation(entry),
    };
  }

  if (type === "vocabulary-choice") {
    const choices = makeChoices(pool, entry, "english");

    if (choices.length < MIN_CHOICE_POOL_SIZE) {
      return null;
    }

    return {
      id: `${entry.id}-${level}-${index}-th-en-choice`,
      type,
      instructionTh: "เลือกคำศัพท์ภาษาอังกฤษที่ตรงกับความหมาย",
      question: entry.thai,
      choices,
      correctAnswer: entry.english,
      explanationTh: makeExplanation(entry),
    };
  }

  if (type === "translation-en-to-th") {
    return {
      id: `${entry.id}-${level}-${index}-en-th-typed`,
      type,
      instructionTh: "แปลอังกฤษเป็นไทย",
      question: entry.english,
      correctAnswer: entry.thai,
      explanationTh: `${makeExplanation(entry)} ระบบตรวจโดยตัดช่องว่างส่วนเกินและเครื่องหมายวรรคตอนง่ายๆ`,
    };
  }

  if (type === "translation-th-to-en") {
    return {
      id: `${entry.id}-${level}-${index}-th-en-typed`,
      type,
      instructionTh: "แปลไทยเป็นอังกฤษ",
      question: entry.thai,
      correctAnswer: entry.english,
      explanationTh: `${makeExplanation(entry)} ระบบไม่สนใจตัวพิมพ์ใหญ่เล็ก ช่องว่างส่วนเกิน และเครื่องหมายวรรคตอนง่ายๆ`,
    };
  }

  if (type === "sentence-ordering") {
    return {
      id: `${entry.id}-${level}-${index}-ordering`,
      type,
      instructionTh: "เรียงคำให้เป็นประโยคหรือวลี",
      question: "คลิกคำตามลำดับที่ถูกต้อง",
      choices: shuffle(phraseWords),
      correctAnswers: phraseWords,
      explanationTh: `คำตอบที่ถูกต้องคือ "${phraseWords.join(" ")}"`,
    };
  }

  return {
    id: `${entry.id}-${level}-${index}-fill`,
    type: "fill-in-the-blank",
    instructionTh: "พิมพ์คำศัพท์ภาษาอังกฤษให้ถูกต้อง",
    question: entry.definitionThai || entry.thai,
    correctAnswer: entry.english,
    explanationTh: `${makeExplanation(entry)} ระบบตรวจโดยตัดช่องว่างส่วนเกิน ตัวพิมพ์ใหญ่เล็ก และเครื่องหมายวรรคตอนง่ายๆ`,
  };
}

function getQuestionKey(exercise: GeneratedExercise) {
  return `${exercise.type}-${normalizeAnswer(exercise.question)}-${normalizeAnswer(
    exercise.correctAnswer ?? exercise.correctAnswers?.join(" ") ?? "",
  )}`;
}

function generateQuiz(
  vocabularyPool: VocabularyPoolEntry[],
  level: DifficultyLevel,
  previousSignature = "",
) {
  const usablePool = getUniqueVocabularyPool(vocabularyPool);
  let bestQuiz: GeneratedExercise[] = [];

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const seenQuestions = new Set<string>();
    const quiz: GeneratedExercise[] = [];

    for (const entry of shuffle(usablePool)) {
      const exercise = createExercise(entry, usablePool, level, quiz.length);

      if (!exercise) {
        continue;
      }

      const questionKey = getQuestionKey(exercise);

      if (seenQuestions.has(questionKey)) {
        continue;
      }

      seenQuestions.add(questionKey);
      quiz.push(exercise);

      if (quiz.length === Math.min(QUIZ_SIZE, usablePool.length)) {
        break;
      }
    }

    const signature = quiz.map((exercise) => exercise.id).join("|");

    if (quiz.length > bestQuiz.length) {
      bestQuiz = quiz;
    }

    if (quiz.length && signature !== previousSignature) {
      return quiz;
    }
  }

  return bestQuiz;
}

export function LessonExerciseRunner({
  lessonTitle,
  vocabularyPool,
}: LessonExerciseRunnerProps) {
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(1);
  const [quiz, setQuiz] = useState<GeneratedExercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [orderedIndexes, setOrderedIndexes] = useState<number[]>([]);
  const [isAnswered, setIsAnswered] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  const exercise = quiz[currentIndex];
  const progressPercent = quiz.length ? ((currentIndex + 1) / quiz.length) * 100 : 0;
  const selectedWords = useMemo(
    () => orderedIndexes.map((index) => exercise?.choices?.[index] ?? ""),
    [exercise, orderedIndexes],
  );
  const passingScore = Math.ceil(quiz.length * 0.7);
  const activeDifficulty = difficultyOptions.find(
    (option) => option.level === difficulty,
  );

  function resetAnswerState() {
    setSelectedChoice(null);
    setTextAnswer("");
    setOrderedIndexes([]);
    setIsAnswered(false);
    setWasCorrect(false);
  }

  function resetSessionState(nextQuiz: GeneratedExercise[]) {
    setQuiz(nextQuiz);
    setCurrentIndex(0);
    setScore(0);
    setIsComplete(false);
    setHasInitialized(true);
    resetAnswerState();
  }

  function startNewQuiz(level = difficulty) {
    const previousSignature = quiz.map((item) => item.id).join("|");
    resetSessionState(generateQuiz(vocabularyPool, level, previousSignature));
  }

  function retryCurrentQuiz() {
    setCurrentIndex(0);
    setScore(0);
    setIsComplete(false);
    resetAnswerState();
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuiz(generateQuiz(vocabularyPool, difficulty));
      setCurrentIndex(0);
      setScore(0);
      setIsComplete(false);
      setHasInitialized(true);
      resetAnswerState();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [difficulty, vocabularyPool]);

  function recordAnswer(correct: boolean) {
    if (isAnswered) {
      return;
    }

    setWasCorrect(correct);
    setIsAnswered(true);

    if (correct) {
      setScore((currentScore) => currentScore + 1);
    }
  }

  function handleTextSubmit() {
    if (!exercise) {
      return;
    }

    const correctAnswers = exercise.correctAnswers ?? [exercise.correctAnswer ?? ""];
    const correct = correctAnswers.some(
      (answer) => normalizeAnswer(answer) === normalizeAnswer(textAnswer),
    );

    recordAnswer(correct);
  }

  function handleSentenceSubmit() {
    const correct = selectedWords.join(" ") === exercise?.correctAnswers?.join(" ");
    recordAnswer(correct);
  }

  function handleNext() {
    if (currentIndex === quiz.length - 1) {
      setIsComplete(true);
      return;
    }

    setCurrentIndex((index) => index + 1);
    resetAnswerState();
  }

  if (getUniqueVocabularyPool(vocabularyPool).length < MIN_CHOICE_POOL_SIZE) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
        <h2 className="text-2xl font-bold">ยังมีคำศัพท์ไม่พอสำหรับสุ่มแบบฝึก</h2>
        <p className="mt-3 leading-7">
          บทเรียนนี้ต้องมีคำศัพท์ที่ไม่ซ้ำกันอย่างน้อย 4 คำเพื่อสร้างตัวเลือกหลายข้อ
          ลองเพิ่มคำใน CSV หรือปรับ keyword ของบทเรียน
        </p>
      </div>
    );
  }

  if (!exercise && !isComplete && !hasInitialized) {
    return (
      <div className="rounded-2xl bg-white p-6 text-slate-700 shadow-sm ring-1 ring-slate-200">
        กำลังสุ่มชุดแบบฝึก...
      </div>
    );
  }

  if (!exercise && !isComplete) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
        <h2 className="text-2xl font-bold">ยังสร้างแบบฝึกสำหรับระดับนี้ไม่ได้</h2>
        <p className="mt-3 leading-7">
          คำศัพท์ที่พบอาจมีตัวเลือกซ้ำมากเกินไปสำหรับระดับนี้
          ลองกด “สุ่มชุดใหม่” เปลี่ยนระดับความยาก หรือเพิ่มคำศัพท์ใน CSV
        </p>
        <button
          type="button"
          onClick={() => startNewQuiz(difficulty)}
          className="mt-5 rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700"
        >
          สุ่มชุดใหม่
        </button>
      </div>
    );
  }

  if (isComplete) {
    const passed = score >= passingScore;

    return (
      <div className="rounded-2xl bg-white p-6 text-slate-950 shadow-sm ring-1 ring-slate-200 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          {lessonTitle}
        </p>
        <h2 className="mt-2 text-3xl font-bold">
          คุณได้ {score} จาก {quiz.length} คะแนน
        </h2>
        <p className="mt-4 leading-7 text-slate-600">
          {passed
            ? "ผ่านแล้ว เยี่ยมมาก! คุณเข้าใจคำศัพท์ชุดนี้ดีขึ้นแล้ว"
            : "ยังไม่ผ่าน ลองสุ่มชุดใหม่หรือทบทวนคำศัพท์ก่อนอีกครั้ง"}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={retryCurrentQuiz}
            className="rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700"
          >
            ลองใหม่
          </button>
          <button
            type="button"
            onClick={() => startNewQuiz(difficulty)}
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-3 font-semibold text-emerald-800 transition hover:bg-emerald-100"
          >
            สุ่มชุดใหม่
          </button>
        </div>
      </div>
    );
  }

  const isChoiceExercise =
    exercise.type === "multiple-choice" || exercise.type === "vocabulary-choice";
  const isTypedExercise =
    exercise.type === "fill-in-the-blank" ||
    exercise.type === "translation-en-to-th" ||
    exercise.type === "translation-th-to-en";

  return (
    <div className="rounded-2xl bg-emerald-700 p-6 text-white shadow-sm sm:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-100">
            Vocabulary Practice
          </p>
          <h2 className="mt-2 text-2xl font-bold">
            ข้อ {currentIndex + 1} จาก {quiz.length}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-emerald-50">
            {activeDifficulty?.instruction}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {difficultyOptions.map((option) => (
            <button
              key={option.level}
              type="button"
              onClick={() => setDifficulty(option.level)}
              className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                difficulty === option.level
                  ? "bg-white text-emerald-800"
                  : "bg-white/15 text-white hover:bg-white/25"
              }`}
              title={option.instruction}
            >
              {option.label}: {option.description}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/20">
        <div
          className="h-full rounded-full bg-white transition-all"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="mt-6 rounded-xl bg-white p-5 text-slate-950">
        <p className="text-sm font-semibold text-emerald-700">
          {exercise.instructionTh}
        </p>
        <p className="mt-3 text-xl font-bold">{exercise.question}</p>
      </div>

      {isChoiceExercise ? (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {(exercise.choices ?? []).map((choice) => {
            const isSelected = selectedChoice === choice;
            const isCorrectAnswer =
              normalizeChoice(choice) === normalizeChoice(exercise.correctAnswer ?? "");
            const feedbackClass = isAnswered
              ? isCorrectAnswer
                ? "border-white bg-white text-emerald-800"
                : isSelected
                  ? "border-amber-200 bg-amber-100 text-amber-950"
                  : "border-white/20 bg-emerald-600 text-white"
              : "border-white/30 bg-white text-slate-800 hover:bg-emerald-50";

            return (
              <button
                key={choice}
                type="button"
                onClick={() => {
                  setSelectedChoice(choice);
                  recordAnswer(
                    normalizeChoice(choice) ===
                      normalizeChoice(exercise.correctAnswer ?? ""),
                  );
                }}
                className={`rounded-lg border px-4 py-3 text-left font-semibold transition ${feedbackClass}`}
              >
                {choice}
              </button>
            );
          })}
        </div>
      ) : null}

      {isTypedExercise ? (
        <div className="mt-5">
          <input
            value={textAnswer}
            onChange={(event) => setTextAnswer(event.target.value)}
            disabled={isAnswered}
            placeholder="พิมพ์คำตอบที่นี่"
            className="w-full rounded-lg border border-white/30 bg-white px-4 py-3 font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-white"
          />
          <button
            type="button"
            onClick={handleTextSubmit}
            disabled={!textAnswer.trim() || isAnswered}
            className="mt-3 rounded-lg bg-white px-5 py-3 font-semibold text-emerald-800 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ตรวจคำตอบ
          </button>
        </div>
      ) : null}

      {exercise.type === "sentence-ordering" ? (
        <div className="mt-5 space-y-4">
          <div className="min-h-16 rounded-lg bg-white/15 p-3">
            <p className="text-sm font-semibold text-emerald-50">คำตอบของคุณ</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedWords.length ? (
                selectedWords.map((word, index) => (
                  <span
                    key={`${word}-${index}`}
                    className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-emerald-800"
                  >
                    {word}
                  </span>
                ))
              ) : (
                <span className="text-sm text-emerald-50">ยังไม่ได้เลือกคำ</span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {(exercise.choices ?? []).map((word, index) => {
              const isUsed = orderedIndexes.includes(index);

              return (
                <button
                  key={`${word}-${index}`}
                  type="button"
                  onClick={() =>
                    setOrderedIndexes((current) =>
                      current.includes(index) ? current : [...current, index],
                    )
                  }
                  disabled={isUsed || isAnswered}
                  className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {word}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSentenceSubmit}
              disabled={!orderedIndexes.length || isAnswered}
              className="rounded-lg bg-white px-5 py-3 font-semibold text-emerald-800 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ตรวจคำตอบ
            </button>
            <button
              type="button"
              onClick={() => setOrderedIndexes([])}
              disabled={isAnswered || !orderedIndexes.length}
              className="rounded-lg border border-white/40 px-5 py-3 font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ล้างคำตอบ
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => startNewQuiz(difficulty)}
          className="rounded-lg border border-white/40 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
        >
          สุ่มชุดใหม่
        </button>
      </div>

      {isAnswered ? (
        <div
          className={`mt-5 rounded-lg p-4 text-sm leading-6 ${
            wasCorrect ? "bg-white text-emerald-800" : "bg-amber-100 text-amber-950"
          }`}
        >
          <p className="font-bold">
            {wasCorrect
              ? "ถูกต้อง!"
              : `ยังไม่ถูก คำตอบคือ ${
                  exercise.correctAnswer ?? exercise.correctAnswers?.join(" ")
                }`}
          </p>
          <p className="mt-2">{exercise.explanationTh}</p>
          <button
            type="button"
            onClick={handleNext}
            className="mt-4 rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700"
          >
            {currentIndex === quiz.length - 1 ? "ดูคะแนน" : "ถัดไป"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
