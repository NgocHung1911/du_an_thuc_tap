package com.task.management.service;

import com.task.management.dto.request.ProjectRequest;
import com.task.management.dto.response.ProjectDTO;
import com.task.management.entity.Project;
import com.task.management.enums.ProjectStatus;
import com.task.management.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;

    private ProjectDTO mapToDTO(Project project) {
        int taskCount = (project.getTasks() != null) ? project.getTasks().size() : 0;
        return ProjectDTO.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .startDate(project.getStartDate())
                .endDate(project.getEndDate())
                .status(project.getStatus())
                .taskCount(taskCount)
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .build();
    }

    private Project mapToEntity(ProjectRequest request) {
        Project project = new Project();
        project.setName(request.getName().trim());
        project.setDescription(request.getDescription());
        project.setStartDate(request.getStartDate());
        project.setEndDate(request.getEndDate());
        project.setStatus(request.getStatus() != null ? request.getStatus() : ProjectStatus.PLANNING);
        return project;
    }

    @Transactional(readOnly = true)
    public List<ProjectDTO> getAllProjects() {
        return getAllProjects(null, null);
    }

    @Transactional(readOnly = true)
    public List<ProjectDTO> getAllProjects(String search, ProjectStatus status) {
        return projectRepository.searchProjects(search, status)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProjectDTO getProjectById(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy dự án với ID: " + id));
        return mapToDTO(project);
    }

    @Transactional
    public ProjectDTO createProject(ProjectRequest request) {
        if (projectRepository.existsByName(request.getName().trim())) {
            throw new RuntimeException("Tên dự án đã tồn tại!");
        }
        Project project = mapToEntity(request);
        Project savedProject = projectRepository.save(project);
        return mapToDTO(savedProject);
    }

    @Transactional
    public ProjectDTO updateProject(Long id, ProjectRequest request) {
        Project existingProject = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy dự án với ID: " + id));

        String newName = request.getName().trim();
        if (!existingProject.getName().equalsIgnoreCase(newName) && projectRepository.existsByName(newName)) {
            throw new RuntimeException("Tên dự án mới đã trùng với dự án khác!");
        }

        existingProject.setName(newName);
        existingProject.setDescription(request.getDescription());
        existingProject.setStartDate(request.getStartDate());
        existingProject.setEndDate(request.getEndDate());
        if (request.getStatus() != null) {
            existingProject.setStatus(request.getStatus());
        }

        Project updatedProject = projectRepository.save(existingProject);
        return mapToDTO(updatedProject);
    }

    @Transactional
    public void deleteProject(Long id) {
        Project existingProject = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy dự án với ID: " + id));
        projectRepository.delete(existingProject);
    }
}