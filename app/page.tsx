"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useInView, useSpring } from "framer-motion";
import Link from "next/link";

// Animated gradient background
function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute -inset-[100%] animate-[spin_20s_linear_infinite] opacity-30">
        <div className="absolute top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-3xl" />
        <div className="absolute top-1/3 left-1/3 h-[600px] w-[600px] rounded-full bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-teal-500/20 blur-3xl" />
      </div>
      <div className="absolute inset-0 bg-slate-950/80" />
    </div>
  );
}

// Typewriter effect hook
function useTypewriter(text: string, speed: number = 50, start: boolean = true) {
  const [displayText, setDisplayText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!start) return;
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayText(text.slice(0, i + 1));
        i++;
      } else {
        setIsComplete(true);
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed, start]);

  return { displayText, isComplete };
}

// Fade in when in view
function FadeIn({ 
  children, 
  delay = 0, 
  direction = "up",
  className = "" 
}: { 
  children: React.ReactNode; 
  delay?: number; 
  direction?: "up" | "down" | "left" | "right";
  className?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  const directions = {
    up: { y: 40, x: 0 },
    down: { y: -40, x: 0 },
    left: { y: 0, x: 40 },
    right: { y: 0, x: -40 },
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...directions[direction] }}
      animate={isInView ? { opacity: 1, y: 0, x: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Scale up when in view
function ScaleIn({ 
  children, 
  delay = 0,
  className = "" 
}: { 
  children: React.ReactNode; 
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Bounce icon animation
function BounceIcon({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ scale: 0 }}
      animate={isInView ? { scale: 1 } : {}}
      transition={{ 
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay 
      }}
    >
      {children}
    </motion.div>
  );
}

// Mock email preview
function MockEmail({ progress }: { progress: number }) {
  const attendees = [
    { name: "Sarah Chen", role: "VP of Engineering" },
    { name: "Marcus Johnson", role: "Product Lead" },
    { name: "Emily Rodriguez", role: "Design Director" },
  ];

  return (
    <div className="relative mx-auto max-w-lg overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
      <div className="border-b border-slate-800 bg-slate-800/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500/80" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
          <div className="h-3 w-3 rounded-full bg-green-500/80" />
        </div>
      </div>
      <div className="p-6">
        <motion.div 
          className="mb-4 text-xs text-slate-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: progress > 0.1 ? 1 : 0 }}
        >
          From: PreMeet &lt;briefings@premeet.app&gt;
        </motion.div>
        <motion.h3 
          className="mb-4 text-lg font-semibold text-white"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: progress > 0.2 ? 1 : 0, y: progress > 0.2 ? 0 : 10 }}
        >
          Briefing: Q4 Planning Session today at 2:00 PM
        </motion.h3>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: progress > 0.4 ? 1 : 0 }}
          className="space-y-3"
        >
          <p className="text-sm text-slate-400">Attendees (3)</p>
          {attendees.map((attendee, i) => (
            <motion.div
              key={attendee.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ 
                opacity: progress > 0.5 + i * 0.15 ? 1 : 0, 
                x: progress > 0.5 + i * 0.15 ? 0 : -20 
              }}
              className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-800/30 px-3 py-2"
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500" />
              <div>
                <p className="text-sm font-medium text-white">{attendee.name}</p>
                <p className="text-xs text-slate-500">{attendee.role}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

// Hero Section
function Hero() {
  const { displayText, isComplete } = useTypewriter("Never Walk Into A Meeting Blind", 60);

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-6">
      <AnimatedBackground />
      
      {/* Beta Badge */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 1 }}
        className="absolute right-6 top-24 z-20"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-400 ring-1 ring-inset ring-indigo-500/20">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
          </span>
          Beta
        </span>
      </motion.div>
      
      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl md:text-7xl">
            {displayText}
            {!isComplete && (
              <span className="inline-block h-[1em] w-[3px] animate-pulse bg-indigo-500 align-middle" />
            )}
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isComplete ? 1 : 0, y: isComplete ? 0 : 20 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mx-auto mt-8 max-w-2xl text-xl leading-relaxed text-slate-400 sm:text-2xl"
        >
          Get a 5-minute briefing on everyone you&apos;re about to meet.
          Delivered to your inbox before every meeting.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: isComplete ? 1 : 0, scale: isComplete ? 1 : 0.9 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-10 flex flex-col items-center gap-3"
        >
          <Link
            href="/sign-up"
            className="group relative inline-flex items-center justify-center overflow-hidden rounded-lg bg-indigo-600 px-10 py-4 text-lg font-medium text-white transition-all duration-300 hover:bg-indigo-500 hover:shadow-[0_0_40px_-10px_rgba(99,102,241,0.5)] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            <span className="relative z-10">Get Free Beta Access</span>
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          </Link>
          <p className="text-sm text-slate-500">
            Free during beta · No credit card required
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
      >
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <span className="text-xs uppercase tracking-widest">Scroll to explore</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="h-6 w-4 rounded-full border-2 border-slate-600"
          >
            <div className="mx-auto mt-1 h-1.5 w-1 rounded-full bg-slate-400" />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

// How It Works Section
function HowItWorks() {
  const steps = [
    {
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Connect Your Calendar",
      description: "One-click Google Calendar integration. We only need read access to see your upcoming meetings.",
    },
    {
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
      ),
      title: "Get Briefing Emails",
      description: "5 minutes before each meeting, receive an email with intel on every attendee.",
    },
    {
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
        </svg>
      ),
      title: "Walk In Prepared",
      description: "Know who you're meeting, their role, and talking points. Make every meeting count.",
    },
  ];

  return (
    <section className="relative py-32 px-6">
      <div className="mx-auto max-w-6xl">
        <FadeIn className="mb-20 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">How It Works</h2>
          <p className="mt-4 text-lg text-slate-400">Three simple steps to meeting intelligence</p>
        </FadeIn>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <FadeIn 
              key={step.title} 
              delay={i * 0.15}
              direction={i === 0 ? "left" : i === 2 ? "right" : "up"}
            >
              <div className="group relative rounded-2xl border border-slate-800 bg-slate-900/50 p-8 transition-all duration-300 hover:border-indigo-500/30 hover:bg-slate-900">
                <div className="mb-6 inline-flex rounded-xl bg-indigo-500/10 p-4 text-indigo-400">
                  <BounceIcon delay={0.3 + i * 0.2}>{step.icon}</BounceIcon>
                </div>
                <h3 className="mb-3 text-xl font-semibold text-white">{step.title}</h3>
                <p className="leading-relaxed text-slate-400">{step.description}</p>
                <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-indigo-500/0 to-indigo-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// Demo Section with scroll progress
function DemoSection() {
  const containerRef = useRef(null);
  const [progressValue, setProgressValue] = useState(0);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });
  const progress = useTransform(scrollYProgress, [0.2, 0.8], [0, 1]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.8, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);
  
  // Convert MotionValue to plain number
  useEffect(() => {
    const unsubscribe = progress.on("change", (v) => setProgressValue(v));
    return () => unsubscribe();
  }, [progress]);

  return (
    <section ref={containerRef} className="relative py-32 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <FadeIn direction="left">
            <div>
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Your Briefing, Delivered
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-slate-400">
                Every briefing email includes meeting details, attendee list with roles, 
                and response status. Everything you need in one clean email.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "Meeting time and duration",
                  "Complete attendee roster",
                  "Response status (accepted/declined)",
                  "Clean, mobile-friendly format",
                ].map((item, i) => (
                  <motion.li
                    key={item}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * i }}
                    viewport={{ once: true }}
                    className="flex items-center gap-3 text-slate-300"
                  >
                    <svg className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </motion.li>
                ))}
              </ul>
            </div>
          </FadeIn>

          <motion.div style={{ scale, opacity }} className="lg:sticky lg:top-32">
            <MockEmail progress={progressValue} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Features Grid
function Features() {
  const features = [
    { title: "5-Minute Timing", desc: "Briefings arrive exactly when you need them" },
    { title: "Privacy First", desc: "We only read calendar data, never store emails" },
    { title: "Works Everywhere", desc: "Gmail, Outlook, any email client" },
    { title: "Smart Detection", desc: "Automatic meeting discovery from your calendar" },
    { title: "Attendee Intel", desc: "Know who you're meeting before you say hello" },
    { title: "Zero Setup", desc: "Connect calendar and you're done" },
  ];

  return (
    <section className="relative py-32 px-6">
      <div className="mx-auto max-w-6xl">
        <FadeIn className="mb-20 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Everything You Need</h2>
          <p className="mt-4 text-lg text-slate-400">Simple, powerful, designed for professionals</p>
        </FadeIn>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <ScaleIn key={feature.title} delay={i * 0.1}>
              <div className="group h-full rounded-xl border border-slate-800 bg-slate-900/30 p-6 transition-all duration-300 hover:border-slate-700 hover:bg-slate-900/50">
                <h3 className="mb-2 font-semibold text-white">{feature.title}</h3>
                <p className="text-sm text-slate-400">{feature.desc}</p>
              </div>
            </ScaleIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// Social Proof
function SocialProof() {
  const testimonials = [
    {
      quote: "PreMeet has completely changed how I prepare for meetings. I walk in knowing exactly who I'm talking to.",
      author: "Sarah Chen",
      role: "VP of Engineering",
    },
    {
      quote: "The 5-minute timing is perfect. Just enough time to review, not enough to forget.",
      author: "Marcus Johnson",
      role: "Product Lead",
    },
    {
      quote: "I used to scramble before client calls. Now I'm always prepared with PreMeet.",
      author: "Emily Rodriguez",
      role: "Design Director",
    },
  ];

  return (
    <section className="relative overflow-hidden py-32 px-6">
      <div className="mx-auto max-w-6xl">
        <FadeIn className="mb-20 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Loved by Professionals</h2>
        </FadeIn>

        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <FadeIn key={t.author} delay={i * 0.15} direction={i === 1 ? "up" : i === 0 ? "left" : "right"}>
              <div className="relative rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/50 to-slate-900 p-8">
                <svg className="mb-4 h-8 w-8 text-indigo-500/50" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                <p className="mb-6 leading-relaxed text-slate-300">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="font-medium text-white">{t.author}</p>
                  <p className="text-sm text-slate-500">{t.role}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// CTA Section
function CTA() {
  return (
    <section className="relative py-32 px-6">
      <div className="mx-auto max-w-4xl text-center">
        <FadeIn>
          <h2 className="text-4xl font-bold text-white sm:text-5xl">
            Ready to walk in prepared?
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
            Join the beta and be among the first to experience meeting intelligence.
          </p>
          <div className="mt-10 flex flex-col items-center gap-3">
            <Link
              href="/sign-up"
              className="group relative inline-flex items-center justify-center overflow-hidden rounded-lg bg-indigo-600 px-10 py-4 text-lg font-medium text-white transition-all duration-300 hover:bg-indigo-500 hover:shadow-[0_0_40px_-10px_rgba(99,102,241,0.5)]"
            >
              <span className="relative z-10">Get Free Beta Access</span>
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </Link>
            <p className="text-sm text-slate-500">
              Free during beta · No credit card required
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// Footer
function Footer() {
  return (
    <footer className="border-t border-slate-800/50 py-12 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <span className="text-lg font-semibold text-white">PreMeet</span>
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} PreMeet. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

// Main Page
export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased">
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold tracking-tight text-white">
              PreMeet
            </span>
            <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-400 ring-1 ring-inset ring-indigo-500/20">
              BETA
            </span>
          </div>
          <Link
            href="/sign-in"
            className="text-sm font-medium text-slate-400 transition-colors hover:text-white"
          >
            Sign In
          </Link>
        </div>
      </nav>

      <main>
        <Hero />
        <HowItWorks />
        <DemoSection />
        <Features />
        <SocialProof />
        <CTA />
      </main>

      <Footer />
    </div>
  );
}
