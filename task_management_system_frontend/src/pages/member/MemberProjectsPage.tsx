import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderGit2, RefreshCw, Search, Inbox, X, Plus, CheckCircle2, AlertCircle
} from 'lucide-react';
import { projectApi, ProjectDTO, ProjectRequest, ProjectStatus } from '../../services/projectApi';
import { ProjectCard } from '../../components/project/ProjectCard';
import { ProjectFormModal } from '../../components/project/ProjectFormModal';

export const MemberProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Search & Filter state
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [projectToEdit, setProjectToEdit] = useState<ProjectDTO | null>(null);

  // Toast Notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await projectApi.getAllProjects({
        search: searchKeyword,
        status: filterStatus !== 'ALL' ? (filterStatus as ProjectStatus) : undefined,
      });
      setProjects(data || []);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [searchKeyword, filterStatus]);

  // Handle Quick Status Change from Project Card
  const handleStatusChange = async (projectId: number, newStatus: ProjectStatus) => {
    const currentProject = projects.find((p) => p.id === projectId);
    if (!currentProject || currentProject.status === newStatus) return;

    const previousStatus = currentProject.status;

    // Optimistic state update
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, status: newStatus } : p))
    );

    try {
      await projectApi.updateProject(projectId, {
        name: currentProject.name,
        description: currentProject.description || '',
        startDate: currentProject.startDate || new Date().toISOString().split('T')[0],
        endDate: currentProject.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: newStatus,
      });
      showToast(`Đã thay đổi trạng thái dự án sang ${newStatus}!`, 'success');
    } catch (err: any) {
      console.error('Lỗi khi đổi trạng thái dự án:', err);
      // Revert optimistic update
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, status: previousStatus } : p))
      );
      const msg = err.response?.data?.message || err.message || 'Không thể thay đổi trạng thái dự án!';
      showToast(msg, 'error');
    }
  };

  // Handle Form Submit (Create or Update)
  const handleFormSubmit = async (data: ProjectRequest, projectId?: number) => {
    if (projectId) {
      await projectApi.updateProject(projectId, data);
      showToast(`Đã cập nhật dự án PROJ-${projectId} thành công!`, 'success');
    } else {
      await projectApi.createProject(data);
      showToast('Đã tạo dự án mới thành công! Bạn là Chủ sở hữu (Owner) của dự án này.', 'success');
    }
    await fetchProjects();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans relative">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-5 rounded-xl border border-[#DFE1E6] shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <FolderGit2 className="text-[#0052CC]" size={26} />
            <h1 className="text-2xl font-bold text-[#172B4D]">Dự Án Của Tôi</h1>
          </div>
          <p className="text-sm text-[#5E6C84] mt-1">
            Danh sách các dự án bạn đã tạo hoặc tham gia. Bấm vào dự án để xem chi tiết Bảng công việc.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchProjects}
            className="p-2 text-[#5E6C84] hover:text-[#0052CC] hover:bg-[#F4F5F7] rounded-lg border border-[#DFE1E6]"
            title="Tải lại dữ liệu"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={() => {
              setProjectToEdit(null);
              setIsFormModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0052CC] hover:bg-[#0747A6] text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
          >
            <Plus size={16} />
            <span>Tạo Dự Án Mới</span>
          </button>
        </div>
      </div>

      {/* Toolbar & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#DFE1E6] flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#5E6C84]">
            <Search size={16} />
          </span>
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="Tìm kiếm dự án theo tên..."
            className="w-full pl-9 pr-8 py-2 bg-[#F4F5F7] focus:bg-white text-[#172B4D] text-xs rounded-lg border border-[#DFE1E6] focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC] outline-none transition-all"
          />
          {searchKeyword && (
            <button
              onClick={() => setSearchKeyword('')}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#5E6C84] shrink-0">Trạng thái:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs bg-[#F4F5F7] hover:bg-[#EBECF0] text-[#172B4D] border border-[#DFE1E6] rounded-lg px-3 py-2 font-bold outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="PLANNING">PLANNING</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="ON_HOLD">ON_HOLD</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-xl border border-[#DFE1E6] text-center shadow-xs">
          <RefreshCw className="animate-spin text-[#0052CC] mx-auto mb-3" size={28} />
          <p className="text-sm text-[#5E6C84]">Đang tải danh sách dự án...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white p-16 rounded-xl border border-[#DFE1E6] text-center shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#DEEBFF] text-[#0052CC] flex items-center justify-center mx-auto">
            <Inbox size={32} />
          </div>
          <h3 className="text-lg font-bold text-[#172B4D]">
            {searchKeyword || filterStatus !== 'ALL'
              ? 'Không tìm thấy dự án nào phù hợp với bộ lọc'
              : 'Bạn chưa tham gia hoặc sở hữu dự án nào'}
          </h3>
          <p className="text-sm text-[#5E6C84] max-w-md mx-auto">
            {searchKeyword || filterStatus !== 'ALL'
              ? 'Vui lòng thử tìm kiếm bằng từ khóa khác hoặc xóa bộ lọc.'
              : 'Hãy nhấn nút "+ Tạo Dự Án Mới" ở trên để khởi tạo và làm chủ dự án đầu tiên của bạn!'}
          </p>

          {!(searchKeyword || filterStatus !== 'ALL') && (
            <button
              onClick={() => {
                setProjectToEdit(null);
                setIsFormModalOpen(true);
              }}
              className="px-4 py-2 bg-[#0052CC] hover:bg-[#0747A6] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors inline-flex items-center gap-1.5"
            >
              <Plus size={16} />
              <span>Tạo Dự Án Mới</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              isAdmin={false}
              onCardClick={(projectId) => navigate(`/projects/${projectId}`)}
              onStatusChange={handleStatusChange}
              onEditClick={(proj) => {
                setProjectToEdit(proj);
                setIsFormModalOpen(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Modal Tạo/Sửa Dự Án */}
      <ProjectFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setProjectToEdit(null);
        }}
        onSubmit={handleFormSubmit}
        projectToEdit={projectToEdit}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl border flex items-center gap-3 text-xs font-bold transition-all animate-in fade-in slide-in-from-bottom-5 duration-200 ${
            toast.type === 'success'
              ? 'bg-[#006644] text-white border-[#004D33]'
              : 'bg-[#BF2600] text-white border-[#991F00]'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 p-1 hover:bg-white/20 rounded">
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};
