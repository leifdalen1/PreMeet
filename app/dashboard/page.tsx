"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";

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

export default function DashboardPage() {
  const { isLoaded, isSignedIn } = useUser();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

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

    fetchEvents();
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
        <div className="mx-auto flex h-14 max-w-6xl items-center px-6">
          <span className="text-lg font-semibold tracking-tight text-white">
            PreMeet
          </span>
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
      </main>
    </div>
  );
}
