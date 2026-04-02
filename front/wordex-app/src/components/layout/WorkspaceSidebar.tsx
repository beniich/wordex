"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText, Zap, Users, Settings, FolderPlus, Search,
  ChevronRight, ChevronDown,
} from "lucide-react";

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
}

interface WorkspaceSidebarProps {
  workspaceName?: string;
  workspaceId?: string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  collapsed?: boolean;
  onToggle?: () => void;
  currentUser?: { username: string; initials: string; plan?: string };
}

const NAV_ITEMS: SidebarItem[] = [
  { id: "docs",     label: "Documents",     icon: <FileText size={18} />,  badge: 3 },
  { id: "ai",       label: "AI Assistant",  icon: <Zap size={18} /> },
  { id: "team",     label: "Team",          icon: <Users size={18} /> },
  { id: "search",   label: "Search",        icon: <Search size={18} /> },
  { id: "settings", label: "Settings",      icon: <Settings size={18} /> },
];

export default function WorkspaceSidebar({
  workspaceName = "My Workspace",
  workspaceId,
  activeTab = "docs",
  onTabChange,
  collapsed = false,
  onToggle,
  currentUser = { username: "User", initials: "U", plan: "Free" },
}: WorkspaceSidebarProps) {
  const [docsExpanded, setDocsExpanded] = useState(true);

  return (
    <aside
      className={`${collapsed ? "w-[72px]" : "w-64"} flex-shrink-0 border-r border-white/10 bg-slate-900/60 backdrop-blur-xl transition-all duration-300 flex flex-col z-20`}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 flex-shrink-0">
        {collapsed ? (
          <Link
            href="/"
            className="mx-auto w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-extrabold text-base shadow-lg shadow-indigo-500/30 text-white"
          >
            W
          </Link>
        ) : (
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center font-extrabold text-sm shadow-lg shadow-indigo-500/30 text-white transition-transform group-hover:scale-105">
              W
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight truncate max-w-[140px]">
                {workspaceName}
              </p>
              <p className="text-slate-500 text-xs">Wordex</p>
            </div>
          </Link>
        )}

        <button
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors flex-shrink-0"
        >
          <ChevronRight
            size={16}
            className={`transition-transform duration-200 ${collapsed ? "" : "rotate-180"}`}
          />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <div key={item.id}>
            <button
              onClick={() => {
                onTabChange?.(item.id);
                if (item.id === "docs") setDocsExpanded((p) => !p);
              }}
              title={collapsed ? item.label : undefined}
              className={[
                "w-full flex items-center rounded-lg py-2.5 text-sm font-medium transition-all duration-150",
                collapsed ? "justify-center px-2" : "justify-start px-3",
                activeTab === item.id
                  ? "bg-indigo-600/20 text-indigo-400"
                  : "text-slate-400 hover:bg-white/5 hover:text-white",
              ].join(" ")}
            >
              <span className={activeTab === item.id ? "text-indigo-400" : "text-slate-500"}>
                {item.icon}
              </span>
              {!collapsed && (
                <>
                  <span className="ml-3 flex-1 truncate text-left">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto text-xs bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                  {item.id === "docs" && (
                    <ChevronDown
                      size={14}
                      className={`ml-1 transition-transform duration-200 ${docsExpanded ? "" : "-rotate-90"}`}
                    />
                  )}
                </>
              )}
            </button>

            {/* Sub-items for Docs */}
            {item.id === "docs" && !collapsed && docsExpanded && (
              <div className="ml-6 mt-1 space-y-0.5 border-l border-white/5 pl-3">
                {["Product PRD", "Meeting Notes", "API Spec"].map((doc) => (
                  <button
                    key={doc}
                    onClick={() => onTabChange?.("editor")}
                    className="w-full text-left text-xs text-slate-500 hover:text-slate-300 py-1.5 px-2 rounded hover:bg-white/5 transition-colors truncate"
                  >
                    {doc}
                  </button>
                ))}
                <button className="w-full text-left text-xs text-indigo-500 hover:text-indigo-400 py-1.5 px-2 flex items-center gap-1 transition-colors">
                  <FolderPlus size={11} /> New document
                </button>
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* User */}
      <div className={`p-4 border-t border-white/10 flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-indigo-500 flex items-center justify-center font-bold text-xs text-white flex-shrink-0 shadow">
          {currentUser.initials}
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-white truncate">{currentUser.username}</p>
            <p className="text-xs text-slate-500">{currentUser.plan ?? "Free"} Plan</p>
          </div>
        )}
      </div>
    </aside>
  );
}
