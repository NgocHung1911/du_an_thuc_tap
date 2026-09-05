import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CheckCircle2, Clock, AlertTriangle, Users,
  FolderGit2, RefreshCw, CheckSquare, ListTodo, Shield, AlertCircle,
  TrendingUp, ArrowRight, Activity, Settings, UserPlus
} from 'lucide-react';
import { taskApi, TaskDTO, UserDTO } from '../../services/taskApi';
import { projectApi, ProjectDTO } from '../../services/projectApi';
import { userApi } from '../../services/userApi';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [allTasks, allProjects, allUsers] = await Promise.all([
        taskApi.getAllTasks().catch(() => []),
        projectApi.getAllProjects().catch(() => []),
        userApi.getAllUsers().catch(() => []),
      ]);

      setTasks(allTasks || []);
      setProjects(allProjects || []);
      setUsers(allUsers || []);
    } catch (err: any) {
      console.error('Lỗi khi tải dữ liệu Admin Dashboard:', err);
      setError('Không thể tải dữ liệu tổng quan. Vui lòng kiểm tra kết nối hệ thống.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Compute Statistics
  const stats = useMemo(() => {
    const totalTasks = tasks.length;
    const doneTasks = tasks.filter((t) => t.status === 'DONE').length;
    const doingTasks = tasks.filter((t) => t.status === 'DOING').length;
    const reviewTasks = tasks.filter((t) => t.status === 'REVIEW').length;
    const todoTasks = tasks.filter((t) => t.status === 'TODO').length;
    const inProgressTasks = doingTasks + reviewTasks;

    const taskCompletionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    const totalProjects = projects.length;
    const activeProjects = projects.filter((p) => p.status === 'IN_PROGRESS').length;
    const completedProjects = projects.filter((p) => p.status === 'COMPLETED').length;
    const planningProjects = projects.filter((p) => p.status === 'PLANNING').length;
    const onHoldProjects = projects.filter((p) => p.status === 'ON_HOLD').length;

    const totalUsers = users.length;
    const adminUsers = users.filter((u) => u.role && u.role.toUpperCase().includes('ADMIN')).length;
    const memberUsers = totalUsers - adminUsers;

    return {
      totalTasks,
      doneTasks,
      doingTasks,
      reviewTasks,
      todoTasks,
      inProgressTasks,
      taskCompletionRate,
      totalProjects,
      activeProjects,
      completedProjects,
      planningProjects,
      onHoldProjects,
      totalUsers,
      adminUsers,
      memberUsers,
    };
  }, [tasks, projects, users]);

  // Dynamic Recent System Activity
  const recentActivities = useMemo(() => {
    const list: { id: string; title: string; detail: string; time: string; tag: string; tagBg: string; tagColor: string }[] = [];

    // Recent tasks
    tasks.slice(-3).reverse().forEach((t) => {
      list.push({
        id: `task-${t.id}`,
        title: `Công việc #${t.id}: ${t.title}`,
        detail: `Dự án: ${t.projectName || 'Chưa phân loại'} | Trạng thái: ${t.status}`,
        time: 'Gần đây',
        tag: 'TASK',
        tagBg: 'bg-blue-50',
        tagColor: 'text-blue-700',
      });
    });

    // Recent projects
    projects.slice(-2).reverse().forEach((p) => {
      list.push({
        id: `proj-${p.id}`,
        title: `Dự án mới: ${p.name}`,
        detail: `Trạng thái: ${p.status || 'PLANNING'} | ${p.taskCount || 0} tasks`,
        time: 'Gần đây',
        tag: 'DỰ ÁN',
        tagBg: 'bg-indigo-50',
        tagColor: 'text-indigo-700',
      });
    });

    return list;
  }, [tasks, projects]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 p-6 rounded-2xl text-white shadow-md">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <LayoutDashboard size={26} className="text-blue-200" />
            <span>📊 Dashboard Tổng Quan</span>
          </h1>
          <p className="text-blue-100 text-sm mt-1">
            Báo cáo tổng quan tiến độ dự án, công việc và thành viên toàn hệ thống
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-xs transition-all border border-white/20 disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Làm Mới Dữ Liệu</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center justify-between text-sm font-medium">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchDashboardData}
            className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-xs font-bold"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-white rounded-2xl border border-slate-200 p-5"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-64 bg-white rounded-2xl border border-slate-200"></div>
            <div className="h-64 bg-white rounded-2xl border border-slate-200"></div>
          </div>
        </div>
      ) : (
        <>
          {/* Top 4 Overview Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Tổng số công việc */}
            <div
              onClick={() => navigate('/admin/tasks')}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-400 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng Số Công Việc</p>
                <p className="text-3xl font-extrabold text-blue-600">{stats.totalTasks}</p>
                <p className="text-xs text-slate-500">{stats.inProgressTasks} Đang xử lý · {stats.todoTasks} Chờ làm</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                <CheckSquare size={24} />
              </div>
            </div>

            {/* 2. Đã hoàn thành */}
            <div
              onClick={() => navigate('/admin/tasks')}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-emerald-400 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Đã Hoàn Thành</p>
                <p className="text-3xl font-extrabold text-emerald-600">{stats.doneTasks}</p>
                <p className="text-xs text-emerald-600 font-semibold">{stats.taskCompletionRate}% Tỷ lệ hoàn thành</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                <CheckCircle2 size={24} />
              </div>
            </div>

            {/* 3. Tổng số dự án */}
            <div
              onClick={() => navigate('/admin/projects')}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-indigo-400 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng Số Dự Án</p>
                <p className="text-3xl font-extrabold text-indigo-600">{stats.totalProjects}</p>
                <p className="text-xs text-slate-500">{stats.activeProjects} Đang chạy · {stats.completedProjects} Hoàn thành</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                <FolderGit2 size={24} />
              </div>
            </div>

            {/* 4. Số lượng thành viên */}
            <div
              onClick={() => navigate('/admin/users')}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-purple-400 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Số Lượng Thành Viên</p>
                <p className="text-3xl font-extrabold text-purple-600">{stats.totalUsers}</p>
                <p className="text-xs text-slate-500">{stats.adminUsers} Admin · {stats.memberUsers} Member</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                <Users size={24} />
              </div>
            </div>
          </div>

          {/* Shortcuts Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => navigate('/admin/projects')}
              className="p-4 bg-white hover:bg-indigo-50/50 rounded-2xl border border-slate-200 hover:border-indigo-300 shadow-xs transition-all flex items-center gap-3 text-left group"
            >
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-bold group-hover:scale-110 transition-transform">
                <FolderGit2 size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">Quản Lý Dự Án</p>
                <p className="text-[11px] text-slate-500">{stats.totalProjects} dự án hệ thống</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/admin/tasks')}
              className="p-4 bg-white hover:bg-blue-50/50 rounded-2xl border border-slate-200 hover:border-blue-300 shadow-xs transition-all flex items-center gap-3 text-left group"
            >
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl font-bold group-hover:scale-110 transition-transform">
                <CheckSquare size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600">Quản Lý Công Việc</p>
                <p className="text-[11px] text-slate-500">{stats.totalTasks} công việc</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/admin/users')}
              className="p-4 bg-white hover:bg-purple-50/50 rounded-2xl border border-slate-200 hover:border-purple-300 shadow-xs transition-all flex items-center gap-3 text-left group"
            >
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl font-bold group-hover:scale-110 transition-transform">
                <Users size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 group-hover:text-purple-600">Quản Lý Thành Viên</p>
                <p className="text-[11px] text-slate-500">{stats.totalUsers} người dùng</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/admin/settings')}
              className="p-4 bg-white hover:bg-slate-100 rounded-2xl border border-slate-200 shadow-xs transition-all flex items-center gap-3 text-left group"
            >
              <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold group-hover:scale-110 transition-transform">
                <Settings size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Cài Đặt Hệ Thống</p>
                <p className="text-[11px] text-slate-500">Cấu hình chung</p>
              </div>
            </button>
          </div>

          {/* Main Grid: Status Breakdown & Activity Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column (2 cols): Project & Task Progress */}
            <div className="lg:col-span-2 space-y-6">
              {/* Projects Status Breakdown */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FolderGit2 size={18} className="text-indigo-600" />
                    <span>Thống Kê Dự Án Theo Trạng Thái</span>
                  </h2>
                  <button
                    onClick={() => navigate('/admin/projects')}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <span>Xem danh sách</span>
                    <ArrowRight size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1">
                    <p className="text-[11px] font-bold text-slate-500 uppercase">PLANNING</p>
                    <p className="text-xl font-bold text-slate-700">{stats.planningProjects}</p>
                  </div>

                  <div className="p-3.5 bg-sky-50 rounded-xl border border-sky-200 text-center space-y-1">
                    <p className="text-[11px] font-bold text-sky-700 uppercase">IN_PROGRESS</p>
                    <p className="text-xl font-bold text-sky-700">{stats.activeProjects}</p>
                  </div>

                  <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-center space-y-1">
                    <p className="text-[11px] font-bold text-emerald-700 uppercase">COMPLETED</p>
                    <p className="text-xl font-bold text-emerald-700">{stats.completedProjects}</p>
                  </div>

                  <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-center space-y-1">
                    <p className="text-[11px] font-bold text-amber-700 uppercase">ON_HOLD</p>
                    <p className="text-xl font-bold text-amber-700">{stats.onHoldProjects}</p>
                  </div>
                </div>
              </div>

              {/* Tasks Progress Bar */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp size={18} className="text-blue-600" />
                    <span>Tiến Độ Công Việc Toàn Hệ Thống</span>
                  </h2>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    {stats.doneTasks}/{stats.totalTasks} Đã hoàn thành
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${stats.totalTasks > 0 ? (stats.doneTasks / stats.totalTasks) * 100 : 0}%` }}
                      className="bg-emerald-500 transition-all duration-500"
                      title="Done"
                    />
                    <div
                      style={{ width: `${stats.totalTasks > 0 ? (stats.doingTasks / stats.totalTasks) * 100 : 0}%` }}
                      className="bg-blue-500 transition-all duration-500"
                      title="Doing"
                    />
                    <div
                      style={{ width: `${stats.totalTasks > 0 ? (stats.reviewTasks / stats.totalTasks) * 100 : 0}%` }}
                      className="bg-purple-500 transition-all duration-500"
                      title="Review"
                    />
                    <div
                      style={{ width: `${stats.totalTasks > 0 ? (stats.todoTasks / stats.totalTasks) * 100 : 0}%` }}
                      className="bg-slate-300 transition-all duration-500"
                      title="To Do"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 font-semibold pt-1">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Done ({stats.doneTasks})</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Doing ({stats.doingTasks})</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Review ({stats.reviewTasks})</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span> To Do ({stats.todoTasks})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (1 col): System Activity Feed */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Activity size={18} className="text-indigo-600" />
                <span>Hoạt Động Gần Đây</span>
              </h2>

              <div className="space-y-3">
                {recentActivities.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">Chưa có hoạt động hệ thống nào.</p>
                ) : (
                  recentActivities.map((act) => (
                    <div key={act.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${act.tagBg} ${act.tagColor}`}>
                          {act.tag}
                        </span>
                        <span className="text-[10px] text-slate-400">{act.time}</span>
                      </div>
                      <p className="font-bold text-slate-900 line-clamp-1">{act.title}</p>
                      <p className="text-slate-500 text-[11px] line-clamp-1">{act.detail}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
