"use client";

import { useEffect, useState } from "react";
import { Activity, MessageSquare, FileText, CheckCircle, Coffee, Keyboard, Flame, Calendar as CalendarIcon, LogIn, User } from "lucide-react";

// --- Firebase Imports ---
import { db, auth } from "@/lib/firebase"; 
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, onSnapshot, setDoc, updateDoc, increment, serverTimestamp } from "firebase/firestore";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

export default function TrackerToucan() {
  const [user, loading] = useAuthState(auth);
  
  const [stats, setStats] = useState({
    chats: 0,
    readmes: 0,
    tasks: 0,
    breaks: 0,
    typetests: 0,
    daysUsed: 1
  });

  const [currentDate, setCurrentDate] = useState(new Date());

  // --- STATS LOGIC ---
  useEffect(() => {
    // 1. IF LOGGED IN: Use Firebase
    if (user) {
      const statsRef = doc(db, "user_stats", user.uid);

      const unsubscribe = onSnapshot(statsRef, async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const todayStr = new Date().toLocaleDateString();
          
          // --- AUTO-STREAK LOGIC (Server Side-ish) ---
          // If the last visit date recorded in DB is NOT today, we increment the streak
          if (data.lastVisit !== todayStr) {
             await updateDoc(statsRef, {
                 daysUsed: increment(1),
                 lastVisit: todayStr
             });
             // The snapshot will fire again automatically after this update, updating the UI
          } else {
             setStats({
                chats: data.chats || 0,
                readmes: data.readmes || 0,
                tasks: data.tasks || 0,
                breaks: data.breaks || 0,
                typetests: data.typetests || 0,
                daysUsed: data.daysUsed || 1
             });
          }
        } else {
          // First time user? Create the stats document
          await setDoc(statsRef, {
            chats: 0, readmes: 0, tasks: 0, breaks: 0, typetests: 0,
            daysUsed: 1,
            lastVisit: new Date().toLocaleDateString()
          });
        }
      });
      return () => unsubscribe();
    } 
    
    // 2. IF GUEST: Use LocalStorage (Legacy Mode)
    else if (!loading) {
      const chats = parseInt(localStorage.getItem('stats_debug_chats') || '0');
      const readmes = parseInt(localStorage.getItem('stats_readme_gen') || '0');
      const tasks = parseInt(localStorage.getItem('stats_tasks_completed') || '0');
      const breaks = parseInt(localStorage.getItem('stats_breakroom_visits') || '0');
      const typetests = parseInt(localStorage.getItem('stats_typetest_played') || '0');

      // Streak Logic for LocalStorage
      const todayStr = new Date().toLocaleDateString();
      const lastVisit = localStorage.getItem("stats_last_visit_date");
      let daysUsed = parseInt(localStorage.getItem("stats_days_used") || "1");

      if (lastVisit !== todayStr) {
          if (lastVisit) daysUsed += 1;
          localStorage.setItem("stats_days_used", daysUsed.toString());
          localStorage.setItem("stats_last_visit_date", todayStr);
      }
      setStats({ chats, readmes, tasks, breaks, typetests, daysUsed });
    }
  }, [user, loading]);

  // Auth Helper
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try { await signInWithPopup(auth, provider); } catch (e) { console.error(e); }
  };

  const totalProductivity = stats.chats + stats.readmes + stats.tasks;
  const totalChill = stats.breaks + stats.typetests;

  // Calendar Helpers
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();
  const todayDay = new Date().getDate();

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto flex flex-col gap-8">
       {/* Header */}
       <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2 flex items-center gap-3">
            Tracker <span className="text-green-500">Toucan</span>
            <Activity className="w-8 h-8 text-green-500 animate-bounce" />
          </h1>
          <p className="text-slate-400">Your productivity ecosystem summary.</p>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Productivity Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-32 bg-green-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition group-hover:bg-green-500/20"></div>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Activity className="text-green-400" /> Productivity
            </h2>
            <div className="space-y-4">
                <StatRow icon={<MessageSquare className="w-5 h-5 text-yellow-400" />} label="Debug Duck Chats" value={stats.chats} color="text-yellow-400" />
                <StatRow icon={<FileText className="w-5 h-5 text-red-400" />} label="Readmes Generated" value={stats.readmes} color="text-red-400" />
                <StatRow icon={<CheckCircle className="w-5 h-5 text-blue-400" />} label="Tasks Completed" value={stats.tasks} color="text-blue-400" />
            </div>
            <div className="mt-8 pt-6 border-t border-slate-800">
                <p className="text-slate-400 text-sm">Total Actions</p>
                <p className="text-4xl font-black text-white">{totalProductivity}</p>
            </div>
        </div>

        {/* Chill Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-32 bg-purple-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition group-hover:bg-purple-500/20"></div>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Coffee className="text-purple-400" /> Chill Zone
            </h2>
            <div className="space-y-4">
                <StatRow icon={<Coffee className="w-5 h-5 text-purple-400" />} label="Breakroom Visits" value={stats.breaks} color="text-purple-400" />
                <StatRow icon={<Keyboard className="w-5 h-5 text-orange-400" />} label="TypeTests Played" value={stats.typetests} color="text-orange-400" />
            </div>
            <div className="mt-8 pt-6 border-t border-slate-800">
                <p className="text-slate-400 text-sm">Total Sessions</p>
                <p className="text-4xl font-black text-white">{totalChill}</p>
            </div>
        </div>
      </div>

      {/* NEW: Streak & Calendar Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Streak Count */}
        <div className="md:col-span-1 bg-slate-900 border border-slate-800 rounded-3xl p-8 relative overflow-hidden flex flex-col justify-center">
             <div className="absolute top-0 right-0 p-24 bg-orange-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
             <div className="flex items-center gap-3 mb-2 text-orange-400">
                <Flame className="w-6 h-6" />
                <span className="font-bold">Consistency Streak</span>
             </div>
             <p className="text-6xl font-black text-white mb-2">{stats.daysUsed}</p>
             <p className="text-slate-400">Days visited</p>
        </div>

        {/* Visual Calendar */}
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-8 relative overflow-hidden">
             <div className="flex items-center justify-between mb-6 relative z-10">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <CalendarIcon className="text-slate-400" /> {monthName} {year}
                </h2>
                <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700">Current Date</span>
             </div>

             <div className="grid grid-cols-7 gap-2 text-center text-sm relative z-10">
                {['S','M','T','W','T','F','S'].map((d, i) => (
                    <div key={i} className="text-slate-500 font-bold mb-2">{d}</div>
                ))}
                
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={`empty-${i}`}></div>
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const isToday = day === todayDay;
                    return (
                        <div 
                            key={day} 
                            className={`aspect-square flex items-center justify-center rounded-lg font-bold transition
                                ${isToday 
                                    ? "bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg shadow-green-900/50 scale-110" 
                                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                }
                            `}
                        >
                            {day}
                        </div>
                    );
                })}
             </div>
        </div>
      </div>

      {/* Summary Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-8 text-center">
         <h3 className="text-xl text-slate-300 mb-2">Overall Vibe</h3>
         <p className="text-3xl font-bold text-white">
            {totalProductivity > totalChill * 2 
                ? "🚀 You are in absolute grind mode!" 
                : totalChill > totalProductivity 
                ? "🧘 Taking it easy today, aren't we?" 
                : "⚖️ Perfectly balanced, as all things should be."}
         </p>
      </div>
    </div>
  );
}

function StatRow({ icon, label, value, color }: any) {
    return (
        <div className="flex justify-between items-center bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
            <div className="flex items-center gap-3 text-slate-300">
                {icon}
                <span>{label}</span>
            </div>
            <span className={`font-bold font-mono text-xl ${color}`}>{value}</span>
        </div>
    );
}