"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getWordProgress,
  isDueForReview,
  isNearMasteredWord,
  isWeakWord,
  loadProgressStore,
  recordWordAnswer,
  saveProgressStore,
  type ProgressStore,
  type ProgressVocabularyWord,
} from "@/lib/progress";
import { saveWordProgress } from "@/lib/progressRepository";
import type { VocabularyEntry } from "@/lib/vocabulary";

type ReviewQuestionType =
  | "en-to-th-choice"
  | "th-to-en-choice"
  | "type-english"
  | "type-thai"
  | "definition-choice";

type ReviewQuestion = {
  id: string;
  type: ReviewQuestionType;
  word: ProgressVocabularyWord;
  instructionTh: string;
  question: string;
  choices?: string[];
  correctAnswer: string;
  explanationTh: string;
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

function getQuestionTypes(word: VocabularyEntry): ReviewQuestionType[] {
  const types: ReviewQuestionType[] = [
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
): ReviewQuestion | null {
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
      instructionTh: "ทบทวน: เลือกความหมายภาษาไทย",
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
          ? "ทบทวน: อ่านคำจำกัดความ แล้วเลือกคำอังกฤษ"
          : "ทบทวน: เลือกคำอังกฤษ",
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
        ? "ทบทวน: พิมพ์คำอังกฤษ"
        : "ทบทวน: พิมพ์ความหมายภาษาไทย",
    question: type === "type-english" ? word.thai : word.english,
    correctAnswer: type === "type-english" ? word.english : word.thai,
    explanationTh,
  };
}

function isToday(value?: string) {
  if (!value) {
    return false;
  }

  return new Date(value).toDateString() === new Date().toDateString();
}

function getDueEntries(vocabulary: VocabularyEntry[], store: ProgressStore) {
  return vocabulary
    .map((entry) => ({
      entry,
      progress: getWordProgress(store, toProgressWord(entry)),
    }))
    .filter(({ progress }) => isDueForReview(progress))
    .sort((first, second) => {
      const firstWeak = isWeakWord(first.progress) ? 1 : 0;
      const secondWeak = isWeakWord(second.progress) ? 1 : 0;

      if (firstWeak !== secondWeak) {
        return secondWeak - firstWeak;
      }

      const firstNear = isNearMasteredWord(first.progress) ? 1 : 0;
      const secondNear = isNearMasteredWord(second.progress) ? 1 : 0;

      if (firstNear !== secondNear) {
        return secondNear - firstNear;
      }

      const firstMastered = first.progress.mastered ? 1 : 0;
      const secondMastered = second.progress.mastered ? 1 : 0;

      return secondMastered - firstMastered;
    });
}

function generateSession(vocabulary: VocabularyEntry[], store: ProgressStore) {
  const dueEntries = getDueEntries(vocabulary, store);
  const questions: ReviewQuestion[] = [];

  for (const { entry } of dueEntries) {
    const question = createQuestion(entry, vocabulary, questions.length);

    if (!question) {
      continue;
    }

    questions.push(question);

    if (questions.length >= SESSION_SIZE) {
      break;
    }
  }

  return questions;
}

export function ReviewPracticeRunner() {
  const [store, setStore] = useState<ProgressStore | null>(null);
  const [vocabulary, setVocabulary] = useState<VocabularyEntry[]>([]);
  const [questions, setQuestions] = useState<ReviewQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [isAnswered, setIsAnswered] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  const question = questions[currentIndex];
  const summary = useMemo(() => {
    if (!store) {
      return { due: 0, weakDue: 0, masteredDue: 0, reviewedToday: 0 };
    }

    const due = getDueEntries(vocabulary, store);
    const reviewedToday = Object.values(store.words).filter((progress) =>
      isToday(progress.lastPracticedAt),
    ).length;

    return {
      due: due.length,
      weakDue: due.filter(({ progress }) => isWeakWord(progress)).length,
      masteredDue: due.filter(({ progress }) => progress.mastered).length,
      reviewedToday,
    };
  }, [store, vocabulary]);

  function resetAnswerState() {
    setSelectedAnswer(null);
    setTypedAnswer("");
    setIsAnswered(false);
    setWasCorrect(false);
  }

  function startSession(nextStore = store) {
    if (!nextStore) {
      return;
    }

    setQuestions(generateSession(vocabulary, nextStore));
    setCurrentIndex(0);
    setScore(0);
    setIsComplete(false);
    resetAnswerState();
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextStore = loadProgressStore();
      setStore(nextStore);
      setHasInitialized(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/progress-words?page=1&pageSize=40`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setVocabulary(data.entries ?? []);
        // generate initial session once vocabulary and store are ready
        setQuestions((prev) => {
          if (prev.length) return prev;
          return generateSession(data.entries ?? [], store ?? loadProgressStore());
        });
      })
      .catch(() => {
        // ignore errors; keep vocabulary empty
      });

    return () => {
      cancelled = true;
    };
  }, [store]);

  async function saveAnswer(correct: boolean, answeredQuestion: ReviewQuestion) {
    if (!store) {
      return;
    }

    const nextStore = recordWordAnswer({
      store,
      word: answeredQuestion.word,
      questionType: answeredQuestion.type,
      correct,
    });

    saveProgressStore(nextStore);
    setStore(nextStore);

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

  if (!hasInitialized) {
    return (
      <div className="rounded-2xl bg-white p-6 text-slate-700 shadow-sm ring-1 ring-slate-200">
        กำลังโหลดคำที่ถึงเวลาทบทวน...
      </div>
    );
  }

  const cards = [
    { label: "ครบกำหนดวันนี้", value: summary.due },
    { label: "คำอ่อนที่ครบกำหนด", value: summary.weakDue },
    { label: "mastered ที่ครบกำหนด", value: summary.masteredDue },
    { label: "ทบทวนแล้ววันนี้", value: summary.reviewedToday },
  ];

  if (!questions.length) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <div key={card.label} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm font-semibold text-slate-600">{card.label}</p>
              <p className="mt-2 text-3xl font-bold text-emerald-700">
                {card.value.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-950">
          <h2 className="text-2xl font-bold">ยังไม่มีคำที่ต้องทบทวนตอนนี้</h2>
          <p className="mt-3 leading-7">
            เมื่อคุณฝึกคำศัพท์ในหน้า Practice ระบบจะกำหนดวันทบทวนให้อัตโนมัติ
          </p>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="rounded-2xl bg-white p-6 text-slate-950 shadow-sm ring-1 ring-slate-200 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          Review Complete
        </p>
        <h2 className="mt-2 text-3xl font-bold">
          คุณได้ {score} จาก {questions.length} คะแนน
        </h2>
        <button
          type="button"
          onClick={() => startSession()}
          className="mt-6 rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700"
        >
          ทบทวนชุดถัดไป
        </button>
      </div>
    );
  }

  const isTypedQuestion = question.type === "type-english" || question.type === "type-thai";
  const progressPercent = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-semibold text-slate-600">{card.label}</p>
            <p className="mt-2 text-3xl font-bold text-emerald-700">
              {card.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-emerald-700 p-6 text-white shadow-sm sm:p-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-100">
            Spaced Review
          </p>
          <h2 className="mt-2 text-2xl font-bold">
            ข้อ {currentIndex + 1} จาก {questions.length}
          </h2>
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
                  normalizeAnswer(typedAnswer) ===
                    normalizeAnswer(question.correctAnswer),
                )
              }
              disabled={!typedAnswer.trim() || isAnswered}
              className="mt-3 rounded-lg bg-white px-5 py-3 font-semibold text-emerald-800 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ตรวจคำตอบ
            </button>
          </div>
        ) : null}

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
    </div>
  );
}
