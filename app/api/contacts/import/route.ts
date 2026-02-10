import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { OAuth2Client } from "google-auth-library";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
}

interface Contact {
  email: string;
  name: string | null;
  company: string | null;
  title: string | null;
  lastMeetingDate: string;
  meetingCount: number;
}

function extractCompany(email: string): string | null {
  // Try to extract company from email domain
  const domain = email.split("@")[1];
  if (!domain) return null;
  
  // Skip common personal domains
  const personalDomains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", "aol.com", "protonmail.com"];
  if (personalDomains.includes(domain.toLowerCase())) return null;
  
  // Extract company name from domain (e.g., "company.com" -> "Company")
  const companyName = domain.split(".")[0];
  return companyName.charAt(0).toUpperCase() + companyName.slice(1);
}

function extractTitle(name: string | null): string | null {
  if (!name) return null;
  
  // Common title patterns
  const titlePatterns = [
    /\b(CEO|CTO|CFO|COO|CMO|CIO|VP|VP of)\b/i,
    /\b(Director|Manager|Lead|Head of)\b/i,
    /\b(Engineer|Developer|Designer|Product|Sales|Marketing)\b/i,
    /\b(Founder|Co-founder|Partner|Principal)\b/i,
  ];
  
  for (const pattern of titlePatterns) {
    const match = name.match(pattern);
    if (match) return match[0];
  }
  
  return null;
}

export async function POST() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's refresh token
    const { data: tokenData, error: tokenError } = await supabase
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

    const { credentials } = await oauth2Client.refreshAccessToken();
    const accessToken = credentials.access_token;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Failed to get access token" },
        { status: 500 }
      );
    }

    // Calculate time range (last 6 months)
    const now = new Date();
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

    const timeMin = sixMonthsAgo.toISOString();
    const timeMax = now.toISOString();

    // Fetch events from Google Calendar API
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
        new URLSearchParams({
          timeMin,
          timeMax,
          singleEvents: "true",
          orderBy: "startTime",
          maxResults: "2500", // Get as many as possible
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
    const events: CalendarEvent[] = data.items || [];

    // Extract unique contacts from all events
    const contactsMap = new Map<string, Contact>();

    for (const event of events) {
      if (!event.attendees || event.attendees.length === 0) continue;

      const eventDate = event.start;

      for (const attendee of event.attendees) {
        // Skip the user themselves (we'll need to filter by self email, but for now skip all)
        // In production, you'd compare against the user's email
        const email = attendee.email?.toLowerCase();
        if (!email) continue;

        // Skip resource rooms and no-reply addresses
        if (email.includes("resource.calendar.google.com") || 
            email.includes("no-reply") ||
            email.includes("noreply")) {
          continue;
        }

        const existing = contactsMap.get(email);
        
        if (existing) {
          // Update existing contact
          existing.meetingCount += 1;
          if (new Date(eventDate) > new Date(existing.lastMeetingDate)) {
            existing.lastMeetingDate = eventDate;
          }
          // Use the most recent name if available
          if (attendee.displayName && !existing.name) {
            existing.name = attendee.displayName;
          }
        } else {
          // Create new contact
          const name = attendee.displayName || null;
          const company = extractCompany(email);
          const title = extractTitle(name);

          contactsMap.set(email, {
            email,
            name,
            company,
            title,
            lastMeetingDate: eventDate,
            meetingCount: 1,
          });
        }
      }
    }

    // Upsert contacts to database
    let importedCount = 0;
    
    for (const contact of contactsMap.values()) {
      const { error } = await supabase
        .from("contacts")
        .upsert(
          {
            user_id: userId,
            email: contact.email,
            name: contact.name,
            company: contact.company,
            title: contact.title,
            last_meeting_date: contact.lastMeetingDate,
            meeting_count: contact.meetingCount,
          },
          { onConflict: "user_id,email" }
        );

      if (error) {
        console.error("Failed to upsert contact:", error);
      } else {
        importedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Imported ${importedCount} contacts`,
      totalEvents: events.length,
      uniqueContacts: contactsMap.size,
    });
  } catch (err) {
    console.error("Import contacts error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
