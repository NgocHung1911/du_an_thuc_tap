import React, { useState } from 'react';
import {
  X, Clock, AlertCircle, CheckCircle2, Trash2, Edit3, Save, RefreshCw, Folder
} from 'lucide-react';
import { TaskDTO, TaskPriority, TaskStatus, UserDTO } from '../../services/taskApi';

interface TaskDetailModalProps {
  task: TaskDTO | null;
  isOpen: boolean;
  onClose: () => void;
  projectMembers?: UserDTO[];
  isAdmin?: boolean;
  onStatusChange?: (taskId: number, newStatus: TaskStatus, fromModal?: boolean) => void;
  onPriorityChange?: (taskId: number, newPriority: TaskPriority) => void;
  onAssigneeChange?: (taskId: number, userId: number | null) => void;
  onUpdateDescription?: (taskId: number, newDescription: string, newTitle: string) => void;
  onDeleteTask?: (taskId: number) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  projectMembers = [],
  isAdmin = true,
  onStatusChange,
  onPriorityChange,
  onAssigneeChange,
  onUpdateDescription,
  onDeleteTask,
}) => {
  if (!isOpen || !task) return null;

  const [isEditing, setIsEditing] = useState(false);
  const [titleInput, setTitleInput] = useState(task.title);
  const [descInput, setDescInput] = useState(task.description || '');
  const [saving, setSaving] = useState(false);

  // Sync inputs when task changes
  React.useEffect(() => {
    setTitleInput(task.title);
    setDescInput(task.description || '');
    setIsEditing(false);
  }, [task]);

  // Check overdue
  const isOverdue = React.useMemo(() => {
    if (!task.deadline || task.status === 'DONE') return false;
    const deadlineDate = new Date(task.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return deadlineDate < today;
  }, [task.deadline, task.status]);

  // Date formatters
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Not set';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateTimeStr?: string) => {
    if (!dateTimeStr) {
      return new Date().toLocaleString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    try {
      const d = new Date(dateTimeStr);
      return d.toLocaleString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateTimeStr;
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'UN';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

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

  const handleSaveContent = async () => {
    if (!onUpdateDescription) return;
    setSaving(true);
    await onUpdateDescription(task.id, descInput, titleInput);
    setSaving(false);
    setIsEditing(false);
  };

  const projectName = task.projectName || task.project?.name || 'Project';
  const assigneeName = task.userFullName || task.assignedUser?.username || 'Unassigned';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-150 font-sans">
        {/* Header Bar */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
              #TASK-{task.id}
            </span>
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Folder size={14} className="text-blue-600 shrink-0" />
              <span>Project:</span>
              <strong className="text-slate-900">{projectName}</strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && onDeleteTask && (
              <button
                onClick={() => {
                  onDeleteTask(task.id);
                  onClose();
                }}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                title="Delete this task"
              >
                <Trash2 size={18} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
              title="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body - 2 Columns Layout */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 bg-white">
          {/* Left Column (Main Content: Title & Description) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title Section */}
            <div>
              {isEditing ? (
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  className="w-full text-xl font-bold text-slate-900 p-2.5 border border-blue-600 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              ) : (
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight tracking-tight">
                  {task.title}
                </h2>
              )}
            </div>

            {/* Description Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Task Description
                </h3>
                {isAdmin && (!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1"
                  >
                    <Edit3 size={13} />
                    <span>Edit</span>
                  </button>
                ) : isEditing ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveContent}
                      disabled={saving}
                      className="px-3.5 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center gap-1.5 shadow-xs"
                    >
                      {saving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
                      <span>Save</span>
                    </button>
                  </div>
                ) : null)}
              </div>

              {isEditing ? (
                <textarea
                  rows={6}
                  value={descInput}
                  onChange={(e) => setDescInput(e.target.value)}
                  placeholder="Enter detailed task description..."
                  className="w-full p-3.5 text-sm text-slate-900 border border-blue-600 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-600 leading-relaxed"
                ></textarea>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-900 min-h-[140px] whitespace-pre-wrap leading-relaxed">
                  {task.description && task.description.trim() ? (
                    task.description
                  ) : (
                    <span className="text-slate-400 italic">No description provided.</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column (Attributes & Metadata Sidebar) */}
          <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200 space-y-5 h-fit">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-2">
              Task Attributes
            </h3>

            {/* Status Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 block">Status</label>
              <select
                value={task.status}
                onChange={(e) =>
                  onStatusChange && onStatusChange(task.id, e.target.value as TaskStatus, true)
                }
                className="w-full px-3 py-2 bg-white text-xs font-bold text-slate-900 border border-slate-200 rounded-xl shadow-2xs focus:outline-none focus:border-blue-600 cursor-pointer"
              >
                <option value="TODO">TODO</option>
                <option value="DOING">DOING</option>
                <option value="REVIEW">REVIEW</option>
                <option value="DONE">DONE</option>
              </select>
            </div>

            {/* Priority Field (English options only) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 block">Priority</label>
              {isAdmin ? (
                <select
                  value={task.priority}
                  onChange={(e) =>
                    onPriorityChange && onPriorityChange(task.id, e.target.value as TaskPriority)
                  }
                  className="w-full px-3 py-2 bg-white text-xs font-bold text-slate-900 border border-slate-200 rounded-xl shadow-2xs focus:outline-none focus:border-blue-600 cursor-pointer"
                >
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              ) : (
                <div className="w-full px-3 py-2 bg-slate-100 text-xs font-bold text-slate-900 border border-slate-200 rounded-xl">
                  {task.priority}
                </div>
              )}
            </div>

            {/* Assignee User */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 block">Assignee</label>
              {isAdmin ? (
                <select
                  value={task.userId || task.assignedUser?.id || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const selectedUserId = val ? Number(val) : null;
                    if (onAssigneeChange) {
                      onAssigneeChange(task.id, selectedUserId);
                    }
                  }}
                  className="w-full px-3 py-2 bg-white text-xs font-bold text-slate-900 border border-slate-200 rounded-xl shadow-2xs focus:outline-none focus:border-blue-600 cursor-pointer"
                >
                  <option value="">Unassigned</option>
                  {projectMembers && projectMembers.map((mem) => (
                    <option key={mem.id} value={mem.id}>
                      {mem.username} ({mem.email || 'Member'})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center gap-2.5 p-2 bg-white rounded-xl border border-slate-200">
                  <div
                    className={`w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center ${getAvatarColor(
                      assigneeName
                    )}`}
                  >
                    {getInitials(assigneeName)}
                  </div>
                  <span className="text-xs font-semibold text-slate-900">
                    {assigneeName}
                  </span>
                </div>
              )}
            </div>

            {/* Deadline */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 block">Deadline</label>
              <div
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold ${
                  isOverdue
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : task.status === 'DONE'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-white text-slate-900 border-slate-200'
                }`}
              >
                {isOverdue ? (
                  <AlertCircle size={15} className="text-red-600 shrink-0" />
                ) : task.status === 'DONE' ? (
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                ) : (
                  <Clock size={15} className="text-slate-400 shrink-0" />
                )}
                <span>{formatDate(task.deadline)}</span>
                {isOverdue && <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.2 rounded font-bold ml-auto">Overdue</span>}
              </div>
            </div>

            {/* Metadata Dates: CreatedAt & UpdatedAt */}
            <div className="pt-3 border-t border-slate-200 space-y-2 text-[11px] text-slate-500">
              <div className="flex items-center justify-between">
                <span>Created At:</span>
                <strong className="text-slate-900 font-mono">{formatDateTime(task.createdAt)}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Last Updated:</span>
                <strong className="text-slate-900 font-mono">{formatDateTime(task.updatedAt)}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


