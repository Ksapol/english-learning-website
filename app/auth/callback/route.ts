import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  // state is reserved for future CSRF protection, not used yet

  if (!code) {
    return NextResponse.redirect(new URL("/auth?error=no_code", request.url));
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Auth callback error:", error);
      return NextResponse.redirect(
        new URL(`/auth?error=${encodeURIComponent(error.message)}`, request.url),
      );
    }

    return NextResponse.redirect(new URL("/progress", request.url));
  } catch (error) {
    console.error("Callback exception:", error);
    return NextResponse.redirect(
      new URL("/auth?error=callback_failed", request.url),
    );
  }
}
