import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Shield, Key } from 'lucide-react';

export const MemberProfilePage: React.FC = () => {
  const { user, roles } = useAuth();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[#172B4D]">👤 Hồ Sơ Cá Nhân</h1>
        <p className="text-sm text-[#5E6C84]">Thông tin chi tiết tài khoản của bạn</p>
      </div>

      <div className="bg-white p-6 rounded-lg border border-[#DFE1E6] shadow-xs space-y-4">
        <div className="flex items-center gap-4 pb-4 border-b border-[#EBECF0]">
          <div className="w-14 h-14 rounded-full bg-[#00875A] text-white font-bold text-xl flex items-center justify-center shadow-xs">
            {user?.username ? user.username.substring(0, 2).toUpperCase() : 'U'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#172B4D]">{user?.username}</h2>
            <p className="text-sm text-[#5E6C84]">{user?.email || 'Chưa cập nhật email'}</p>
          </div>
        </div>

        <div className="space-y-3 pt-2 text-sm text-[#172B4D]">
          <div className="flex items-center gap-3">
            <User size={18} className="text-[#5E6C84]" />
            <span className="font-semibold text-[#5E6C84] w-32">Username:</span>
            <span>{user?.username}</span>
          </div>
          <div className="flex items-center gap-3">
            <Mail size={18} className="text-[#5E6C84]" />
            <span className="font-semibold text-[#5E6C84] w-32">Email:</span>
            <span>{user?.email || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-3">
            <Shield size={18} className="text-[#5E6C84]" />
            <span className="font-semibold text-[#5E6C84] w-32">Vai trò (Role):</span>
            <span className="px-2.5 py-0.5 bg-[#E3FCEF] text-[#006644] rounded text-xs font-bold">
              {roles.join(', ') || 'MEMBER'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Key size={18} className="text-[#5E6C84]" />
            <span className="font-semibold text-[#5E6C84] w-32">JWT Authorization:</span>
            <span className="text-xs font-mono text-[#0052CC] bg-[#DEEBFF] px-2 py-1 rounded">Bearer Token Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
