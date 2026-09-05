import React from 'react';
import { Plus, CheckCircle2, Clock, PlayCircle, Eye } from 'lucide-react';
import { TaskDTO, TaskPriority, TaskStatus, UserDTO } from '../../services/taskApi';
import { TaskCard } from './TaskCard';

interface ProjectBoardViewProps {
  tasks: TaskDTO[];
  projectKey?: string;
  projectMembers?: UserDTO[];
  isAdmin?: boolean;
  onTaskClick?: (task: TaskDTO) => void;
  onStatusChange?: (taskId: number, newStatus: TaskStatus) => void;
  onPriorityChange?: (taskId: number, newPriority: TaskPriority) => void;
  onAssigneeChange?: (taskId: number, userId: number | null) => void;
  onDeleteTask?: (taskId: number) => void;
  onQuickCreate?: (status: TaskStatus) => void;
}

export const ProjectBoardView: React.FC<ProjectBoardViewProps> = ({
  tasks,
  projectMembers = [],
  isAdmin = true,
  onTaskClick,
  onStatusChange,
  onPriorityChange,
  onAssigneeChange,
  onDeleteTask,
  onQuickCreate,
}) => {
  const columns: { status: TaskStatus; label: string; icon: React.FC<{ size?: number }>; color: string }[] = [
    { status: 'TODO', label: 'TODO', icon: Clock, color: 'border-slate-300 bg-slate-50 text-slate-700' },
    { status: 'DOING', label: 'DOING', icon: PlayCircle, color: 'border-sky-300 bg-sky-50 text-sky-700' },
    { status: 'REVIEW', label: 'REVIEW', icon: Eye, color: 'border-purple-300 bg-purple-50 text-purple-700' },
    { status: 'DONE', label: 'DONE', icon: CheckCircle2, color: 'border-emerald-300 bg-emerald-50 text-emerald-700' },
  ];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskIdStr = e.dataTransfer.getData('text/plain');
    if (!taskIdStr) return;
    const taskId = Number(taskIdStr);
    if (taskId && onStatusChange) {
      onStatusChange(taskId, targetStatus);
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    e.dataTransfer.setData('text/plain', String(taskId));
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start font-sans">
      {columns.map((col) => {
        const columnTasks = tasks.filter((t) => t.status === col.status);
        const IconComponent = col.icon;

        return (
          <div
            key={col.status}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.status)}
            className="bg-slate-100/80 rounded-2xl border border-slate-200/80 p-3.5 flex flex-col max-h-[80vh] shadow-2xs transition-colors hover:border-slate-300"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-2">
                <span className={`p-1.5 rounded-lg border ${col.color}`}>
                  <IconComponent size={15} />
                </span>
                <h3 className="font-bold text-xs text-slate-800 tracking-wider uppercase">
                  {col.label}
                </h3>
                <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200 shadow-2xs">
                  {columnTasks.length}
                </span>
              </div>

              {isAdmin && onQuickCreate && (
                <button
                  onClick={() => onQuickCreate(col.status)}
                  className="p-1 hover:bg-white text-slate-500 hover:text-blue-600 rounded-lg transition-colors"
                  title={`Add task to ${col.label}`}
                >
                  <Plus size={16} />
                </button>
              )}
            </div>

            {/* Task List Container */}
            <div className="space-y-3 overflow-y-auto pr-1 flex-1 min-h-[120px] scrollbar-thin">
              {columnTasks.length === 0 ? (
                <div className="h-28 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-xs text-slate-400 font-medium p-4 text-center">
                  No tasks in this column
                </div>
              ) : (
                columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    projectMembers={projectMembers}
                    isAdmin={isAdmin}
                    onTaskClick={onTaskClick}
                    onStatusChange={onStatusChange}
                    onPriorityChange={onPriorityChange}
                    onAssigneeChange={onAssigneeChange}
                    onDeleteTask={onDeleteTask}
                    onDragStart={handleDragStart}
                  />
                ))
              )}
            </div>

            {/* Bottom Add Task Button */}
            {isAdmin && onQuickCreate && (
              <button
                onClick={() => onQuickCreate(col.status)}
                className="mt-3 w-full py-2 px-3 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 flex items-center justify-center gap-1.5 transition-all shrink-0"
              >
                <Plus size={15} />
                <span>Create Task</span>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};
