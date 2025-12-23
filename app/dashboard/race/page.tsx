"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Zap, CheckCircle, RotateCcw, Trophy, X, Flag, List, LogIn, Calendar, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Firebase Imports ---
import { db, auth, incrementStat } from "@/lib/firebase"; // Ensure path is correct
import { useAuthState } from "react-firebase-hooks/auth";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from "firebase/firestore";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

type LocalTask = {
  id: string;
  text: string;
  completed: boolean; // Used for UI state in winner's circle before saving
  progress: number;
};

type DbTask = {
  id: string;
  text: string;
  completedAt: any;
};

export default function RandomizerRoadrunner() {
  const [user] = useAuthState(auth);
  
  // --- LOCAL STATE (The Race) ---
  const [input, setInput] = useState("");
  const [contestants, setContestants] = useState<LocalTask[]>([]);
  const [winners, setWinners] = useState<LocalTask[]>([]); // "Active" winners (not yet saved to DB)
  const [isRacing, setIsRacing] = useState(false);
  const [currentWinner, setCurrentWinner] = useState<LocalTask | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // --- DB STATE (The History) ---
  const [history, setHistory] = useState<DbTask[]>([]);

  // 1. LOAD LOCAL DATA (Contestants & Active Winners)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedContestants = localStorage.getItem("roadrunner_contestants");
      const savedWinners = localStorage.getItem("roadrunner_winners");
      
      if (savedContestants) setContestants(JSON.parse(savedContestants));
      if (savedWinners) setWinners(JSON.parse(savedWinners));
      setIsLoaded(true);
    }
  }, []);

  // 2. SAVE LOCAL DATA
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("roadrunner_contestants", JSON.stringify(contestants));
      localStorage.setItem("roadrunner_winners", JSON.stringify(winners));
    }
  }, [contestants, winners, isLoaded]);

  // 3. LOAD DB DATA (Completed History)
  useEffect(() => {
    if (!user) {
      setHistory([]);
      return;
    }

    const q = query(
      collection(db, "roadrunner_completed"), 
      where("userId", "==", user.uid),
      orderBy("completedAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DbTask[];
      setHistory(docs);
    });

    return () => unsubscribe();
  }, [user]);

  // --- ACTIONS ---

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try { await signInWithPopup(auth, provider); } catch (e) { console.error(e); }
  };

  const addTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;
    const newTask = { id: Date.now().toString(), text: input, completed: false, progress: 0 };
    setContestants([...contestants, newTask]);
    setInput("");
  };

  const removeContestant = (id: string) => {
    setContestants(contestants.filter((t) => t.id !== id));
  };

  const removeActiveWinner = (id: string) => {
    setWinners(winners.filter((t) => t.id !== id));
  };

  // KEY LOGIC: Move from Local "Winner" -> Firestore "History"
  const saveToHistory = async (task: LocalTask) => {
    if (!user) {
      alert("Please login to save your completed tasks!");
      return;
    }


    try {
        // 1. Add to Firebase
        await addDoc(collection(db, "roadrunner_completed"), {
            userId: user.uid,
            text: task.text,
            completedAt: serverTimestamp()
        });
        incrementStat(user.uid, "tasks");
        
        // 2. Remove from Local Lists
        setWinners(prev => prev.filter(w => w.id !== task.id));
        setCurrentWinner(null);

        // Tracker Update (Optional)
        const currentCompleted = parseInt(localStorage.getItem("stats_tasks_completed") || "0");
        localStorage.setItem("stats_tasks_completed", (currentCompleted + 1).toString());

    } catch (error) {
        console.error("Error saving to history:", error);
    }
  };

  const deleteHistoryItem = async (id: string) => {
      try {
          await deleteDoc(doc(db, "roadrunner_completed", id));
      } catch (error) {
          console.error("Error deleting history:", error);
      }
  };

  const startRace = () => {
    if (contestants.length < 1) return;
    setIsRacing(true);
    setCurrentWinner(null);

    const winnerIndex = Math.floor(Math.random() * contestants.length);
    const winnerId = contestants[winnerIndex].id;

    const interval = setInterval(() => {
      setContestants((prev) => 
        prev.map((t) => {
          const speed = t.id === winnerId ? Math.random() * 15 + 5 : Math.random() * 10;
          return { ...t, progress: Math.min(t.progress + speed, 100) };
        })
      );
    }, 100);

    setTimeout(() => {
      clearInterval(interval);
      const winner = contestants[winnerIndex];
      setCurrentWinner(winner);
      setIsRacing(false);

      const resetContestants = contestants.map(c => ({...c, progress: 0})).filter(c => c.id !== winner.id);
      
      setContestants(resetContestants);
      setWinners((prev) => [winner, ...prev]);
    }, 3000);
  };

  const resetLocal = () => {
    if(confirm("Clear the current race and active winners?")) {
      setContestants([]);
      setWinners([]);
      setCurrentWinner(null);
    }
  };

  if (!isLoaded) return null;

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto p-4 gap-8">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2 flex items-center gap-3">
            Randomizer <span className="text-blue-500">Roadrunner</span>
            <Zap className="w-6 h-6 md:w-8 md:h-8 text-blue-500 animate-bounce" />
          </h1>
          <p className="text-sm md:text-base text-slate-400">RNG Task Racing. Finishers go to the Quest Log.</p>
        </div>
      </div>

      {/* TOP SECTION: RACE AREA */}
      <div className="flex flex-col lg:flex-row gap-6 lg:h-[600px] min-h-0">
        
        {/* LEFT: CONTESTANT SETUP */}
        <div className="w-full lg:w-1/3 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col shrink-0 lg:h-full max-h-[500px] lg:max-h-full">
          <div className="p-4 border-b border-slate-800 bg-slate-950/50 shrink-0">
            <h2 className="font-bold text-white flex items-center gap-2">
              <List className="w-4 h-4 text-blue-500" /> Contestants
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar min-h-0">
            <AnimatePresence>
              {contestants.map((task) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex justify-between items-center bg-slate-800/50 p-3 rounded-xl border border-transparent hover:border-slate-700 transition group"
                >
                  <span className="truncate text-slate-200 text-sm">{task.text}</span>
                  {!isRacing && (
                    <button onClick={() => removeContestant(task.id)} className="text-slate-600 hover:text-red-400 lg:opacity-0 lg:group-hover:opacity-100 transition">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {contestants.length === 0 && !isRacing && (
                <div className="text-center text-slate-600 italic text-xs py-10">Add contestants to begin.</div>
            )}
          </div>

          <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex flex-col gap-3 shrink-0">
             <form onSubmit={addTask} className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Add task..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition text-sm"
                  disabled={isRacing}
                />
                <button disabled={isRacing || !input.trim()} type="submit" className="bg-slate-800 hover:bg-slate-700 text-blue-400 p-2 rounded-xl transition disabled:opacity-50">
                  <Plus className="w-5 h-5" />
                </button>
             </form>

             <div className="flex gap-2">
                <button
                  onClick={startRace}
                  disabled={isRacing || contestants.length < 1}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 transition active:scale-95"
                >
                  {isRacing ? <Zap className="w-5 h-5 animate-pulse" /> : "Start Race"}
                </button>
                <button onClick={resetLocal} disabled={isRacing} className="px-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition text-slate-400 hover:text-red-400">
                  <RotateCcw className="w-5 h-5" />
                </button>
             </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex-1 flex flex-col gap-6 lg:h-full min-h-0">
            
            {/* UPPER: THE RACE TRACK */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 min-h-[300px] flex-1 relative flex flex-col justify-center overflow-hidden">
               {/* Background Grid */}
               <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

               {isRacing || contestants.length > 0 ? (
                 <div className="space-y-6 relative z-10 overflow-y-auto custom-scrollbar h-full w-full pr-8 py-2">
                   <div className="absolute right-0 top-0 bottom-0 w-[2px] border-r-2 border-dashed border-slate-600 z-0 h-full opacity-30"></div>
                   {contestants.map((t) => (
                     <div key={t.id} className="relative z-10">
                       <div className="text-xs text-slate-500 mb-1 truncate max-w-[200px] font-mono pl-1">{t.text}</div>
                       <div className="h-8 bg-slate-950/50 rounded-full w-full relative border border-slate-800/50 overflow-visible">
                         <motion.div 
                           className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full flex items-center justify-end"
                           style={{ width: `${t.progress}%` }}
                           animate={{ width: `${t.progress}%` }}
                         >
                            <div className="absolute -right-3 top-1/2 -translate-y-1/2 text-xl filter drop-shadow-lg transform scale-x-[-1] select-none">
                              🦆
                            </div>
                         </motion.div>
                       </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center text-slate-700 relative z-10 h-full">
                    <Flag size={48} className="mb-4 opacity-20" />
                    <p>The track is empty.</p>
                 </div>
               )}
            </div>

            {/* LOWER: WINNER'S CIRCLE */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col shrink-0 h-[250px]">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/30 shrink-0">
                    <h3 className="text-sm font-bold text-green-400 uppercase tracking-widest flex items-center gap-2">
                        <Trophy className="w-4 h-4" /> Winner's Circle
                    </h3>
                    <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded-full">{winners.length}</span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    <AnimatePresence>
                        {currentWinner && (
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0 }} 
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 border border-green-500/30 p-4 rounded-xl mb-4 text-center"
                            >
                                <span className="text-xs text-green-300 uppercase tracking-wider font-bold block mb-1">Just Finished</span>
                                <span className="text-xl text-white font-bold break-words">{currentWinner.text}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {winners.map((task) => (
                      <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl border bg-slate-800/50 border-slate-700">
                        <button 
                           onClick={() => saveToHistory(task)}
                           title="Complete & Save to DB"
                           className="w-5 h-5 rounded-full border border-slate-500 hover:border-green-500 hover:bg-green-500/20 flex items-center justify-center shrink-0 transition group"
                        >
                          <CheckCircle className="w-3 h-3 text-transparent group-hover:text-green-500" />
                        </button>
                        <span className="flex-1 text-sm truncate text-slate-200">{task.text}</span>
                        <button onClick={() => removeActiveWinner(task.id)} className="text-slate-600 hover:text-red-400 transition shrink-0">
                           <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    
                    {winners.length === 0 && !currentWinner && (
                        <p className="text-slate-600 text-xs text-center italic mt-4">No pending winners.</p>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* BOTTOM SECTION: COMPLETED HISTORY TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden mb-8">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/30">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                 <CheckCircle className="w-5 h-5 text-green-500" /> Quest Log (History)
              </h2>
              {!user && <span className="text-xs text-yellow-500">Login to view history</span>}
          </div>
          
          <div className="overflow-x-auto">
             <table className="w-full text-left text-sm text-slate-400">
                <thead className="text-xs text-slate-500 uppercase bg-slate-950/50">
                    <tr>
                        <th className="px-6 py-4">Task Name</th>
                        <th className="px-6 py-4">Completed On</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                    {history.length === 0 ? (
                        <tr>
                            <td colSpan={3} className="px-6 py-8 text-center text-slate-600 italic">
                                {user ? "No completed quests yet. Win a race and check it off!" : "Please login to view history."}
                            </td>
                        </tr>
                    ) : (
                        history.map((task) => (
                            <tr key={task.id} className="hover:bg-slate-800/30 transition">
                                <td className="px-6 py-4 font-medium text-slate-200">{task.text}</td>
                                <td className="px-6 py-4">
                                    {task.completedAt?.toDate().toLocaleDateString() || "Just now"}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => deleteHistoryItem(task.id)}
                                        className="text-slate-500 hover:text-red-400 transition"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
             </table>
          </div>
      </div>

    </div>
  );
}