import React from 'react';
import { Users, UserPlus, Shield, CheckCircle2 } from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#172B4D]">👥 Quản Lý Người Dùng</h1>
          <p className="text-sm text-[#5E6C84]">Danh sách tài khoản và phân quyền người dùng trong hệ thống</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[#DFE1E6] shadow-xs overflow-hidden">
        <table className="w-full text-left text-sm text-[#172B4D]">
          <thead className="bg-[#FAFBFC] border-b border-[#DFE1E6] text-xs font-semibold text-[#5E6C84] uppercase">
            <tr>
              <th className="p-4">Tên người dùng</th>
              <th className="p-4">Email</th>
              <th className="p-4">Vai trò (Role)</th>
              <th className="p-4">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EBECF0]">
            <tr>
              <td className="p-4 font-semibold flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#0052CC] text-white flex items-center justify-center text-xs">AD</div>
                admin
              </td>
              <td className="p-4">admin@jira.com</td>
              <td className="p-4"><span className="px-2.5 py-1 bg-[#DEEBFF] text-[#0747A6] rounded text-xs font-bold">ROLE_ADMIN</span></td>
              <td className="p-4 text-[#006644] font-medium flex items-center gap-1"><CheckCircle2 size={16}/> Hoạt động</td>
            </tr>
            <tr>
              <td className="p-4 font-semibold flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#00875A] text-white flex items-center justify-center text-xs">MB</div>
                member
              </td>
              <td className="p-4">member@jira.com</td>
              <td className="p-4"><span className="px-2.5 py-1 bg-[#E3FCEF] text-[#006644] rounded text-xs font-bold">ROLE_MEMBER</span></td>
              <td className="p-4 text-[#006644] font-medium flex items-center gap-1"><CheckCircle2 size={16}/> Hoạt động</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
