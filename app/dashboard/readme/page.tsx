"use client";

import { useState } from 'react';
import useSound from 'use-sound';
import { Copy, RefreshCw, Save, FileText, Eraser, LogIn, User as UserIcon } from "lucide-react";

// --- Firebase Imports ---
import { db, auth, incrementStat } from '@/lib/firebase'; // <--- Import incrementStat
import { useAuthState } from "react-firebase-hooks/auth";
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

export default function ReadmeWizard() {
  const [user] = useAuthState(auth); // <--- Use Firebase Auth
  const [formData, setFormData] = useState({ name: '', stack: '', features: '' });
  const [markdown, setMarkdown] = useState('');
  const [loading, setLoading] = useState(false);

  // Note: Ensure these sound files exist in your public/sounds folder
  const [playPrint] = useSound('/sounds/printer.mp3'); 
  const [playCrumple] = useSound('/sounds/crumple.mp3'); 

  // --- Auth Helper ---
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try { await signInWithPopup(auth, provider); } catch (e) { console.error(e); }
  };

  const generateReadme = async () => {
    if(!formData.name) return;
    setLoading(true);
    playPrint();
    
    // --- TRACKER UPDATE START ---
    // If logged in, update the global stats in Firestore
    if (user) {
        incrementStat(user.uid, "readmes");
    }
    // Optional: Keep local storage as backup if you want
    const currentReadmes = parseInt(localStorage.getItem("stats_readme_gen") || "0");
    localStorage.setItem("stats_readme_gen", (currentReadmes + 1).toString());
    // --- TRACKER UPDATE END ---

    // Simulating API delay
    setTimeout(() => {
        const generated = `# ${formData.name}\n\n![License](https://img.shields.io/badge/license-MIT-red.svg)\n\n## 🚀 Tech Stack\n${formData.stack}\n\n## ✨ Features\n${formData.features}\n\n## 📦 Installation\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\``;
        setMarkdown(generated);
        setLoading(false);
    }, 2000);
  };

  const saveReadmeToDB = async () => {
    if (!user || !markdown) {
        alert("You must be logged in to save!");
        return;
    }
    try {
      // Changed user.id to user.uid for Firebase
      await addDoc(collection(db, "users", user.uid, "readmes"), {
        projectName: formData.name,
        content: markdown,
        createdAt: serverTimestamp(),
      });
      alert("Readme saved to your library!");
    } catch (e) {
      console.error(e);
      alert("Failed to save.");
    }
  };

  const clearForm = () => {
    playCrumple();
    setFormData({ name: '', stack: '', features: '' });
    setMarkdown('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] max-w-7xl mx-auto p-4 gap-6">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold text-white mb-2 flex items-center gap-3">
            Readme <span className="text-red-500">Rooster</span>
            <FileText className="w-8 h-8 text-red-500 animate-bounce" />
          </h1>
          <p className="text-slate-400">Generate hot documentation in seconds.</p>
        </div>
      </div>

      {/* MAIN CONTENT SPLIT */}
      <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden min-h-0">
        
        {/* LEFT: INPUT FORM */}
        <div className="w-full md:w-1/3 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-800 bg-slate-950/50">
            <h2 className="font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-red-500" /> Configuration
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Project Name</label>
              <input 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-red-500 focus:outline-none transition placeholder:text-slate-600"
                placeholder="e.g. Chaos Monkey"
              />
            </div>
            
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Tech Stack</label>
              <input 
                value={formData.stack}
                onChange={(e) => setFormData({...formData, stack: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-red-500 focus:outline-none transition placeholder:text-slate-600"
                placeholder="React, TypeScript, Firebase..."
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Key Features</label>
              <textarea 
                value={formData.features}
                onChange={(e) => setFormData({...formData, features: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white h-40 focus:border-red-500 focus:outline-none transition resize-none placeholder:text-slate-600"
                placeholder="- Real-time chat..."
              />
            </div>
          </div>

          <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex gap-3">
             <button 
              onClick={generateReadme} 
              disabled={loading} 
              className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl font-bold transition flex justify-center items-center gap-2 shadow-lg shadow-red-900/20"
            >
              {loading ? <RefreshCw className="animate-spin" size={18} /> : "Generate"}
            </button>
            <button 
              onClick={clearForm} 
              className="px-4 bg-slate-800 hover:bg-slate-700 rounded-xl transition text-slate-400 hover:text-white"
              title="Clear Form"
            >
              <Eraser size={20} />
            </button>
          </div>
        </div>

        {/* RIGHT: PREVIEW */}
        <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden flex flex-col relative">
          {/* Preview Toolbar */}
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/30">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Live Preview</span>
            
            <div className="flex gap-4">
              {markdown && (
                <>
                  <button onClick={saveReadmeToDB} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition">
                    <Save size={14} /> SAVE
                  </button>
                  <button onClick={() => navigator.clipboard.writeText(markdown)} className="flex items-center gap-2 text-xs font-bold text-red-400 hover:text-red-300 transition">
                      <Copy size={14} /> COPY MD
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Markdown Output */}
          <div className={`flex-1 overflow-y-auto p-8 transition-all duration-500 custom-scrollbar ${loading ? 'blur-sm opacity-50' : 'opacity-100'}`}>
            {markdown ? (
                <div className="prose prose-invert prose-headings:text-red-100 prose-a:text-red-400 max-w-none">
                  <pre className="whitespace-pre-wrap font-mono text-sm text-slate-300 bg-transparent p-0 border-none">
                    {markdown}
                  </pre>
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-700 gap-4">
                    <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center">
                       <FileText size={40} className="opacity-20 text-red-500" />
                    </div>
                    <p className="font-mono text-sm">Fill the form to ignite the generator.</p>
                </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}