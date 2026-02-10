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

interface Contact {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  title: string | null;
  last_meeting_date: string;
  meeting_count: number;
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

function formatRelativeDate(dateStr: string): string {
  if (!dateStr) return "Never";
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return email.slice(0, 2).toUpperCase();
}

function getAvatarColor(email: string): string {
  const colors = [
    "from-red-500 to-orange-500",
    "from-orange-500 to-yellow-500",
    "from-yellow-500 to-green-500",
    "from-green-500 to-teal-500",
    "from-teal-500 to-blue-500",
    "from-blue-500 to-indigo-500",
    "from-indigo-500 to-purple-500",
    "from-purple-500 to-pink-500",
    "from-pink-500 to-rose-500",
  ];
  
  const index = email.charCodeAt(0) % colors.length;
  return colors[index];
}

// Briefings Tab Component
function BriefingsTab({ 
  events, 
  loading, 
  error, 
  googleConnected,
  onSendTest 
}: { 
  events: CalendarEvent[]; 
  loading: boolean; 
  error: string | null;
  googleConnected: boolean;
  onSendTest: () => void;
}) {
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  async function handleSendTest() {
    setSendingEmail(true);
    setEmailSent(false);
    await onSendTest();
    setSendingEmail(false);
    setEmailSent(true);
    setTimeout(() => setEmailSent(false), 3000);
  }

  if (!googleConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="rounded-full bg-slate-800/50 p-6">
          <svg className="h-12 w-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
        </div>
        <h3 className="mt-6 text-xl font-semibold text-white">Connect Your Calendar</h3>
        <p className="mt-2 text-slate-400">Link your Google Calendar to start receiving briefings</p>
        <a
          href="/api/google"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-8 py-3 text-base font-medium text-white transition-colors hover:bg-indigo-500"
        >
          Connect Google Calendar
        </a>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-400">Loading meetings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="rounded-full bg-slate-800/50 p-6">
          <svg className="h-12 w-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 002.25 2.25h.75m0-18H18a2.25 2.25 0 012.25 2.25V19.5a2.25 2.25 0 01-2.25 2.25H6.75a2.25 2.25 0 01-2.25-2.25V6.108c0-1.135.845-2.098 1.976-2.192a48.424 48.424 0 001.123-.08" />
          </svg>
        </div>
        <h3 className="mt-6 text-xl font-semibold text-white">No Upcoming Meetings</h3>
        <p className="mt-2 text-slate-400">Your calendar is clear for the next 24 hours</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/30 px-6 py-4">
        <div className="flex items-center gap-8">
          <div>
            <p className="text-2xl font-semibold text-white">{events.length}</p>
            <p className="text-xs uppercase tracking-wider text-slate-500">Meetings Today</p>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div>
            <p className="text-2xl font-semibold text-white">
              {events.reduce((acc, e) => acc + e.attendees.length, 0)}
            </p>
            <p className="text-xs uppercase tracking-wider text-slate-500">People to Meet</p>
          </div>
        </div>
        {events.length > 0 && (
          <button
            onClick={handleSendTest}
            disabled={sendingEmail}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600/10 px-4 py-2 text-sm font-medium text-indigo-400 transition-colors hover:bg-indigo-600/20 disabled:opacity-50"
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
        )}
        {emailSent && (
          <span className="text-sm text-emerald-400">Email sent!</span>
        )}
      </div>

      {/* Meetings List */}
      <div className="space-y-3">
        {events.map((event) => (
          <div
            key={event.id}
            className="group relative rounded-xl border border-slate-800/60 bg-slate-900/40 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-700 hover:bg-slate-900/60"
          >
            <div className="absolute left-0 top-4 bottom-4 w-0.5 rounded-full bg-indigo-500/80" />
            
            <div className="pl-4">
              <h3 className="text-lg font-semibold text-white tracking-tight">
                {event.summary}
              </h3>
              <p className="mt-1.5 text-sm font-normal text-slate-400">
                {formatDate(event.start)} · {formatTime(event.start)} –{" "}
                {formatTime(event.end)}
              </p>

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
    </div>
  );
}

// Network Tab Component
function NetworkTab({ 
  contacts, 
  loading, 
  onImport 
}: { 
  contacts: Contact[]; 
  loading: boolean;
  onImport: () => void;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("recent");
  const [importing, setImporting] = useState(false);

  const companies = [...new Set(contacts.map(c => c.company).filter(Boolean))].sort();
  
  const filteredContacts = contacts
    .filter(c => 
      search === "" || 
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.company?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      switch (filter) {
        case "recent":
          return new Date(b.last_meeting_date).getTime() - new Date(a.last_meeting_date).getTime();
        case "company":
          return (a.company || "").localeCompare(b.company || "");
        case "alphabetical":
          return (a.name || a.email).localeCompare(b.name || b.email);
        default:
          return 0;
      }
    });

  async function handleImport() {
    setImporting(true);
    await onImport();
    setImporting(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-400">Loading your network...</div>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="rounded-full bg-slate-800/50 p-6">
          <svg className="h-12 w-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
        </div>
        <h3 className="mt-6 text-xl font-semibold text-white">Build Your Network</h3>
        <p className="mt-2 text-slate-400">Import contacts from your calendar history</p>
        <button
          onClick={handleImport}
          disabled={importing}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-8 py-3 text-base font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
        >
          {importing ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Importing...
            </>
          ) : (
            "Import Contacts"
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/30 px-6 py-4">
        <div className="flex items-center gap-8">
          <div>
            <p className="text-2xl font-semibold text-white">{contacts.length}</p>
            <p className="text-xs uppercase tracking-wider text-slate-500">Contacts</p>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div>
            <p className="text-2xl font-semibold text-white">{companies.length}</p>
            <p className="text-xs uppercase tracking-wider text-slate-500">Companies</p>
          </div>
        </div>
        <button
          onClick={handleImport}
          disabled={importing}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600/10 px-4 py-2 text-sm font-medium text-indigo-400 transition-colors hover:bg-indigo-600/20 disabled:opacity-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.07M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          {importing ? "Syncing..." : "Sync"}
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <svg 
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900/50 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {[
            { value: "recent", label: "Recent" },
            { value: "company", label: "Company" },
            { value: "alphabetical", label: "A-Z" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                filter === f.value
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contacts Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredContacts.map((contact) => (
          <div
            key={contact.id}
            className="group relative rounded-xl border border-slate-800 bg-slate-900/40 p-5 transition-all duration-200 hover:-translate-y-1 hover:border-slate-700 hover:bg-slate-900/60"
          >
            <div className="flex items-start gap-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${getAvatarColor(contact.email)} text-sm font-medium text-white`}>
                {getInitials(contact.name, contact.email)}
              </div>
              
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-medium text-white">
                  {contact.name || contact.email.split("@")[0]}
                </h3>
                <p className="truncate text-sm text-slate-500">{contact.email}</p>
                
                {contact.company && (
                  <p className="mt-1 truncate text-xs text-indigo-400">
                    {contact.company}
                  </p>
                )}
                
                {contact.title && (
                  <p className="truncate text-xs text-slate-500">{contact.title}</p>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-800/50 pt-4">
              <span className="text-xs text-slate-500">
                Last met {formatRelativeDate(contact.last_meeting_date)}
              </span>
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                {contact.meeting_count} meetings
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Main Dashboard Page
export default function DashboardPage() {
  const { isLoaded, isSignedIn } = useUser();
  const [activeTab, setActiveTab] = useState<"briefings" | "network">("briefings");
  
  // Data states
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [googleConnected, setGoogleConnected] = useState(false);
  
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      redirect("/sign-in");
      return;
    }

    fetchEvents();
    fetchContacts();
  }, [isLoaded, isSignedIn]);

  async function fetchEvents() {
    try {
      setEventsLoading(true);
      const response = await fetch("/api/calendar/events");
      if (!response.ok) {
        const data = await response.json();
        if (response.status === 400) {
          setGoogleConnected(false);
          setEventsLoading(false);
          return;
        }
        throw new Error(data.error || "Failed to fetch events");
      }
      const data = await response.json();
      setEvents(data.events || []);
      setGoogleConnected(true);
    } catch (err) {
      setEventsError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setEventsLoading(false);
    }
  }

  async function fetchContacts() {
    try {
      setContactsLoading(true);
      const response = await fetch("/api/contacts");
      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts || []);
      }
    } catch (err) {
      console.error("Error fetching contacts:", err);
    } finally {
      setContactsLoading(false);
    }
  }

  async function handleSendTestBriefing() {
    if (events.length === 0) return;
    
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
    } catch (err) {
      console.error("Error sending test briefing:", err);
    }
  }

  async function handleImportContacts() {
    try {
      const response = await fetch("/api/contacts/import", { method: "POST" });
      if (response.ok) {
        fetchContacts();
      }
    } catch (err) {
      console.error("Error importing contacts:", err);
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
      {/* Navbar */}
      <nav className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="text-lg font-semibold tracking-tight text-white hover:opacity-80 transition-opacity">
            PreMeet
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-slate-400 transition-colors hover:text-white"
          >
            Back to Home
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="mt-1 text-slate-400">Manage your briefings and network</p>
        </div>

        {/* Big Equal-Weight Tabs */}
        <div className="mb-8 grid grid-cols-2 gap-1 rounded-xl bg-slate-900/50 p-1">
          <button
            onClick={() => setActiveTab("briefings")}
            className={`relative flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-medium transition-all ${
              activeTab === "briefings"
                ? "bg-indigo-600 text-white shadow-lg"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            Briefings
            {events.length > 0 && (
              <span className={`ml-1 rounded-full px-2 py-0.5 text-xs ${
                activeTab === "briefings" ? "bg-white/20" : "bg-slate-800"
              }`}>
                {events.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("network")}
            className={`relative flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-medium transition-all ${
              activeTab === "network"
                ? "bg-indigo-600 text-white shadow-lg"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            Your Network
            {contacts.length > 0 && (
              <span className={`ml-1 rounded-full px-2 py-0.5 text-xs ${
                activeTab === "network" ? "bg-white/20" : "bg-slate-800"
              }`}>
                {contacts.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "briefings" ? (
          <BriefingsTab
            events={events}
            loading={eventsLoading}
            error={eventsError}
            googleConnected={googleConnected}
            onSendTest={handleSendTestBriefing}
          />
        ) : (
          <NetworkTab
            contacts={contacts}
            loading={contactsLoading}
            onImport={handleImportContacts}
          />
        )}
      </main>
    </div>
  );
}
