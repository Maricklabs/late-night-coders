"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Bot, FileText, Zap, Music, Keyboard, Activity, LayoutDashboard, 
  Menu, X, Settings, LogOut, User as UserIcon, Trash2 
} from "lucide-react";
import { useState } from "react";

// --- Firebase Imports ---
import { auth, db } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { signOut, deleteUser } from "firebase/auth";
import { doc, deleteDoc } from "firebase/firestore";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user] = useAuthState(auth);
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- ACTIONS ---
  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    const confirmDelete = window.confirm(
        "Are you sure? This will delete your stats and account permanently. This cannot be undone."
    );
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
        await deleteDoc(doc(db, "user_stats", user.uid)); // 1. Clean DB
        await deleteUser(user); // 2. Delete Auth
        router.push("/");
    } catch (error: any) {
        console.error("Error deleting account:", error);
        if (error.code === 'auth/requires-recent-login') {
            alert("Please log out and log back in to delete your account.");
        } else {
            alert("Failed to delete account.");
        }
    } finally {
        setIsDeleting(false);
        setIsSettingsOpen(false);
    }
  };
  
  const navItems = [
    { name: "Lounge", href: "/dashboard", icon: LayoutDashboard, color: "text-yellow-400" },
    { name: "Debug Duck", href: "/dashboard/duck", icon: Bot, color: "text-yellow-400" },
    { name: "Readme Rooster", href: "/dashboard/readme", icon: FileText, color: "text-red-400" },
    { name: "Randomizer Roadrunner", href: "/dashboard/race", icon: Zap, color: "text-blue-400" },
    { name: "Breakroom Bird", href: "/dashboard/breakroom", icon: Music, color: "text-purple-400" },
    { name: "TypeTest Turkey", href: "/dashboard/typetest", icon: Keyboard, color: "text-orange-400" },
    { name: "Tracker Toucan", href: "/dashboard/tracker", icon: Activity, color: "text-green-400" },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-white selection:bg-yellow-500/30 font-sans">
      
      {/* MOBILE HEADER */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 border-b border-slate-800 z-50 flex items-center justify-between px-4">
         <div className="text-xl font-black tracking-wider flex items-center gap-2">
             <span className="text-white">LNC</span>
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-purple-600">LOUNGE</span>
         </div>
         <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-400 hover:text-white">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
         </button>
      </div>

      {/* SIDEBAR */}
      <aside className={`
          fixed md:relative z-40 inset-y-0 left-0 w-64 bg-slate-950 border-r border-slate-900 flex flex-col transition-transform duration-300
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
          {/* Logo */}
          <div className="h-24 flex items-center px-6">
            <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="group block">
              <div className="text-2xl font-black tracking-wider flex flex-col leading-none">
                <span className="text-white group-hover:text-yellow-500 transition">LATE NIGHT</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-purple-600">CODERS</span>
              </div>
            </Link>
          </div>
          
          {/* Nav Items */}
          <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
            {navItems.map((item) => (
              <NavLink key={item.href} item={item} onClick={() => setIsMobileMenuOpen(false)} />
            ))}
            
            {/* Settings Item (Triggers Modal) */}
            <button 
                onClick={() => { setIsSettingsOpen(true); setIsMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-300 group"
            >
                <Settings className="w-5 h-5 text-slate-500 group-hover:text-white transition-transform group-hover:rotate-90" />
                <span className="font-medium text-sm tracking-wide">Settings</span>
            </button>
          </nav>

          {/* User Profile & Logout */}
          <div className="p-4 border-t border-slate-900 bg-slate-950">
             <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-yellow-500">
                    <UserIcon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">
                        {user?.displayName || "Night Owl"}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
                <button 
                    onClick={handleLogout}
                    className="text-slate-500 hover:text-red-400 transition p-1"
                    title="Sign Out"
                >
                    <LogOut size={18} />
                </button>
             </div>
          </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-slate-950 overflow-y-auto min-h-screen pt-16 md:pt-0">
        {children}
      </main>

      {/* SETTINGS MODAL (Global) */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full relative shadow-2xl animate-in zoom-in-95 duration-200">
                <button 
                    onClick={() => setIsSettingsOpen(false)}
                    className="absolute top-4 right-4 text-slate-500 hover:text-white transition"
                >
                    <X size={24} />
                </button>
                
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <Settings className="text-slate-400" /> Settings
                </h2>

                <div className="space-y-6">
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Account</p>
                        <p className="text-white font-medium">{user?.email}</p>
                    </div>

                    <div className="pt-6 border-t border-slate-800">
                        <h3 className="text-red-400 font-bold mb-2">Danger Zone</h3>
                        <p className="text-slate-500 text-sm mb-4">
                            Deleting your account is permanent. All stats and data will be wiped.
                        </p>
                        <button 
                            onClick={handleDeleteAccount}
                            disabled={isDeleting}
                            className="w-full bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 border border-red-500/50 font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
                        >
                            {isDeleting ? "Deleting..." : <><Trash2 size={18} /> Delete Account</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
      )}
    </div>
  );
}

function NavLink({ item, onClick }: { item: any, onClick: () => void }) {
  const pathname = usePathname();
  const isActive = pathname === item.href;
  const Icon = item.icon;

  return (
    <Link 
      href={item.href} 
      onClick={onClick}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden
        ${isActive ? "bg-slate-800 text-white shadow-lg border border-slate-700/50" : "text-slate-400 hover:text-white hover:bg-slate-800/50"}
      `}
    >
      {isActive && <div className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-yellow-500`} />}
      <span className={`transition-transform duration-300 ${isActive ? "text-yellow-400 scale-110" : `text-slate-500 group-hover:${item.color} group-hover:scale-110`}`}>
        <Icon className="w-5 h-5" />
      </span> 
      <span className="font-medium text-sm tracking-wide">{item.name}</span>
    </Link>
  );
}