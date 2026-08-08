import React from 'react';
import { Clock, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';
import { TaskDTO, TaskPriority, TaskStatus } from '../../services/taskApi';

interface TaskCardProps {
  task: TaskDTO;
  projectKey?: string;
  onTaskClick?: (task: TaskDTO) => void;
  onStatusChange?: (taskId: number, newStatus: TaskStatus) => void;
  onPriorityChange?: (taskId: number, newPriority: TaskPriority) => void;
  onDeleteTask?: (taskId: number) => void;
  onDragStart?: (e: React.DragEvent, taskId: number) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  projectKey = 'TO',
  onTaskClick,
  onStatusChange,
  onPriorityChange,
  onDeleteTask,
  onDragStart,
}) => {
  const taskKey = `${projectKey}-${task.id}`;

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
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
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
    if (!name) return 'bg-[#5E6C84]';
    const colors = [
      'bg-[#FF5630]',
      'bg-[#FFAB00]',
      'bg-[#36B37E]',
      'bg-[#0052CC]',
      'bg-[#6554C0]',
      'bg-[#00B8D9]',
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
        return 'bg-[#FFEBE6] text-[#BF2600] border-[#FFBDAD]';
      case 'MEDIUM':
        return 'bg-[#FFF0B3] text-[#172B4D] border-[#FFE380]';
      case 'LOW':
      default:
        return 'bg-[#DEEBFF] text-[#0747A6] border-[#B3D4FF]';
    }
  };

  // Status color mapping for fixed badge
  const getStatusBadgeStyle = (status: TaskStatus) => {
    switch (status) {
      case 'TODO':
        return 'bg-[#DFE1E6] text-[#42526E] border-[#C1C7D0]';
      case 'DOING':
        return 'bg-[#DEEBFF] text-[#0747A6] border-[#B3D4FF]';
      case 'REVIEW':
        return 'bg-[#EAE6FF] text-[#403294] border-[#C0B6F2]';
      case 'DONE':
        return 'bg-[#E3FCEF] text-[#006644] border-[#ABF5D1]';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart && onDragStart(e, task.id)}
      onClick={() => onTaskClick && onTaskClick(task)}
      className="bg-white rounded-lg border border-[#DFE1E6] hover:border-[#4C9AFF] hover:shadow-md transition-all duration-150 p-3.5 flex flex-col gap-2.5 cursor-grab active:cursor-grabbing group relative select-none"
    >
      {/* Top Header: Priority Dropdown Select & Delete Button */}
      <div className="flex items-center justify-between">
        <span className="font-mono font-bold text-[11px] text-[#0052CC]">
          {taskKey}
        </span>

        <div className="flex items-center gap-1.5">
          {/* Priority Select */}
          <div
            className="flex items-center"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <select
              value={task.priority}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onChange={(e) => {
                e.stopPropagation();
                const newPri = e.target.value as TaskPriority;
                if (onPriorityChange) {
                  onPriorityChange(task.id, newPri);
                }
              }}
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border outline-none cursor-pointer transition-colors ${getPriorityStyle(
                task.priority
              )}`}
            >
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>

          {/* Delete Button directly on TaskCard */}
          {onDeleteTask && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onDeleteTask(task.id);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="Delete Task"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Task Title */}
      <h4 className="text-sm font-medium text-[#172B4D] group-hover:text-[#0052CC] leading-snug line-clamp-2 transition-colors">
        {task.title}
      </h4>

      {/* Due Date Indicator */}
      {formattedDate && (
        <div
          className={`flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md border ${
            isOverdue
              ? 'bg-red-50 text-red-600 border-red-200 font-semibold animate-pulse'
              : task.status === 'DONE'
              ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
              : 'bg-[#F4F5F7] text-[#5E6C84] border-[#DFE1E6]'
          }`}
        >
          {isOverdue ? <AlertCircle size={12} /> : task.status === 'DONE' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
          <span>Due Date: {formattedDate}</span>
        </div>
      )}

      {/* Footer Info: Status Badge & Assignee Avatar */}
      <div className="flex items-center justify-between pt-2 border-t border-[#F4F5F7] mt-1 text-xs text-[#5E6C84]">
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
            className={`text-[10px] font-bold px-2 py-0.5 rounded border outline-none cursor-pointer font-sans transition-colors ${getStatusBadgeStyle(
              task.status
            )}`}
          >
            <option value="TODO">TODO</option>
            <option value="DOING">DOING</option>
            <option value="REVIEW">REVIEW</option>
            <option value="DONE">DONE</option>
          </select>
        </div>

        {/* Assignee Avatar */}
        <div
          className={`w-7 h-7 rounded-full text-white text-[11px] font-bold flex items-center justify-center border-2 border-white shadow-xs shrink-0 ${getAvatarColor(
            task.assignedUser?.username
          )}`}
          title={task.assignedUser ? task.assignedUser.username : 'Unassigned'}
        >
          {task.assignedUser ? getInitials(task.assignedUser.username) : '?'}
        </div>
      </div>
    </div>
  );
};
