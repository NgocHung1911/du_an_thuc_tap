import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CheckSquare, Clock, AlertTriangle, ListTodo,
  Calendar, ArrowRight, FolderGit2, AlertCircle, RefreshCw, Zap,
  Folder, ShieldAlert, User, CheckCircle2, ChevronRight, Flame
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { taskApi, TaskDTO, TaskStatus, TaskPriority } from '../../services/taskApi';
import { projectApi, ProjectDTO } from '../../services/projectApi';
import { TaskDetailModal } from '../../components/project/TaskDetailModal';

export const MemberDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Selected Task Modal State
  const [selectedTask, setSelectedTask] = useState<TaskDTO | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Fetch tasks and projects
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [allTasks, allProjects] = await Promise.all([
        taskApi.getAllTasks().catch(() => []),
        projectApi.getAllProjects().catch(() => []),
      ]);
      setTasks(allTasks || []);
      setProjects(allProjects || []);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please verify connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Filter tasks assigned to current user
  const myTasks = useMemo(() => {
    if (!tasks || !user) return [];
    return tasks.filter((t) => {
      const assignedName = t.assignedUser?.username || t.userFullName;
      const assignedEmail = t.assignedUser?.email;

      return (
        (assignedName && user.username && assignedName.toLowerCase() === user.username.toLowerCase()) ||
        (assignedEmail && user.email && assignedEmail.toLowerCase() === user.email.toLowerCase())
      );
    });
  }, [tasks, user]);

  // Statistics
  const stats = useMemo(() => {
    const total = myTasks.length;
    const todoCount = myTasks.filter((t) => t.status === 'TODO').length;
    const doingCount = myTasks.filter((t) => t.status === 'DOING').length;
    const reviewCount = myTasks.filter((t) => t.status === 'REVIEW').length;

    const inProgressCount = doingCount + reviewCount;

    // Priority counts
    const highPriorityCount = myTasks.filter((t) => t.priority === 'HIGH' && t.status !== 'DONE').length;
    const mediumPriorityCount = myTasks.filter((t) => t.priority === 'MEDIUM' && t.status !== 'DONE').length;
    const lowPriorityCount = myTasks.filter((t) => t.priority === 'LOW' && t.status !== 'DONE').length;

    return {
      total,
      todoCount,
      doingCount,
      reviewCount,
      inProgressCount,
      highPriorityCount,
      mediumPriorityCount,
      lowPriorityCount,
    };
  }, [myTasks]);

  // Upcoming & Overdue Deadlines
  const upcomingDeadlines = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return myTasks
      .filter((t) => t.deadline && t.status !== 'DONE')
      .map((t) => {
        const dDate = new Date(t.deadline!);
        dDate.setHours(0, 0, 0, 0);

        const diffTime = dDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let deadlineStatus: 'OVERDUE' | 'TODAY' | 'SOON' | 'NORMAL' = 'NORMAL';
        if (diffDays < 0) deadlineStatus = 'OVERDUE';
        else if (diffDays === 0) deadlineStatus = 'TODAY';
        else if (diffDays <= 3) deadlineStatus = 'SOON';

        return { ...t, diffDays, deadlineStatus };
      })
      .sort((a, b) => a.diffDays - b.diffDays);
  }, [myTasks]);

  const overdueCount = useMemo(() => {
    return upcomingDeadlines.filter((t) => t.deadlineStatus === 'OVERDUE').length;
  }, [upcomingDeadlines]);

  // Task detail handlers
  const handleOpenDetail = (task: TaskDTO) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleStatusChange = async (taskId: number, newStatus: TaskStatus) => {
    try {
      await taskApi.updateTaskStatus(taskId, newStatus);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask({ ...selectedTask, status: newStatus });
      }
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  const handlePriorityChange = async (taskId: number, newPriority: TaskPriority) => {
    try {
      await taskApi.updateTaskPriority(taskId, newPriority);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, priority: newPriority } : t))
      );
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask({ ...selectedTask, priority: newPriority });
      }
    } catch (err) {
      console.error('Failed to update task priority:', err);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'No deadline';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-6 rounded-2xl text-white shadow-md">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <span>Welcome back, {user?.fullName || user?.username || 'Member'}!</span> 👋
          </h1>
          <p className="text-blue-100 text-sm mt-1">
            Here is your personal task summary, quick actions, and upcoming deadlines.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={fetchDashboardData}
            className="flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-xs transition-all border border-white/20"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Data</span>
          </button>
          <button
            onClick={() => navigate('/member/my-tasks')}
            className="flex items-center gap-2 px-4 py-2 bg-white text-blue-700 hover:bg-blue-50 rounded-xl text-xs font-bold shadow-xs transition-all"
          >
            <CheckSquare size={16} />
            <span>View All Tasks</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3 text-sm">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Tasks */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">My Tasks</p>
            <p className="text-3xl font-extrabold text-slate-900">{stats.total}</p>
            <p className="text-xs text-slate-500">Total assigned to you</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <CheckSquare size={24} />
          </div>
        </div>

        {/* 2. To Do (Before In Progress) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">To Do</p>
            <p className="text-3xl font-extrabold text-slate-700">{stats.todoCount}</p>
            <p className="text-xs text-slate-500">Tasks waiting to start</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <ListTodo size={24} />
          </div>
        </div>

        {/* 3. In Progress */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">In Progress</p>
            <p className="text-3xl font-extrabold text-blue-600">{stats.inProgressCount}</p>
            <p className="text-xs text-slate-500">{stats.doingCount} Doing · {stats.reviewCount} Review</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Clock size={24} />
          </div>
        </div>

        {/* 4. Upcoming & Overdue Deadlines */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Upcoming Deadlines</p>
            <p className={`text-3xl font-extrabold ${overdueCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {upcomingDeadlines.length}
            </p>
            <p className="text-xs text-amber-600 font-semibold">
              {overdueCount > 0 ? `${overdueCount} Overdue!` : 'All on schedule'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      {/* Quick Shortcuts Section (Lối tắt thao tác nhanh) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Zap size={18} className="text-amber-500 fill-amber-500" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Quick Actions & Shortcuts</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => navigate('/member/my-tasks')}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 bg-slate-50/70 hover:bg-blue-50/50 flex flex-col items-start gap-2 group transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <CheckSquare size={18} />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600">My Tasks</p>
              <p className="text-[11px] text-slate-500">View all assigned</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/member/my-tasks')}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-amber-300 bg-slate-50/70 hover:bg-amber-50/50 flex flex-col items-start gap-2 group transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <ShieldAlert size={18} />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-900 group-hover:text-amber-600">Overdue Tasks</p>
              <p className="text-[11px] text-amber-600 font-semibold">{overdueCount} overdue</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/member/projects')}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-300 bg-slate-50/70 hover:bg-indigo-50/50 flex flex-col items-start gap-2 group transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <FolderGit2 size={18} />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">My Projects</p>
              <p className="text-[11px] text-slate-500">{projects.length} participating</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/member/profile')}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-purple-300 bg-slate-50/70 hover:bg-purple-50/50 flex flex-col items-start gap-2 group transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <User size={18} />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-900 group-hover:text-purple-600">Profile</p>
              <p className="text-[11px] text-slate-500">Manage account</p>
            </div>
          </button>
        </div>
      </div>

      {/* Main Grid Section: Recent Tasks & Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Recent Assigned Tasks */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckSquare size={18} className="text-blue-600" />
                <span>Recent Assigned Tasks</span>
              </h2>
              <button
                onClick={() => navigate('/member/my-tasks')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {loading ? (
              <div className="py-8 text-center text-slate-400 text-sm animate-pulse">
                Loading tasks...
              </div>
            ) : myTasks.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">
                🎉 No tasks currently assigned to you!
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {myTasks.slice(0, 6).map((t) => {
                  let statusBg = 'bg-slate-100 text-slate-700';
                  if (t.status === 'DOING') statusBg = 'bg-blue-100 text-blue-700';
                  if (t.status === 'REVIEW') statusBg = 'bg-purple-100 text-purple-700';
                  if (t.status === 'DONE') statusBg = 'bg-emerald-100 text-emerald-700';

                  let priorityBg = 'bg-slate-100 text-slate-600';
                  if (t.priority === 'HIGH') priorityBg = 'bg-red-50 text-red-600 border border-red-100';
                  if (t.priority === 'MEDIUM') priorityBg = 'bg-amber-50 text-amber-600 border border-amber-100';

                  return (
                    <div
                      key={t.id}
                      onClick={() => handleOpenDetail(t)}
                      className="py-3 px-2 rounded-xl hover:bg-slate-50 flex items-center justify-between gap-4 cursor-pointer transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 truncate hover:text-blue-600">
                          {t.title}
                        </p>
                        <p className="text-xs text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                          <FolderGit2 size={12} className="text-slate-400 shrink-0" />
                          <span>{t.projectName || t.project?.name || 'General Project'}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${priorityBg}`}>
                          {t.priority}
                        </span>
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${statusBg}`}>
                          {t.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Participating Projects Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FolderGit2 size={18} className="text-indigo-600" />
                <span>My Participating Projects</span>
              </h2>
              <button
                onClick={() => navigate('/member/projects')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <span>View all projects</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {loading ? (
              <div className="py-6 text-center text-slate-400 text-sm animate-pulse">
                Loading projects...
              </div>
            ) : projects.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-sm">
                📁 You haven't joined any projects yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {projects.slice(0, 4).map((p) => {
                  const projectTaskCount = myTasks.filter(
                    (t) => (t.projectId || t.project?.id) === p.id
                  ).length;

                  return (
                    <div
                      key={p.id}
                      onClick={() => navigate(`/member/projects/${p.id}`)}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-indigo-50/40 hover:border-indigo-200 cursor-pointer transition-all flex items-center justify-between group"
                    >
                      <div className="space-y-1 min-w-0 flex-1 pr-2">
                        <p className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600">
                          {p.name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {p.description || 'No description provided.'}
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                            {projectTaskCount} assigned tasks
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-slate-400 group-hover:text-indigo-600 shrink-0" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Upcoming Deadlines & Priority Breakdown */}
        <div className="space-y-6">
          {/* Upcoming Deadlines Widget */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar size={20} className="text-amber-500" />
                <h2 className="text-base font-bold text-slate-900">Upcoming Deadlines</h2>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                {upcomingDeadlines.length} pending
              </span>
            </div>

            {loading ? (
              <div className="py-6 text-center text-slate-400 text-sm animate-pulse">
                Loading deadlines...
              </div>
            ) : upcomingDeadlines.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">
                ✨ No upcoming deadlines! All clear.
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingDeadlines.slice(0, 5).map((t) => {
                  let badgeBg = 'bg-blue-50 text-blue-700 border-blue-200';
                  let statusText = `Due in ${t.diffDays} day${t.diffDays > 1 ? 's' : ''}`;

                  if (t.deadlineStatus === 'OVERDUE') {
                    badgeBg = 'bg-red-50 text-red-700 border-red-200';
                    statusText = `Overdue by ${Math.abs(t.diffDays)} day${Math.abs(t.diffDays) > 1 ? 's' : ''}`;
                  } else if (t.deadlineStatus === 'TODAY') {
                    badgeBg = 'bg-amber-50 text-amber-700 border-amber-200';
                    statusText = 'Due Today';
                  } else if (t.deadlineStatus === 'SOON') {
                    badgeBg = 'bg-amber-50 text-amber-700 border-amber-100';
                  }

                  return (
                    <div
                      key={t.id}
                      onClick={() => handleOpenDetail(t)}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100/80 cursor-pointer transition-all space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-slate-900 line-clamp-1 hover:text-blue-600">
                          {t.title}
                        </p>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border shrink-0 ${badgeBg}`}>
                          {statusText}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <FolderGit2 size={12} className="text-slate-400" />
                          <span className="truncate max-w-[120px]">{t.projectName || t.project?.name || 'Project'}</span>
                        </span>
                        <span className="font-semibold text-slate-700">
                          {formatDate(t.deadline)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTask(null);
          }}
          isAdmin={false}
          onStatusChange={handleStatusChange}
          onPriorityChange={handlePriorityChange}
        />
      )}
    </div>
  );
};
