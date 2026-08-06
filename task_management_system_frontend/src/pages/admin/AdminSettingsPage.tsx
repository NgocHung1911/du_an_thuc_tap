import React from 'react';
import { Settings, Save } from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#172B4D]">⚙️ Cài Đặt Hệ Thống</h1>
        <p className="text-sm text-[#5E6C84]">Cấu hình bảo mật, thông báo và tham số hệ thống</p>
      </div>

      <div className="bg-white p-6 rounded-lg border border-[#DFE1E6] shadow-xs space-y-4 max-w-2xl">
        <h2 className="text-base font-semibold text-[#172B4D]">Cấu hình JWT Auth</h2>
        <div>
          <label className="block text-xs font-semibold text-[#5E6C84] uppercase mb-1">Thời gian hết hạn Token (ms)</label>
          <input type="text" defaultValue="86400000 (24 Giờ)" disabled className="w-full bg-[#FAFBFC] border border-[#DFE1E6] p-2 rounded text-sm text-[#5E6C84]" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#5E6C84] uppercase mb-1">Thuật toán mã hóa Password</label>
          <input type="text" defaultValue="BCryptPasswordEncoder" disabled className="w-full bg-[#FAFBFC] border border-[#DFE1E6] p-2 rounded text-sm text-[#5E6C84]" />
        </div>
      </div>
    </div>
  );
};
