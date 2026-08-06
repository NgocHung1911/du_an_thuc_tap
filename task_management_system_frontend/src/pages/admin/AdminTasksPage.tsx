import React from 'react';
import { ClipboardList, Plus, Search, Filter } from 'lucide-react';

export const AdminTasksPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172B4D]">📋 Quản Lý Công Việc (Tất Cả)</h1>
          <p className="text-sm text-[#5E6C84]">Quản lý và giao việc cho tất cả thành viên trong tổ chức</p>
        </div>
        <button className="bg-[#0052CC] hover:bg-[#0747A6] text-white px-4 py-2 rounded text-sm font-medium flex items-center gap-2 shadow-xs transition-colors self-start sm:self-auto">
          <Plus size={16} />
          Tạo công việc mới
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg border border-[#DFE1E6] shadow-xs flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3 text-[#6B778C]" />
          <input
            type="text"
            placeholder="Tìm theo tên nhiệm vụ..."
            className="w-full pl-9 pr-3 py-2 bg-[#FAFBFC] border border-[#DFE1E6] rounded text-sm text-[#172B4D]"
          />
        </div>
        <button className="px-3 py-2 bg-[#FAFBFC] border border-[#DFE1E6] rounded text-sm text-[#42526E] flex items-center gap-1.5 hover:bg-[#EBECF0]">
          <Filter size={16} />
          Lọc
        </button>
      </div>

      <div className="bg-white rounded-lg border border-[#DFE1E6] shadow-xs overflow-hidden">
        <table className="w-full text-left text-sm text-[#172B4D]">
          <thead className="bg-[#FAFBFC] border-b border-[#DFE1E6] text-xs font-semibold text-[#5E6C84] uppercase">
            <tr>
              <th className="p-4">Mã Task</th>
              <th className="p-4">Tiêu đề công việc</th>
              <th className="p-4">Người thực hiện</th>
              <th className="p-4">Trạng thái</th>
              <th className="p-4">Hạn chót</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EBECF0]">
            <tr>
              <td className="p-4 font-mono text-xs text-[#0052CC]">TASK-101</td>
              <td className="p-4 font-medium">Thiết kế API Authentication JWT Backend</td>
              <td className="p-4">Admin</td>
              <td className="p-4"><span className="px-2 py-1 bg-[#E3FCEF] text-[#006644] rounded text-xs font-semibold">Đã hoàn thành</span></td>
              <td className="p-4 text-[#5E6C84]">Hôm nay</td>
            </tr>
            <tr>
              <td className="p-4 font-mono text-xs text-[#0052CC]">TASK-102</td>
              <td className="p-4 font-medium">Xây dựng MemberSidebar và AdminSidebar</td>
              <td className="p-4">Member</td>
              <td className="p-4"><span className="px-2 py-1 bg-[#FFF0B3] text-[#172B4D] rounded text-xs font-semibold">Đang làm</span></td>
              <td className="p-4 text-[#5E6C84]">Ngày mai</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
