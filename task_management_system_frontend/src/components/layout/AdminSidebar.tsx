import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, ClipboardList, Users, FolderKanban, Settings, LogOut, ShieldAlert } from 'lucide-react';

export const AdminSidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard Tổng quan', icon: LayoutDashboard, path: '/admin/dashboard' },
    { label: 'Quản lý Công việc', icon: ClipboardList, path: '/admin/tasks' },
    { label: 'Quản lý Người dùng', icon: Users, path: '/admin/users' },
    { label: 'Quản lý Dự án', icon: FolderKanban, path: '/admin/projects' },
    { label: 'Cài đặt Hệ thống', icon: Settings, path: '/admin/settings' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-[#EBECF0] flex flex-col justify-between h-screen sticky top-0 font-sans shadow-sm">
      {/* Header Info */}
      <div>
        <div className="p-5 border-b border-[#EBECF0]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0052CC] text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
              {user?.username ? user.username.substring(0, 2).toUpperCase() : 'AD'}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-[#172B4D] truncate">{user?.username || 'Admin'}</h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded text-xs font-semibold bg-[#DEEBFF] text-[#0747A6]">
                <ShieldAlert size={12} />
                Admin
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-2 text-xs font-bold text-[#5E6C84] uppercase tracking-wider">
            Quản trị hệ thống
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#EBF5FF] text-[#0052CC] font-semibold'
                      : 'text-[#42526E] hover:bg-[#FAFBFC] hover:text-[#172B4D]'
                  }`
                }
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Logout Button */}
      <div className="p-4 border-t border-[#EBECF0] bg-[#FAFBFC]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-[#FFEBE6] text-[#BF2600] border border-[#FFBDAD] rounded-md text-sm font-medium transition-colors shadow-xs"
        >
          <LogOut size={16} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
};
