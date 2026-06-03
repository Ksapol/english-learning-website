import { LessonDetail } from "../lesson-detail";
import { getLesson } from "../lessons-data";

export default function TravelEnglishLessonPage() {
  return <LessonDetail lesson={getLesson("travel-english")!} />;
}
