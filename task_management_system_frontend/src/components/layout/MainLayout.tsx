import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AdminSidebar } from './AdminSidebar';
import { MemberSidebar } from './MemberSidebar';
import { Search, Bell, HelpCircle, Kanban } from 'lucide-react';

export const MainLayout: React.FC = () => {
  const { isAdmin, user } = useAuth();

  return (
    <div className="h-screen max-h-screen bg-slate-50 flex flex-col font-sans overflow-hidden">
      <header className="h-14 bg-slate-900 text-white flex items-center justify-between px-5 shadow-sm z-10 shrink-0 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-sm">
            <Kanban size={18} />
          </div>
          <span className="font-bold text-base tracking-tight text-white">TinG Task Management</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden md:block w-64">
            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 pointer-events-none">
              <Search size={15} />
            </span>
            <input
              type="text"
              placeholder="Search for jobs, projects..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 focus:bg-white focus:text-slate-900 focus:placeholder-slate-400 text-white placeholder-slate-400 rounded-xl text-xs focus:outline-none transition-colors border border-slate-700 focus:border-blue-600"
            />
          </div>

          <button className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-300 hover:text-white" title="Notifications">
            <Bell size={18} />
          </button>
          <button className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-300 hover:text-white" title="Help">
            <HelpCircle size={18} />
          </button>

          <div className="h-5 w-px bg-slate-800"></div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-600 border border-blue-400/30 flex items-center justify-center text-xs font-bold text-white shadow-xs">
              {user?.username ? user.username.substring(0, 2).toUpperCase() : 'U'}
            </div>
            <span className="text-xs font-semibold text-slate-200 hidden sm:inline">{user?.username}</span>
          </div>
        </div>
      </header>

      {/* Body Content with Sidebar */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Automatic Sidebar dispatch based on Role */}
        {isAdmin ? <AdminSidebar /> : <MemberSidebar />}

        {/* Dynamic Outlet Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

