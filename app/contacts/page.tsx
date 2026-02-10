"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import Link from "next/link";

interface Contact {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  title: string | null;
  last_meeting_date: string;
  meeting_count: number;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "Never";
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
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

export default function ContactsPage() {
  const { isLoaded, isSignedIn } = useUser();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  const [stats, setStats] = useState({ total: 0, recent: [] as Contact[] });
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("recent");
  const [selectedCompany, setSelectedCompany] = useState("");

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      redirect("/sign-in");
      return;
    }

    fetchContacts();
  }, [isLoaded, isSignedIn, search, filter, selectedCompany]);

  async function fetchContacts() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (filter) params.append("filter", filter);
      if (selectedCompany) params.append("company", selectedCompany);

      const response = await fetch(`/api/contacts?${params}`);
      if (!response.ok) throw new Error("Failed to fetch contacts");
      
      const data = await response.json();
      setContacts(data.contacts);
      setCompanies(data.companies);
      setStats(data.stats);
    } catch (err) {
      console.error("Error fetching contacts:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleImport() {
    try {
      setImporting(true);
      const response = await fetch("/api/contacts/import", { method: "POST" });
      if (!response.ok) throw new Error("Failed to import contacts");
      
      const data = await response.json();
      alert(data.message);
      fetchContacts();
    } catch (err) {
      console.error("Error importing contacts:", err);
      alert("Failed to import contacts");
    } finally {
      setImporting(false);
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
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-lg font-semibold tracking-tight text-white hover:opacity-80 transition-opacity">
              PreMeet
            </Link>
            <Link 
              href="/dashboard" 
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Dashboard
            </Link>
            <span className="text-sm text-white">Network</span>
          </div>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-slate-400 transition-colors hover:text-white"
          >
            Back to Dashboard
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Your Network</h1>
            <p className="mt-1 text-slate-400">
              {stats.total} contacts imported from your calendar
            </p>
          </div>
          <button
            onClick={handleImport}
            disabled={importing}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
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
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                Sync Contacts
              </>
            )}
          </button>
        </div>

        {/* Filters */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* Search */}
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

          {/* Filter tabs */}
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

          {/* Company filter */}
          {companies.length > 0 && (
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="">All Companies</option>
              {companies.map((company) => (
                <option key={company} value={company}>
                  {company}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Contacts Grid */}
        {loading ? (
          <div className="mt-12 flex items-center justify-center">
            <div className="text-slate-400">Loading contacts...</div>
          </div>
        ) : contacts.length === 0 ? (
          <div className="mt-12 rounded-xl border border-slate-800 bg-slate-900/50 p-12 text-center">
            <p className="text-slate-400">No contacts found</p>
            <p className="mt-2 text-sm text-slate-500">
              Sync your calendar to import contacts from your meetings
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="group relative rounded-xl border border-slate-800 bg-slate-900/40 p-5 transition-all duration-200 hover:-translate-y-1 hover:border-slate-700 hover:bg-slate-900/60 hover:shadow-lg hover:shadow-black/20"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${getAvatarColor(contact.email)} text-sm font-medium text-white`}>
                    {getInitials(contact.name, contact.email)}
                  </div>
                  
                  {/* Info */}
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

                {/* Meeting stats */}
                <div className="mt-4 flex items-center justify-between border-t border-slate-800/50 pt-4">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formatDate(contact.last_meeting_date)}
                  </div>
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                    {contact.meeting_count} meetings
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent Contacts Preview */}
        {stats.recent.length > 0 && (
          <div className="mt-16">
            <h2 className="text-lg font-semibold text-white">Recently Met</h2>
            <div className="mt-4 flex gap-4 overflow-x-auto pb-4">
              {stats.recent.map((contact) => (
                <div
                  key={contact.id}
                  className="flex shrink-0 items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-3"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${getAvatarColor(contact.email)} text-xs font-medium text-white`}>
                    {getInitials(contact.name, contact.email)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {contact.name || contact.email.split("@")[0]}
                    </p>
                    <p className="text-xs text-slate-500">{formatDate(contact.last_meeting_date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
