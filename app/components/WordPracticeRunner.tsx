"use client";

import { useEffect, useMemo, useState } from "react";
import {
  loadProgressStore,
  markWordAsked,
  recordWordAnswer,
  saveProgressStore,
  type ProgressStore,
  type ProgressVocabularyWord,
} from "@/lib/progress";
import { saveWordProgress } from "@/lib/progressRepository";
import type { VocabularyEntry } from "@/lib/vocabulary";

type PracticeQuestionType =
  | "en-to-th-choice"
  | "th-to-en-choice"
  | "type-english"
  | "type-thai"
  | "definition-choice";

type PracticeQuestion = {
  id: string;
  type: PracticeQuestionType;
  word: ProgressVocabularyWord;
  instructionTh: string;
  question: string;
  choices?: string[];
  correctAnswer: string;
  explanationTh: string;
};

type WordPracticeRunnerProps = {
  partOfSpeech: string;
  vocabulary: VocabularyEntry[];
};

const SESSION_SIZE = 10;

function normalizeAnswer(value: string) {
  return value
    .trim()
    .toLocaleLowerCase()
    .replace(/[.?!,:;"'()[\]{}\-_/\\]/g, "")
    .replace(/\s+/g, " ");
}

function shuffle<T>(items: T[]) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }

  return copy;
}

function uniqueValues(values: string[]) {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const value of values) {
    const trimmedValue = value.trim();
    const key = normalizeAnswer(trimmedValue);

    if (!trimmedValue || seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(trimmedValue);
  }

  return unique;
}

function toProgressWord(entry: VocabularyEntry): ProgressVocabularyWord {
  return {
    id: entry.id,
    english: entry.english,
    thai: entry.thai,
    partOfSpeech: entry.partOfSpeech,
  };
}

function makeChoices(
  current: VocabularyEntry,
  vocabulary: VocabularyEntry[],
  field: "english" | "thai",
) {
  const correctAnswer = current[field];
  const wrongChoices = uniqueValues(
    shuffle(vocabulary)
      .filter((entry) => entry.id !== current.id)
      .map((entry) => entry[field]),
  ).filter((choice) => normalizeAnswer(choice) !== normalizeAnswer(correctAnswer));

  return shuffle(uniqueValues([correctAnswer, ...wrongChoices]).slice(0, 4));
}

function getQuestionTypes(word: VocabularyEntry): PracticeQuestionType[] {
  const types: PracticeQuestionType[] = [
    "en-to-th-choice",
    "th-to-en-choice",
    "type-english",
    "type-thai",
  ];

  if (word.definitionThai) {
    types.push("definition-choice");
  }

  return types;
}

function createQuestion(
  word: VocabularyEntry,
  vocabulary: VocabularyEntry[],
  index: number,
): PracticeQuestion | null {
  const type = shuffle(getQuestionTypes(word))[0];
  const explanationTh = word.definitionThai
    ? `${word.english} แปลว่า ${word.thai}. ${word.definitionThai}`
    : `${word.english} แปลว่า ${word.thai}`;

  if (type === "en-to-th-choice") {
    const choices = makeChoices(word, vocabulary, "thai");

    if (choices.length < 4) {
      return null;
    }

    return {
      id: `${word.id}-${type}-${index}`,
      type,
      word: toProgressWord(word),
      instructionTh: "เลือกความหมายภาษาไทยที่ถูกต้อง",
      question: word.english,
      choices,
      correctAnswer: word.thai,
      explanationTh,
    };
  }

  if (type === "th-to-en-choice" || type === "definition-choice") {
    const choices = makeChoices(word, vocabulary, "english");

    if (choices.length < 4) {
      return null;
    }

    return {
      id: `${word.id}-${type}-${index}`,
      type,
      word: toProgressWord(word),
      instructionTh:
        type === "definition-choice"
          ? "อ่านคำจำกัดความภาษาไทย แล้วเลือกคำอังกฤษ"
          : "เลือกคำอังกฤษที่ตรงกับความหมายภาษาไทย",
      question: type === "definition-choice" ? word.definitionThai : word.thai,
      choices,
      correctAnswer: word.english,
      explanationTh,
    };
  }

  return {
    id: `${word.id}-${type}-${index}`,
    type,
    word: toProgressWord(word),
    instructionTh:
      type === "type-english"
        ? "พิมพ์คำศัพท์ภาษาอังกฤษ"
        : "พิมพ์ความหมายภาษาไทย",
    question: type === "type-english" ? word.thai : word.english,
    correctAnswer: type === "type-english" ? word.english : word.thai,
    explanationTh:
      type === "type-english"
        ? `${explanationTh} ระบบไม่สนใจตัวพิมพ์ใหญ่เล็ก ช่องว่างเกิน และเครื่องหมายวรรคตอนง่ายๆ`
        : `${explanationTh} คำตอบภาษาไทยตรวจแบบตรงตัวหลังตัดช่องว่างและเครื่องหมายวรรคตอนง่ายๆ`,
  };
}

function generateSession({
  vocabulary,
  progressStore,
  includeMastered,
}: {
  vocabulary: VocabularyEntry[];
  progressStore: ProgressStore | null;
  includeMastered: boolean;
}) {
  const words = vocabulary.filter((word) => {
    if (includeMastered || !progressStore) {
      return true;
    }

    return !progressStore.words[word.id]?.mastered;
  });
  const questions: PracticeQuestion[] = [];
  const seenWordIds = new Set<string>();

  for (const word of shuffle(words)) {
    if (seenWordIds.has(word.id)) {
      continue;
    }

    const question = createQuestion(word, vocabulary, questions.length);

    if (!question) {
      continue;
    }

    seenWordIds.add(word.id);
    questions.push(question);

    if (questions.length >= SESSION_SIZE) {
      break;
    }
  }

  return questions;
}

export function WordPracticeRunner({
  partOfSpeech,
  vocabulary,
}: WordPracticeRunnerProps) {
  const [progressStore, setProgressStore] = useState<ProgressStore | null>(null);
  const [includeMastered, setIncludeMastered] = useState(false);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [isAnswered, setIsAnswered] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  const question = questions[currentIndex];
  const masteredCount = useMemo(() => {
    if (!progressStore) {
      return 0;
    }

    return vocabulary.filter((word) => progressStore.words[word.id]?.mastered).length;
  }, [progressStore, vocabulary]);

  function resetAnswerState() {
    setSelectedAnswer(null);
    setTypedAnswer("");
    setIsAnswered(false);
    setWasCorrect(false);
  }

  function startNewSession(store = progressStore, include = includeMastered) {
    setQuestions(
      generateSession({
        vocabulary,
        progressStore: store,
        includeMastered: include,
      }),
    );
    setCurrentIndex(0);
    setScore(0);
    setIsComplete(false);
    resetAnswerState();
    setHasInitialized(true);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const store = loadProgressStore();
      setProgressStore(store);
      setQuestions(
        generateSession({
          vocabulary,
          progressStore: store,
          includeMastered,
        }),
      );
      setCurrentIndex(0);
      setScore(0);
      setIsComplete(false);
      resetAnswerState();
      setHasInitialized(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [includeMastered, vocabulary]);

  async function saveAnswer(correct: boolean, answeredQuestion: PracticeQuestion) {
    if (!progressStore) {
      return;
    }

    const askedStore = markWordAsked(progressStore, answeredQuestion.word);
    const nextStore = recordWordAnswer({
      store: askedStore,
      word: answeredQuestion.word,
      questionType: answeredQuestion.type,
      correct,
    });

    // Save to localStorage immediately
    saveProgressStore(nextStore);
    setProgressStore(nextStore);

    // Try to save to cloud if logged in
    const updatedProgress = nextStore.words[answeredQuestion.word.id];
    if (updatedProgress) {
      await saveWordProgress(updatedProgress);
    }
  }

  function recordAnswer(correct: boolean) {
    if (!question || isAnswered) {
      return;
    }

    setWasCorrect(correct);
    setIsAnswered(true);
    saveAnswer(correct, question);

    if (correct) {
      setScore((currentScore) => currentScore + 1);
    }
  }

  function handleNext() {
    if (currentIndex === questions.length - 1) {
      setIsComplete(true);
      return;
    }

    setCurrentIndex((index) => index + 1);
    resetAnswerState();
  }

  function retrySession() {
    setCurrentIndex(0);
    setScore(0);
    setIsComplete(false);
    resetAnswerState();
  }

  if (!hasInitialized) {
    return (
      <div className="rounded-2xl bg-white p-6 text-slate-700 shadow-sm ring-1 ring-slate-200">
        กำลังเตรียมแบบฝึก...
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
        <h2 className="text-2xl font-bold">คุณเชี่ยวชาญคำในกลุ่มนี้ครบแล้ว</h2>
        <p className="mt-3 leading-7">
          ลองเลือกกลุ่มอื่น หรือเปิดตัวเลือกรวมคำที่เชี่ยวชาญแล้ว
        </p>
        <label className="mt-5 flex items-center gap-3 text-sm font-semibold">
          <input
            type="checkbox"
            checked={includeMastered}
            onChange={(event) => setIncludeMastered(event.target.checked)}
            className="h-4 w-4"
          />
          รวมคำที่เชี่ยวชาญแล้ว
        </label>
      </div>
    );
  }

  if (isComplete) {
    const passed = score >= Math.ceil(questions.length * 0.7);

    return (
      <div className="rounded-2xl bg-white p-6 text-slate-950 shadow-sm ring-1 ring-slate-200 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          Practice {partOfSpeech}
        </p>
        <h2 className="mt-2 text-3xl font-bold">
          คุณได้ {score} จาก {questions.length} คะแนน
        </h2>
        <p className="mt-4 leading-7 text-slate-600">
          {passed
            ? "ผ่านแล้ว ดีมาก! คำที่ตอบถูกจะสะสมความคืบหน้าในเครื่องนี้"
            : "ยังไม่ผ่าน ลองสุ่มชุดใหม่หรือฝึกชุดเดิมอีกครั้ง"}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={retrySession}
            className="rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700"
          >
            ลองใหม่
          </button>
          <button
            type="button"
            onClick={() => startNewSession()}
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-3 font-semibold text-emerald-800 transition hover:bg-emerald-100"
          >
            สุ่มชุดใหม่
          </button>
        </div>
      </div>
    );
  }

  const isTypedQuestion =
    question.type === "type-english" || question.type === "type-thai";
  const progressPercent = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="rounded-2xl bg-emerald-700 p-6 text-white shadow-sm sm:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-100">
            Part of Speech: {partOfSpeech}
          </p>
          <h2 className="mt-2 text-2xl font-bold">
            ข้อ {currentIndex + 1} จาก {questions.length}
          </h2>
          <p className="mt-2 text-sm text-emerald-50">
            เชี่ยวชาญแล้ว {masteredCount.toLocaleString()} /{" "}
            {vocabulary.length.toLocaleString()} คำในกลุ่มนี้
          </p>
        </div>
        <label className="flex items-center gap-3 rounded-lg bg-white/15 px-4 py-3 text-sm font-semibold">
          <input
            type="checkbox"
            checked={includeMastered}
            onChange={(event) => setIncludeMastered(event.target.checked)}
            className="h-4 w-4"
          />
          รวมคำที่เชี่ยวชาญแล้ว
        </label>
      </div>

      <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/20">
        <div
          className="h-full rounded-full bg-white transition-all"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="mt-6 rounded-xl bg-white p-5 text-slate-950">
        <p className="text-sm font-semibold text-emerald-700">
          {question.instructionTh}
        </p>
        <p className="mt-3 text-xl font-bold">{question.question}</p>
      </div>

      {question.choices ? (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {question.choices.map((choice) => {
            const isSelected = selectedAnswer === choice;
            const isCorrect =
              normalizeAnswer(choice) === normalizeAnswer(question.correctAnswer);
            const feedbackClass = isAnswered
              ? isCorrect
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
                  setSelectedAnswer(choice);
                  recordAnswer(isCorrect);
                }}
                className={`rounded-lg border px-4 py-3 text-left font-semibold transition ${feedbackClass}`}
              >
                {choice}
              </button>
            );
          })}
        </div>
      ) : null}

      {isTypedQuestion ? (
        <div className="mt-5">
          <input
            value={typedAnswer}
            onChange={(event) => setTypedAnswer(event.target.value)}
            disabled={isAnswered}
            placeholder="พิมพ์คำตอบที่นี่"
            className="w-full rounded-lg border border-white/30 bg-white px-4 py-3 font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-white"
          />
          <button
            type="button"
            onClick={() =>
              recordAnswer(
                normalizeAnswer(typedAnswer) === normalizeAnswer(question.correctAnswer),
              )
            }
            disabled={!typedAnswer.trim() || isAnswered}
            className="mt-3 rounded-lg bg-white px-5 py-3 font-semibold text-emerald-800 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ตรวจคำตอบ
          </button>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => startNewSession()}
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
            {wasCorrect ? "ถูกต้อง!" : `ยังไม่ถูก คำตอบคือ ${question.correctAnswer}`}
          </p>
          <p className="mt-2">{question.explanationTh}</p>
          <button
            type="button"
            onClick={handleNext}
            className="mt-4 rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700"
          >
            {currentIndex === questions.length - 1 ? "ดูคะแนน" : "ถัดไป"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
