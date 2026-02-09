export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased">
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center px-6">
          <span className="text-lg font-semibold tracking-tight text-white">
            PreMeet
          </span>
        </div>
      </nav>

      <main className="flex min-h-screen flex-col items-center justify-center px-6 pt-14">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl">
            Never walk into a meeting blind
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-400 sm:text-xl">
            Get a 5-minute briefing on everyone you&apos;re about to meet.
            Delivered to your inbox before every meeting.
          </p>
          <div className="mt-10">
            <a
              href="/sign-up"
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-8 py-3.5 text-base font-medium text-white transition-colors hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              Get Started
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
