package com.task.management.service;

import com.task.management.dto.request.ProjectRequest;
import com.task.management.dto.response.ProjectDTO;
import com.task.management.entity.Project;
import com.task.management.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;

    private ProjectDTO mapToDTO(Project project) {
        return ProjectDTO.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .startDate(project.getStartDate())
                .endDate(project.getEndDate())
                .status(project.getStatus())
                .build();
    }

    private Project mapToEntity(ProjectRequest request) {
        Project project = new Project();
        project.setName(request.getName());
        project.setDescription(request.getDescription());
        project.setStartDate(request.getStartDate());
        project.setEndDate(request.getEndDate());
        project.setStatus(request.getStatus());
        return project;
    }

    public List<ProjectDTO> getAllProjects() {
        return projectRepository.findAll()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public ProjectDTO getProjectById(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Project với ID: " + id));
        return mapToDTO(project);
    }

    public ProjectDTO createProject(ProjectRequest request) {
        if (projectRepository.existsByName(request.getName())) {
            throw new RuntimeException("Tên dự án đã tồn tại!");
        }
        Project project = mapToEntity(request);
        Project savedProject = projectRepository.save(project);
        return mapToDTO(savedProject);
    }

    public ProjectDTO updateProject(Long id, ProjectRequest request) {
        Project existingProject = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Project với ID: " + id));

        existingProject.setName(request.getName());
        existingProject.setDescription(request.getDescription());
        existingProject.setStartDate(request.getStartDate());
        existingProject.setEndDate(request.getEndDate());
        existingProject.setStatus(request.getStatus());

        Project updatedProject = projectRepository.save(existingProject);
        return mapToDTO(updatedProject);
    }

    public void deleteProject(Long id) {
        Project existingProject = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Project với ID: " + id));
        projectRepository.delete(existingProject);
    }
}