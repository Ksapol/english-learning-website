import { LessonDetail } from "../lesson-detail";
import { getLesson } from "../lessons-data";

export default function OfficeEnglishLessonPage() {
  return <LessonDetail lesson={getLesson("office-english")!} />;
}
