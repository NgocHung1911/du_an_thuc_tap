import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban, Plus, RefreshCw, Search, Inbox, CheckCircle2, AlertCircle, X,
  Filter, Eye, Edit3, Trash2, ChevronLeft, ChevronRight, Calendar, Users, CheckSquare,
  Clock
} from 'lucide-react';
import { projectApi, ProjectDTO, ProjectRequest, ProjectStatus } from '../../services/projectApi';
import { ProjectFormModal } from '../../components/project/ProjectFormModal';
import { ProjectDeleteModal } from '../../components/project/ProjectDeleteModal';
import { useAuth } from '../../context/AuthContext';

const ITEMS_PER_PAGE = 20;

export const AdminProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Search & Filter state
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [projectToEdit, setProjectToEdit] = useState<ProjectDTO | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [projectToDelete, setProjectToDelete] = useState<ProjectDTO | null>(null);

  // Toast Notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch Projects from API with Search & Status Filters
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await projectApi.getAllProjects({
        search: searchKeyword,
        status: filterStatus !== 'ALL' ? (filterStatus as ProjectStatus) : undefined,
        all: true,
      });
      setProjects(data || []);
      setCurrentPage(1); // Reset page on fetch
    } catch (err: any) {
      console.error('Error fetching projects:', err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [searchKeyword, filterStatus]);

  // Handle Quick Status Change
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
      showToast(`Successfully updated project status to ${newStatus}!`, 'success');
    } catch (err: any) {
      console.error('Error changing project status:', err);
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, status: previousStatus } : p))
      );
      const msg = err.response?.data?.message || err.message || 'Failed to update project status!';
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

  // Handle Delete Confirm
  const handleDeleteConfirm = async (projectId: number) => {
    await projectApi.deleteProject(projectId);
    showToast(`Successfully deleted project #${projectId}!`, 'success');
    await fetchProjects();
  };

  // Statistics
  const stats = useMemo(() => {
    const total = projects.length;
    const inProgress = projects.filter((p) => p.status === 'IN_PROGRESS').length;
    const completed = projects.filter((p) => p.status === 'COMPLETED').length;
    const planning = projects.filter((p) => p.status === 'PLANNING').length;
    const onHold = projects.filter((p) => p.status === 'ON_HOLD').length;

    return { total, inProgress, completed, planning, onHold };
  }, [projects]);

  // Paginated data
  const totalPages = Math.ceil(projects.length / ITEMS_PER_PAGE) || 1;
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return projects.slice(start, start + ITEMS_PER_PAGE);
  }, [projects, currentPage]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <FolderKanban size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Projects Management</h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Manage all system projects, monitor progress, and update status
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <button
            onClick={fetchProjects}
            className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
            title="Refresh list"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin text-blue-600' : ''} />
          </button>

          <button
            onClick={() => {
              setProjectToEdit(null);
              setIsFormModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all"
          >
            <Plus size={18} />
            <span>Create New Project</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase text-slate-400">Total Projects</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{stats.total}</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <FolderKanban size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase text-slate-400">In Progress</p>
            <p className="text-2xl font-extrabold text-blue-600 mt-0.5">{stats.inProgress}</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Clock size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase text-slate-400">Completed</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-0.5">{stats.completed}</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase text-slate-400">Planning / On Hold</p>
            <p className="text-2xl font-extrabold text-amber-600 mt-0.5">{stats.planning + stats.onHold}</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Filter size={20} />
          </div>
        </div>
      </div>

      {/* Toolbar & Search/Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        {/* Search Input */}
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

        {/* Status Filter */}
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

      {/* Projects List View */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
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
                : 'No projects available in the system'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
              {searchKeyword || filterStatus !== 'ALL'
                ? 'Please try searching with another keyword or reset filters.'
                : 'Click "Create New Project" to create your first project.'}
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
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5"
              >
                <Plus size={16} />
                <span>Create New Project</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Project Table List */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">ID</th>
                  <th className="py-3.5 px-4">Project Name & Description</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Timeline</th>
                  <th className="py-3.5 px-4">Members & Tasks</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-500">
                      #{project.id}
                    </td>

                    {/* Name & Description */}
                    <td className="py-3.5 px-4 max-w-xs sm:max-w-md">
                      <button
                        onClick={() => navigate(`/admin/projects/${project.id}`)}
                        className="font-bold text-slate-900 hover:text-blue-600 transition-colors text-left line-clamp-1 hover:underline"
                      >
                        {project.name}
                      </button>
                      {project.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {project.description}
                        </p>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <select
                        value={project.status || 'PLANNING'}
                        onChange={(e) => handleStatusChange(project.id, e.target.value as ProjectStatus)}
                        className={`text-[11px] font-bold rounded-xl px-3 py-1.5 border outline-none cursor-pointer transition-all shadow-2xs ${
                          project.status === 'IN_PROGRESS'
                            ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                            : project.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : project.status === 'PLANNING'
                            ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        <option value="PLANNING" className="bg-white text-amber-700 font-semibold">PLANNING</option>
                        <option value="IN_PROGRESS" className="bg-white text-blue-700 font-semibold">IN_PROGRESS</option>
                        <option value="COMPLETED" className="bg-white text-emerald-700 font-semibold">COMPLETED</option>
                        <option value="ON_HOLD" className="bg-white text-slate-700 font-semibold">ON_HOLD</option>
                      </select>
                    </td>

                    {/* Dates */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                        <Calendar size={13} className="text-slate-400 shrink-0" />
                        <span>{project.startDate || 'N/A'}</span>
                        <span className="text-slate-400">→</span>
                        <span>{project.endDate || 'N/A'}</span>
                      </div>
                    </td>

                    {/* Members & Tasks */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-slate-600" title="Members">
                          <Users size={14} className="text-slate-400" />
                          <span className="font-semibold">{project.members?.length || 0}</span>
                        </div>
                        {project.taskCount !== undefined && (
                          <div className="flex items-center gap-1 text-slate-600" title="Tasks">
                            <CheckSquare size={14} className="text-slate-400" />
                            <span className="font-semibold">{project.taskCount}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/admin/projects/${project.id}`)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setProjectToEdit(project);
                            setIsFormModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit project"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setProjectToDelete(project);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete project"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-slate-500">
              Showing <span className="font-bold text-slate-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
              <span className="font-bold text-slate-900">{Math.min(currentPage * ITEMS_PER_PAGE, projects.length)}</span> of{' '}
              <span className="font-bold text-slate-900">{projects.length}</span> projects (20 items / page)
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl disabled:opacity-40 disabled:hover:bg-white hover:bg-slate-100 transition-all font-semibold flex items-center gap-1 shadow-2xs"
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-1 px-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-xl font-bold text-xs transition-all ${
                      currentPage === page
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl disabled:opacity-40 disabled:hover:bg-white hover:bg-slate-100 transition-all font-semibold flex items-center gap-1 shadow-2xs"
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Form Modal (Create / Edit) */}
      <ProjectFormModal
        isOpen={isFormModalOpen}
        projectToEdit={projectToEdit}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
      />

      {/* Project Delete Modal */}
      <ProjectDeleteModal
        isOpen={isDeleteModalOpen}
        project={projectToDelete}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
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


