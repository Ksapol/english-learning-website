import { LessonDetail } from "../lesson-detail";
import { getLesson } from "../lessons-data";

export default function GreetingLessonPage() {
  return <LessonDetail lesson={getLesson("greeting")!} />;
}
