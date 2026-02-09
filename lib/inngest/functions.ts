import { inngest } from "./client";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { OAuth2Client } from "google-auth-library";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || "briefings@premeet.app";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  attendees: Array<{
    email: string;
    displayName: string | null;
    responseStatus: string;
  }>;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return "Tomorrow";
  }
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function getSubjectDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const time = formatTime(dateStr);

  if (date.toDateString() === today.toDateString()) {
    return `today at ${time}`;
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return `tomorrow at ${time}`;
  }
  return `on ${date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} at ${time}`;
}

function generateEmailHtml(meeting: CalendarEvent): string {
  const attendeeList =
    meeting.attendees.length > 0
      ? meeting.attendees
          .map(
            (a) => `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
            <span style="color: #374151;">${a.displayName || a.email}</span>
            <span style="color: #6b7280; font-size: 14px;">${a.displayName ? ` (${a.email})` : ""}</span>
          </td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
            <span style="color: #6b7280; font-size: 14px; text-transform: capitalize;">${a.responseStatus}</span>
          </td>
        </tr>
      `
          )
          .join("")
      : `<tr><td colspan="2" style="padding: 16px 0; color: #6b7280; font-style: italic;">Just you</td></tr>`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Meeting Briefing</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); max-width: 600px;">
              <tr>
                <td style="padding: 32px 32px 24px; border-bottom: 1px solid #e5e7eb;">
                  <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #111827;">PreMeet</h1>
                  <p style="margin: 4px 0 0; font-size: 14px; color: #6b7280;">Meeting briefing</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 32px;">
                  <h2 style="margin: 0 0 8px; font-size: 20px; font-weight: 600; color: #111827;">${meeting.summary}</h2>
                  <p style="margin: 0; font-size: 16px; color: #4b5563;">
                    ${formatDate(meeting.start)} at ${formatTime(meeting.start)} – ${formatTime(meeting.end)}
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 0 32px 32px;">
                  <h3 style="margin: 0 0 16px; font-size: 14px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em;">Attendees (${meeting.attendees.length})</h3>
                  <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 15px;">
                    ${attendeeList}
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding: 24px 32px; border-top: 1px solid #e5e7eb; text-align: center;">
                  <p style="margin: 0; font-size: 13px; color: #9ca3af;">Sent by PreMeet · Your meeting assistant</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

async function fetchCalendarEvents(
  accessToken: string,
  timeMin: string,
  timeMax: string
): Promise<CalendarEvent[]> {
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
    throw new Error("Failed to fetch calendar events");
  }

  const data = await response.json();

  return (
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
    })) || []
  );
}

async function sendBriefingEmail(meeting: CalendarEvent) {
  const subjectDate = getSubjectDate(meeting.start);
  const subject = `Briefing: ${meeting.summary} ${subjectDate}`;
  const html = generateEmailHtml(meeting);

  const { error } = await resend.emails.send({
    from: `PreMeet <${FROM_EMAIL}>`,
    // Hardcoded for Resend testing (free tier restriction)
    // TODO: Change to userEmail after verifying domain
    to: "leifdalen1@gmail.com",
    subject,
    html,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

async function wasBriefingSent(userId: string, meetingId: string): Promise<boolean> {
  const { data } = await supabase
    .from("sent_briefings")
    .select("id")
    .eq("user_id", userId)
    .eq("meeting_id", meetingId)
    .maybeSingle();

  return !!data;
}

async function markBriefingSent(userId: string, meetingId: string) {
  await supabase.from("sent_briefings").insert({
    user_id: userId,
    meeting_id: meetingId,
  });
}

export const checkAndSendBriefings = inngest.createFunction(
  { id: "check-and-send-briefings" },
  { cron: "*/1 * * * *" }, // Run every 1 minute
  async ({ step }) => {
    // Get all users with connected Google calendars
    const { data: userTokens, error: tokensError } = await supabase
      .from("user_tokens")
      .select("user_id, refresh_token")
      .eq("provider", "google");

    if (tokensError || !userTokens || userTokens.length === 0) {
      return { message: "No users with connected calendars" };
    }

    const results = {
      processed: 0,
      emailsSent: 0,
      errors: [] as string[],
    };

    const now = new Date();
    const timeMin = now.toISOString();
    const timeMax = new Date(now.getTime() + 30 * 60 * 1000).toISOString(); // Next 30 minutes

    for (const userToken of userTokens) {
      try {
        await step.run(`process-user-${userToken.user_id}`, async () => {
          // Exchange refresh token for access token
          const oauth2Client = new OAuth2Client({
            clientId: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET,
          });

          oauth2Client.setCredentials({
            refresh_token: userToken.refresh_token,
          });

          const { credentials } = await oauth2Client.refreshAccessToken();
          const accessToken = credentials.access_token;

          if (!accessToken) {
            throw new Error("Failed to get access token");
          }

          // Fetch upcoming meetings
          const events = await fetchCalendarEvents(accessToken, timeMin, timeMax);

          for (const event of events) {
            const meetingStart = new Date(event.start);
            const minutesUntilMeeting =
              (meetingStart.getTime() - now.getTime()) / (1000 * 60);

            // Check if meeting starts in 4-6 minutes (5 min window)
            if (minutesUntilMeeting >= 4 && minutesUntilMeeting <= 6) {
              // Check if we already sent a briefing for this meeting
              const alreadySent = await wasBriefingSent(userToken.user_id, event.id);

              if (!alreadySent) {
                // Send the briefing email
                await sendBriefingEmail(event);
                await markBriefingSent(userToken.user_id, event.id);
                results.emailsSent++;
              }
            }
          }

          results.processed++;
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        results.errors.push(`User ${userToken.user_id}: ${errorMsg}`);
      }
    }

    return {
      message: `Processed ${results.processed} users, sent ${results.emailsSent} briefings`,
      errors: results.errors.length > 0 ? results.errors : undefined,
    };
  }
);
