import React, { useState } from 'react';
import { X, Shield, Crown, User, Trash2, UserPlus, RefreshCw } from 'lucide-react';
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
  onUpdateMemberRoleSuccess: (userId: number, newRole: 'ADMIN' | 'MEMBER') => void;
  onRemoveMemberSuccess: (userId: number) => void;
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
  onUpdateMemberRoleSuccess,
  onRemoveMemberSuccess,
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

      onUpdateMemberRoleSuccess(targetUserId, newRole);
      onClose();

      onShowToast(
        `Updated member role to ${newRole === 'ADMIN' ? 'ADMIN' : 'MEMBER'}!`,
        'success'
      );
    } catch (err: any) {
      console.error('Error updating role:', err);
      const msg = err.response?.data?.message || 'Could not update member role!';
      onShowToast(msg, 'error');
    } finally {
      setLoadingUserId(null);
    }
  };

  const handleRemoveMember = async (targetUserId: number, username: string) => {
    if (!window.confirm(`Are you sure you want to remove member "${username}" from the project?`)) {
      return;
    }

    try {
      setLoadingUserId(targetUserId);
      await projectApi.removeMemberFromProject(projectId, targetUserId);
      onRemoveMemberSuccess(targetUserId);
      onShowToast(`Removed member ${username} from the project!`, 'success');
    } catch (err: any) {
      console.error('Error removing member:', err);
      const msg = err.response?.data?.message || 'Could not remove member from the project!';
      onShowToast(msg, 'error');
    } finally {
      setLoadingUserId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-150 font-sans">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900">Project Members</h3>
            <p className="text-xs text-slate-500">Manage team members and permissions in this project</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
            title="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
          {canManageMembers && (
            <div className="flex items-center justify-between p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 mb-4">
              <div className="text-xs text-blue-900">
                <span className="font-semibold">Your Role: </span>
                <span className="font-extrabold uppercase bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200">
                  {currentUserRole}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenInvite();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-2xs transition-colors"
              >
                <UserPlus size={14} />
                <span>+ Invite Member</span>
              </button>
            </div>
          )}

          <div className="divide-y divide-slate-100">
            {members.map((mem) => {
              const pRole = mem.projectRole || (mem.role === 'ADMIN' ? 'ADMIN' : 'MEMBER');
              const isTargetOwner = pRole === 'OWNER';
              const isTargetAdmin = pRole === 'ADMIN';
              const isSelf = currentUsername && (mem.username.toLowerCase() === currentUsername.toLowerCase() || mem.email?.toLowerCase() === currentUsername.toLowerCase());

              const canChangeRole = isOwner && !isTargetOwner;
              const canRemove = !isTargetOwner && (isOwner || (isAdmin && !isTargetAdmin));
              const isLoading = loadingUserId === mem.id;

              return (
                <div key={mem.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-2xs ${
                      isTargetOwner
                        ? 'bg-amber-500 ring-2 ring-amber-300'
                        : isTargetAdmin
                        ? 'bg-blue-600'
                        : 'bg-slate-500'
                    }`}>
                      {mem.username.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{mem.username}</span>
                        {isSelf && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">
                            (You)
                          </span>
                        )}
                        {isLoading && (
                          <RefreshCw size={14} className="animate-spin text-blue-600" />
                        )}
                      </div>
                      <span className="text-xs text-slate-500 block">{mem.email || 'No Email'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Role Display / Selector */}
                    {canChangeRole ? (
                      <select
                        value={pRole}
                        disabled={isLoading}
                        onChange={(e) => handleRoleChange(mem.id, e.target.value as 'ADMIN' | 'MEMBER')}
                        className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-900 font-bold border border-slate-200 rounded-xl px-2.5 py-1.5 outline-none cursor-pointer disabled:opacity-50 transition-colors"
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
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {isTargetOwner && <Crown size={12} className="text-amber-500" />}
                        {isTargetAdmin && <Shield size={12} className="text-blue-500" />}
                        {!isTargetOwner && !isTargetAdmin && <User size={12} className="text-slate-500" />}
                        <span>{pRole}</span>
                      </span>
                    )}

                    {/* Delete Button */}
                    {canRemove && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(mem.id, mem.username)}
                        disabled={isLoading}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
                        title="Remove member from project"
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
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};


