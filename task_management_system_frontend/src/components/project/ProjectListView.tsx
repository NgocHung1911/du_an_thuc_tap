import React from 'react';
import { Clock, Edit, Trash2 } from 'lucide-react';
import { TaskDTO, TaskPriority, TaskStatus } from '../../services/taskApi';

interface ProjectListViewProps {
  tasks: TaskDTO[];
  projectKey?: string;
  onTaskClick?: (task: TaskDTO) => void;
  onStatusChange?: (taskId: number, newStatus: TaskStatus) => void;
  onPriorityChange?: (taskId: number, newPriority: TaskPriority) => void;
  onDeleteTask?: (taskId: number) => void;
}

export const ProjectListView: React.FC<ProjectListViewProps> = ({
  tasks,
  projectKey = 'TO',
  onTaskClick,
  onStatusChange,
  onPriorityChange,
  onDeleteTask,
}) => {
  const renderStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'TODO':
        return (
          <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded bg-[#DFE1E6] text-[#42526E]">
            TODO
          </span>
        );
      case 'DOING':
        return (
          <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded bg-[#DEEBFF] text-[#0747A6]">
            DOING
          </span>
        );
      case 'REVIEW':
        return (
          <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded bg-[#EAE6FF] text-[#403294]">
            REVIEW
          </span>
        );
      case 'DONE':
        return (
          <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded bg-[#E3FCEF] text-[#006644]">
            DONE
          </span>
        );
      default:
        return <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100">{status}</span>;
    }
  };

  const getPriorityStyle = (priority: TaskPriority) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-[#FFEBE6] text-[#BF2600] border-[#FFBDAD]';
      case 'MEDIUM':
        return 'bg-[#FFF0B3] text-[#172B4D] border-[#FFE380]';
      case 'LOW':
      default:
        return 'bg-[#DEEBFF] text-[#0747A6] border-[#B3D4FF]';
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'UN';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="bg-white rounded-xl border border-[#DFE1E6] shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-[#F4F5F7] border-b border-[#DFE1E6] text-[11px] font-bold text-[#5E6C84] uppercase tracking-wider">
              <th className="py-3 px-4 w-28">Key</th>
              <th className="py-3 px-4 min-w-[220px]">Title</th>
              <th className="py-3 px-4 w-36">Status</th>
              <th className="py-3 px-4 w-36">Priority</th>
              <th className="py-3 px-4 w-44">Assignee</th>
              <th className="py-3 px-4 w-32">Due Date</th>
              <th className="py-3 px-4 w-24 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DFE1E6]">
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-[#5E6C84]">
                  No tasks found.
                </td>
              </tr>
            ) : (
              tasks.map((task) => {
                const taskKey = `${projectKey}-${task.id}`;
                const isOverdue =
                  task.deadline &&
                  task.status !== 'DONE' &&
                  new Date(task.deadline) < new Date(new Date().setHours(0, 0, 0, 0));

                return (
                  <tr
                    key={task.id}
                    onClick={() => onTaskClick && onTaskClick(task)}
                    className="hover:bg-[#F4F5F7]/70 transition-colors cursor-pointer group"
                  >
                    {/* Key */}
                    <td className="py-3 px-4 font-mono font-bold text-xs text-[#0052CC]">
                      {taskKey}
                    </td>

                    {/* Title */}
                    <td className="py-3 px-4 font-medium text-[#172B4D] group-hover:text-[#0052CC] transition-colors">
                      {task.title}
                    </td>

                    {/* Status Dropdown */}
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      {onStatusChange ? (
                        <select
                          value={task.status}
                          onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
                          className="text-xs font-bold bg-[#F4F5F7] hover:bg-[#EBECF0] text-[#172B4D] border border-[#DFE1E6] rounded-md px-2.5 py-1 outline-none cursor-pointer"
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

                    {/* Priority Dropdown Select */}
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      {onPriorityChange ? (
                        <select
                          value={task.priority}
                          onChange={(e) => onPriorityChange(task.id, e.target.value as TaskPriority)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-md border outline-none cursor-pointer transition-colors ${getPriorityStyle(
                            task.priority
                          )}`}
                        >
                          <option value="HIGH">HIGH</option>
                          <option value="MEDIUM">MEDIUM</option>
                          <option value="LOW">LOW</option>
                        </select>
                      ) : (
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-md border ${getPriorityStyle(
                            task.priority
                          )}`}
                        >
                          {task.priority}
                        </span>
                      )}
                    </td>

                    {/* Assignee */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#0052CC] text-white text-[10px] font-bold flex items-center justify-center">
                          {getInitials(task.assignedUser?.username)}
                        </div>
                        <span className="text-xs text-[#172B4D] font-medium line-clamp-1">
                          {task.assignedUser?.username || 'Unassigned'}
                        </span>
                      </div>
                    </td>

                    {/* Due Date */}
                    <td className="py-3 px-4">
                      {task.deadline ? (
                        <span
                          className={`text-xs font-medium inline-flex items-center gap-1 ${
                            isOverdue ? 'text-red-600 font-bold' : 'text-[#5E6C84]'
                          }`}
                        >
                          <Clock size={12} />
                          {task.deadline}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onTaskClick && onTaskClick(task)}
                          className="p-1.5 hover:bg-[#EBECF0] rounded text-[#5E6C84] hover:text-[#0052CC]"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        {onDeleteTask && (
                          <button
                            onClick={() => onDeleteTask(task.id)}
                            className="p-1.5 hover:bg-red-100 rounded text-red-600 hover:text-red-700"
                            title="Delete"
                          >
                            <Trash2 size={14} />
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
