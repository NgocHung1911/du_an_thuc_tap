import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban, RefreshCw, Search, Inbox, X, Filter,
  Plus, CheckCircle2, AlertCircle
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

  // Fetch Member Projects via getAllProjects API endpoint
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await projectApi.getAllProjects({
        search: searchKeyword,
        status: filterStatus !== 'ALL' ? (filterStatus as ProjectStatus) : undefined,
      });
      setProjects(data || []);
    } catch (err: any) {
      console.error('Error fetching member projects:', err);
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
      showToast(`Successfully updated project #${projectId}!`, 'success');
    } else {
      await projectApi.createProject(data);
      showToast('Successfully created new project!', 'success');
    }
    await fetchProjects();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans relative">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <FolderKanban size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Joined Projects</h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                List of workspace projects you are currently participating in or managing
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <button
            onClick={fetchProjects}
            className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
            title="Refresh projects list"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin text-blue-600' : ''} />
          </button>

          <button
            onClick={() => {
              setProjectToEdit(null);
              setIsFormModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all hover:shadow-md"
          >
            <Plus size={18} />
            <span>Create New Project</span>
          </button>
        </div>
      </div>

      {/* Toolbar & Search/Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
            <Search size={16} />
          </span>
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="Search projects by name..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-900 text-xs rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
          />
          {searchKeyword && (
            <button
              onClick={() => setSearchKeyword('')}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Filter size={15} className="text-slate-400" />
          <span className="text-xs font-semibold text-slate-600 shrink-0">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 rounded-xl px-3 py-2 font-bold outline-none cursor-pointer focus:border-blue-600 transition-colors"
          >
            <option value="ALL">All Statuses</option>
            <option value="PLANNING">PLANNING</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="ON_HOLD">ON_HOLD</option>
          </select>
        </div>
      </div>

      {/* Skeleton Loading State */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex justify-between items-center">
                <div className="w-24 h-6 bg-slate-200 rounded-full animate-skeleton" />
                <div className="w-16 h-6 bg-slate-200 rounded-md animate-skeleton" />
              </div>
              <div className="w-3/4 h-5 bg-slate-200 rounded animate-skeleton" />
              <div className="w-full h-10 bg-slate-100 rounded animate-skeleton" />
              <div className="flex justify-between pt-2 border-t border-slate-100">
                <div className="w-32 h-4 bg-slate-200 rounded animate-skeleton" />
                <div className="w-16 h-4 bg-slate-200 rounded animate-skeleton" />
              </div>
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        /* Empty State */
        <div className="bg-white p-12 sm:p-16 rounded-2xl border border-slate-200 text-center shadow-2xs space-y-4">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
            <Inbox size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {searchKeyword || filterStatus !== 'ALL'
                ? 'No projects found matching the filter'
                : 'You have not joined any projects yet'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
              {searchKeyword || filterStatus !== 'ALL'
                ? 'Please try searching with a different keyword or reset filters.'
                : 'Click "Create New Project" to create your first project, or contact your team manager for an invitation link.'}
            </p>
          </div>

          <div className="pt-2">
            {searchKeyword || filterStatus !== 'ALL' ? (
              <button
                onClick={() => {
                  setSearchKeyword('');
                  setFilterStatus('ALL');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-blue-600 text-xs font-bold rounded-xl border border-slate-200 transition-colors"
              >
                Reset all filters
              </button>
            ) : (
              <button
                onClick={() => {
                  setProjectToEdit(null);
                  setIsFormModalOpen(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5"
              >
                <Plus size={16} />
                <span>Create New Project</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Project Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onCardClick={(projectId) => navigate(`/projects/${projectId}`)}
              onEditClick={(proj) => {
                setProjectToEdit(proj);
                setIsFormModalOpen(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Project Form Modal (Create / Edit) */}
      <ProjectFormModal
        isOpen={isFormModalOpen}
        projectToEdit={projectToEdit}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-3 text-xs font-bold transition-all animate-in fade-in slide-in-from-bottom-5 duration-200 ${
            toast.type === 'success'
              ? 'bg-emerald-800 text-white border-emerald-900'
              : 'bg-red-800 text-white border-red-900'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 p-1 hover:bg-white/20 rounded-lg">
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};
