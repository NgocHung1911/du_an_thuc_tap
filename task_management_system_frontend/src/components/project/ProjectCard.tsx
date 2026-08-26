import React from 'react';
import { Calendar, Edit3, Trash2, CheckSquare, ArrowUpRight } from 'lucide-react';
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
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'IN_PROGRESS':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'ON_HOLD':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div
      onClick={() => onCardClick(project.id)}
      className="bg-white rounded-xl border border-slate-200 hover:border-blue-500 hover:shadow-lg transition-all duration-200 cursor-pointer p-5 flex flex-col justify-between group relative shadow-2xs space-y-4"
    >
      {/* Top Header Row */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadgeStyle(
              project.status
            )}`}
          >
            {project.status || 'PLANNING'}
          </span>

          {/* Top Right Action & Link Indicator */}
          <div className="flex items-center gap-1">
            {isAdmin && (
              <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onEditClick) onEditClick(project);
                  }}
                  className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500 hover:text-blue-600 transition-colors"
                  title="Edit project details"
                >
                  <Edit3 size={15} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onDeleteClick) onDeleteClick(project);
                  }}
                  className="p-1.5 hover:bg-red-50 rounded-md text-slate-400 hover:text-red-600 transition-colors"
                  title="Delete project"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            )}
            <div className="p-1 text-slate-300 group-hover:text-blue-600 transition-colors">
              <ArrowUpRight size={18} />
            </div>
          </div>
        </div>

        {/* Project Title & Description */}
        <div>
          <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors leading-snug line-clamp-1">
            {project.name}
          </h3>
          <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
            {project.description || 'No description provided.'}
          </p>
        </div>
      </div>

      {/* Bottom Metadata Bar */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
          <Calendar size={13} className="text-slate-400 shrink-0" />
          <span className="font-medium text-[11px]">
            {project.startDate || 'N/A'} &rarr; {project.endDate || 'N/A'}
          </span>
        </div>

        {project.taskCount !== undefined && (
          <div className="flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md text-[11px]">
            <CheckSquare size={13} className="text-blue-600" />
            <span>{project.taskCount} {project.taskCount === 1 ? 'task' : 'tasks'}</span>
          </div>
        )}
      </div>
    </div>
  );
};


