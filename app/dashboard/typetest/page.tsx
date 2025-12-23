"use client";

import { useState, useEffect } from "react";
import { Keyboard, RefreshCw, Trophy, Zap, Clock, Settings, LogIn, User as UserIcon, Crown } from "lucide-react";

// --- Firebase Imports ---
import { db, auth, incrementStat } from "@/lib/firebase"; 
import { useAuthState } from "react-firebase-hooks/auth";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  setDoc, 
  doc, 
  serverTimestamp,
  getDoc 
} from "firebase/firestore";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const WORDS = [
  "react", "nextjs", "typescript", "code", "debug", "deploy", "server", "client",
  "component", "hook", "state", "effect", "render", "build", "node", "function",
  "variable", "constant", "array", "object", "string", "number", "boolean", "async",
  "await", "promise", "import", "export", "default", "class", "interface", "type",
  "loop", "condition", "map", "filter", "reduce", "callback", "event", "handler",
  "browser", "window", "document", "style", "css", "html", "div", "span", "input"
];

type LeaderboardEntry = {
  id: string;
  username: string;
  wpm: number;
  date: any;
};

export default function TypeTestTurkey() {
  const [user] = useAuthState(auth);
  
  // Game State
  const [text, setText] = useState<string[]>([]);
  const [userInput, setUserInput] = useState("");
  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const [correctWordArray, setCorrectWordArray] = useState<boolean[]>([]);
  const [start, setStart] = useState(false);
  
  // Settings & Timer
  const [duration, setDuration] = useState(30);
  const [timer, setTimer] = useState(30);
  const [finished, setFinished] = useState(false);
  const [wpm, setWpm] = useState(0);

  // Leaderboard State
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [personalBest, setPersonalBest] = useState(0);

  // --- 1. LOAD LEADERBOARD (Real-time) ---
  useEffect(() => {
    // Listen for scores specifically for the current duration (15, 30, or 60)
    const q = query(
      collection(db, "typetest_scores"),
      where("duration", "==", duration),
      orderBy("wpm", "desc"),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LeaderboardEntry[];
      setLeaderboard(docs);
    });

    return () => unsubscribe();
  }, [duration]);

  // --- 2. LOAD PERSONAL BEST ---
  useEffect(() => {
    if (!user) {
        setPersonalBest(0);
        return;
    }
    const fetchPersonalBest = async () => {
        // We use a composite ID: userId_duration to easily find their specific record
        const docRef = doc(db, "typetest_scores", `${user.uid}_${duration}`);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            setPersonalBest(docSnap.data().wpm);
        } else {
            setPersonalBest(0);
        }
    };
    fetchPersonalBest();
  }, [user, duration]);

  // --- 3. GAME LOGIC ---

  // Generate Words & Reset on Duration Change
  useEffect(() => {
    resetGame();
  }, [duration]);

  // Timer Logic
  useEffect(() => {
    let interval: any;
    if (start && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      endGame();
    }
    return () => clearInterval(interval);
  }, [start, timer]);

  const resetGame = () => {
    const newWords = Array.from({ length: 50 }, () => WORDS[Math.floor(Math.random() * WORDS.length)]);
    setText(newWords);
    setUserInput("");
    setActiveWordIndex(0);
    setCorrectWordArray([]);
    setStart(false);
    setTimer(duration);
    setFinished(false);
    setWpm(0);
  };

  const endGame = async () => {
    setStart(false);
    setFinished(true);
    
    // Calculate Stats
    const correctWords = correctWordArray.filter(Boolean).length;
    const minutes = duration / 60;
    const finalWpm = Math.round(correctWords / minutes);
    setWpm(finalWpm);

    // --- SAVE LOGIC ---
    if (user) {
        // A. Increment Play Count Global Stat
        incrementStat(user.uid, "typetests");

        // B. Check & Save High Score
        if (finalWpm > personalBest) {
            setPersonalBest(finalWpm); // Optimistic Update
            try {
                // Save to Firestore with a composite ID so one user has one entry per duration category
                await setDoc(doc(db, "typetest_scores", `${user.uid}_${duration}`), {
                    userId: user.uid,
                    username: user.displayName || "Anonymous Racer",
                    wpm: finalWpm,
                    duration: duration,
                    date: serverTimestamp()
                });
            } catch (error) {
                console.error("Error saving score:", error);
            }
        }
    } else {
        // Guest Fallback
        const current = parseInt(localStorage.getItem("stats_typetest_played") || "0");
        localStorage.setItem("stats_typetest_played", (current + 1).toString());
    }
  };

  const processInput = (value: string) => {
    if (!start && !finished) setStart(true);
    
    if (value.endsWith(" ")) {
      const wordToMatch = text[activeWordIndex];
      const enteredWord = value.trim();
      
      const isCorrect = enteredWord === wordToMatch;
      setCorrectWordArray([...correctWordArray, isCorrect]);

      setActiveWordIndex((prev) => prev + 1);
      setUserInput("");
    } else {
      setUserInput(value);
    }
  };

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try { await signInWithPopup(auth, provider); } catch (e) { console.error(e); }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto flex flex-col gap-8">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-white mb-2 flex items-center gap-3">
            TypeTest <span className="text-orange-500">Turkey</span>
            <Keyboard className="w-8 h-8 text-orange-500 animate-bounce" />
          </h1>
          <p className="text-slate-400">Test your coding speed. Compete on the {duration}s leaderboard.</p>
        </div>

        {/* Auth & Settings */}
        <div className="flex flex-col md:flex-row items-end gap-3 w-full md:w-auto">
             {/* Time Selector */}
             <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-2 rounded-xl">
                <Settings className="w-4 h-4 text-slate-500 ml-2" />
                <select 
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    disabled={start} 
                    className="bg-transparent text-white font-bold text-sm focus:outline-none cursor-pointer hover:text-orange-400 transition pr-2 disabled:opacity-50"
                >
                    <option value={15}>15s Sprint</option>
                    <option value={30}>30s Standard</option>
                    <option value={60}>60s Marathon</option>
                </select>
            </div>
        </div>
      </div>

      {/* STATS BAR */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
            <Clock className="text-slate-400 w-6 h-6" />
            <div>
                <p className="text-xs text-slate-500">Time Left</p>
                <p className={`text-2xl font-bold font-mono ${timer < 10 ? "text-red-500" : "text-white"}`}>{timer}s</p>
            </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
            <Zap className="text-yellow-400 w-6 h-6" />
            <div>
                <p className="text-xs text-slate-500">Current WPM</p>
                <p className="text-2xl font-bold text-white">{finished ? wpm : "..."}</p>
            </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
            <Trophy className="text-purple-400 w-6 h-6" />
            <div>
                <p className="text-xs text-slate-500">Your Best ({duration}s)</p>
                <p className="text-2xl font-bold text-white">{personalBest > 0 ? personalBest : "-"}</p>
            </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
            <Crown className="text-orange-500 w-6 h-6" />
            <div>
                <p className="text-xs text-slate-500">Global Best</p>
                <p className="text-2xl font-bold text-white">{leaderboard.length > 0 ? leaderboard[0].wpm : "-"}</p>
            </div>
        </div>
      </div>

      {/* GAME BOARD */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 relative min-h-[300px] flex flex-col justify-center shadow-2xl">
        
        {finished ? (
            <div className="text-center animate-in fade-in zoom-in duration-300">
                <h2 className="text-3xl font-bold text-white mb-2">Time's Up!</h2>
                <div className="flex justify-center items-end gap-2 mb-6">
                    <p className="text-orange-500 text-8xl font-black">{wpm}</p>
                    <span className="text-2xl text-slate-400 font-bold mb-4">WPM</span>
                </div>
                
                {user && wpm > personalBest && wpm > 0 && (
                     <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2 inline-block mb-6">
                        <p className="text-yellow-400 font-bold flex items-center gap-2">
                            <Zap className="w-4 h-4" /> New Personal Best!
                        </p>
                     </div>
                )}

                <button 
                    onClick={resetGame}
                    className="bg-orange-600 hover:bg-orange-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 mx-auto transition shadow-lg shadow-orange-900/30 hover:scale-105 active:scale-95"
                >
                    <RefreshCw className="w-5 h-5" /> Play Again
                </button>
            </div>
        ) : (
            <>
                {/* Word Display */}
                <div className="flex flex-wrap gap-3 mb-8 text-xl font-mono leading-relaxed select-none h-[150px] overflow-hidden content-start opacity-90">
                    {text.map((word, index) => {
                        let color = "text-slate-500";
                        if (index < activeWordIndex) {
                            color = correctWordArray[index] ? "text-green-500" : "text-red-500 line-through decoration-2 decoration-red-500/50";
                        } else if (index === activeWordIndex) {
                            color = "text-orange-400 bg-orange-500/10 px-1 rounded -ml-1 border-b-2 border-orange-500";
                        }
                        return (
                            <span key={index} className={color}>{word}</span>
                        );
                    })}
                </div>

                {/* Input Field */}
                <input
                    type="text"
                    value={userInput}
                    onChange={(e) => processInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white text-3xl p-6 rounded-2xl focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition font-mono shadow-inner"
                    placeholder="Start typing..."
                    autoFocus
                    disabled={start && timer === 0}
                />
                
                {!start && <p className="text-center text-slate-500 mt-6 text-sm animate-pulse">Timer starts when you type the first character.</p>}
            </>
        )}
      </div>

      {/* GLOBAL LEADERBOARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/30">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                 <Crown className="w-5 h-5 text-yellow-500" /> Global Leaderboard ({duration}s)
              </h2>
              <span className="text-xs text-slate-500">Top 10 Players</span>
          </div>
          
          <div className="overflow-x-auto">
             <table className="w-full text-left text-sm text-slate-400">
                <thead className="text-xs text-slate-500 uppercase bg-slate-950/50">
                    <tr>
                        <th className="px-6 py-4 w-16">Rank</th>
                        <th className="px-6 py-4">Player</th>
                        <th className="px-6 py-4 text-right">WPM</th>
                        <th className="px-6 py-4 text-right hidden sm:table-cell">Date</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                    {leaderboard.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="px-6 py-8 text-center text-slate-600 italic">
                                No records yet for this category. Be the first!
                            </td>
                        </tr>
                    ) : (
                        leaderboard.map((entry, index) => {
                             const isMe = user?.uid === entry.id.split('_')[0];
                             return (
                                <tr key={entry.id} className={`hover:bg-slate-800/30 transition ${isMe ? "bg-orange-500/5" : ""}`}>
                                    <td className="px-6 py-4 font-mono">
                                        {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                                    </td>
                                    <td className={`px-6 py-4 font-bold ${isMe ? "text-orange-400" : "text-white"}`}>
                                        {entry.username} {isMe && "(You)"}
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono font-bold text-white text-lg">
                                        {entry.wpm}
                                    </td>
                                    <td className="px-6 py-4 text-right hidden sm:table-cell text-xs">
                                        {entry.date ? new Date(entry.date.seconds * 1000).toLocaleDateString() : "Just now"}
                                    </td>
                                </tr>
                             );
                        })
                    )}
                </tbody>
             </table>
          </div>
      </div>

    </div>
  );
}