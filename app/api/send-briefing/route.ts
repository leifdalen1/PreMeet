import { auth, currentUser } from "@clerk/nextjs/server";
import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || "briefings@premeet.app";

interface Attendee {
  email: string;
  displayName: string | null;
  responseStatus: string;
}

interface MeetingData {
  id: string;
  summary: string;
  start: string;
  end: string;
  attendees: Attendee[];
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

function getSubjectTime(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const time = formatTime(dateStr);

  if (date.toDateString() === today.toDateString()) {
    return `at ${time}`;
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return `tomorrow at ${time}`;
  }
  return `${date.toLocaleDateString("en-US", { weekday: "long" })} at ${time}`;
}

function generateEmailHtml(meeting: MeetingData): string {
  const attendeeList = meeting.attendees.length > 0
    ? meeting.attendees.map(a => `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
            <span style="color: #374151;">${a.displayName || a.email}</span>
            <span style="color: #6b7280; font-size: 14px;">${a.displayName ? ` (${a.email})` : ""}</span>
          </td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
            <span style="color: #6b7280; font-size: 14px; text-transform: capitalize;">${a.responseStatus}</span>
          </td>
        </tr>
      `).join("")
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
              <!-- Header -->
              <tr>
                <td style="padding: 32px 32px 24px; border-bottom: 1px solid #e5e7eb;">
                  <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #111827;">PreMeet</h1>
                  <p style="margin: 4px 0 0; font-size: 14px; color: #6b7280;">Meeting briefing</p>
                </td>
              </tr>
              
              <!-- Meeting Info -->
              <tr>
                <td style="padding: 32px;">
                  <h2 style="margin: 0 0 8px; font-size: 20px; font-weight: 600; color: #111827;">${meeting.summary}</h2>
                  <p style="margin: 0; font-size: 16px; color: #4b5563;">
                    ${formatDate(meeting.start)} at ${formatTime(meeting.start)} – ${formatTime(meeting.end)}
                  </p>
                </td>
              </tr>
              
              <!-- Attendees -->
              <tr>
                <td style="padding: 0 32px 32px;">
                  <h3 style="margin: 0 0 16px; font-size: 14px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em;">Attendees (${meeting.attendees.length})</h3>
                  <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 15px;">
                    ${attendeeList}
                  </table>
                </td>
              </tr>
              
              <!-- Footer -->
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

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    
    if (!userId || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = user.emailAddresses[0]?.emailAddress;
    if (!userEmail) {
      return NextResponse.json({ error: "No email found" }, { status: 400 });
    }

    const { meeting } = await request.json();
    
    if (!meeting) {
      return NextResponse.json({ error: "Meeting data required" }, { status: 400 });
    }

    const subjectTime = getSubjectTime(meeting.start);
    const subject = `Briefing: ${meeting.summary} ${subjectTime}`;
    const html = generateEmailHtml(meeting);

    const { data, error } = await resend.emails.send({
      from: `PreMeet <${FROM_EMAIL}>`,
      // Hardcoded for Resend testing (free tier restriction)
      // TODO: Change to userEmail after verifying domain
      to: "leifdalen1@gmail.com",
      subject,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ success: true, messageId: data?.id });
  } catch (err) {
    console.error("Send briefing error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
