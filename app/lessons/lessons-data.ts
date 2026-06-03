export type Lesson = {
  slug: string;
  title: string;
  thaiTitle: string;
  description: string;
  difficulty: string;
  duration: string;
  vocabularyQuery: string;
  vocabularyKeywords: string[];
  explanation: string;
  phrases: string[];
};

export const lessons: Lesson[] = [
  {
    slug: "greeting",
    title: "Greeting",
    thaiTitle: "การทักทาย",
    description: "ฝึกคำทักทายพื้นฐาน การถามสารทุกข์สุกดิบ และการตอบกลับอย่างสุภาพ",
    difficulty: "เริ่มต้น",
    duration: "10 นาที",
    vocabularyQuery: "hello",
    vocabularyKeywords: ["hello", "good", "morning", "welcome", "meet", "thanks"],
    explanation:
      "บทเรียนนี้ช่วยให้ผู้เริ่มต้นทักทายเป็นภาษาอังกฤษได้อย่างมั่นใจ เริ่มจากประโยคสั้นๆ ที่ใช้ได้จริง เช่น การพูดสวัสดี การถามว่าอีกฝ่ายสบายดีไหม และการบอกว่ายินดีที่ได้รู้จัก",
    phrases: [
      "Hello. - สวัสดี",
      "Good morning. - สวัสดีตอนเช้า",
      "How are you? - คุณสบายดีไหม",
      "Nice to meet you. - ยินดีที่ได้รู้จัก",
    ],
  },
  {
    slug: "self-introduction",
    title: "Self Introduction",
    thaiTitle: "การแนะนำตัว",
    description: "ฝึกบอกชื่อ อาชีพ บ้านเกิด และข้อมูลพื้นฐานเกี่ยวกับตัวเอง",
    difficulty: "เริ่มต้น",
    duration: "12 นาที",
    vocabularyQuery: "name",
    vocabularyKeywords: ["name", "introduce", "from", "work", "job", "live"],
    explanation:
      "การแนะนำตัวเป็นทักษะแรกๆ ที่ควรฝึก เพราะใช้ได้ในห้องเรียน ที่ทำงาน และสถานการณ์ใหม่ๆ โครงสร้างง่ายๆ คือ My name is..., I am from..., และ I work as...",
    phrases: [
      "My name is Mali. - ฉันชื่อมะลิ",
      "I am from Thailand. - ฉันมาจากประเทศไทย",
      "I work in Bangkok. - ฉันทำงานในกรุงเทพฯ",
      "I like learning English. - ฉันชอบเรียนภาษาอังกฤษ",
    ],
  },
  {
    slug: "office-english",
    title: "Office English",
    thaiTitle: "อังกฤษในที่ทำงาน",
    description: "เรียนประโยคสุภาพสำหรับขอความช่วยเหลือ ประชุม และคุยกับเพื่อนร่วมงาน",
    difficulty: "พื้นฐาน",
    duration: "15 นาที",
    vocabularyQuery: "office",
    vocabularyKeywords: [
      "meeting",
      "appointment",
      "schedule",
      "task",
      "report",
      "manager",
    ],
    explanation:
      "ภาษาอังกฤษในที่ทำงานควรชัดเจนและสุภาพ โดยเฉพาะเมื่อต้องขอความช่วยเหลือ ขอเวลาตรวจงาน หรือนัดประชุม ใช้ Could you... และ Please... เพื่อให้ประโยคฟังนุ่มนวลขึ้น",
    phrases: [
      "Could you help me, please? - ช่วยฉันหน่อยได้ไหม",
      "I have a question. - ฉันมีคำถาม",
      "Let’s have a meeting. - มาประชุมกันเถอะ",
      "Please send me the file. - กรุณาส่งไฟล์ให้ฉัน",
    ],
  },
  {
    slug: "email-english",
    title: "Email English",
    thaiTitle: "อังกฤษสำหรับอีเมล",
    description: "ฝึกคำขึ้นต้น คำขอบคุณ และประโยคลงท้ายอีเมลแบบมืออาชีพ",
    difficulty: "พื้นฐาน",
    duration: "15 นาที",
    vocabularyQuery: "email",
    vocabularyKeywords: ["email", "subject", "attach", "reply", "send", "message"],
    explanation:
      "อีเมลภาษาอังกฤษที่ดีควรสั้น ชัดเจน และสุภาพ เริ่มด้วยคำทักทาย ระบุเรื่องที่ต้องการ แล้วปิดท้ายด้วยคำขอบคุณหรือคำลงท้ายที่เหมาะสม",
    phrases: [
      "Dear Sir or Madam, - เรียนคุณผู้เกี่ยวข้อง",
      "Thank you for your email. - ขอบคุณสำหรับอีเมลของคุณ",
      "Please find attached... - โปรดดูไฟล์แนบ",
      "Best regards, - ด้วยความเคารพ",
    ],
  },
  {
    slug: "travel-english",
    title: "Travel English",
    thaiTitle: "อังกฤษสำหรับเดินทาง",
    description: "ฝึกประโยคจำเป็นสำหรับสนามบิน โรงแรม ร้านอาหาร และการถามทาง",
    difficulty: "พื้นฐาน",
    duration: "15 นาที",
    vocabularyQuery: "travel",
    vocabularyKeywords: [
      "hotel",
      "reservation",
      "ticket",
      "airport",
      "passport",
      "travel",
    ],
    explanation:
      "เวลาเดินทางควรจำประโยคสั้นๆ ที่ใช้ถามทาง ขอราคา สั่งอาหาร และขอความช่วยเหลือ เน้นพูดให้ชัดและใช้คำสุภาพอย่าง please และ thank you",
    phrases: [
      "Where is the train station? - สถานีรถไฟอยู่ที่ไหน",
      "How much is this? - อันนี้ราคาเท่าไร",
      "I would like water, please. - ขอน้ำหน่อยครับ/ค่ะ",
      "Can you help me? - ช่วยฉันได้ไหม",
    ],
  },
];

export function getLesson(slug: string) {
  return lessons.find((lesson) => lesson.slug === slug);
}
