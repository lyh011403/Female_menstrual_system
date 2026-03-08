import { Outlet, NavLink } from "react-router";
import { Home, Calendar as CalendarIcon, Utensils, FileText, Mic } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { LoggingSheet } from "./LoggingSheet";

export function Layout() {
  const [isLoggingOpen, setIsLoggingOpen] = useState(false);

  return (
    <div className="w-full h-full min-h-screen bg-[#e6f0ff] text-[#44474b] overflow-hidden relative font-sans flex flex-col">
      <div className="flex-1 overflow-y-auto pb-32 pt-[var(--safe-area-top)] px-4">
        <Outlet />
      </div>


      {/* 底部導覽列 - 繁體中文版本 */}
      <nav className="fixed bottom-0 w-full neu-nav pt-4 pb-[calc(1.5rem+var(--safe-area-bottom))] px-8 flex justify-between items-center z-30">
        <NavItem to="/" icon={<Home />} label="主頁" />
        <NavItem to="/calendar" icon={<CalendarIcon />} label="紀錄" />
        <NavItem to="/diet" icon={<Utensils />} label="飲食" />
        <NavItem to="/tools" icon={<FileText />} label="設定" />
      </nav>

      {isLoggingOpen && <LoggingSheet onClose={() => setIsLoggingOpen(false)} />}
    </div>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center gap-1 ${isActive ? "text-[#4a90e2]" : "text-stone-400"
        }`
      }
    >
      <div className="w-6 h-6">{icon}</div>
      <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
    </NavLink>
  );
}
