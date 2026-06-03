import { NextResponse } from "next/server";
import { getVocabularyPage } from "@/lib/vocabularyServer";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const page = Number(url.searchParams.get("page") ?? "1");
  const pageSize = Number(url.searchParams.get("pageSize") ?? "50");
  const query = url.searchParams.get("query") ?? "";
  const partOfSpeech = url.searchParams.get("partOfSpeech") ?? "";

  const result = getVocabularyPage({ page, pageSize, query, partOfSpeech });

  return NextResponse.json(result, { status: 200 });
}
