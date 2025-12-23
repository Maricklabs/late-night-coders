"use client";

import { useState, useEffect } from "react";
import { Play, Plus, Trash2, Music, GripVertical, MonitorPlay, RefreshCw, Gamepad2, LogIn, User as UserIcon } from "lucide-react";
import { Reorder, AnimatePresence } from "framer-motion";

// --- Firebase Imports ---
import { db, auth, incrementStat } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

export default function BreakroomBird() {
  const [user, loading] = useAuthState(auth);
  const [urlInput, setUrlInput] = useState("");

  // Default state (Lofi Girl)
  const [queue, setQueue] = useState<string[]>(["jfKfPfyJRdk"]);
  const [currentId, setCurrentId] = useState("jfKfPfyJRdk");
  const [isLoaded, setIsLoaded] = useState(false);

  // --- 1. Load Data (Hybrid: Firestore or LocalStorage) ---
  useEffect(() => {
    // FIX: Unique key ensures this specific page visit is counted separately
    if (user && !sessionStorage.getItem('breakroom_visit_logged')) {
      incrementStat(user.uid, "breaks");
      sessionStorage.setItem('breakroom_visit_logged', 'true'); 
    }

    const loadData = async () => {
      // Option A: Logged In -> Load from Firestore
      if (user) {
        try {
          const docRef = doc(db, "breakroom_playlists", user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.queue) setQueue(data.queue);
            if (data.currentId) setCurrentId(data.currentId);
          }
        } catch (error) {
          console.error("Error loading playlist:", error);
        }
      }
      // Option B: Guest -> Load from LocalStorage
      else {
        if (typeof window !== "undefined") {
          const savedQueue = localStorage.getItem("breakroom_queue");
          const savedId = localStorage.getItem("breakroom_current_id");
          if (savedQueue) setQueue(JSON.parse(savedQueue));
          if (savedId) setCurrentId(savedId);
        }
      }
      setIsLoaded(true);
    };

    if (!loading) {
      loadData();
    }
  }, [user, loading]);

  // --- 2. Save Data (Auto-sync on change) ---
  useEffect(() => {
    if (!isLoaded) return;

    // Save to Firestore if user exists
    if (user) {
      const saveToDb = async () => {
        try {
          await setDoc(doc(db, "breakroom_playlists", user.uid), {
            queue,
            currentId,
            updatedAt: new Date()
          }, { merge: true });
        } catch (e) {
          console.error("Error saving playlist:", e);
        }
      };
      // Debounce slightly 
      const timeout = setTimeout(saveToDb, 1000);
      return () => clearTimeout(timeout);
    }
    // Save to LocalStorage if guest
    else {
      localStorage.setItem("breakroom_queue", JSON.stringify(queue));
      localStorage.setItem("breakroom_current_id", currentId);
    }
  }, [queue, currentId, user, isLoaded]);

  // --- 3. Actions ---

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try { await signInWithPopup(auth, provider); } catch (e) { console.error(e); }
  };

  const getYouTubeID = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const addToQueue = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const id = getYouTubeID(urlInput);
    if (id) {
      if (!queue.includes(id)) setQueue([...queue, id]);
      setUrlInput("");
    } else {
      alert("Please enter a valid YouTube URL");
    }
  };

  const addLofiGirl = () => {
    const lofiId = "jfKfPfyJRdk";
    if (!queue.includes(lofiId)) {
      setQueue([lofiId, ...queue]);
    }
    setCurrentId(lofiId);
  };

  const openPopOut = () => {
    const width = 400;
    const height = 300;
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);
    window.open(
      `https://www.youtube.com/embed/${currentId}?autoplay=1`,
      'MiniPlayer',
      `width=${width},height=${height},top=${top},left=${left},resizable=yes`
    );
  };

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto flex flex-col gap-8">

      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2 flex items-center gap-3">
            Breakroom <span className="text-purple-400">Bird</span>
            <Music className="w-8 h-8 text-purple-500 animate-bounce" />
          </h1>
          <p className="text-slate-400">Listen to chill beats while working. Scroll down for Tetris.</p>
        </div>

      </div>

      {/* SECTION 1: MUSIC PLAYER */}
      <div className="grid lg:grid-cols-3 gap-8 lg:h-[500px]">

        {/* LEFT: Player */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-black rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative flex-1 aspect-video lg:aspect-auto">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${currentId}?autoplay=0&rel=0`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          </div>

          <div className="hidden md:flex bg-purple-900/20 border border-purple-500/30 p-3 rounded-xl justify-between items-center gap-3">
            <div className="flex flex-col text-left">
              <span className="text-sm font-bold text-white">Keep the music playing?</span>
              <span className="text-xs text-purple-200">Open a mini-player so you can switch tabs.</span>
            </div>
            <button onClick={openPopOut} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition shadow-lg shadow-purple-900/50 whitespace-nowrap">
              <MonitorPlay className="w-4 h-4" /> Pop Out Player
            </button>
          </div>
        </div>

        {/* RIGHT: Playlist */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col h-[500px] lg:h-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              Playlist
              <span className="text-xs bg-slate-800 px-2 py-1 rounded-full text-slate-400">{queue.length}</span>
            </h3>
            {!queue.includes("jfKfPfyJRdk") && (
              <button onClick={addLofiGirl} className="text-xs text-purple-400 hover:text-white flex items-center gap-1 border border-purple-500/30 rounded px-2 py-1 hover:bg-purple-500/20 transition">
                <RefreshCw className="w-3 h-3" /> Add Lofi Girl
              </button>
            )}
          </div>

          <form onSubmit={addToQueue} className="flex gap-2 mb-6">
            <input
              type="text"
              placeholder="Paste YouTube Link..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition"
            />
            <button type="submit" className="bg-purple-600 hover:bg-purple-500 p-2 rounded-lg transition shrink-0">
              <Plus className="w-5 h-5 text-white" />
            </button>
          </form>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            {!user && queue.length > 0 && (
              <div className="mb-2 p-2 bg-yellow-900/20 border border-yellow-700/50 rounded text-center">
                <p className="text-xs text-yellow-500">Login to save your playlist permanently!</p>
              </div>
            )}

            <Reorder.Group axis="y" values={queue} onReorder={setQueue} className="space-y-2">
              <AnimatePresence>
                {queue.map((id) => (
                  <Reorder.Item key={id} value={id} whileDrag={{ scale: 1.05 }}>
                    <div className={`group flex items-center gap-3 p-3 rounded-lg border transition cursor-grab active:cursor-grabbing ${currentId === id ? "bg-purple-900/20 border-purple-500/50" : "bg-slate-800/50 border-transparent hover:border-slate-700"
                      }`}>
                      <GripVertical className="text-slate-600 w-4 h-4 shrink-0" />
                      <img src={`https://img.youtube.com/vi/${id}/default.jpg`} alt="thumb" className="w-10 h-8 object-cover rounded shrink-0" />
                      <div className="flex-1 overflow-hidden">
                        <p className="text-xs text-slate-300 truncate font-mono">{id === "jfKfPfyJRdk" ? "Lofi Girl Radio" : `Video ID: ${id}`}</p>
                      </div>
                      <div className="flex gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition shrink-0">
                        <button onClick={() => setCurrentId(id)} className="text-green-400 hover:text-green-300" title="Play"><Play className="w-4 h-4" /></button>
                        <button onClick={() => setQueue(queue.filter(i => i !== id))} className="text-red-400 hover:text-red-300" title="Remove"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </Reorder.Item>
                ))}
              </AnimatePresence>
            </Reorder.Group>
            {queue.length === 0 && (
              <div className="text-center text-slate-600 mt-10 italic text-sm">
                Playlist is empty.
                <button onClick={addLofiGirl} className="block mx-auto mt-2 text-purple-400 underline">Add Lofi Girl?</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: TETRIS ARCADE */}
      <div className="mt-8 border-t border-slate-800 pt-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          Tetris <span className="text-purple-400">T-Rex</span>
          <Gamepad2 className="text-purple-400 w-6 h-6" />
        </h2>

        <div className="w-full max-w-[400px] mx-auto h-[640px] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
          <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
            <span className="text-slate-300 font-mono text-sm">TETRIS Game Console &lt;3</span>
            <span className="text-yellow-500 text-xs font-bold uppercase tracking-widest animate-pulse">
              Click to play
            </span>
          </div>

          <div className="flex-1 bg-black relative w-full h-full flex items-center justify-center overflow-hidden">
            <iframe
              src="https://binaryify.github.io/vue-tetris/"
              className="w-full h-full border-none block"
              title="Tetris Game"
              scrolling="no"
            ></iframe>
          </div>
        </div>
      </div>

    </div>
  );
}