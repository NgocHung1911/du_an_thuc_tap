import React, { useState } from 'react';
import { X, Shield, Crown, User, Trash2, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { UserDTO } from '../../services/taskApi';
import { projectApi } from '../../services/projectApi';

interface ProjectMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  members: UserDTO[];
  currentUserRole: 'OWNER' | 'ADMIN' | 'MEMBER';
  currentUserId?: number;
  currentUsername?: string;
  onRefreshMembers: () => void;
  onOpenInvite: () => void;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

export const ProjectMembersModal: React.FC<ProjectMembersModalProps> = ({
  isOpen,
  onClose,
  projectId,
  members,
  currentUserRole,
  currentUsername,
  onRefreshMembers,
  onOpenInvite,
  onShowToast,
}) => {
  const [loadingUserId, setLoadingUserId] = useState<number | null>(null);

  if (!isOpen) return null;

  const isOwner = currentUserRole === 'OWNER';
  const isAdmin = currentUserRole === 'ADMIN';
  const canManageMembers = isOwner || isAdmin;

  const handleRoleChange = async (targetUserId: number, newRole: 'ADMIN' | 'MEMBER') => {
    try {
      setLoadingUserId(targetUserId);
      await projectApi.updateMemberRole(projectId, targetUserId, newRole);
      onShowToast(`Đã cập nhật vai trò thành ${newRole === 'ADMIN' ? 'Quản trị viên (ADMIN)' : 'Thành viên (MEMBER)'}!`, 'success');
      onRefreshMembers();
    } catch (err: any) {
      console.error('Lỗi khi cập nhật vai trò:', err);
      const msg = err.response?.data?.message || 'Không thể thay đổi vai trò thành viên!';
      onShowToast(msg, 'error');
    } finally {
      setLoadingUserId(null);
    }
  };

  const handleRemoveMember = async (targetUserId: number, username: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa thành viên "${username}" khỏi dự án không?`)) {
      return;
    }

    try {
      setLoadingUserId(targetUserId);
      await projectApi.removeMemberFromProject(projectId, targetUserId);
      onShowToast(`Đã xóa thành viên ${username} khỏi dự án!`, 'success');
      onRefreshMembers();
    } catch (err: any) {
      console.error('Lỗi khi xóa thành viên:', err);
      const msg = err.response?.data?.message || 'Không thể xóa thành viên khỏi dự án!';
      onShowToast(msg, 'error');
    } finally {
      setLoadingUserId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-[#DFE1E6] shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-150 font-sans">
        {/* Header */}
        <div className="px-6 py-4 bg-[#F4F5F7] border-b border-[#DFE1E6] flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-[#172B4D]">Danh Sách Thành Viên Dự Án</h3>
            <p className="text-xs text-[#5E6C84]">Quản lý danh sách thành viên và phân quyền trong dự án</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#5E6C84] hover:text-[#172B4D] hover:bg-[#EBECF0] rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
          {canManageMembers && (
            <div className="flex items-center justify-between p-3 bg-[#DEEBFF]/30 rounded-xl border border-[#B3D4FF] mb-4">
              <div className="text-xs text-[#0747A6]">
                <span className="font-bold">Vai trò của bạn: </span>
                <span className="font-extrabold uppercase bg-[#DEEBFF] px-2 py-0.5 rounded border border-[#B3D4FF]">
                  {currentUserRole}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenInvite();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0052CC] hover:bg-[#0747A6] text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
              >
                <UserPlus size={14} />
                <span>+ Mời Thành Viên Mới</span>
              </button>
            </div>
          )}

          <div className="divide-y divide-[#DFE1E6]">
            {members.map((mem) => {
              const pRole = mem.projectRole || (mem.role === 'ADMIN' ? 'ADMIN' : 'MEMBER');
              const isTargetOwner = pRole === 'OWNER';
              const isTargetAdmin = pRole === 'ADMIN';
              const isSelf = currentUsername && (mem.username.toLowerCase() === currentUsername.toLowerCase() || mem.email?.toLowerCase() === currentUsername.toLowerCase());

              // Privilege checks:
              // Only Owner can change role of others (except Owner itself)
              const canChangeRole = isOwner && !isTargetOwner;
              // Owner can remove anyone except itself. Admin can remove MEMBERs only.
              const canRemove = !isTargetOwner && (isOwner || (isAdmin && !isTargetAdmin));

              return (
                <div key={mem.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                      isTargetOwner
                        ? 'bg-amber-500 ring-2 ring-amber-300'
                        : isTargetAdmin
                        ? 'bg-[#0052CC]'
                        : 'bg-[#5E6C84]'
                    }`}>
                      {mem.username.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#172B4D]">{mem.username}</span>
                        {isSelf && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">
                            (Bạn)
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-[#5E6C84] block">{mem.email || 'No Email'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Role Display / Selector */}
                    {canChangeRole ? (
                      <select
                        value={pRole}
                        disabled={loadingUserId === mem.id}
                        onChange={(e) => handleRoleChange(mem.id, e.target.value as 'ADMIN' | 'MEMBER')}
                        className="text-xs bg-[#F4F5F7] hover:bg-[#EBECF0] text-[#172B4D] font-bold border border-[#DFE1E6] rounded-lg px-2.5 py-1.5 outline-none cursor-pointer"
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="MEMBER">MEMBER</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${
                        isTargetOwner
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : isTargetAdmin
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-gray-100 text-gray-700 border-gray-200'
                      }`}>
                        {isTargetOwner && <Crown size={12} className="text-amber-500" />}
                        {isTargetAdmin && <Shield size={12} className="text-blue-500" />}
                        {!isTargetOwner && !isTargetAdmin && <User size={12} className="text-gray-500" />}
                        <span>{pRole}</span>
                      </span>
                    )}

                    {/* Delete Button */}
                    {canRemove && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(mem.id, mem.username)}
                        disabled={loadingUserId === mem.id}
                        className="p-1.5 text-[#5E6C84] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa thành viên khỏi dự án"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#F4F5F7] border-t border-[#DFE1E6] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-gray-100 text-[#172B4D] border border-[#DFE1E6] text-xs font-semibold rounded-xl transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
