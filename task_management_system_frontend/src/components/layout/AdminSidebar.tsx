import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, FolderGit2, Users, FolderKanban, User, LogOut } from 'lucide-react';

export const AdminSidebar: React.FC = () => {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { labelKey: 'sidebar.dashboard_overview', icon: LayoutDashboard, path: '/admin/dashboard' },
    { labelKey: 'sidebar.participating_projects', icon: FolderGit2, path: '/admin/my-projects' },
    { labelKey: 'sidebar.manage_users', icon: Users, path: '/admin/users' },
    { labelKey: 'sidebar.manage_system_projects', icon: FolderKanban, path: '/admin/projects' },
    { labelKey: 'sidebar.profile', icon: User, path: '/admin/profile' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full font-sans shadow-2xs shrink-0">
      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto min-h-0 p-3 space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          {t('sidebar.system_admin')}
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-bold shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <Icon size={18} />
              <span>{t(item.labelKey)}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Logout Button */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/80 mt-auto shrink-0">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 border border-slate-200 hover:border-red-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
        >
          <LogOut size={16} />
          <span>{t('sidebar.logout')}</span>
        </button>
      </div>
    </aside>
  );
};

