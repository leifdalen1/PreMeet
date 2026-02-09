import { auth } from "@clerk/nextjs/server";
import { OAuth2Client } from "google-auth-library";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseServer = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch refresh token from Supabase
  const { data: tokenData, error: tokenError } = await supabaseServer
    .from("user_tokens")
    .select("refresh_token")
    .eq("user_id", userId)
    .eq("provider", "google")
    .single();

  if (tokenError || !tokenData) {
    return NextResponse.json(
      { error: "Google Calendar not connected" },
      { status: 400 }
    );
  }

  // Exchange refresh token for access token
  const oauth2Client = new OAuth2Client({
    clientId: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
  });

  oauth2Client.setCredentials({
    refresh_token: tokenData.refresh_token,
  });

  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    const accessToken = credentials.access_token;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Failed to get access token" },
        { status: 500 }
      );
    }

    // Calculate time range (next 24 hours)
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const timeMin = now.toISOString();
    const timeMax = tomorrow.toISOString();

    // Fetch events from Google Calendar API
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
        new URLSearchParams({
          timeMin,
          timeMax,
          singleEvents: "true",
          orderBy: "startTime",
        }),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Google Calendar API error:", errorData);
      return NextResponse.json(
        { error: "Failed to fetch calendar events" },
        { status: 500 }
      );
    }

    const data = await response.json();

    // Format events
    const events =
      data.items?.map((event: any) => ({
        id: event.id,
        summary: event.summary || "(No title)",
        start: event.start?.dateTime || event.start?.date,
        end: event.end?.dateTime || event.end?.date,
        attendees:
          event.attendees?.map((a: any) => ({
            email: a.email,
            displayName: a.displayName || null,
            responseStatus: a.responseStatus,
          })) || [],
      })) || [];

    return NextResponse.json({ events });
  } catch (err) {
    console.error("Error fetching calendar events:", err);
    return NextResponse.json(
      { error: "Failed to fetch calendar events" },
      { status: 500 }
    );
  }
}
