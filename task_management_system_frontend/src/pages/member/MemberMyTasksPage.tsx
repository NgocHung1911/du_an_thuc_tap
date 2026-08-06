import React from 'react';
import { CheckSquare, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const MemberMyTasksPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#172B4D]">📌 Công Việc Của Tôi</h1>
        <p className="text-sm text-[#5E6C84]">Danh sách nhiệm vụ được giao cho <strong>{user?.username}</strong></p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Column 1: To Do */}
        <div className="bg-[#FAFBFC] p-4 rounded-lg border border-[#DFE1E6] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#EBECF0]">
            <span className="font-semibold text-xs text-[#5E6C84] uppercase tracking-wider">Cần làm (TO DO)</span>
            <span className="bg-[#DFE1E6] text-[#172B4D] px-2 py-0.5 rounded-full text-xs font-bold">1</span>
          </div>
          <div className="bg-white p-3.5 rounded border border-[#DFE1E6] shadow-xs space-y-2">
            <span className="text-xs font-mono text-[#0052CC]">TASK-103</span>
            <h4 className="text-sm font-semibold text-[#172B4D]">Kiểm thử giao diện MemberSidebar</h4>
            <div className="flex items-center justify-between pt-2 text-xs text-[#5E6C84]">
              <span className="flex items-center gap-1"><Clock size={14}/> Hạn: Hôm nay</span>
            </div>
          </div>
        </div>

        {/* Column 2: In Progress */}
        <div className="bg-[#FAFBFC] p-4 rounded-lg border border-[#DFE1E6] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#EBECF0]">
            <span className="font-semibold text-xs text-[#0052CC] uppercase tracking-wider">Đang làm (IN PROGRESS)</span>
            <span className="bg-[#DEEBFF] text-[#0052CC] px-2 py-0.5 rounded-full text-xs font-bold">1</span>
          </div>
          <div className="bg-white p-3.5 rounded border border-[#DFE1E6] shadow-xs space-y-2">
            <span className="text-xs font-mono text-[#0052CC]">TASK-102</span>
            <h4 className="text-sm font-semibold text-[#172B4D]">Tự tạo tài khoản mới qua RegisterPage</h4>
            <div className="flex items-center justify-between pt-2 text-xs text-[#5E6C84]">
              <span className="flex items-center gap-1 text-[#FF8B00]"><Clock size={14}/> Đang tiến hành</span>
            </div>
          </div>
        </div>

        {/* Column 3: Done */}
        <div className="bg-[#FAFBFC] p-4 rounded-lg border border-[#DFE1E6] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#EBECF0]">
            <span className="font-semibold text-xs text-[#006644] uppercase tracking-wider">Hoàn thành (DONE)</span>
            <span className="bg-[#E3FCEF] text-[#006644] px-2 py-0.5 rounded-full text-xs font-bold">1</span>
          </div>
          <div className="bg-white p-3.5 rounded border border-[#DFE1E6] shadow-xs space-y-2">
            <span className="text-xs font-mono text-[#0052CC]">TASK-100</span>
            <h4 className="text-sm font-semibold text-[#172B4D]">Đăng nhập hệ thống thành công</h4>
            <div className="flex items-center justify-between pt-2 text-xs text-[#006644] font-medium">
              <span>✓ Đã hoàn tất</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
