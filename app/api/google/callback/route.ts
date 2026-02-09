import { auth } from "@clerk/nextjs/server";
import { OAuth2Client } from "google-auth-library";
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

const REDIRECT_URI = "http://localhost:3000/api/google/callback";
const PROVIDER = "google";

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(
      new URL("/sign-in", "http://localhost:3000")
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code) {
    return NextResponse.redirect(
      new URL("/dashboard?error=missing_code", "http://localhost:3000")
    );
  }

  if (state !== userId) {
    return NextResponse.redirect(
      new URL("/dashboard?error=invalid_state", "http://localhost:3000")
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Missing Google OAuth credentials" },
      { status: 500 }
    );
  }

  const oauth2Client = new OAuth2Client({
    clientId,
    clientSecret,
    redirectUri: REDIRECT_URI,
  });

  try {
    const { tokens } = await oauth2Client.getToken(code);
    const refreshToken = tokens.refresh_token;

    if (!refreshToken) {
      return NextResponse.redirect(
        new URL("/dashboard?error=no_refresh_token", "http://localhost:3000")
      );
    }

    const { error } = await supabaseServer
      .from("user_tokens")
      .upsert(
        {
          user_id: userId,
          provider: PROVIDER,
          refresh_token: refreshToken,
          access_token: tokens.access_token || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,provider" }
      );

    if (error) {
      console.error("Supabase upsert failed:", error);
      return NextResponse.redirect(
        new URL("/dashboard?error=storage_failed", "http://localhost:3000")
      );
    }

    return NextResponse.redirect(
      new URL("/dashboard?connected=1", "http://localhost:3000")
    );
  } catch (err) {
    console.error("Google OAuth token exchange failed:", err);
    return NextResponse.redirect(
      new URL("/dashboard?error=exchange_failed", "http://localhost:3000")
    );
  }
}
