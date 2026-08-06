import React from 'react';
import { FolderGit2 } from 'lucide-react';

export const MemberProjectsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#172B4D]">📂 Dự Án Tham Gia</h1>
        <p className="text-sm text-[#5E6C84]">Các dự án bạn đang tham gia đóng góp công việc</p>
      </div>

      <div className="bg-white p-5 rounded-lg border border-[#DFE1E6] shadow-xs space-y-2 max-w-xl">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-[#0052CC] bg-[#DEEBFF] px-2 py-0.5 rounded">PROJ-TMS</span>
          <span className="text-xs text-[#006644] font-semibold bg-[#E3FCEF] px-2 py-0.5 rounded">Member Role</span>
        </div>
        <h3 className="font-bold text-lg text-[#172B4D]">Task Management System</h3>
        <p className="text-sm text-[#5E6C84]">Dự án thực tập quản lý công việc fullstack Spring Boot & React Vite.</p>
      </div>
    </div>
  );
};
