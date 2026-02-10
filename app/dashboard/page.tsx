"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import Link from "next/link";

interface Attendee {
  email: string;
  displayName: string | null;
  responseStatus: string;
}

interface CalendarEvent {
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
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

interface Contact {
  id: string;
  email: string;
  name: string | null;
  last_meeting_date: string;
}

export default function DashboardPage() {
  const { isLoaded, isSignedIn } = useUser();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  // Contacts state
  const [contactsCount, setContactsCount] = useState(0);
  const [recentContacts, setRecentContacts] = useState<Contact[]>([]);
  
  // Feedback state
  const [feedbackRating, setFeedbackRating] = useState<"thumbs_up" | "thumbs_down" | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      redirect("/sign-in");
      return;
    }

    async function fetchEvents() {
      try {
        const response = await fetch("/api/calendar/events");
        if (!response.ok) {
          const data = await response.json();
          if (response.status === 400) {
            setGoogleConnected(false);
            setLoading(false);
            return;
          }
          throw new Error(data.error || "Failed to fetch events");
        }
        const data = await response.json();
        setEvents(data.events || []);
        setGoogleConnected(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    async function fetchContacts() {
      try {
        const response = await fetch("/api/contacts");
        if (response.ok) {
          const data = await response.json();
          setContactsCount(data.stats?.total || 0);
          setRecentContacts(data.stats?.recent?.slice(0, 5) || []);
        }
      } catch (err) {
        console.error("Error fetching contacts:", err);
      }
    }

    fetchEvents();
    fetchContacts();
  }, [isLoaded, isSignedIn]);

  async function handleSendTestBriefing() {
    if (events.length === 0) return;
    
    setSendingEmail(true);
    setEmailSent(false);
    
    try {
      const firstEvent = events[0];
      const response = await fetch("/api/send-briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meeting: firstEvent }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to send email");
      }
      
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 3000);
    } catch (err) {
      setError("Failed to send test email");
    } finally {
      setSendingEmail(false);
    }
  }

  async function handleSubmitFeedback() {
    if (!feedbackRating) return;
    
    setSubmittingFeedback(true);
    
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: feedbackRating,
          message: feedbackMessage || null,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }
      
      setFeedbackSubmitted(true);
    } catch (err) {
      console.error("Feedback error:", err);
    } finally {
      setSubmittingFeedback(false);
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased">
      <nav className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="text-lg font-semibold tracking-tight text-white hover:opacity-80 transition-opacity">
            PreMeet
          </Link>
          {googleConnected && (
            <Link
              href="/contacts"
              className="text-sm font-medium text-slate-400 transition-colors hover:text-white"
            >
              Your Network
            </Link>
          )}
        </div>
      </nav>

      <main className="mx-auto max-w-2xl px-6 py-16">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Your Meetings
            </h1>
            <p className="mt-4 text-lg text-slate-400">
              Next 24 hours of scheduled events
            </p>
          </div>
          
          {googleConnected && events.length > 0 && (
            <div className="flex flex-col items-end gap-2">
              <button
                onClick={handleSendTestBriefing}
                disabled={sendingEmail}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingEmail ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                    Send Test Briefing
                  </>
                )}
              </button>
              {emailSent && (
                <span className="text-sm text-emerald-400 animate-in fade-in slide-in-from-top-1">
                  Email sent!
                </span>
              )}
            </div>
          )}
        </div>

        {!googleConnected ? (
          <div className="mt-10">
            <a
              href="/api/google"
              className="inline-flex items-center justify-center rounded-lg bg-slate-800 px-8 py-4 text-base font-medium text-white ring-1 ring-slate-700 transition-colors hover:bg-slate-700 hover:ring-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              Connect Google Calendar
            </a>
          </div>
        ) : loading ? (
          <div className="mt-10 text-slate-400">Loading events...</div>
        ) : error ? (
          <div className="mt-10 text-red-400">{error}</div>
        ) : events.length === 0 ? (
          <div className="mt-10 rounded-lg border border-slate-800 bg-slate-900/50 p-8 text-center">
            <p className="text-slate-400">No upcoming meetings</p>
          </div>
        ) : (
          <div className="mt-10 space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="group relative rounded-lg border border-slate-800/60 bg-slate-900/40 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-700 hover:bg-slate-900/60 hover:shadow-lg hover:shadow-black/20"
              >
                {/* Left accent border */}
                <div className="absolute left-0 top-4 bottom-4 w-0.5 rounded-full bg-indigo-500/80" />
                
                <div className="pl-4">
                  {/* Title */}
                  <h3 className="text-lg font-semibold text-white tracking-tight">
                    {event.summary}
                  </h3>
                  
                  {/* Time */}
                  <p className="mt-1.5 text-sm font-normal text-slate-400">
                    {formatDate(event.start)} · {formatTime(event.start)} –{" "}
                    {formatTime(event.end)}
                  </p>

                  {/* Attendees */}
                  <div className="mt-4">
                    {event.attendees.length === 0 ? (
                      <div className="inline-flex items-center gap-2 rounded-md bg-slate-800/50 px-3 py-1.5">
                        <svg 
                          className="h-3.5 w-3.5 text-slate-500" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                        <span className="text-xs font-light italic tracking-wide text-slate-500">
                          Solo meeting
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {event.attendees.slice(0, 3).map((attendee, idx) => (
                          <div 
                            key={idx} 
                            className="flex items-center gap-2 text-xs font-light tracking-wide text-slate-400"
                          >
                            <svg 
                              className="h-3 w-3 text-slate-500" 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                              strokeWidth={1.5}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                            </svg>
                            <span className="truncate">{attendee.email}</span>
                          </div>
                        ))}
                        {event.attendees.length > 3 && (
                          <p className="pl-5 text-xs font-light text-slate-500">
                            +{event.attendees.length - 3} more
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Feedback Banner - only show when connected and has events */}
        {googleConnected && !loading && events.length > 0 && !feedbackSubmitted && (
          <div className="mt-12 rounded-xl border border-slate-800 bg-slate-900/50 p-6">
            {!feedbackRating ? (
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-300">How was your first briefing?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFeedbackRating("thumbs_up")}
                    className="rounded-lg bg-slate-800 p-2 text-slate-400 transition-colors hover:bg-slate-700 hover:text-emerald-400"
                    title="Good"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setFeedbackRating("thumbs_down")}
                    className="rounded-lg bg-slate-800 p-2 text-slate-400 transition-colors hover:bg-slate-700 hover:text-red-400"
                    title="Needs improvement"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.498 15.25H4.372c-1.026 0-1.945-.694-2.054-1.715a12.137 12.137 0 01-.068-1.285c0-2.848.992-5.464 2.649-7.521C5.287 4.247 5.886 4 6.504 4h4.016a6 6 0 011.423.23l3.114 1.04a4.5 4.5 0 001.423.23h1.294M7.498 15.25c.618 0 .991.272 1.067.82a9.04 9.04 0 010 2.06c-.076.548-.449.82-1.067.82H4.596M7.498 15.25H4.372c-1.026 0-1.945-.694-2.054-1.715a12.137 12.137 0 01-.068-1.285c0-2.848.992-5.464 2.649-7.521C5.287 4.247 5.886 4 6.504 4h4.016a6 6 0 011.423.23l3.114 1.04a4.5 4.5 0 001.423.23h1.294M14.25 9h2.25M5.904 18.75l.729-.571c.928-.727 2.11-1.107 3.316-1.044 1.135.06 2.27.147 3.396.26M14.25 18.75a3 3 0 01-4.35-2.334c-.14-.39-.21-.806-.21-1.224" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-300">
                  {feedbackRating === "thumbs_down" 
                    ? "What would make this better?" 
                    : "Thanks! Any additional feedback?"}
                </p>
                <textarea
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  placeholder="Tell us what you think..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  rows={3}
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleSubmitFeedback}
                    disabled={submittingFeedback}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {submittingFeedback ? "Submitting..." : "Submit"}
                  </button>
                  <button
                    onClick={() => {
                      setFeedbackRating(null);
                      setFeedbackMessage("");
                    }}
                    className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-400 transition-colors hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Thank you message after feedback submitted */}
        {feedbackSubmitted && (
          <div className="mt-12 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-center">
            <p className="text-emerald-400">Thanks for your feedback! 🙏</p>
          </div>
        )}

        {/* Network Stats Card */}
        {googleConnected && contactsCount > 0 && (
          <div className="mt-12 rounded-xl border border-slate-800 bg-slate-900/50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Your Network</h3>
                <p className="text-sm text-slate-400">{contactsCount} contacts imported</p>
              </div>
              <Link
                href="/contacts"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
              >
                View All
              </Link>
            </div>
            
            {/* Recent contacts preview */}
            {recentContacts.length > 0 && (
              <div className="mt-4">
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
                  Last {recentContacts.length} people you met
                </p>
                <div className="flex flex-wrap gap-2">
                  {recentContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-800/50 px-3 py-1.5"
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-[10px] font-medium text-white">
                        {(contact.name || contact.email).slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-xs text-slate-300">
                        {contact.name || contact.email.split("@")[0]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
