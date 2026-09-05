import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Search, Filter, Layers, Plus, ArrowLeft, RefreshCw, AlertCircle, Columns, List,
  CheckCircle2, X, Trash2, AlertTriangle, Inbox, UserPlus, Users
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { projectApi, ProjectDTO } from '../../services/projectApi';
import { taskApi, TaskDTO, TaskStatus, TaskPriority, UserDTO } from '../../services/taskApi';
import { ProjectBoardView } from '../../components/project/ProjectBoardView';
import { ProjectListView } from '../../components/project/ProjectListView';
import { TaskDetailModal } from '../../components/project/TaskDetailModal';
import { InviteMemberModal } from '../../components/project/InviteMemberModal';
import { ProjectMembersModal } from '../../components/project/ProjectMembersModal';

type ViewTab = 'Board' | 'List';



export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const projectId = Number(id);
  const { user } = useAuth();

  const [project, setProject] = useState<ProjectDTO | null>(null);
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [projectMembers, setProjectMembers] = useState<UserDTO[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState<boolean>(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const currentUserMember = useMemo(() => {
    if (!user || !projectMembers) return null;
    return projectMembers.find(
      (m) =>
        (m.username && m.username.toLowerCase() === user.username?.toLowerCase()) ||
        (m.email && user.email && m.email.toLowerCase() === user.email?.toLowerCase())
    );
  }, [projectMembers, user]);

  const currentUserProjectRole: 'OWNER' | 'ADMIN' | 'MEMBER' = useMemo(() => {
    if (currentUserMember?.projectRole) {
      return currentUserMember.projectRole;
    }
    return 'MEMBER';
  }, [currentUserMember]);

  const canManageTasks = currentUserProjectRole === 'OWNER' || currentUserProjectRole === 'ADMIN';
  const canManageMembers = currentUserProjectRole === 'OWNER' || currentUserProjectRole === 'ADMIN';

  // Update tab title when project name is available
  useEffect(() => {
    if (project?.name) {
      document.title = project.name;
    }
  }, [project]);

  // Toast Notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Task Detail Modal State
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<TaskDTO | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  // Delete Confirmation Modal State
  const [taskToDelete, setTaskToDelete] = useState<TaskDTO | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  // Active View Tab (Default: 'Board', ONLY 2 tabs: Board & List)
  const [activeTab, setActiveTab] = useState<ViewTab>('Board');

  // Search & Filter state
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Quick Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>('TODO');
  const [taskForm, setTaskForm] = useState<{
    title: string;
    description: string;
    deadline: string;
    priority: TaskPriority;
    userId: number | null;
  }>({
    title: '',
    description: '',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'MEDIUM',
    userId: null,
  });
  const [creating, setCreating] = useState<boolean>(false);

  // Show Toast notification helper
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch Project & Tasks & Members
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (projectId) {
        // Fetch Project details
        try {
          const projData = await projectApi.getProjectById(projectId);
          setProject(projData);
        } catch {
          setProject({
            id: projectId,
            name: `Dự án #${projectId}`,
            description: 'Chi tiết quản lý dự án và phân công nhiệm vụ.',
            status: 'IN_PROGRESS',
          });
        }

        // Fetch Tasks from backend API
        try {
          const taskList = await taskApi.getTasksByProjectId(projectId);
          setTasks(taskList || []);
        } catch {
          setTasks([]);
        }

        // Fetch Project Members from backend API
        try {
          const members = await projectApi.getProjectMembers(projectId);
          setProjectMembers(members || []);
        } catch {
          setProjectMembers([]);
        }
      }
    } catch (err: any) {
      console.error('Lỗi khi tải thông tin dự án:', err);
      setError('Không thể tải dữ liệu từ máy chủ.');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMemberInvited = (newMember: UserDTO) => {
    setProjectMembers((prev) => [...prev.filter((m) => m.id !== newMember.id), newMember]);
    showToast(`Đã thêm thành viên ${newMember.username} vào dự án thành công!`, 'success');
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

  // Handle task click to open Task Detail Modal
  const handleTaskClick = (task: TaskDTO) => {
    setSelectedTaskDetail(task);
    setIsDetailModalOpen(true);
  };

  // Handle status update with Optimistic update & Real-time Sync
  const handleStatusChange = async (taskId: number, newStatus: TaskStatus, fromModal = false) => {
    const currentTask = tasks.find((t) => t.id === taskId);
    if (!currentTask || currentTask.status === newStatus) return;

    const previousStatus = currentTask.status;
    const snapshotTasks = [...tasks];

    // Optimistic State Update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    if (selectedTaskDetail && selectedTaskDetail.id === taskId) {
      setSelectedTaskDetail((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    try {
      const updatedTask = await taskApi.updateTaskStatus(taskId, newStatus);
      if (updatedTask && updatedTask.id) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, ...updatedTask } : t))
        );
      }
      showToast(`Đã chuyển trạng thái công việc sang ${newStatus}`, 'success');

      // Requirement 3: Auto close modal ONLY when API succeeds
      if (fromModal) {
        setIsDetailModalOpen(false);
        setSelectedTaskDetail(null);
      }
    } catch (err: any) {
      console.error('API error updating status:', err);
      // Revert optimistic state
      setTasks(snapshotTasks);
      if (selectedTaskDetail && selectedTaskDetail.id === taskId) {
        setSelectedTaskDetail((prev) => (prev ? { ...prev, status: previousStatus } : null));
      }
      const errMsg = err.response?.data?.message || err.message || 'Không thể thay đổi trạng thái công việc!';
      showToast(errMsg, 'error');
      // DO NOT close modal if API failed!
    }
  };

  // Handle Priority update with Optimistic update & Real-time Sync
  const handlePriorityChange = async (taskId: number, newPriority: TaskPriority) => {
    const currentTask = tasks.find((t) => t.id === taskId);
    if (!currentTask || currentTask.priority === newPriority) return;

    const previousPriority = currentTask.priority;
    const snapshotTasks = [...tasks];

    // Optimistic State Update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, priority: newPriority } : t))
    );

    if (selectedTaskDetail && selectedTaskDetail.id === taskId) {
      setSelectedTaskDetail((prev) => (prev ? { ...prev, priority: newPriority } : null));
    }

    try {
      const updatedTask = await taskApi.updateTaskPriority(taskId, newPriority);
      if (updatedTask && updatedTask.id) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, ...updatedTask } : t))
        );
      }
      showToast(`Đã cập nhật mức độ ưu tiên sang ${newPriority}`, 'success');
    } catch (err: any) {
      console.error('API error updating priority:', err);
      setTasks(snapshotTasks);
      if (selectedTaskDetail && selectedTaskDetail.id === taskId) {
        setSelectedTaskDetail((prev) => (prev ? { ...prev, priority: previousPriority } : null));
      }
      const errMsg = err.response?.data?.message || err.message || 'Không thể thay đổi mức độ ưu tiên!';
      showToast(errMsg, 'error');
    }
  };

  // Handle Description & Title edit inside Task Detail Modal
  const handleUpdateDescription = async (taskId: number, newDescription: string, newTitle: string) => {
    const currentTask = tasks.find((t) => t.id === taskId);
    if (!currentTask) return;

    const previousTitle = currentTask.title;
    const previousDesc = currentTask.description;
    const nowIso = new Date().toISOString();

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, title: newTitle, description: newDescription, updatedAt: nowIso } : t
      )
    );
    if (selectedTaskDetail && selectedTaskDetail.id === taskId) {
      setSelectedTaskDetail((prev) =>
        prev ? { ...prev, title: newTitle, description: newDescription, updatedAt: nowIso } : null
      );
    }

    try {
      const updatedTask = await taskApi.updateTask(taskId, {
        title: newTitle,
        description: newDescription,
        deadline: selectedTaskDetail?.deadline || new Date().toISOString().split('T')[0],
        priority: selectedTaskDetail?.priority || 'MEDIUM',
        status: selectedTaskDetail?.status || 'TODO',
        projectId: projectId,
      });
      if (updatedTask && updatedTask.id) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, ...updatedTask } : t))
        );
      }
      showToast(`Đã lưu nội dung công việc thành công!`, 'success');
    } catch (err: any) {
      console.error('API error updating description:', err);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, title: previousTitle, description: previousDesc } : t
        )
      );
      if (selectedTaskDetail && selectedTaskDetail.id === taskId) {
        setSelectedTaskDetail((prev) =>
          prev ? { ...prev, title: previousTitle, description: previousDesc } : null
        );
      }
      const errMsg = err.response?.data?.message || err.message || 'Không thể lưu nội dung công việc!';
      showToast(errMsg, 'error');
    }
  };

  // Filter tasks based on Search Keyword, Selected Assignee, Priority Filter, Status Filter
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Keyword search
      if (searchKeyword.trim()) {
        const kw = searchKeyword.toLowerCase().trim();
        const matchesTitle = task.title.toLowerCase().includes(kw);
        const matchesKey = `to-${task.id}`.includes(kw) || `proj-${task.id}`.includes(kw);
        const matchesDesc = task.description?.toLowerCase().includes(kw);
        if (!matchesTitle && !matchesKey && !matchesDesc) return false;
      }

      // Assignee Avatar Filter
      if (selectedAssignee) {
        if (!task.assignedUser) return false;
        const uName = task.assignedUser.username.toLowerCase();
        const sel = selectedAssignee.toLowerCase();
        const initials = task.assignedUser.username
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toLowerCase();

        if (!uName.includes(sel) && !initials.includes(sel) && task.assignedUser.initials?.toLowerCase() !== sel) {
          return false;
        }
      }

      // Status Filter
      if (filterStatus !== 'ALL' && task.status !== filterStatus) {
        return false;
      }

      // Priority Filter
      if (filterPriority !== 'ALL' && task.priority !== filterPriority) {
        return false;
      }

      return true;
    });
  }, [tasks, searchKeyword, selectedAssignee, filterStatus, filterPriority]);

  // Handle Assignee change with Optimistic update & Real-time Sync
  const handleAssigneeChange = async (taskId: number, newUserId: number | null) => {
    const currentTask = tasks.find((t) => t.id === taskId);
    if (!currentTask) return;

    const assignedMember = newUserId ? projectMembers.find((m) => m.id === newUserId) : undefined;
    const previousUser = currentTask.assignedUser;
    const previousUserId = currentTask.userId;
    const snapshotTasks = [...tasks];

    // Optimistic State Update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
            ...t,
            userId: newUserId || undefined,
            assignedUser: assignedMember ? assignedMember : undefined,
            userFullName: assignedMember ? assignedMember.username : undefined,
          }
          : t
      )
    );

    if (selectedTaskDetail && selectedTaskDetail.id === taskId) {
      setSelectedTaskDetail((prev) =>
        prev
          ? {
            ...prev,
            userId: newUserId || undefined,
            assignedUser: assignedMember ? assignedMember : undefined,
            userFullName: assignedMember ? assignedMember.username : undefined,
          }
          : null
      );
    }

    try {
      const updatedTask = await taskApi.assignTaskToUser(taskId, newUserId);
      if (updatedTask && updatedTask.id) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, ...updatedTask } : t))
        );
      }
      showToast(
        newUserId
          ? `Đã gán người thực hiện: ${assignedMember?.username || 'Thành viên'}`
          : 'Đã bỏ gán người thực hiện công việc',
        'success'
      );
    } catch (err: any) {
      console.warn('Lỗi API gán người thực hiện:', err);
      const errMsg = err.response?.data?.message || 'Lỗi máy chủ khi gán người thực hiện!';
      setTasks(snapshotTasks);
      if (selectedTaskDetail && selectedTaskDetail.id === taskId) {
        setSelectedTaskDetail((prev) =>
          prev
            ? {
              ...prev,
              userId: previousUserId,
              assignedUser: previousUser,
              userFullName: previousUser?.username,
            }
            : null
        );
      }
      showToast(errMsg, 'error');
    }
  };

  // Open Quick Create Modal
  const handleOpenQuickCreate = (initialStatus: TaskStatus = 'TODO') => {
    setNewTaskStatus(initialStatus);
    setTaskForm({
      title: '',
      description: '',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: 'MEDIUM',
      userId: null,
    });
    setIsCreateModalOpen(true);
  };

  // Submit Create Task
  const handleCreateTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;

    setCreating(true);
    try {
      const createdTask = await taskApi.createTask({
        title: taskForm.title.trim(),
        description: taskForm.description,
        deadline: taskForm.deadline,
        priority: taskForm.priority,
        status: newTaskStatus,
        projectId: projectId,
        userId: taskForm.userId,
      });

      if (createdTask && createdTask.id) {
        setTasks((prev) => [createdTask, ...prev]);
      } else {
        await fetchData();
      }
      showToast('Đã tạo task mới thành công!', 'success');
    } catch (err: any) {
      console.error('Lỗi khi tạo task:', err);
      const errMsg = err.response?.data?.message || 'Không thể kết nối máy chủ để tạo task!';
      showToast(errMsg, 'error');
    } finally {
      setCreating(false);
      setIsCreateModalOpen(false);
    }
  };

  // Trigger Delete Confirmation Modal
  const handleRequestDelete = (taskId: number) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setTaskToDelete(task);
    }
  };

  // Confirm Delete Handler
  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    const taskId = taskToDelete.id;
    setDeleting(true);

    // Optimistically remove from state
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (selectedTaskDetail && selectedTaskDetail.id === taskId) {
      setIsDetailModalOpen(false);
      setSelectedTaskDetail(null);
    }

    try {
      await taskApi.deleteTask(taskId);
      showToast(`Đã xóa công việc thành công!`, 'success');
    } catch (err) {
      showToast(`Đã xóa công việc khỏi giao diện!`, 'success');
    } finally {
      setDeleting(false);
      setTaskToDelete(null);
    }
  };

  // Calculate Task Statistics Overview
  const taskStats = useMemo(() => {
    const total = tasks.length;
    const todo = tasks.filter((t) => t.status === 'TODO').length;
    const doing = tasks.filter((t) => t.status === 'DOING').length;
    const review = tasks.filter((t) => t.status === 'REVIEW').length;
    const done = tasks.filter((t) => t.status === 'DONE').length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdue = tasks.filter(
      (t) => t.deadline && t.status !== 'DONE' && new Date(t.deadline) < today
    ).length;

    return { total, todo, doing, review, done, overdue };
  }, [tasks]);

  const projectTitle = project?.name || `Dự án #${projectId || 1}`;

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto pb-10 font-sans relative">
      {/* Top Breadcrumb & Project Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded-xl border border-slate-200 transition-colors shrink-0 mt-0.5 sm:mt-0"
              title="Quay lại danh sách dự án"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${project?.status === 'COMPLETED'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : project?.status === 'IN_PROGRESS'
                        ? 'bg-sky-50 text-sky-700 border-sky-200'
                        : project?.status === 'ON_HOLD'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                >
                  {project?.status || 'PLANNING'}
                </span>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {projectTitle}
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                {project?.description || 'Task management and project assignments overview.'}
              </p>
            </div>

          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
            <button
              onClick={fetchData}
              className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
              title="Refresh data"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin text-blue-600' : ''} />
            </button>

            {/* Quick Action buttons */}
            <button
              type="button"
              onClick={() => setIsMembersModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 transition-colors"
              title="View and manage members"
            >
              <Users size={15} className="text-slate-500" />
              <span className="hidden sm:inline">Members ({projectMembers.length})</span>
            </button>

            {canManageMembers && (
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition-colors"
                title="Invite new member"
              >
                <UserPlus size={15} />
                <span>+ Invite</span>
              </button>
            )}

            {canManageTasks && (
              <button
                onClick={() => handleOpenQuickCreate('TODO')}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors"
              >
                <Plus size={18} />
                <span>Create Task</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* View Switcher Header (Board & List) */}
      <div className="border-b border-slate-200 bg-white rounded-t-2xl border-x px-4 pt-3 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('Board')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${activeTab === 'Board'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
          >
            <Columns size={15} />
            <span>Board View</span>
          </button>

          <button
            onClick={() => setActiveTab('List')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${activeTab === 'List'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
          >
            <List size={15} />
            <span>List View</span>
          </button>
        </div>
      </div>

      {/* Toolbar & Filter Bar */}
      <div className="bg-white p-4 rounded-b-2xl border-x border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        {/* Left: Search input & Member Avatars */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Board */}
          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
              <Search size={15} />
            </span>
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Search tasks (Name, ID)..."
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

          {/* Member Avatars Filter */}
          <div className="flex flex-wrap items-center gap-1.5 border-l border-slate-200 pl-3">
            <span className="text-xs font-semibold text-slate-500 mr-1 hidden lg:inline">
              Filter by member:
            </span>
            {projectMembers.length > 0 &&
              projectMembers.map((mem, idx) => {
                const initials = mem.username
                  ? mem.username.substring(0, 2).toUpperCase()
                  : 'MB';
                const isSelected = selectedAssignee === mem.username || selectedAssignee === initials;
                const colors = ['bg-blue-600', 'bg-red-500', 'bg-amber-500', 'bg-emerald-600', 'bg-purple-600'];
                const bgColor = colors[idx % colors.length];

                return (
                  <button
                    key={mem.id}
                    onClick={() =>
                      setSelectedAssignee((prev) => (prev === mem.username ? null : mem.username))
                    }
                    className={`w-7 h-7 rounded-full text-white text-[11px] font-bold flex items-center justify-center transition-transform ${bgColor} ${isSelected
                        ? 'ring-2 ring-blue-600 ring-offset-2 scale-110 shadow-md'
                        : 'hover:scale-105 opacity-90 hover:opacity-100'
                      }`}
                    title={`${mem.username} (${mem.email || 'Member'})`}
                  >
                    {initials}
                  </button>
                );
              })}

            {selectedAssignee && (
              <button
                onClick={() => setSelectedAssignee(null)}
                className="text-xs text-blue-600 hover:underline font-bold ml-1"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Right: Priority Filter & Reset Button */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600">Priority:</span>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 rounded-xl px-3 py-2 font-bold outline-none cursor-pointer focus:border-blue-600 transition-colors"
          >
            <option value="ALL">All Priorities</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>

          {(searchKeyword || selectedAssignee || filterPriority !== 'ALL') && (
            <button
              onClick={() => {
                setSearchKeyword('');
                setSelectedAssignee(null);
                setFilterPriority('ALL');
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 text-xs font-semibold transition-colors"
            >
              <Filter size={14} className="text-slate-400" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Views: Board View, List View, OR Empty State View */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((col) => (
            <div key={col} className="bg-slate-100/70 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="w-28 h-6 bg-slate-200 rounded-md animate-pulse" />
              <div className="space-y-2">
                <div className="w-full h-24 bg-white rounded-lg animate-pulse" />
                <div className="w-full h-24 bg-white rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        /* Empty State View */
        <div className="bg-white p-12 sm:p-16 rounded-2xl border border-slate-200 text-center shadow-2xs space-y-4">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
            <Inbox size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {searchKeyword || selectedAssignee || filterPriority !== 'ALL'
                ? 'No tasks found matching your filters'
                : 'This project currently has no tasks'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
              {searchKeyword || selectedAssignee || filterPriority !== 'ALL'
                ? 'Please try changing your search keywords or resetting the filters.'
                : canManageTasks
                  ? 'Click the "+ Create Task" button to create and assign the first task for this project.'
                  : 'No tasks have been created for this project yet. Please contact the project Owner or Admin.'}
            </p>
          </div>

          <div className="pt-2">
            {searchKeyword || selectedAssignee || filterPriority !== 'ALL' || filterStatus !== 'ALL' ? (
              <button
                onClick={() => {
                  setSearchKeyword('');
                  setSelectedAssignee(null);
                  setFilterPriority('ALL');
                  setFilterStatus('ALL');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-blue-600 text-xs font-bold rounded-xl border border-slate-200 transition-colors"
              >
                Reset filters
              </button>
            ) : canManageTasks ? (
              <button
                onClick={() => handleOpenQuickCreate('TODO')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5"
              >
                <Plus size={16} />
                <span>Create Task</span>
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <div>
          {activeTab === 'Board' ? (
            <ProjectBoardView
              tasks={filteredTasks}
              projectKey={`PROJ-${projectId || 1}`}
              projectMembers={projectMembers}
              isAdmin={canManageTasks}
              onTaskClick={handleTaskClick}
              onStatusChange={handleStatusChange}
              onPriorityChange={handlePriorityChange}
              onAssigneeChange={handleAssigneeChange}
              onDeleteTask={handleRequestDelete}
              onQuickCreate={handleOpenQuickCreate}
            />
          ) : (
            <ProjectListView
              tasks={filteredTasks}
              projectKey={`PROJ-${projectId || 1}`}
              projectMembers={projectMembers}
              isAdmin={canManageTasks}
              onTaskClick={handleTaskClick}
              onStatusChange={handleStatusChange}
              onPriorityChange={handlePriorityChange}
              onAssigneeChange={handleAssigneeChange}
              onDeleteTask={handleRequestDelete}
            />
          )}
        </div>
      )}

      {/* Task Detail View Modal (Jira Style) */}
      <TaskDetailModal
        task={selectedTaskDetail}
        isOpen={isDetailModalOpen}
        projectMembers={projectMembers}
        isAdmin={canManageTasks}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedTaskDetail(null);
        }}
        onStatusChange={handleStatusChange}
        onPriorityChange={handlePriorityChange}
        onAssigneeChange={handleAssigneeChange}
        onUpdateDescription={handleUpdateDescription}
        onDeleteTask={handleRequestDelete}
      />

      {/* Delete Confirmation Modal (Jira Style) */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#DFE1E6] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-red-50 border-b border-red-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base text-red-900">Xác Nhận Xóa Công Việc</h3>
                <p className="text-xs text-red-700">Thao tác này không thể hoàn tác!</p>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 text-sm text-[#172B4D] space-y-3">
              <p>
                Bạn có chắc chắn muốn xóa công việc{' '}
                <strong className="text-red-600 font-mono">
                  PROJ-{projectId || 1}-{taskToDelete.id}
                </strong>{' '}
                không?
              </p>
              <div className="p-3 bg-[#F4F5F7] rounded-xl border border-[#DFE1E6] text-xs font-medium text-[#172B4D]">
                "{taskToDelete.title}"
              </div>
            </div>

            {/* Modal Footer Buttons */}
            <div className="px-5 py-3.5 bg-[#F4F5F7] border-t border-[#DFE1E6] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setTaskToDelete(null)}
                disabled={deleting}
                className="px-4 py-2 bg-white hover:bg-gray-100 text-[#172B4D] border border-[#DFE1E6] text-xs font-semibold rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
              >
                {deleting ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                <span>Xóa Công Việc</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl border flex items-center gap-3 text-xs font-bold transition-all animate-in fade-in slide-in-from-bottom-5 duration-200 ${toast.type === 'success'
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

      {/* Quick Create Task Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#DFE1E6] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="px-5 py-4 bg-[#F4F5F7] border-b border-[#DFE1E6] flex items-center justify-between">
              <h3 className="font-bold text-base text-[#172B4D]">Tạo Công Việc Mới</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTaskSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#172B4D] mb-1">
                  Tiêu đề công việc <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nhập tên task..."
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DFE1E6] rounded-lg text-sm focus:outline-none focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#172B4D] mb-1">Trạng thái (Status)</label>
                  <select
                    value={newTaskStatus}
                    onChange={(e) => setNewTaskStatus(e.target.value as TaskStatus)}
                    className="w-full px-3 py-2 border border-[#DFE1E6] rounded-lg text-xs font-bold focus:outline-none focus:border-[#0052CC]"
                  >
                    <option value="TODO">TODO</option>
                    <option value="DOING">DOING</option>
                    <option value="REVIEW">REVIEW</option>
                    <option value="DONE">DONE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172B4D] mb-1">Độ ưu tiên (Priority)</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as TaskPriority })}
                    className="w-full px-3 py-2 border border-[#DFE1E6] rounded-lg text-xs font-bold focus:outline-none focus:border-[#0052CC]"
                  >
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172B4D] mb-1">Hạn chót</label>
                <input
                  type="date"
                  value={taskForm.deadline}
                  onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DFE1E6] rounded-lg text-xs focus:outline-none focus:border-[#0052CC]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172B4D] mb-1">Người thực hiện</label>
                <select
                  value={taskForm.userId || ''}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, userId: e.target.value ? Number(e.target.value) : null })
                  }
                  className="w-full px-3 py-2 border border-[#DFE1E6] rounded-lg text-xs font-medium focus:outline-none focus:border-[#0052CC]"
                >
                  <option value="">-- Chưa phân công --</option>
                  {projectMembers.map((mem) => (
                    <option key={mem.id} value={mem.id}>
                      {mem.username} ({mem.email || 'Member'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172B4D] mb-1">Mô tả công việc</label>
                <textarea
                  rows={3}
                  placeholder="Mô tả chi tiết nội dung task..."
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DFE1E6] rounded-lg text-xs focus:outline-none focus:border-[#0052CC]"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-[#DFE1E6] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-[#0052CC] hover:bg-[#0747A6] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
                >
                  {creating && <RefreshCw size={14} className="animate-spin" />}
                  <span>Tạo Task</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Mời Thành Viên Vào Dự Án */}
      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        projectId={projectId}
        existingMemberIds={projectMembers.map((m) => m.id)}
        onMemberInvited={handleMemberInvited}
      />

      {/* Modal Quản Lý Thành Viên & Phân Quyền */}
      <ProjectMembersModal
        isOpen={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
        projectId={projectId}
        members={projectMembers}
        currentUserRole={currentUserProjectRole}
        currentUserId={currentUserMember?.id}
        currentUsername={user?.username}
        onUpdateMemberRoleSuccess={(userId, newRole) => {
          setProjectMembers((prev) =>
            prev.map((m) => (m.id === userId ? { ...m, projectRole: newRole } : m))
          );
        }}
        onRemoveMemberSuccess={(userId) => {
          setProjectMembers((prev) => prev.filter((m) => m.id !== userId));
        }}
        onOpenInvite={() => setIsInviteModalOpen(true)}
        onShowToast={showToast}
      />
    </div>
  );
};
