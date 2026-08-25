import React, { useState } from 'react';
import {
  X, Calendar, Clock, User, ArrowUp, ArrowDown, Minus, AlertCircle,
  CheckCircle2, Trash2, Edit3, Save, RefreshCw, Layers, Folder
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
    if (!dateStr) return 'Chưa thiết lập';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateTimeStr?: string) => {
    if (!dateTimeStr) {
      // Fallback display formatted current date for complete view
      return new Date().toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    try {
      const d = new Date(dateTimeStr);
      return d.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
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

  const handleSaveContent = async () => {
    if (!onUpdateDescription) return;
    setSaving(true);
    await onUpdateDescription(task.id, descInput, titleInput);
    setSaving(false);
    setIsEditing(false);
  };

  const projectName = task.projectName || task.project?.name || 'TinGJob-Officer';
  const assigneeName = task.userFullName || task.assignedUser?.username || 'Unassigned';

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-[#DFE1E6] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-150">
        {/* Header Bar */}
        <div className="px-6 py-4 bg-[#F4F5F7] border-b border-[#DFE1E6] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-xs text-[#0052CC] bg-[#DEEBFF] px-2.5 py-1 rounded-md border border-[#B3D4FF]">
              #TASK-{task.id}
            </span>
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#5E6C84]">
              <Folder size={14} className="text-[#0052CC]" />
              <span>Dự án:</span>
              <strong className="text-[#172B4D]">{projectName}</strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && onDeleteTask && (
              <button
                onClick={() => {
                  onDeleteTask(task.id);
                  onClose();
                }}
                className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                title="Xóa công việc này"
              >
                <Trash2 size={18} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              title="Đóng modal"
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
                  className="w-full text-xl font-bold text-[#172B4D] p-2 border border-[#0052CC] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0052CC]"
                />
              ) : (
                <h2 className="text-xl sm:text-2xl font-bold text-[#172B4D] leading-tight tracking-tight">
                  {task.title}
                </h2>
              )}
            </div>

            {/* Description Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#172B4D] flex items-center gap-2">
                  <span>Mô tả công việc (Description)</span>
                </h3>
                {isAdmin && (!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-xs text-[#0052CC] hover:underline font-semibold flex items-center gap-1"
                  >
                    <Edit3 size={13} />
                    <span>Chỉnh sửa</span>
                  </button>
                ) : isEditing ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-2.5 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-md"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleSaveContent}
                      disabled={saving}
                      className="px-3 py-1 text-xs bg-[#0052CC] hover:bg-[#0747A6] text-white font-semibold rounded-md flex items-center gap-1"
                    >
                      {saving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
                      <span>Lưu lại</span>
                    </button>
                  </div>
                ) : null)}
              </div>

              {isEditing ? (
                <textarea
                  rows={6}
                  value={descInput}
                  onChange={(e) => setDescInput(e.target.value)}
                  placeholder="Nhập mô tả chi tiết công việc..."
                  className="w-full p-3 text-sm text-[#172B4D] border border-[#0052CC] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0052CC]"
                ></textarea>
              ) : (
                <div className="p-4 bg-[#F4F5F7] rounded-xl border border-[#DFE1E6] text-sm text-[#172B4D] min-h-[140px] whitespace-pre-wrap leading-relaxed">
                  {task.description && task.description.trim() ? (
                    task.description
                  ) : (
                    <span className="text-[#A5ADBA] italic">Chưa có mô tả chi tiết.</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column (Attributes & Metadata Sidebar) */}
          <div className="bg-[#F4F5F7]/70 p-5 rounded-xl border border-[#DFE1E6] space-y-5 h-fit">
            <h3 className="text-xs font-bold text-[#5E6C84] uppercase tracking-wider border-b border-[#DFE1E6] pb-2">
              Thông tin thuộc tính
            </h3>

            {/* Status Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#5E6C84] block">Status</label>
              <select
                value={task.status}
                onChange={(e) =>
                  onStatusChange && onStatusChange(task.id, e.target.value as TaskStatus, true)
                }
                className="w-full px-3 py-2 bg-white text-xs font-bold text-[#172B4D] border border-[#DFE1E6] rounded-lg shadow-2xs focus:outline-none focus:border-[#0052CC] cursor-pointer"
              >
                <option value="TODO">TODO</option>
                <option value="DOING">DOING</option>
                <option value="REVIEW">REVIEW</option>
                <option value="DONE">DONE</option>
              </select>
            </div>

            {/* Priority Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#5E6C84] block">Priority</label>
              {isAdmin ? (
                <select
                  value={task.priority}
                  onChange={(e) =>
                    onPriorityChange && onPriorityChange(task.id, e.target.value as TaskPriority)
                  }
                  className="w-full px-3 py-2 bg-white text-xs font-bold text-[#172B4D] border border-[#DFE1E6] rounded-lg shadow-2xs focus:outline-none focus:border-[#0052CC] cursor-pointer"
                >
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              ) : (
                <div className="w-full px-3 py-2 bg-[#F4F5F7] text-xs font-bold text-[#172B4D] border border-[#DFE1E6] rounded-lg">
                  {task.priority}
                </div>
              )}
            </div>

            {/* Assignee User */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#5E6C84] block">Người thực hiện</label>
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
                  className="w-full px-3 py-2 bg-white text-xs font-bold text-[#172B4D] border border-[#DFE1E6] rounded-lg shadow-2xs focus:outline-none focus:border-[#0052CC] cursor-pointer"
                >
                  <option value="">-- Chưa phân công --</option>
                  {projectMembers && projectMembers.map((mem) => (
                    <option key={mem.id} value={mem.id}>
                      {mem.username} ({mem.email || 'Member'})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-[#DFE1E6]">
                  <div
                    className={`w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center ${getAvatarColor(
                      assigneeName
                    )}`}
                  >
                    {getInitials(assigneeName)}
                  </div>
                  <span className="text-xs font-semibold text-[#172B4D]">
                    {assigneeName}
                  </span>
                </div>
              )}
            </div>

            {/* Deadline */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#5E6C84] block">Hạn chót (Deadline)</label>
              <div
                className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-semibold ${
                  isOverdue
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : task.status === 'DONE'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-white text-[#172B4D] border-[#DFE1E6]'
                }`}
              >
                {isOverdue ? (
                  <AlertCircle size={15} className="text-red-600" />
                ) : task.status === 'DONE' ? (
                  <CheckCircle2 size={15} className="text-emerald-600" />
                ) : (
                  <Clock size={15} className="text-gray-500" />
                )}
                <span>{formatDate(task.deadline)}</span>
                {isOverdue && <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.2 rounded">Quá hạn</span>}
              </div>
            </div>

            {/* Metadata Dates: CreatedAt & UpdatedAt */}
            <div className="pt-3 border-t border-[#DFE1E6] space-y-2 text-[11px] text-[#5E6C84]">
              <div className="flex items-center justify-between">
                <span>Ngày tạo:</span>
                <strong className="text-[#172B4D] font-mono">{formatDateTime(task.createdAt)}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Cập nhật lần cuối:</span>
                <strong className="text-[#172B4D] font-mono">{formatDateTime(task.updatedAt)}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
