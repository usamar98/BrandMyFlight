import { NextRequest, NextResponse } from "next/server";
import { recordSiteVisit } from "@/lib/supabase-server";

const visitorCookie = "bmf_visit";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  const cookieValue = request.cookies.get(visitorCookie)?.value;
  const sessionId = cookieValue && uuidPattern.test(cookieValue) ? cookieValue : crypto.randomUUID();

  try {
    const counts = await recordSiteVisit(sessionId);
    if (!counts) {
      return NextResponse.json({ error: "Visitor counter is not configured." }, { status: 503 });
    }

    const response = NextResponse.json(counts, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });

    response.cookies.set({
      name: visitorCookie,
      value: sessionId,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Unable to update visitor counts", error);
    return NextResponse.json({ error: "Unable to update visitor counts." }, { status: 503 });
  }
}
