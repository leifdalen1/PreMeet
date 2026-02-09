import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ connected: false }, { status: 401 });
  }

  try {
    const { data, error } = await supabaseServer
      .from("user_tokens")
      .select("user_id")
      .eq("user_id", userId)
      .eq("provider", "google")
      .maybeSingle();

    if (error) {
      console.error("Supabase status check failed:", error);
      return NextResponse.json({ connected: false }, { status: 500 });
    }

    return NextResponse.json({ connected: !!data });
  } catch (err) {
    console.error("Status check failed:", err);
    return NextResponse.json({ connected: false }, { status: 500 });
  }
}
