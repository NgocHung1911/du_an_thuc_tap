import React from 'react';
import { Clock, Edit3, Trash2, AlertCircle } from 'lucide-react';
import { TaskDTO, TaskPriority, TaskStatus, UserDTO } from '../../services/taskApi';

interface ProjectListViewProps {
  tasks: TaskDTO[];
  projectKey?: string;
  projectMembers?: UserDTO[];
  isAdmin?: boolean;
  onTaskClick?: (task: TaskDTO) => void;
  onStatusChange?: (taskId: number, newStatus: TaskStatus) => void;
  onPriorityChange?: (taskId: number, newPriority: TaskPriority) => void;
  onAssigneeChange?: (taskId: number, userId: number | null) => void;
  onDeleteTask?: (taskId: number) => void;
}

export const ProjectListView: React.FC<ProjectListViewProps> = ({
  tasks,
  projectMembers = [],
  isAdmin = true,
  onTaskClick,
  onStatusChange,
  onPriorityChange,
  onAssigneeChange,
  onDeleteTask,
}) => {
  const renderStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'TODO':
        return (
          <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
            TODO
          </span>
        );
      case 'DOING':
        return (
          <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-md bg-sky-50 text-sky-700 border border-sky-200">
            DOING
          </span>
        );
      case 'REVIEW':
        return (
          <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
            REVIEW
          </span>
        );
      case 'DONE':
        return (
          <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
            DONE
          </span>
        );
      default:
        return <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100">{status}</span>;
    }
  };

  const getPriorityStyle = (priority: TaskPriority) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'MEDIUM':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'LOW':
      default:
        return 'bg-sky-50 text-sky-700 border-sky-200';
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'UN';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden font-sans">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-4 w-28">Task ID</th>
              <th className="py-3.5 px-4 min-w-[240px]">Task Title</th>
              <th className="py-3.5 px-4 w-36">Status</th>
              <th className="py-3.5 px-4 w-36">Priority</th>
              <th className="py-3.5 px-4 w-44">Assignee</th>
              <th className="py-3.5 px-4 w-36">Due Date</th>
              <th className="py-3.5 px-4 w-24 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                  No tasks found in list.
                </td>
              </tr>
            ) : (
              tasks.map((task) => {
                const isOverdue =
                  task.deadline &&
                  task.status !== 'DONE' &&
                  new Date(task.deadline) < new Date(new Date().setHours(0, 0, 0, 0));

                return (
                  <tr
                    key={task.id}
                    onClick={() => onTaskClick && onTaskClick(task)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    {/* Task ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-xs text-blue-700">
                      #TASK-{task.id}
                    </td>

                    {/* Title */}
                    <td className="py-3.5 px-4 font-medium text-slate-900 group-hover:text-blue-600 transition-colors leading-relaxed">
                      {task.title}
                    </td>

                    {/* Status Dropdown */}
                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      {onStatusChange ? (
                        <select
                          value={task.status}
                          onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
                          className="text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 rounded-lg px-2.5 py-1 outline-none cursor-pointer focus:border-blue-600 transition-colors"
                        >
                          <option value="TODO">TODO</option>
                          <option value="DOING">DOING</option>
                          <option value="REVIEW">REVIEW</option>
                          <option value="DONE">DONE</option>
                        </select>
                      ) : (
                        renderStatusBadge(task.status)
                      )}
                    </td>

                    {/* Priority Dropdown Select (Admin/Owner only) */}
                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      {isAdmin && onPriorityChange ? (
                        <select
                          value={task.priority}
                          onChange={(e) => onPriorityChange(task.id, e.target.value as TaskPriority)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg border outline-none cursor-pointer transition-colors ${getPriorityStyle(
                            task.priority
                          )}`}
                        >
                          <option value="HIGH">HIGH</option>
                          <option value="MEDIUM">MEDIUM</option>
                          <option value="LOW">LOW</option>
                        </select>
                      ) : (
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${getPriorityStyle(
                            task.priority
                          )}`}
                        >
                          {task.priority}
                        </span>
                      )}
                    </td>

                    {/* Assignee */}
                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      {isAdmin && projectMembers.length > 0 ? (
                        <select
                          value={task.userId || task.assignedUser?.id || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const newUserId = val ? Number(val) : null;
                            if (onAssigneeChange) {
                              onAssigneeChange(task.id, newUserId);
                            }
                          }}
                          className="text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 rounded-lg px-2 py-1 outline-none cursor-pointer max-w-[140px] truncate"
                        >
                          <option value="">Unassigned</option>
                          {projectMembers.map((mem) => (
                            <option key={mem.id} value={mem.id}>
                              {mem.username}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                            {getInitials(task.assignedUser?.username)}
                          </div>
                          <span className="text-xs text-slate-800 font-medium line-clamp-1">
                            {task.assignedUser?.username || 'Unassigned'}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Due Date */}
                    <td className="py-3.5 px-4">
                      {task.deadline ? (
                        <span
                          className={`text-xs font-medium inline-flex items-center gap-1 ${
                            isOverdue ? 'text-red-700 font-bold' : 'text-slate-600'
                          }`}
                        >
                          {isOverdue ? <AlertCircle size={13} className="text-red-600" /> : <Clock size={13} className="text-slate-400" />}
                          {task.deadline}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">-</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {isAdmin && (
                          <button
                            onClick={() => onTaskClick && onTaskClick(task)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition-colors"
                            title="Edit task details"
                          >
                            <Edit3 size={15} />
                          </button>
                        )}
                        {isAdmin && onDeleteTask && (
                          <button
                            onClick={() => onDeleteTask(task.id)}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                            title="Delete task"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};


