import React from 'react';
import { LayoutDashboard, CheckCircle2, Clock, AlertTriangle, Users } from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const stats = [
    { label: 'Tổng số công việc', count: '128', icon: LayoutDashboard, color: 'text-[#0052CC]', bg: 'bg-[#DEEBFF]' },
    { label: 'Đã hoàn thành', count: '84', icon: CheckCircle2, color: 'text-[#006644]', bg: 'bg-[#E3FCEF]' },
    { label: 'Đang xử lý', count: '32', icon: Clock, color: 'text-[#FF8B00]', bg: 'bg-[#FFF0B3]' },
    { label: 'Số lượng thành viên', count: '14', icon: Users, color: 'text-[#5243AA]', bg: 'bg-[#EAE6FF]' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#172B4D]">📊 Dashboard Tổng Quan (Admin)</h1>
        <p className="text-sm text-[#5E6C84]">Báo cáo tổng quan tiến độ dự án và thành viên hệ thống</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="bg-white p-5 rounded-lg border border-[#DFE1E6] shadow-xs flex items-center gap-4">
              <div className={`w-12 h-12 rounded-lg ${item.bg} ${item.color} flex items-center justify-center font-bold`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#5E6C84] uppercase tracking-wider">{item.label}</p>
                <p className="text-2xl font-bold text-[#172B4D] mt-0.5">{item.count}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white p-6 rounded-lg border border-[#DFE1E6] shadow-xs space-y-4">
        <h2 className="text-base font-semibold text-[#172B4D]">Hoạt động gần đây</h2>
        <div className="space-y-3">
          <div className="p-3 bg-[#FAFBFC] rounded border border-[#EBECF0] flex items-center justify-between text-sm">
            <span className="text-[#172B4D]">📌 Admin vừa khởi tạo hệ thống và cấu hình Security JWT.</span>
            <span className="text-xs text-[#5E6C84]">Vừa xong</span>
          </div>
          <div className="p-3 bg-[#FAFBFC] rounded border border-[#EBECF0] flex items-center justify-between text-sm">
            <span className="text-[#172B4D]">✅ Hệ thống phân quyền Sidebar Admin & Member hoàn tất.</span>
            <span className="text-xs text-[#5E6C84]">1 phút trước</span>
          </div>
        </div>
      </div>
    </div>
  );
};
