import React from 'react';
import { Calendar, ArrowRight, Edit3, Trash2 } from 'lucide-react';
import { ProjectDTO, ProjectStatus } from '../../services/projectApi';

interface ProjectCardProps {
  project: ProjectDTO;
  isAdmin?: boolean;
  onCardClick: (projectId: number) => void;
  onEditClick?: (project: ProjectDTO) => void;
  onDeleteClick?: (project: ProjectDTO) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  isAdmin = false,
  onCardClick,
  onEditClick,
  onDeleteClick,
}) => {
  const getStatusBadgeStyle = (status?: ProjectStatus | string) => {
    switch (status) {
      case 'PLANNING':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'IN_PROGRESS':
        return 'bg-[#DEEBFF] text-[#0747A6] border-[#B3D4FF]';
      case 'COMPLETED':
        return 'bg-[#E3FCEF] text-[#006644] border-[#ABF5D1]';
      case 'ON_HOLD':
        return 'bg-[#FFF0B3] text-[#894000] border-[#FFE380]';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div
      onClick={() => onCardClick(project.id)}
      className="bg-white p-5 rounded-xl border border-[#DFE1E6] hover:border-[#0052CC] hover:shadow-md transition-all duration-200 cursor-pointer space-y-4 group relative flex flex-col justify-between"
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-[#0052CC] bg-[#DEEBFF] px-2.5 py-1 rounded-md border border-[#B3D4FF]">
            PROJ-{project.id}
          </span>

          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getStatusBadgeStyle(
              project.status
            )}`}
          >
            {project.status || 'PLANNING'}
          </span>
        </div>

        <h3 className="font-bold text-lg text-[#172B4D] group-hover:text-[#0052CC] transition-colors">
          {project.name}
        </h3>
        <p className="text-sm text-[#5E6C84] line-clamp-2">
          {project.description || 'Chưa có mô tả dự án.'}
        </p>
      </div>

      <div className="pt-3 border-t border-[#F4F5F7] space-y-3">
        <div className="flex items-center justify-between text-xs text-[#5E6C84]">
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

        {/* Footer Action Buttons */}
        <div className="flex items-center justify-between pt-1">
          {isAdmin && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onEditClick) onEditClick(project);
                }}
                className="p-1.5 hover:bg-[#EBECF0] rounded text-[#5E6C84] hover:text-[#0052CC] transition-colors"
                title="Chỉnh sửa dự án"
              >
                <Edit3 size={15} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onDeleteClick) onDeleteClick(project);
                }}
                className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-600 transition-colors"
                title="Xóa dự án"
              >
                <Trash2 size={15} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
