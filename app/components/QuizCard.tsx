"use client";

import { useState } from "react";

type QuizCardProps = {
  question: string;
  choices: string[];
  answer: string;
  explanation: string;
};

export function QuizCard({
  question,
  choices,
  answer,
  explanation,
}: QuizCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const hasAnswered = selectedAnswer !== null;
  const isCorrect = selectedAnswer === answer;

  return (
    <div className="rounded-2xl bg-emerald-700 p-6 text-white shadow-sm sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-wide text-emerald-100">
        Short Quiz
      </p>
      <h2 className="mt-2 text-2xl font-bold">แบบทดสอบสั้นๆ</h2>
      <p className="mt-3 text-emerald-50">{question}</p>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {choices.map((choice) => {
          const isSelected = selectedAnswer === choice;
          const isAnswer = choice === answer;
          const answeredClass = isAnswer
            ? "border-emerald-200 bg-white text-emerald-800"
            : "border-white/30 bg-emerald-600 text-white";
          const selectedClass = isSelected
            ? "ring-2 ring-white ring-offset-2 ring-offset-emerald-700"
            : "";

          return (
            <button
              key={choice}
              type="button"
              onClick={() => setSelectedAnswer(choice)}
              className={`rounded-lg border px-4 py-3 text-left font-semibold transition hover:bg-white hover:text-emerald-800 ${hasAnswered ? answeredClass : "border-white/30 bg-white text-slate-800"} ${selectedClass}`}
            >
              {choice}
            </button>
          );
        })}
      </div>

      {hasAnswered ? (
        <div
          className={`mt-5 rounded-lg p-4 text-sm leading-6 ${
            isCorrect ? "bg-white text-emerald-800" : "bg-amber-100 text-amber-950"
          }`}
        >
          <p className="font-bold">
            {isCorrect ? "ถูกต้อง!" : `ยังไม่ถูก คำตอบคือ ${answer}`}
          </p>
          <p className="mt-2">{explanation}</p>
        </div>
      ) : (
        <p className="mt-5 rounded-lg bg-white/15 p-4 text-sm leading-6 text-emerald-50">
          เลือกคำตอบเพื่อดูเฉลยและคำอธิบาย
        </p>
      )}
    </div>
  );
}
