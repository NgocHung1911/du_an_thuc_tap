import React from 'react';
import { Clock, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';
import { TaskDTO, TaskPriority, TaskStatus, UserDTO } from '../../services/taskApi';

interface TaskCardProps {
  task: TaskDTO;
  projectKey?: string;
  projectMembers?: UserDTO[];
  isAdmin?: boolean;
  onTaskClick?: (task: TaskDTO) => void;
  onStatusChange?: (taskId: number, newStatus: TaskStatus) => void;
  onPriorityChange?: (taskId: number, newPriority: TaskPriority) => void;
  onAssigneeChange?: (taskId: number, userId: number | null) => void;
  onDeleteTask?: (taskId: number) => void;
  onDragStart?: (e: React.DragEvent, taskId: number) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  projectMembers = [],
  isAdmin = true,
  onTaskClick,
  onStatusChange,
  onPriorityChange,
  onAssigneeChange,
  onDeleteTask,
  onDragStart,
}) => {
  // Check if overdue
  const isOverdue = React.useMemo(() => {
    if (!task.deadline || task.status === 'DONE') return false;
    const deadlineDate = new Date(task.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return deadlineDate < today;
  }, [task.deadline, task.status]);

  // Format date readable
  const formattedDate = React.useMemo(() => {
    if (!task.deadline) return null;
    try {
      const d = new Date(task.deadline);
      return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
    } catch {
      return task.deadline;
    }
  }, [task.deadline]);

  // Helper to extract initials
  const getInitials = (name?: string) => {
    if (!name) return 'UN';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Determine avatar background color from name hash
  const getAvatarColor = (name?: string) => {
    if (!name) return 'bg-slate-400';
    const colors = [
      'bg-red-500',
      'bg-amber-500',
      'bg-emerald-600',
      'bg-blue-600',
      'bg-purple-600',
      'bg-teal-600',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Priority color mapping
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

  // Status color mapping for fixed badge
  const getStatusBadgeStyle = (status: TaskStatus) => {
    switch (status) {
      case 'TODO':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'DOING':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'REVIEW':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'DONE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const assigneeName = task.userFullName || task.assignedUser?.username || 'Unassigned';

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart && onDragStart(e, task.id)}
      onClick={() => onTaskClick && onTaskClick(task)}
      className="bg-white rounded-xl border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all duration-150 p-3.5 flex flex-col gap-2.5 cursor-grab active:cursor-grabbing group relative select-none shadow-2xs"
    >
      {/* Top Header: Task ID & Priority Dropdown Select & Delete Button */}
      <div className="flex items-center justify-between">
        <span className="font-mono font-bold text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
          #TASK-{task.id}
        </span>

        <div className="flex items-center gap-1.5">
          {/* Priority Select (Admin/Owner only) vs Read-only badge */}
          <div
            className="flex items-center"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {isAdmin && onPriorityChange ? (
              <select
                value={task.priority}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onChange={(e) => onPriorityChange(task.id, e.target.value as TaskPriority)}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border outline-none cursor-pointer transition-colors ${getPriorityStyle(
                  task.priority
                )}`}
              >
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            ) : (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getPriorityStyle(
                  task.priority
                )}`}
              >
                {task.priority}
              </span>
            )}
          </div>

          {/* Delete Task Button */}
          {isAdmin && onDeleteTask && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onDeleteTask(task.id);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors opacity-80 group-hover:opacity-100"
              title="Delete task"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Task Title */}
      <h4 className="text-sm font-medium text-slate-900 group-hover:text-blue-600 leading-snug line-clamp-2 transition-colors">
        {task.title}
      </h4>

      {/* Due Date Indicator */}
      {formattedDate && (
        <div
          className={`flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md border w-fit ${
            isOverdue
              ? 'bg-red-50 text-red-700 border-red-200 font-bold animate-pulse'
              : task.status === 'DONE'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-slate-50 text-slate-600 border-slate-200'
          }`}
        >
          {isOverdue ? (
            <AlertCircle size={12} className="shrink-0 text-red-600" />
          ) : task.status === 'DONE' ? (
            <CheckCircle2 size={12} className="shrink-0 text-emerald-600" />
          ) : (
            <Clock size={12} className="shrink-0 text-slate-400" />
          )}
          <span>{isOverdue ? `Overdue: ${formattedDate}` : `Due: ${formattedDate}`}</span>
        </div>
      )}

      {/* Footer Info: Status Badge & Assignee Avatar */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-1 text-xs">
        {/* Status Select Badge */}
        <div
          className="inline-block"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <select
            value={task.status}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onChange={(e) => {
              e.stopPropagation();
              const newStat = e.target.value as TaskStatus;
              if (onStatusChange) {
                onStatusChange(task.id, newStat);
              }
            }}
            className={`text-[10px] font-bold px-2 py-0.5 rounded border outline-none cursor-pointer transition-colors ${getStatusBadgeStyle(
              task.status
            )}`}
          >
            <option value="TODO">TODO</option>
            <option value="DOING">DOING</option>
            <option value="REVIEW">REVIEW</option>
            <option value="DONE">DONE</option>
          </select>
        </div>

        {/* Assignee Select / Avatar */}
        {isAdmin && projectMembers.length > 0 ? (
          <div
            className="inline-block"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <select
              value={task.userId || task.assignedUser?.id || ''}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onChange={(e) => {
                e.stopPropagation();
                const val = e.target.value;
                const newUserId = val ? Number(val) : null;
                if (onAssigneeChange) {
                  onAssigneeChange(task.id, newUserId);
                }
              }}
              className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 hover:bg-white text-slate-800 outline-none cursor-pointer max-w-[110px] truncate"
              title={`Assigned to: ${assigneeName}`}
            >
              <option value="">Unassigned</option>
              {projectMembers.map((mem) => (
                <option key={mem.id} value={mem.id}>
                  {mem.username}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div
            className={`w-7 h-7 rounded-full text-white text-[11px] font-bold flex items-center justify-center border-2 border-white shadow-xs shrink-0 ${getAvatarColor(
              task.assignedUser?.username
            )}`}
            title={`Assigned to: ${assigneeName}`}
          >
            {task.assignedUser ? getInitials(task.assignedUser.username) : '?'}
          </div>
        )}
      </div>
    </div>
  );
};


