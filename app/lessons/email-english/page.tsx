import { LessonDetail } from "../lesson-detail";
import { getLesson } from "../lessons-data";

export default function EmailEnglishLessonPage() {
  return <LessonDetail lesson={getLesson("email-english")!} />;
}
