import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getNavItems, BOTTOM_NAV_ITEMS } from "@/lib/design";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { NotificationsPanel } from "./NotificationsPanel";

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  workspaceName?: string;
  userName?: string;
  userInitials?: string;
  userPlan?: string;
  actions?: React.ReactNode;
}

export default function AppShell({
  children,
  title = "Aether Suite",
  workspaceName = "Celestial Atelier",
  userName: propUserName,
  userInitials: propUserInitials,
  userPlan = "Architect",
  actions,
}: AppShellProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const userName = propUserName || user?.username || "Guest";
  const userInitials = propUserInitials || (user?.username ? user.username.substring(0, 1).toUpperCase() : "G");

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  // Detect current workspace context from URL path
  const workspaceId = pathname.startsWith("/workspace/") ? pathname.split("/")[2] : "demo-ws";
  const navItems = getNavItems(workspaceId);
  const { showToast } = useToast();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("wordex_access_token");
    if (!token) return;

    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/notifications/stream?token=${token}`;
    const es = new EventSource(url);

    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'notification') {
          showToast(payload.data.message || "New notification", "info");
        }
      } catch (err) {
        // Skip
      }
    };

    es.onerror = () => {
      es.close();
    };

    return () => es.close();
  }, [showToast]);

  return (
    <div className="flex bg-surface text-foreground min-h-screen overflow-hidden font-body selection:bg-primary-light selection:text-primary">
      
      {/* ── Top Navigation Shell (The Floating Horizon) ───────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3 max-w-7xl mx-auto rounded-3xl mt-4 mx-4 bg-surface/60 backdrop-blur-3xl shadow-[0_30px_60px_rgba(28,28,26,0.04)] border border-outline-variant/10">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="text-xl font-black tracking-tighter text-primary hover:opacity-80 transition-opacity">
            {title}
          </Link>
          <div className="hidden md:flex items-center gap-2">
            <Link href="/dashboard" className={`font-black text-[10px] uppercase tracking-[0.2em] px-4 py-2 rounded-xl transition-all ${pathname === '/dashboard' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-outline hover:bg-primary/5 hover:text-primary'}`}>Workspace</Link>
            <Link href="/dashboard/bi" className={`font-black text-[10px] uppercase tracking-[0.2em] px-4 py-2 rounded-xl transition-all ${pathname.includes('/bi') ? 'bg-tertiary text-white shadow-lg' : 'text-outline hover:bg-tertiary/5 hover:text-tertiary'}`}>Control Tower</Link>
            <Link href="/settings/team" className={`font-black text-[10px] uppercase tracking-[0.2em] px-4 py-2 rounded-xl transition-all ${pathname.includes('/team') ? 'bg-secondary text-white shadow-lg' : 'text-outline hover:bg-secondary/5 hover:text-secondary'}`}>Team Suite</Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-sm">search</span>
            <input
              className="bg-surface-container-low border-transparent rounded-full pl-10 pr-4 py-2 text-xs focus:bg-white focus:ring-1 focus:ring-primary/30 w-64 text-foreground outline-none placeholder:text-outline-variant font-bold"
              placeholder="Search archives..."
              type="text"
              title="Search archives"
              aria-label="Search documents"
            />
          </div>
          {actions}
          <NotificationsPanel />
          <div className="flex items-center gap-3 pl-4 border-l border-outline-variant/20 ml-2">
            <div className="hidden sm:block text-right">
              <p className="text-[10px] font-black text-foreground leading-none uppercase tracking-widest">{userName}</p>
              <p className="text-[8px] font-black text-primary uppercase tracking-[0.2em] mt-1 opacity-70">{userPlan}</p>
            </div>
            <button 
              onClick={logout}
              className="w-9 h-9 rounded-full overflow-hidden border border-outline-variant/30 bg-linear-to-tr from-primary to-primary-container text-white flex items-center justify-center font-black text-[10px] shadow-lg shadow-primary/20 hover:scale-110 active:scale-95 transition-all group relative"
              title="Sign Out"
            >
              <span className="group-hover:opacity-0 transition-opacity font-bold">{userInitials}</span>
              <span className="material-symbols-outlined absolute opacity-0 group-hover:opacity-100 transition-opacity text-sm">logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ── Side Navigation Shell (The Monolith) ──────────────────────────────────────────────── */}
      <aside
        className={`fixed left-0 top-24 bottom-6 ml-4 md:ml-6 flex flex-col p-6 z-40 rounded-[2.5rem] bg-surface-container-low/40 backdrop-blur-2xl shadow-[40px_0_80px_rgba(28,28,26,0.02)] border border-outline-variant/10 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${collapsed ? "w-24" : "w-64 lg:w-72"} hidden lg:flex`}
      >
        <div className={`mb-12 flex items-center justify-between ${collapsed ? "flex-col gap-6" : ""}`}>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-primary mb-1 opacity-60">Workspace</span>
              <h2 className="text-xl font-black text-foreground tracking-tighter leading-none">{workspaceName}</h2>
            </div>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="w-10 h-10 rounded-xl hover:bg-white/60 hover:shadow-sm transition-all text-outline flex items-center justify-center bg-white/20 border border-outline-variant/10"
          >
            <span className="material-symbols-outlined text-[20px]">
              {collapsed ? "grid_view" : "side_navigation"}
            </span>
          </button>
        </div>

        {/* Main Nav (High-Tech Hud Aesthetic) */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto no-scrollbar">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl group transition-all duration-300 font-black uppercase tracking-[0.15em] text-[10px]
                  ${active
                    ? "bg-linear-to-tr from-primary to-primary-container text-white shadow-[0_10px_20px_rgba(137,77,13,0.25)] scale-[1.02] is-active"
                    : "text-on-surface-variant hover:text-primary hover:bg-white/60 hover:translate-x-1"
                  } ${collapsed ? "justify-center px-0" : ""}`}
              >
                <span
                  className={`material-symbols-outlined text-[20px] transition-transform group-hover:scale-110 ${active ? 'icon-fill' : ''}`}
                >
                  {item.icon}
                </span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
          
          <div className="my-8 py-3 relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-outline-variant/20"></div></div>
            <div className="relative flex justify-center"><span className="bg-surface-container-low/0 px-2 text-[8px] font-black text-outline-variant uppercase tracking-[0.3em]">Core</span></div>
          </div>
          
          {BOTTOM_NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl group transition-all duration-300 font-black uppercase tracking-[0.15em] text-[10px]
                  ${active
                    ? "bg-linear-to-tr from-primary to-primary-container text-white shadow-[0_10px_20px_rgba(137,77,13,0.25)]"
                    : "text-on-surface-variant hover:text-primary hover:bg-white/60 hover:translate-x-1"
                  } ${collapsed ? "justify-center px-0" : ""}`}
              >
                <span className="material-symbols-outlined text-[20px] transition-transform group-hover:scale-110">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* New Doc Button (The Floating Dark Pillar) */}
        <button className={`mt-auto py-4 w-full bg-inverse-surface text-surface rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:shadow-2xl hover:brightness-125 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xl shadow-black/10 ${collapsed ? "px-0" : ""}`}>
          {collapsed ? (
            <span className="material-symbols-outlined text-[20px] fill-icon">add</span>
          ) : (
             <>
               <span className="material-symbols-outlined text-[18px]">edit_note</span>
               <span>New Project</span>
             </>
          )}
        </button>
      </aside>

      {/* ── Main Content Area (The Infinite Canvas) ──────────────────────────────────────────── */}
      <main
        className={`flex-1 flex flex-col min-h-screen overflow-y-auto transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${collapsed ? "lg:ml-[120px]" : "lg:ml-[300px] xl:ml-[320px]"}`}
      >
        <div className="pt-24 pb-20 px-6 sm:px-10 max-w-[1700px] w-full mx-auto">
           {children}
        </div>
      </main>
      
      {/* Dynamic Ambient Background Lights */}
      <div className="fixed top-[-20%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[160px] pointer-events-none -z-10 animate-pulse" />
      <div className="fixed bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-tertiary/5 rounded-full blur-[140px] pointer-events-none -z-10" />
      
      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .hud-scanline {
          background: linear-gradient(to bottom, transparent 50%, rgba(137, 77, 13, 0.02) 50%);
          background-size: 100% 4px;
        }

        :global(.fill-icon) { font-variation-settings: 'FILL' 1; }
        .is-active .material-symbols-outlined { font-variation-settings: 'FILL' 1; }
      `}</style>
    </div>
  );
}

