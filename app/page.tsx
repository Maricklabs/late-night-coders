"use client";

import Link from "next/link";
import { 
  ArrowRight, Bot, FileText, Zap, Music, Github, Linkedin, Mail, 
  Keyboard, Activity, LogIn, CheckCircle, Coffee, Code, LogOut 
} from "lucide-react";
import { useState, useEffect } from "react";

// --- Firebase Imports ---
import { auth } from "@/lib/firebase"; 
import { useAuthState } from "react-firebase-hooks/auth";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth"; // Added signOut
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  // Handle Login directly from Landing Page
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try { 
      await signInWithPopup(auth, provider); 
      router.push("/dashboard"); 
    } catch (e) { 
      console.error(e); 
    }
  };

  // Handle Sign Out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // We stay on the landing page, but state updates automatically
    } catch (e) {
      console.error("Error signing out:", e);
    }
  };

  const features = [
    {
      title: "Debugger Duck",
      desc: "AI debugging companion that actually listens to your rant.",
      icon: <Bot className="text-yellow-400 w-6 h-6" />,
      color: "hover:border-yellow-500/50 hover:shadow-yellow-500/20",
      textColor: "group-hover:text-yellow-400"
    },
    {
      title: "Readme Rooster",
      desc: "Wake up your docs! Generate pro documentation at sunrise speeds.",
      icon: <FileText className="text-red-400 w-6 h-6" />,
      color: "hover:border-red-500/50 hover:shadow-red-500/20",
      textColor: "group-hover:text-red-400"
    },
    {
      title: "Randomizer Roadrunner",
      desc: "Meep meep! Gamify your backlog and race tasks to the finish line.",
      icon: <Zap className="text-blue-400 w-6 h-6" />,
      color: "hover:border-blue-500/50 hover:shadow-blue-500/20",
      textColor: "group-hover:text-blue-400"
    },
    {
      title: "Breakroom Bird",
      desc: "Chill lo-fi beats & vibes. Nest here when the code breaks.",
      icon: <Music className="text-purple-400 w-6 h-6" />,
      color: "hover:border-purple-500/50 hover:shadow-purple-500/20",
      textColor: "group-hover:text-purple-400"
    },
    {
        title: "TypeTest Turkey",
        desc: "Test your coding speed with developer-focused word sets.",
        icon: <Keyboard className="w-6 h-6 text-orange-400" />,
        color: "hover:border-orange-500/50 hover:shadow-orange-500/20",
        textColor: "group-hover:text-orange-400"
      },
      {
        title: "Tracker Toucan",
        desc: "Visualize your productivity and break habits with simple stats.",
        icon: <Activity className="w-6 h-6 text-green-400" />,
        color: "hover:border-green-500/50 hover:shadow-green-500/20",
        textColor: "group-hover:text-green-400"
      }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-yellow-500/30 flex flex-col relative overflow-hidden">
      
      {/* Background Gradient Blob */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Navbar */}
      <nav className="p-6 max-w-7xl mx-auto w-full flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0 z-10">
        
        {/* Logo Section */}
        <div className="text-2xl font-bold tracking-tighter flex items-center gap-3">
          <img 
            src="/logo-LNC.png" 
            alt="LNC Logo" 
            className="w-10 h-10 object-contain drop-shadow-[0_0_10px_rgba(234,179,8,0.3)]" 
          />
          <div className="flex items-center gap-2">
            <span>LATE NIGHT CODERS</span>
            <span className="text-yellow-500 bg-yellow-500/10 px-1 py-1 rounded-lg text-sm border border-yellow-500/20">LOUNGE</span>
          </div>
        </div>

        {/* Auth Buttons */}
        <div className="flex gap-4 items-center">
          {loading ? (
             <span className="text-slate-500 text-sm">Loading...</span>
          ) : user ? (
            // CHANGED: Replaced "Go to Dashboard" with "Sign Out" since CTA is in Hero
            <button 
              onClick={handleSignOut}
              className="bg-slate-800 text-slate-200 px-5 py-2 rounded-full font-bold hover:bg-slate-700 hover:text-white transition border border-slate-700 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          ) : (
            <>
              <button onClick={handleLogin} className="text-slate-400 hover:text-white transition py-2 font-medium">
                Login
              </button>
              <button onClick={handleLogin} className="bg-white text-slate-900 px-5 py-2 rounded-full font-bold hover:bg-slate-200 transition flex items-center gap-2">
                 Get Started
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 mt-6 md:mt-10 z-10">
        
        <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-slate-800 bg-slate-900/50 text-slate-400 text-sm font-medium backdrop-blur-md animate-fade-in-up">
          🌙 Open 24/7 for Night Owls & Bug Hunters
        </div>
        
        <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
          <span className="text-yellow-400 drop-shadow-[0_0_30px_rgba(59,130,246,0.3)]">Debug. </span>
          <span className="text-red-400 drop-shadow-[0_0_30px_rgba(59,130,246,0.3)]">Document.</span>
          <br />
          <span className="text-blue-500 drop-shadow-[0_0_30px_rgba(59,130,246,0.3)]">Decompress.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl leading-relaxed">
          The ultimate productivity nest for developers. Fix bugs with the <span className="text-yellow-400 font-medium">Duck</span>, 
          generate docs with the <span className="text-red-400 font-medium">Rooster</span>, and race tasks with the <span className="text-blue-400 font-medium">Roadrunner</span>.
        </p>

        {user ? (
            <Link href="/dashboard" className="group bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl text-lg font-bold transition-all hover:scale-105 flex items-center gap-2 shadow-xl shadow-blue-600/20">
              Enter the Lounge <ArrowRight className="group-hover:translate-x-1 transition" />
            </Link>
        ) : (
            <button onClick={handleLogin} className="group bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl text-lg font-bold transition-all hover:scale-105 flex items-center gap-2 shadow-xl shadow-blue-600/20">
              Join via Google <LogIn className="w-5 h-5" />
            </button>
        )}

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-24 max-w-7xl w-full text-left">
          {features.map((feature, idx) => (
             <FeatureCard key={idx} {...feature} />
          ))}
        </div>

        {/* NEW SECTION: Why Choose Us / Detail View */}
        <div className="w-full max-w-7xl mt-32 mb-20 text-left">
          <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-8 md:p-12 backdrop-blur-sm relative overflow-hidden">
            
            {/* Decorative background element for section */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Not just tools. <br />
                  <span className="text-yellow-400">A productivity habitat.</span>
                </h2>
                <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                  Late Night Coders Lounge isn't just another dashboard. It's a cohesive environment designed to reduce context switching. We combine the emotional support of rubber duck debugging with the raw utility of documentation generation.
                </p>
                
                <ul className="space-y-4">
                  {[
                    "Zero-distraction 'Dark Mode' default interface.",
                    "Gamified logic to turn Jira tickets into dopamine.",
                    "Integrated lo-fi player to keep you in flow state.",
                    "Export documentation directly to Markdown/Notion."
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-300">
                      <CheckCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Stats / Visual Interest */}
              <div className="grid grid-cols-2 gap-4">
                <StatBox 
                  icon={<Code className="text-blue-400" />} 
                  value="10k+" 
                  label="Lines Debugged" 
                  borderColor="border-blue-500/30"
                />
                <StatBox 
                  icon={<FileText className="text-red-400" />} 
                  value="500+" 
                  label="Docs Generated" 
                  borderColor="border-red-500/30"
                />
                <StatBox 
                  icon={<Coffee className="text-yellow-400" />} 
                  value="∞" 
                  label="Caffeine Consumed" 
                  borderColor="border-yellow-500/30"
                />
                <StatBox 
                  icon={<Zap className="text-purple-400" />} 
                  value="100%" 
                  label="Productivity Boost" 
                  borderColor="border-purple-500/30"
                />
              </div>
            </div>
          </div>
        </div>

      </main>
      
      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 z-10">
        <div className="max-w-7xl mx-auto py-12 px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h3 className="font-bold text-lg text-white mb-1 flex items-center gap-2 justify-center md:justify-start">
               <img src="/logo-LNC.png" className="w-5 h-5" alt="logo" /> 
               Late Night Coders Lounge
            </h3>
            <p className="text-slate-500 text-sm">© {new Date().getFullYear()} All Rights Reserved | Built by Maricklabs - Fritz Marick A. Fernandez</p>
          </div>

          <div className="flex items-center gap-6">
            <SocialLink href="https://github.com/Maricklabs" icon={<Github className="w-5 h-5" />} label="GitHub" />
            <SocialLink href="https://www.linkedin.com/in/fritz-marick-fernandez-244709327/" icon={<Linkedin className="w-5 h-5" />} label="LinkedIn" />
            <SocialLink href="mailto:contact@fritzmarick.fernandez@wvsu.edu.ph" icon={<Mail className="w-5 h-5" />} label="Email" />
            <SocialLink href="https://maricklabs.netlify.app/" icon={<Bot className="w-5 h-5" />} label="Portfolio" />
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc, color, textColor }: any) {
  return (
    <div className={`p-6 rounded-2xl bg-slate-900/40 border border-slate-800 transition-all hover:-translate-y-1 backdrop-blur-sm group ${color}`}>
      <div className="mb-4 bg-slate-950 border border-slate-800 w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition duration-300 shadow-lg">
        {icon}
      </div>
      <h3 className={`text-lg font-bold mb-2 text-white transition ${textColor}`}>{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

function StatBox({ icon, value, label, borderColor }: any) {
    return (
        <div className={`bg-slate-950/50 border ${borderColor} p-6 rounded-2xl flex flex-col items-center justify-center text-center hover:bg-slate-900 transition duration-300`}>
            <div className="mb-2 bg-slate-900 p-2 rounded-lg">{icon}</div>
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{label}</div>
        </div>
    )
}

function SocialLink({ href, icon, label }: any) {
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-900 rounded-full"
      aria-label={label}
    >
      {icon}
    </a>
  );
}