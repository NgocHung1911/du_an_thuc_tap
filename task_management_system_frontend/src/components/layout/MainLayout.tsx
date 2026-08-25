import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AdminSidebar } from './AdminSidebar';
import { MemberSidebar } from './MemberSidebar';
import { Search, Bell, HelpCircle } from 'lucide-react';

export const MainLayout: React.FC = () => {
  const { isAdmin, user } = useAuth();

  return (
    <div className="h-screen max-h-screen bg-[#F4F5F7] flex flex-col font-sans overflow-hidden">
      <header className="h-14 bg-[#0052CC] text-white flex items-center justify-between px-5 shadow-sm z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-white/20 flex items-center justify-center font-bold text-base">
            J
          </div>
          <span className="font-bold text-lg tracking-wide">Kira Task Management</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden md:block w-64">
            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-white/60">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Tìm kiếm công việc, dự án..."
              className="w-full pl-9 pr-3 py-1.5 bg-white/10 hover:bg-white/20 focus:bg-white focus:text-[#172B4D] focus:placeholder-[#a5adba] text-white placeholder-white/70 rounded text-sm focus:outline-none transition-colors"
            />
          </div>

          <button className="p-1.5 hover:bg-white/10 rounded transition-colors text-white/80 hover:text-white">
            <Bell size={18} />
          </button>
          <button className="p-1.5 hover:bg-white/10 rounded transition-colors text-white/80 hover:text-white">
            <HelpCircle size={18} />
          </button>

          <div className="h-6 w-px bg-white/20"></div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#0747A6] border border-white/30 flex items-center justify-center text-xs font-bold text-white">
              {user?.username ? user.username.substring(0, 2).toUpperCase() : 'U'}
            </div>
            <span className="text-sm font-medium hidden sm:inline">{user?.username}</span>
          </div>
        </div>
      </header>

      {/* Body Content with Sidebar */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Automatic Sidebar dispatch based on Role */}
        {isAdmin ? <AdminSidebar /> : <MemberSidebar />}

        {/* Dynamic Outlet Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#F4F5F7]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
