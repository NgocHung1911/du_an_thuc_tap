import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AdminSidebar } from './AdminSidebar';
import { MemberSidebar } from './MemberSidebar';
import { userApi } from '../../services/userApi';
import { UserDTO } from '../../services/taskApi';
import { Bell, HelpCircle, Kanban } from 'lucide-react';

export const MainLayout: React.FC = () => {
  const { isAdmin, user } = useAuth();
  const [profile, setProfile] = useState<UserDTO | null>(null);

  useEffect(() => {
    userApi.getCurrentUser()
      .then(data => setProfile(data))
      .catch(err => console.error('Failed to load profile in header:', err));
  }, []);

  const displayName = profile?.fullName || profile?.username || user?.username || 'User';

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="h-screen max-h-screen bg-slate-50 flex flex-col font-sans overflow-hidden">
      <header className="h-14 bg-slate-900 text-white flex items-center justify-between px-5 shadow-sm z-10 shrink-0 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-sm">
            <Kanban size={18} />
          </div>
          <span className="font-bold text-base tracking-tight text-white">Kira Task Management</span>
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-300 hover:text-white" title="Notifications">
            <Bell size={18} />
          </button>
          <button className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-300 hover:text-white" title="Help">
            <HelpCircle size={18} />
          </button>

          <div className="h-5 w-px bg-slate-800"></div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-600 border border-blue-400/30 flex items-center justify-center text-xs font-bold text-white shadow-xs">
              {getInitials(displayName)}
            </div>
            <span className="text-xs font-semibold text-slate-200 hidden sm:inline">{displayName}</span>
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
