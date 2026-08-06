import React from 'react';
import { FolderKanban, Plus } from 'lucide-react';

export const AdminProjectsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#172B4D]">📁 Quản Lý Dự Án</h1>
          <p className="text-sm text-[#5E6C84]">Danh sách tất cả dự án trong hệ thống</p>
        </div>
        <button className="bg-[#0052CC] hover:bg-[#0747A6] text-white px-4 py-2 rounded text-sm font-medium flex items-center gap-2">
          <Plus size={16} /> Tạo dự án mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-lg border border-[#DFE1E6] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-[#0052CC] bg-[#DEEBFF] px-2 py-0.5 rounded">PROJ-TMS</span>
            <span className="text-xs text-[#006644] font-semibold bg-[#E3FCEF] px-2 py-0.5 rounded">Đang chạy</span>
          </div>
          <h3 className="font-bold text-lg text-[#172B4D]">Task Management System</h3>
          <p className="text-sm text-[#5E6C84]">Xây dựng hệ thống quản lý công việc phân quyền JWT Security Spring Boot & React Vite</p>
        </div>
      </div>
    </div>
  );
};
