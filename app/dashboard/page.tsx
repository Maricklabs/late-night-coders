"use client";

import Link from "next/link";
import { Bot, FileText, Zap, Music, Keyboard, ArrowRight, Activity, CheckCircle2, CalendarDays } from "lucide-react";
import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase"; 
import { useAuthState } from "react-firebase-hooks/auth";

export default function DashboardPage() {
  const [user, loading] = useAuthState(auth);
  
  // Fallback username logic
  const username = user?.displayName ? user.displayName.split(" ")[0] : "Night Owl";
  const [checkedIn, setCheckedIn] = useState(false);

  useEffect(() => {
     if (typeof window !== "undefined") {
        const lastCheckIn = localStorage.getItem('daily_check_in_date');
        const today = new Date().toLocaleDateString();
        if(lastCheckIn === today) setCheckedIn(true);
     }
  }, []);

  const handleCheckIn = () => {
      const today = new Date().toLocaleDateString();
      localStorage.setItem('daily_check_in_date', today);
      setCheckedIn(true);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen flex flex-col relative">
      
      {/* Header Section */}
      <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 tracking-tight text-white">
            LATE NIGHT CODERS <span className="text-yellow-500">LOUNGE</span>
          </h1>
          <p className="text-slate-400 text-xl max-w-2xl">
            Welcome back, <span className="text-white font-semibold">{loading ? "..." : username}</span>! 
            <br className="hidden md:block" /> The coffee is hot and the bugs are waiting~
          </p>
        </div>

        {/* DAILY CHECK-IN BUTTON */}
        <button 
            onClick={handleCheckIn}
            disabled={checkedIn}
            className={`
                px-6 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all duration-300 shadow-xl
                ${checkedIn 
                    ? "bg-green-500/10 text-green-400 border border-green-500/20 cursor-default" 
                    : "bg-white text-slate-950 hover:bg-yellow-400 hover:scale-105 active:scale-95"
                }
            `}
        >
            {checkedIn ? (
                <>
                    <CheckCircle2 size={24} />
                    <div className="flex flex-col items-start leading-none">
                        <span className="text-sm uppercase tracking-wider opacity-70">Daily Goal</span>
                        <span>Checked In</span>
                    </div>
                </>
            ) : (
                <>
                    <CalendarDays size={24} />
                    <div className="flex flex-col items-start leading-none">
                        <span className="text-xs uppercase tracking-wider opacity-70">Start Shift</span>
                        <span>Daily Check-In</span>
                    </div>
                </>
            )}
        </button>
      </header>

      {/* Main Grid Menu */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1 mb-12">
        <DashboardCard 
          href="/dashboard/duck" 
          title="Rubber Duck Debugger" 
          desc="AI companion. Explain your logic to the duck until the bug reveals itself."
          icon={<Bot className="text-yellow-400 w-8 h-8" />}
          color="hover:border-yellow-500/50 hover:shadow-yellow-500/20"
        />
        <DashboardCard 
          href="/dashboard/readme" 
          title="Readme Rooster" 
          desc="Wake up your docs! Paste messy code and get a clean markdown file."
          icon={<FileText className="text-red-400 w-8 h-8" />}
          color="hover:border-red-500/50 hover:shadow-red-500/20"
        />
        <DashboardCard 
          href="/dashboard/race" 
          title="Randomizer Roadrunner" 
          desc="Meep meep! Let the RNG speedster decide which task you tackle first."
          icon={<Zap className="text-blue-400 w-8 h-8" />}
          color="hover:border-blue-500/50 hover:shadow-blue-500/20"
        />
        <DashboardCard 
          href="/dashboard/breakroom" 
          title="Breakroom Bird" 
          desc="Lo-fi beats and chill vibes. Nest here when the code breaks."
          icon={<Music className="text-purple-400 w-8 h-8" />}
          color="hover:border-purple-500/50 hover:shadow-purple-500/20"
        />
        <DashboardCard 
          href="/dashboard/typetest" 
          title="Typetest Turkey" 
          desc="Don't type like a turkey. Gobble up words and boost your WPM."
          icon={<Keyboard className="text-orange-400 w-8 h-8" />}
          color="hover:border-orange-500/50 hover:shadow-orange-500/20"
        />
         <DashboardCard 
          href="/dashboard/tracker" 
          title="Tracker Toucan" 
          desc="Visualize your productivity ecosystem and daily stats."
          icon={<Activity className="text-green-400 w-8 h-8" />}
          color="hover:border-green-500/50 hover:shadow-green-500/20"
        />
      </div>

      <footer className="mt-auto pt-8 border-t border-slate-900 text-center flex justify-center items-center gap-6 text-slate-600 text-sm">
        <span>© 2025 Late Night Coder's Lounge by <Link href="https://maricklabs.netlify.app/" className="hover:text-yellow-500 transition">Maricklabs</Link></span>
        <span className="w-1 h-1 bg-slate-800 rounded-full"></span>
        <Link href="/" className="hover:text-yellow-500 transition">Back to Landing Page</Link>
      </footer>
    </div>
  );
}

function DashboardCard({ href, title, desc, icon, color }: any) {
  return (
    <Link 
      href={href} 
      className={`group relative bg-slate-900/40 border border-slate-800 p-8 rounded-3xl transition-all duration-300 hover:-translate-y-1 hover:bg-slate-900 ${color} shadow-lg flex flex-col`}
    >
      <div className="flex justify-between items-start mb-6">
        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 group-hover:scale-110 transition duration-300 shadow-md">
          {icon}
        </div>
        <ArrowRight className="text-slate-600 group-hover:text-white transition-transform duration-300 group-hover:translate-x-1" />
      </div>
      <h3 className="text-2xl font-bold mb-3 text-white">{title}</h3>
      <p className="text-slate-400 font-medium leading-relaxed group-hover:text-slate-300">{desc}</p>
    </Link>
  );
}