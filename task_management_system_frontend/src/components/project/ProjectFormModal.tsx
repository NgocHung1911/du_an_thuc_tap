import React, { useState, useEffect } from 'react';
import { X, FolderKanban, Calendar, RefreshCw, AlertCircle } from 'lucide-react';
import { ProjectDTO, ProjectRequest, ProjectStatus } from '../../services/projectApi';

interface ProjectFormModalProps {
  isOpen: boolean;
  projectToEdit?: ProjectDTO | null;
  onClose: () => void;
  onSubmit: (data: ProjectRequest, projectId?: number) => Promise<void>;
}

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  isOpen,
  projectToEdit,
  onClose,
  onSubmit,
}) => {
  if (!isOpen) return null;

  const isEditMode = Boolean(projectToEdit);

  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [status, setStatus] = useState<ProjectStatus>('PLANNING');

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (projectToEdit) {
      setName(projectToEdit.name || '');
      setDescription(projectToEdit.description || '');
      setStartDate(projectToEdit.startDate || '');
      setEndDate(projectToEdit.endDate || '');
      setStatus((projectToEdit.status as ProjectStatus) || 'PLANNING');
    } else {
      const today = new Date().toISOString().split('T')[0];
      const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setName('');
      setDescription('');
      setStartDate(today);
      setEndDate(nextMonth);
      setStatus('PLANNING');
    }
    setErrorMessage(null);
  }, [projectToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Tên dự án không được để trống!');
      return;
    }
    if (!startDate) {
      setErrorMessage('Vui lòng chọn ngày bắt đầu!');
      return;
    }
    if (!endDate) {
      setErrorMessage('Vui lòng chọn ngày kết thúc!');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setErrorMessage('Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu!');
      return;
    }

    try {
      setLoading(true);
      await onSubmit(
        {
          name: name.trim(),
          description: description.trim(),
          startDate,
          endDate,
          status,
        },
        projectToEdit?.id
      );
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi lưu thông tin dự án!';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#DFE1E6] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150 font-sans">
        {/* Header */}
        <div className="px-6 py-4 bg-[#F4F5F7] border-b border-[#DFE1E6] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#DEEBFF] text-[#0052CC] flex items-center justify-center font-bold">
              <FolderKanban size={18} />
            </div>
            <h3 className="font-bold text-base text-[#172B4D]">
              {isEditMode ? `Cập Nhật Dự Án (PROJ-${projectToEdit?.id})` : 'Tạo Dự Án Mới'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#5E6C84] hover:text-[#172B4D] hover:bg-[#EBECF0] rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-600 flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#172B4D] mb-1">
              Tên dự án <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Nhập tên dự án..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-[#DFE1E6] rounded-lg text-sm focus:outline-none focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#172B4D] mb-1">Mô tả dự án</label>
            <textarea
              rows={3}
              placeholder="Mô tả mục tiêu, phạm vi của dự án..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-[#DFE1E6] rounded-lg text-xs focus:outline-none focus:border-[#0052CC]"
            ></textarea>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#172B4D] mb-1">
                Ngày bắt đầu <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-[#DFE1E6] rounded-lg text-xs focus:outline-none focus:border-[#0052CC]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172B4D] mb-1">
                Ngày kết thúc <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-[#DFE1E6] rounded-lg text-xs focus:outline-none focus:border-[#0052CC]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#172B4D] mb-1">
              Trạng thái dự án (Status) <span className="text-red-500">*</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              className="w-full px-3 py-2 border border-[#DFE1E6] rounded-lg text-xs font-bold focus:outline-none focus:border-[#0052CC]"
            >
              <option value="PLANNING">PLANNING</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="ON_HOLD">ON_HOLD</option>
            </select>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-[#DFE1E6] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#172B4D] text-xs font-semibold rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#0052CC] hover:bg-[#0747A6] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
            >
              {loading && <RefreshCw size={14} className="animate-spin" />}
              <span>{isEditMode ? 'Cập Nhật Dự Án' : 'Tạo Dự Án Mới'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
