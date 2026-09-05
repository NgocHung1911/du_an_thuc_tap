import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckSquare, Clock, AlertCircle, Search, Filter, RefreshCw,
  Folder, CheckCircle2, Layers, ChevronDown, ChevronRight, Eye,
  AlertTriangle, Inbox
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { taskApi, TaskDTO, TaskStatus, TaskPriority } from '../../services/taskApi';
import { TaskDetailModal } from '../../components/project/TaskDetailModal';

const STATUS_COLUMNS: {
  key: TaskStatus;
  title: string;
  badgeBg: string;
  badgeText: string;
  columnBg: string;
  borderColor: string;
}[] = [
  {
    key: 'TODO',
    title: 'TO DO',
    badgeBg: 'bg-[#DFE1E6]',
    badgeText: 'text-[#42526E]',
    columnBg: 'bg-[#F4F5F7]',
    borderColor: 'border-[#DFE1E6]',
  },
  {
    key: 'DOING',
    title: 'IN PROGRESS',
    badgeBg: 'bg-[#DEEBFF]',
    badgeText: 'text-[#0052CC]',
    columnBg: 'bg-[#F0F5FF]',
    borderColor: 'border-[#B3D4FF]',
  },
  {
    key: 'REVIEW',
    title: 'REVIEW',
    badgeBg: 'bg-[#EAE6FF]',
    badgeText: 'text-[#403294]',
    columnBg: 'bg-[#F8F6FF]',
    borderColor: 'border-[#C0B6F2]',
  },
  {
    key: 'DONE',
    title: 'DONE',
    badgeBg: 'bg-[#E3FCEF]',
    badgeText: 'text-[#006644]',
    columnBg: 'bg-[#F3FDF7]',
    borderColor: 'border-[#ABF5D1]',
  },
];

interface ProjectGroup {
  projectId: number | string;
  projectName: string;
  projectDescription?: string;
  tasks: TaskDTO[];
}

export const MemberMyTasksPage: React.FC = () => {
  const { user } = useAuth();

  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');

  // Expanded states per project
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

  // Task Detail Modal State
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<TaskDTO | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  // Toast Notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch tasks from API
  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const allTasks = await taskApi.getAllTasks();
      setTasks(allTasks || []);
    } catch (err: any) {
      console.error('Error loading tasks:', err);
      setError('Failed to load tasks from server. Please check your backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Filter tasks assigned to current user
  const myAssignedTasks = useMemo(() => {
    if (!tasks || !user) return [];
    return tasks.filter((task) => {
      const assignedName = task.assignedUser?.username || task.userFullName;
      const assignedEmail = task.assignedUser?.email;

      const isAssigned =
        (assignedName && user.username && assignedName.toLowerCase() === user.username.toLowerCase()) ||
        (assignedEmail && user.email && assignedEmail.toLowerCase() === user.email.toLowerCase());

      return Boolean(isAssigned);
    });
  }, [tasks, user]);

  // Apply Search and Project filters
  const filteredTasks = useMemo(() => {
    const query = searchKeyword.trim().toLowerCase();
    return myAssignedTasks.filter((task) => {
      const pName = (task.projectName || task.project?.name || '').toLowerCase();
      const tTitle = (task.title || '').toLowerCase();

      const matchesSearch =
        !query ||
        tTitle.includes(query) ||
        pName.includes(query);

      const projId = task.projectId || task.project?.id;
      const matchesProject =
        selectedProjectId === 'ALL' || (projId && String(projId) === String(selectedProjectId));

      return matchesSearch && matchesProject;
    });
  }, [myAssignedTasks, searchKeyword, selectedProjectId]);

  // Group filtered tasks by Project
  const projectGroups = useMemo(() => {
    const map = new Map<string, ProjectGroup>();

    filteredTasks.forEach((task) => {
      const pId = task.projectId || task.project?.id || 'unassigned';
      const pKey = String(pId);
      const pName = task.projectName || task.project?.name || 'Unassigned Project';
      const pDesc = task.project?.description;

      if (!map.has(pKey)) {
        map.set(pKey, {
          projectId: pId,
          projectName: pName,
          projectDescription: pDesc,
          tasks: [],
        });
      }
      map.get(pKey)!.tasks.push(task);
    });

    return Array.from(map.values());
  }, [filteredTasks]);

  // Unique list of projects assigned to the user for the dropdown filter
  const availableProjects = useMemo(() => {
    const map = new Map<string, string>();
    myAssignedTasks.forEach((t) => {
      const id = t.projectId || t.project?.id;
      const name = t.projectName || t.project?.name || `Project #${id}`;
      if (id) {
        map.set(String(id), name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [myAssignedTasks]);

  // Toggle project group expand/collapse
  const toggleProjectCollapse = (pKey: string) => {
    setExpandedProjects((prev) => ({ ...prev, [pKey]: !prev[pKey] }));
  };

  // Handle status update
  const handleStatusChange = async (taskId: number, newStatus: TaskStatus, fromModal = false) => {
    const currentTask = tasks.find((t) => t.id === taskId);
    if (!currentTask || currentTask.status === newStatus) return;

    const previousStatus = currentTask.status;

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    if (selectedTaskDetail && selectedTaskDetail.id === taskId) {
      setSelectedTaskDetail((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    try {
      await taskApi.updateTaskStatus(taskId, newStatus);
      showToast(`Task status updated to ${newStatus}`, 'success');
      if (fromModal) {
        setIsDetailModalOpen(false);
        setSelectedTaskDetail(null);
      }
    } catch (err: any) {
      console.error('Failed to update status:', err);
      showToast('Failed to update task status', 'error');
      // Revert status
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: previousStatus } : t))
      );
      if (selectedTaskDetail && selectedTaskDetail.id === taskId) {
        setSelectedTaskDetail((prev) => (prev ? { ...prev, status: previousStatus } : null));
      }
    }
  };

  // Format date helper
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  // Priority styling helper
  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'HIGH':
        return <span className="bg-red-50 text-red-700 text-[11px] font-semibold px-2 py-0.5 rounded border border-red-200">HIGH</span>;
      case 'MEDIUM':
        return <span className="bg-amber-50 text-amber-700 text-[11px] font-semibold px-2 py-0.5 rounded border border-amber-200">MEDIUM</span>;
      case 'LOW':
      default:
        return <span className="bg-slate-50 text-slate-600 text-[11px] font-semibold px-2 py-0.5 rounded border border-slate-200">LOW</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium flex items-center gap-2 transition-all duration-300 ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#DFE1E6] pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172B4D] flex items-center gap-2">
            📌 My Tasks
          </h1>
          <p className="text-sm text-[#5E6C84] mt-0.5">
            Tasks assigned to you categorized by Project & Status
          </p>
        </div>
        <button
          onClick={fetchTasks}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#172B4D] bg-white border border-[#DFE1E6] rounded-md hover:bg-[#F4F5F7] shadow-xs transition-colors self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-[#DFE1E6] shadow-xs">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B778C]" />
          <input
            type="text"
            placeholder="Search by task title or project name..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-[#DFE1E6] rounded-md focus:outline-none focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC] bg-[#FAFBFC]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Project Filter */}
          <div className="flex items-center gap-1.5 text-xs text-[#5E6C84]">
            <Filter size={14} />
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-[#DFE1E6] rounded-md focus:outline-none focus:border-[#0052CC] bg-white text-[#172B4D] font-medium"
            >
              <option value="ALL">All Projects ({availableProjects.length})</option>
              {availableProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between text-red-800 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchTasks}
            className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading ? (
        <div className="space-y-6 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white p-4 rounded-lg border border-[#DFE1E6] space-y-4">
              <div className="h-6 bg-[#EBECF0] rounded w-1/4"></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-32 bg-[#F4F5F7] rounded"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : projectGroups.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-lg border border-[#DFE1E6] p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-[#F4F5F7] text-[#5E6C84] rounded-full flex items-center justify-center mx-auto">
            <Inbox size={24} />
          </div>
          <h3 className="text-base font-semibold text-[#172B4D]">No Tasks Found</h3>
          <p className="text-xs text-[#5E6C84] max-w-md mx-auto">
            {myAssignedTasks.length === 0
              ? "You currently have no tasks assigned to you across any project."
              : "No tasks match your search or filter criteria. Try resetting filters."}
          </p>
          {(searchKeyword || selectedProjectId !== 'ALL') && (
            <button
              onClick={() => {
                setSearchKeyword('');
                setSelectedProjectId('ALL');
              }}
              className="px-3 py-1.5 text-xs font-medium text-[#0052CC] hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        /* Render Project Groups */
        <div className="space-y-8">
          {projectGroups.map((group) => {
            const pKey = String(group.projectId);
            const isExpanded = Boolean(expandedProjects[pKey]) || Boolean(searchKeyword.trim());

            return (
              <div
                key={pKey}
                className="bg-white border border-[#DFE1E6] rounded-xl shadow-xs overflow-hidden transition-all duration-200"
              >
                {/* Project Header Card */}
                <div
                  onClick={() => toggleProjectCollapse(pKey)}
                  className="bg-[#FAFBFC] p-4 border-b border-[#EBECF0] flex items-center justify-between cursor-pointer select-none hover:bg-[#F4F5F7] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <button className="text-[#5E6C84] hover:text-[#172B4D]">
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>

                    <div className="w-8 h-8 rounded-lg bg-[#DEEBFF] text-[#0052CC] flex items-center justify-center font-bold">
                      <Folder size={18} />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-[#172B4D]">
                          {group.projectName}
                        </h2>
                        <span className="bg-[#DFE1E6] text-[#172B4D] px-2 py-0.5 rounded-full text-xs font-bold">
                          {group.tasks.length} {group.tasks.length === 1 ? 'task' : 'tasks'}
                        </span>
                      </div>
                      {group.projectDescription && (
                        <p className="text-xs text-[#5E6C84] line-clamp-1 mt-0.5">
                          {group.projectDescription}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Project Kanban Status Columns */}
                {isExpanded && (
                  <div className="p-4 bg-[#FAFBFC]">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {STATUS_COLUMNS.map((col) => {
                        const colTasks = group.tasks.filter((t) => t.status === col.key);

                        return (
                          <div
                            key={col.key}
                            className={`${col.columnBg} p-3.5 rounded-lg border ${col.borderColor} flex flex-col space-y-3 min-h-[160px]`}
                          >
                            {/* Column Header */}
                            <div className="flex items-center justify-between pb-2 border-b border-black/5">
                              <span className="font-semibold text-xs text-[#42526E] uppercase tracking-wider flex items-center gap-1.5">
                                {col.title}
                              </span>
                              <span className={`${col.badgeBg} ${col.badgeText} px-2 py-0.5 rounded-full text-xs font-bold`}>
                                {colTasks.length}
                              </span>
                            </div>

                            {/* Task Cards List */}
                            <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[420px] pr-0.5">
                              {colTasks.length === 0 ? (
                                <div className="py-6 text-center text-xs text-[#6B778C] border border-dashed border-gray-200 rounded-md bg-white/50">
                                  No tasks in {col.title}
                                </div>
                              ) : (
                                colTasks.map((task) => (
                                  <div
                                    key={task.id}
                                    className="bg-white p-3.5 rounded-lg border border-[#DFE1E6] shadow-xs hover:shadow-md hover:border-[#B3D4FF] transition-all space-y-2.5 group relative"
                                  >
                                    {/* Task ID & Priority */}
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-mono font-bold text-[#0052CC]">
                                        #TASK-{task.id}
                                      </span>
                                      {getPriorityBadge(task.priority)}
                                    </div>

                                    {/* Task Title */}
                                    <h4
                                      onClick={() => {
                                        setSelectedTaskDetail(task);
                                        setIsDetailModalOpen(true);
                                      }}
                                      className="text-xs font-semibold text-[#172B4D] hover:text-[#0052CC] cursor-pointer line-clamp-2 leading-relaxed"
                                    >
                                      {task.title}
                                    </h4>

                                    {/* Task Description Preview */}
                                    {task.description && (
                                      <p className="text-[11px] text-[#5E6C84] line-clamp-2 leading-normal">
                                        {task.description}
                                      </p>
                                    )}

                                    {/* Footer Info & Actions */}
                                    <div className="pt-2 border-t border-[#EBECF0] flex items-center justify-between gap-1 text-[11px] text-[#5E6C84]">
                                      {/* Deadline */}
                                      <div className="flex items-center gap-1 font-medium">
                                        <Clock size={12} className="text-[#6B778C]" />
                                        <span>{formatDate(task.deadline) || 'No date'}</span>
                                      </div>

                                      {/* Change Status Dropdown */}
                                      <select
                                        value={task.status}
                                        onChange={(e) =>
                                          handleStatusChange(task.id, e.target.value as TaskStatus)
                                        }
                                        className="text-[11px] font-semibold py-0.5 px-1.5 rounded border border-[#DFE1E6] bg-white text-[#172B4D] focus:outline-none focus:border-[#0052CC] hover:bg-[#F4F5F7] cursor-pointer"
                                      >
                                        <option value="TODO">TO DO</option>
                                        <option value="DOING">IN PROGRESS</option>
                                        <option value="REVIEW">REVIEW</option>
                                        <option value="DONE">DONE</option>
                                      </select>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTaskDetail}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedTaskDetail(null);
        }}
        isAdmin={true}
        onStatusChange={(taskId, newStatus) => handleStatusChange(taskId, newStatus, true)}
      />
    </div>
  );
};
