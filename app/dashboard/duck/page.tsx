"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Bot, User, Trash2, MessageSquare, PlusCircle, LogIn } from "lucide-react";

// --- Firebase Imports ---
import { db, auth, incrementStat } from "@/lib/firebase";
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
  updateDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

type Message = { role: "user" | "system"; content: string };
type Session = { id: string; title: string; messages: Message[]; date: string; userId: string; createdAt: any };

export default function RubberDuckDebugger() {
  const [user, loading] = useAuthState(auth); // Auth State
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- 1. Load Sessions from Firestore (Real-time) ---
  useEffect(() => {
    if (!user) {
      setSessions([]);
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, "duck_sessions"), 
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const parsedSessions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Session[];
      
      setSessions(parsedSessions);

      // If we have a current session selected, keep its messages in sync
      if (currentSessionId) {
        const current = parsedSessions.find(s => s.id === currentSessionId);
        if (current) setMessages(current.messages);
      }
    });

    return () => unsubscribe();
  }, [user, currentSessionId]);

  // Scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // --- 2. Google Login Helper ---
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error("Login failed", e);
    }
  };

  const startNewSession = () => {
    if (!user) return;
    setMessages([]);
    setCurrentSessionId(null); // Deselect to prepare for new session creation on first message
  };

  const loadSession = (id: string) => {
    const session = sessions.find((s) => s.id === id);
    if (session) {
      setCurrentSessionId(id);
      setMessages(session.messages);
    }
  };

  const deleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!user) return;

    try {
      await deleteDoc(doc(db, "duck_sessions", id));
      if (currentSessionId === id) {
        setMessages([]);
        setCurrentSessionId(null);
      }
    } catch (error) {
      console.error("Error deleting session:", error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (!user) {
      alert("Please log in to chat with the duck!");
      return;
    }
    if (user) {
      incrementStat(user.uid, "chats");
    }

    // --- TRACKER UPDATE (Optional: Move this to Firestore if needed later) ---
    const currentChats = parseInt(localStorage.getItem("stats_debug_chats") || "0");
    localStorage.setItem("stats_debug_chats", (currentChats + 1).toString());
    // -----------------------------------------------------------------------

    const userMsg = { role: "user" as const, content: input };
    const tempHistory = [...messages, userMsg];
    
    // Optimistic UI Update
    setMessages(tempHistory);
    setInput("");
    setIsLoading(true);

    let activeSessionId = currentSessionId;

    try {
      // 1. Get AI Response
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: tempHistory }),
      });

      const data = await res.json();
      const botMsg = { role: "system" as const, content: data.text };
      const finalHistory = [...tempHistory, botMsg];

      setMessages(finalHistory);

      // 2. Save to Firestore
      if (activeSessionId) {
        // Update existing session
        const sessionRef = doc(db, "duck_sessions", activeSessionId);
        await updateDoc(sessionRef, {
          messages: finalHistory,
          // Update title if it's the very first exchange
          title: messages.length === 0 ? input.substring(0, 30) + "..." : sessions.find(s => s.id === activeSessionId)?.title
        });
      } else {
        // Create new session
        const newSessionData = {
          userId: user.uid,
          title: input.substring(0, 30) + "...",
          messages: finalHistory,
          date: new Date().toLocaleDateString(),
          createdAt: serverTimestamp()
        };
        const docRef = await addDoc(collection(db, "duck_sessions"), newSessionData);
        setCurrentSessionId(docRef.id);
      }

    } catch (error) {
      console.error(error);
      setMessages([...tempHistory, { role: "system", content: "Quack! (Connection Error)" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] max-w-7xl mx-auto p-4 gap-6">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold text-white mb-2 flex items-center gap-3">
            Debugging <span className="text-yellow-500">Duck</span>
            <Bot className="w-8 h-8 text-yellow-500 animate-bounce" />
          </h1>
          <p className="text-slate-400">Explain your code line by line. The duck is listening.</p>
        </div>
      </div>

      {/* MAIN CONTENT SPLIT */}
      <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
        
        {/* SIDEBAR: History */}
        <div className="w-64 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden hidden md:flex flex-shrink-0">
          <div className="p-4 border-b border-slate-800">
            <button 
              onClick={startNewSession}
              disabled={!user}
              className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition"
            >
              <PlusCircle className="w-4 h-4" /> New Chat
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {!user ? (
               <div className="p-4 text-center">
                  <p className="text-slate-500 text-sm mb-3">Log in to view your debugging history.</p>
                  <button onClick={handleLogin} className="text-yellow-500 hover:underline text-sm">Sign In</button>
               </div>
            ) : sessions.length === 0 ? (
              <p className="text-slate-600 text-xs text-center mt-4">No history yet.</p>
            ) : (
              sessions.map((session) => (
                <div 
                  key={session.id}
                  onClick={() => loadSession(session.id)}
                  className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition ${
                    currentSessionId === session.id ? "bg-slate-800 border border-slate-700" : "hover:bg-slate-800/50 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <MessageSquare className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-sm text-slate-200 truncate w-32 font-medium">{session.title}</span>
                      <span className="text-xs text-slate-500">{session.date}</span>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => deleteSession(e, session.id)} 
                    className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* CHAT AREA */}
        <div className="flex-1 flex flex-col bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden relative">
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                <Bot className="w-16 h-16 mb-4 text-yellow-500" />
                <h2 className="text-2xl font-bold text-white">
                  {user ? "Ready to Quack" : "Login to Start Debugging"}
                </h2>
                <p className="text-slate-400">
                  {user ? "Ask me anything about your buggy code." : "Your sessions will be saved to your account."}
                </p>
                {!user && (
                    <button 
                        onClick={handleLogin}
                        className="mt-4 bg-yellow-500 hover:bg-yellow-400 text-slate-900 px-6 py-2 rounded-full font-bold transition"
                    >
                        Login with Google
                    </button>
                )}
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "system" && (
                    <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-black" />
                    </div>
                  )}
                  <div className={`p-4 rounded-2xl max-w-[80%] leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user" 
                      ? "bg-blue-600 text-white rounded-br-none" 
                      : "bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none font-mono text-sm"
                  }`}>
                    {msg.content}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                      {user?.photoURL ? (
                          <img src={user.photoURL} alt="User" className="w-full h-full rounded-full" />
                      ) : (
                          <User className="w-5 h-5 text-white" />
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-black" />
                </div>
                <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
                  <span className="animate-pulse">Thinking... 🦆</span>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={sendMessage} className="p-4 bg-slate-950 border-t border-slate-800 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={user ? "Describe your bug..." : "Please log in to chat"}
              disabled={!user || isLoading}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition disabled:opacity-50"
            />
            <button 
              type="submit" 
              disabled={isLoading || !input.trim() || !user}
              className="bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 p-3 rounded-xl transition font-bold"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}