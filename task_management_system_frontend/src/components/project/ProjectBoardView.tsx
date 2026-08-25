import React, { useState } from 'react';
import { Plus } from 'lucide-react';
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
  onQuickCreate?: (initialStatus: TaskStatus) => void;
}

interface ColumnConfig {
  id: TaskStatus;
  title: string;
  badgeBg: string;
  badgeText: string;
  borderTopColor: string;
}

const COLUMNS: ColumnConfig[] = [
  {
    id: 'TODO',
    title: 'TODO',
    badgeBg: 'bg-[#DFE1E6]',
    badgeText: 'text-[#42526E]',
    borderTopColor: 'border-blue-500',
  },
  {
    id: 'DOING',
    title: 'DOING',
    badgeBg: 'bg-[#DEEBFF]',
    badgeText: 'text-[#0747A6]',
    borderTopColor: 'border-amber-500',
  },
  {
    id: 'REVIEW',
    title: 'REVIEW',
    badgeBg: 'bg-[#EAE6FF]',
    badgeText: 'text-[#403294]',
    borderTopColor: 'border-purple-500',
  },
  {
    id: 'DONE',
    title: 'DONE',
    badgeBg: 'bg-[#E3FCEF]',
    badgeText: 'text-[#006644]',
    borderTopColor: 'border-emerald-500',
  },
];

export const ProjectBoardView: React.FC<ProjectBoardViewProps> = ({
  tasks,
  projectKey = 'TO',
  projectMembers = [],
  isAdmin = true,
  onTaskClick,
  onStatusChange,
  onPriorityChange,
  onAssigneeChange,
  onDeleteTask,
  onQuickCreate,
}) => {
  const [draggedOverCol, setDraggedOverCol] = useState<TaskStatus | null>(null);

  // Map tasks into 4 column buckets
  const columnTasks = React.useMemo(() => {
    const map: Record<TaskStatus, TaskDTO[]> = {
      TODO: [],
      DOING: [],
      REVIEW: [],
      DONE: [],
    };

    tasks.forEach((task) => {
      let status = task.status;
      if (!map[status]) {
        if (status === ('IN_PROGRESS' as any)) status = 'DOING';
        else if (status === ('IN_REVIEW' as any) || status === ('REOPEN' as any)) status = 'REVIEW';
        else status = 'TODO';
      }
      if (map[status]) {
        map[status].push(task);
      } else {
        map['TODO'].push(task);
      }
    });

    return map;
  }, [tasks]);

  // Handle Drag Start from TaskCard
  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    e.dataTransfer.setData('text/plain', String(taskId));
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle Drop on Column
  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    setDraggedOverCol(null);
    const taskIdStr = e.dataTransfer.getData('text/plain');
    if (!taskIdStr) return;

    const taskId = Number(taskIdStr);
    if (!isNaN(taskId) && onStatusChange) {
      onStatusChange(taskId, targetStatus);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-6 items-start">
      {COLUMNS.map((col) => {
        const colTaskList = columnTasks[col.id] || [];
        const taskCount = colTaskList.length;
        const isDraggedOver = draggedOverCol === col.id;

        return (
          <div
            key={col.id}
            onDragOver={(e) => {
              e.preventDefault();
              if (draggedOverCol !== col.id) setDraggedOverCol(col.id);
            }}
            onDragLeave={() => setDraggedOverCol(null)}
            onDrop={(e) => handleDrop(e, col.id)}
            className={`w-full bg-[#F4F5F7] rounded-xl border transition-all duration-150 flex flex-col max-h-full shadow-2xs ${
              isDraggedOver
                ? 'border-[#0052CC] ring-2 ring-[#0052CC]/50 bg-[#DEEBFF]/30 shadow-md'
                : 'border-[#DFE1E6]'
            }`}
          >
            {/* Column Header */}
            <div className={`p-3 border-t-4 ${col.borderTopColor} bg-white rounded-t-xl border-b border-[#DFE1E6] flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-xs tracking-wider text-[#5E6C84] uppercase">
                  {col.title}
                </h3>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.badgeBg} ${col.badgeText}`}>
                  {taskCount}
                </span>
              </div>

              {isAdmin && (
                <button
                  onClick={() => onQuickCreate && onQuickCreate(col.id)}
                  className="p-1 hover:bg-[#F4F5F7] rounded text-[#5E6C84] hover:text-[#0052CC] transition-colors"
                  title={`Create task in ${col.title}`}
                >
                  <Plus size={16} />
                </button>
              )}
            </div>

            {/* Column Body - Task List */}
            <div
              className={`p-2.5 flex flex-col gap-2.5 overflow-y-auto max-h-[calc(100vh-320px)] min-h-[150px] transition-colors ${
                isDraggedOver ? 'bg-[#DEEBFF]/20' : ''
              }`}
            >
              {colTaskList.length === 0 ? (
                <div className="border-2 border-dashed border-[#DFE1E6] rounded-lg p-6 text-center text-xs text-[#A5ADBA] font-medium my-auto">
                  {isDraggedOver ? 'Drop task here' : 'Drag and drop task here'}
                </div>
              ) : (
                colTaskList.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    projectKey={projectKey}
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

            {/* Column Footer: "+ Create" button (Only for Admin/Owner) */}
            {isAdmin && (
              <div className="p-2 border-t border-[#DFE1E6] bg-[#F4F5F7] rounded-b-xl">
                <button
                  onClick={() => onQuickCreate && onQuickCreate(col.id)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-[#5E6C84] hover:text-[#0052CC] hover:bg-white rounded-lg transition-all border border-transparent hover:border-[#DFE1E6] shadow-2xs"
                >
                  <Plus size={14} />
                  <span>Create</span>
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
