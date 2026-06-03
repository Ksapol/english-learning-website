import { LessonDetail } from "../lesson-detail";
import { getLesson } from "../lessons-data";

export default function SelfIntroductionLessonPage() {
  return <LessonDetail lesson={getLesson("self-introduction")!} />;
}
