import React, { useState } from 'react';
import { AlertTriangle, Trash2, RefreshCw, X } from 'lucide-react';
import { ProjectDTO } from '../../services/projectApi';

interface ProjectDeleteModalProps {
  isOpen: boolean;
  project: ProjectDTO | null;
  onClose: () => void;
  onConfirm: (projectId: number) => Promise<void>;
}

export const ProjectDeleteModal: React.FC<ProjectDeleteModalProps> = ({
  isOpen,
  project,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !project) return null;

  const [deleting, setDeleting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleConfirm = async () => {
    try {
      setDeleting(true);
      setErrorMsg(null);
      await onConfirm(project.id);
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Không thể xóa dự án này!';
      setErrorMsg(msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-[#DFE1E6] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-red-50 border-b border-red-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="font-bold text-base text-red-900">Xác Nhận Xóa Dự Án</h3>
            <p className="text-xs text-red-700">Hành động này không thể hoàn tác!</p>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 text-sm text-[#172B4D] space-y-3">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-600">
              {errorMsg}
            </div>
          )}

          <p>
            Bạn có chắc chắn muốn xóa dự án{' '}
            <strong className="text-red-600 font-mono">PROJ-{project.id}</strong> không?
          </p>
          <div className="p-3 bg-[#F4F5F7] rounded-xl border border-[#DFE1E6] text-xs font-semibold text-[#172B4D]">
            "{project.name}"
          </div>
          <p className="text-xs text-[#5E6C84]">
            Tất cả các công việc (tasks) liên quan thuộc dự án này cũng sẽ bị xóa khỏi hệ thống.
          </p>
        </div>

        {/* Footer Buttons */}
        <div className="px-5 py-3.5 bg-[#F4F5F7] border-t border-[#DFE1E6] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="px-4 py-2 bg-white hover:bg-gray-100 text-[#172B4D] border border-[#DFE1E6] text-xs font-semibold rounded-lg transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={deleting}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
          >
            {deleting ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
            <span>Xóa Dự Án</span>
          </button>
        </div>
      </div>
    </div>
  );
};
