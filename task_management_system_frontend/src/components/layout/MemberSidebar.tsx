import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CheckSquare, FolderGit2, User, LogOut, UserCheck } from 'lucide-react';

export const MemberSidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Công việc của tôi', icon: CheckSquare, path: '/member/my-tasks' },
    { label: 'Dự án tham gia', icon: FolderGit2, path: '/member/projects' },
    { label: 'Hồ sơ cá nhân', icon: User, path: '/member/profile' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-[#EBECF0] flex flex-col h-full font-sans shadow-sm shrink-0">
      {/* Phần Top (Profile): Cố định ở trên */}
      <div className="p-5 border-b border-[#EBECF0] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#00875A] text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
            {user?.username ? user.username.substring(0, 2).toUpperCase() : 'MB'}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-[#172B4D] truncate">{user?.username || 'Member'}</h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded text-xs font-semibold bg-[#E3FCEF] text-[#006644]">
              <UserCheck size={12} />
              Thành viên
            </span>
          </div>
        </div>
      </div>

      {/* Phần Middle (Menu 'Không gian làm việc'): flex-1 overflow-y-auto */}
      <nav className="flex-1 overflow-y-auto min-h-0 p-3 space-y-1">
        <div className="px-3 py-2 text-xs font-bold text-[#5E6C84] uppercase tracking-wider">
          Không gian làm việc
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

      {/* Phần Bottom (Nút Đăng xuất): mt-auto shrink-0 ghim dưới đáy */}
      <div className="p-4 border-t border-[#EBECF0] bg-[#FAFBFC] mt-auto shrink-0">
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
