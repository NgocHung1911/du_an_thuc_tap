import React from 'react';
import { Calendar, Edit3, Trash2, ArrowUpRight } from 'lucide-react';
import { ProjectDTO, ProjectStatus } from '../../services/projectApi';

interface ProjectCardProps {
  project: ProjectDTO;
  isAdmin?: boolean;
  onCardClick: (projectId: number) => void;
  onEditClick?: (project: ProjectDTO) => void;
  onDeleteClick?: (project: ProjectDTO) => void;
  onStatusChange?: (projectId: number, newStatus: ProjectStatus) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  isAdmin = false,
  onCardClick,
  onEditClick,
  onDeleteClick,
  onStatusChange,
}) => {
  const getStatusBadgeStyle = (status?: ProjectStatus | string) => {
    switch (status) {
      case 'PLANNING':
        return 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200';
      case 'IN_PROGRESS':
        return 'bg-[#DEEBFF] text-[#0747A6] border-[#B3D4FF] hover:bg-[#C0DAFF]';
      case 'COMPLETED':
        return 'bg-[#E3FCEF] text-[#006644] border-[#ABF5D1] hover:bg-[#C3F8DD]';
      case 'ON_HOLD':
        return 'bg-[#FFF0B3] text-[#894000] border-[#FFE380] hover:bg-[#FFE899]';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div
      onClick={() => onCardClick(project.id)}
      className="bg-white p-5 rounded-xl border border-[#DFE1E6] hover:border-[#0052CC] hover:shadow-md transition-all duration-200 cursor-pointer space-y-4 group relative flex flex-col justify-between"
    >
      {/* Top Header Row */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-mono font-bold text-[#0052CC] bg-[#DEEBFF] px-2.5 py-1 rounded-md border border-[#B3D4FF]">
            PROJ-{project.id}
          </span>

          <div className="flex items-center gap-2">
            {onStatusChange ? (
              <select
                value={project.status || 'PLANNING'}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                onChange={(e) => {
                  e.stopPropagation();
                  onStatusChange(project.id, e.target.value as ProjectStatus);
                }}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full border outline-none cursor-pointer transition-colors shadow-2xs ${getStatusBadgeStyle(
                  project.status
                )}`}
                title="Thay đổi trạng thái dự án"
              >
                <option value="PLANNING" className="bg-white text-slate-800 font-medium">PLANNING</option>
                <option value="IN_PROGRESS" className="bg-white text-slate-800 font-medium">IN_PROGRESS</option>
                <option value="COMPLETED" className="bg-white text-slate-800 font-medium">COMPLETED</option>
                <option value="ON_HOLD" className="bg-white text-slate-800 font-medium">ON_HOLD</option>
              </select>
            ) : (
              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${getStatusBadgeStyle(
                  project.status
                )}`}
              >
                {project.status || 'PLANNING'}
              </span>
            )}

            {(isAdmin || onEditClick || onDeleteClick) && (
              <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                {onEditClick && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditClick(project);
                    }}
                    className="p-1.5 hover:bg-[#EBECF0] rounded text-[#5E6C84] hover:text-[#0052CC] transition-colors"
                    title="Chỉnh sửa dự án"
                  >
                    <Edit3 size={15} />
                  </button>
                )}
                {onDeleteClick && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteClick(project);
                    }}
                    className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-600 transition-colors"
                    title="Xóa dự án"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            )}
            <div className="p-1 text-slate-300 group-hover:text-blue-600 transition-colors">
              <ArrowUpRight size={18} />
            </div>
          </div>
        </div>

        <h3 className="font-bold text-lg text-[#172B4D] group-hover:text-[#0052CC] transition-colors">
          {project.name}
        </h3>
        <p className="text-sm text-[#5E6C84] line-clamp-2">
          {project.description || 'Chưa có mô tả dự án.'}
        </p>
      </div>

      <div className="pt-3 border-t border-[#F4F5F7] flex items-center justify-between text-xs text-[#5E6C84]">
        <div className="flex items-center gap-1">
          <Calendar size={14} />
          <span>
            {project.startDate || 'N/A'} &rarr; {project.endDate || 'N/A'}
          </span>
        </div>

        {project.taskCount !== undefined && (
          <span className="font-semibold text-[#172B4D]">
            {project.taskCount} công việc
          </span>
        )}
      </div>
    </div>
  );
};
