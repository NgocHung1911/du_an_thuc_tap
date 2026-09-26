package com.task.management.service;

import com.task.management.dto.request.ProjectRequest;
import com.task.management.dto.response.ProjectDTO;
import com.task.management.dto.response.TaskDTO;
import com.task.management.dto.response.UserDTO;
import com.task.management.entity.Project;
import com.task.management.entity.ProjectMember;
import com.task.management.entity.Task;
import com.task.management.entity.User;
import com.task.management.enums.ProjectRole;
import com.task.management.enums.Role;
import com.task.management.enums.TaskPriority;
import com.task.management.enums.TaskStatus;
import com.task.management.repository.ProjectMemberRepository;
import com.task.management.repository.ProjectRepository;
import com.task.management.repository.TaskRepository;
import com.task.management.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.AccessDeniedException;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProjectSecurityAccessTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProjectMemberRepository projectMemberRepository;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private ProjectService projectService;

    private Project testProject;
    private User ownerUser;
    private User adminMemberUser;
    private User regularMemberUser;
    private User systemAdminUser;
    private User outsiderUser;

    @BeforeEach
    void setUp() {
        ownerUser = new User();
        ownerUser.setId(1L);
        ownerUser.setUsername("owner");
        ownerUser.setEmail("owner@task.com");
        ownerUser.setRole(Role.MEMBER);

        adminMemberUser = new User();
        adminMemberUser.setId(2L);
        adminMemberUser.setUsername("project_admin");
        adminMemberUser.setEmail("p_admin@task.com");
        adminMemberUser.setRole(Role.MEMBER);

        regularMemberUser = new User();
        regularMemberUser.setId(3L);
        regularMemberUser.setUsername("project_member");
        regularMemberUser.setEmail("p_member@task.com");
        regularMemberUser.setRole(Role.MEMBER);

        systemAdminUser = new User();
        systemAdminUser.setId(4L);
        systemAdminUser.setUsername("sys_admin");
        systemAdminUser.setEmail("sys_admin@task.com");
        systemAdminUser.setRole(Role.ADMIN);

        outsiderUser = new User();
        outsiderUser.setId(5L);
        outsiderUser.setUsername("outsider");
        outsiderUser.setEmail("outsider@task.com");
        outsiderUser.setRole(Role.MEMBER);

        testProject = new Project();
        testProject.setId(100L);
        testProject.setName("Security Test Project");
        testProject.setUser(ownerUser);

        List<ProjectMember> members = new ArrayList<>();
        members.add(ProjectMember.builder().id(1L).project(testProject).user(ownerUser).role(ProjectRole.OWNER).build());
        members.add(ProjectMember.builder().id(2L).project(testProject).user(adminMemberUser).role(ProjectRole.ADMIN).build());
        members.add(ProjectMember.builder().id(3L).project(testProject).user(regularMemberUser).role(ProjectRole.MEMBER).build());
        testProject.setMembers(members);
    }

    @Test
    @DisplayName("1. Member thuộc Project truy cập thành công")
    void testGetProjectById_MemberAllowed() {
        when(projectRepository.findById(100L)).thenReturn(Optional.of(testProject));
        when(userRepository.findByUsername("project_member")).thenReturn(Optional.of(regularMemberUser));
        when(projectMemberRepository.findByProjectIdAndUserId(100L, 3L))
                .thenReturn(Optional.of(ProjectMember.builder().project(testProject).user(regularMemberUser).role(ProjectRole.MEMBER).build()));

        ProjectDTO dto = projectService.getProjectById(100L, "project_member");
        assertNotNull(dto);
        assertEquals(100L, dto.getId());
    }

    @Test
    @DisplayName("2. Project OWNER truy cập thành công")
    void testGetProjectById_OwnerAllowed() {
        when(projectRepository.findById(100L)).thenReturn(Optional.of(testProject));
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));
        when(projectMemberRepository.findByProjectIdAndUserId(100L, 1L))
                .thenReturn(Optional.of(ProjectMember.builder().project(testProject).user(ownerUser).role(ProjectRole.OWNER).build()));

        ProjectDTO dto = projectService.getProjectById(100L, "owner");
        assertNotNull(dto);
        assertEquals(100L, dto.getId());
    }

    @Test
    @DisplayName("3. Project ADMIN truy cập thành công")
    void testGetProjectById_ProjectAdminAllowed() {
        when(projectRepository.findById(100L)).thenReturn(Optional.of(testProject));
        when(userRepository.findByUsername("project_admin")).thenReturn(Optional.of(adminMemberUser));
        when(projectMemberRepository.findByProjectIdAndUserId(100L, 2L))
                .thenReturn(Optional.of(ProjectMember.builder().project(testProject).user(adminMemberUser).role(ProjectRole.ADMIN).build()));

        ProjectDTO dto = projectService.getProjectById(100L, "project_admin");
        assertNotNull(dto);
        assertEquals(100L, dto.getId());
    }

    @Test
    @DisplayName("4. System ADMIN truy cập thành công mọi Project")
    void testGetProjectById_SystemAdminAllowed() {
        when(projectRepository.findById(100L)).thenReturn(Optional.of(testProject));
        when(userRepository.findByUsername("sys_admin")).thenReturn(Optional.of(systemAdminUser));

        ProjectDTO dto = projectService.getProjectById(100L, "sys_admin");
        assertNotNull(dto);
        assertEquals(100L, dto.getId());
    }

    @Test
    @DisplayName("5. User không thuộc Project bị từ chối truy cập (Throw AccessDeniedException)")
    void testGetProjectById_OutsiderDenied() {
        when(projectRepository.findById(100L)).thenReturn(Optional.of(testProject));
        when(userRepository.findByUsername("outsider")).thenReturn(Optional.of(outsiderUser));
        when(projectMemberRepository.findByProjectIdAndUserId(100L, 5L)).thenReturn(Optional.empty());

        assertThrows(AccessDeniedException.class, () -> {
            projectService.getProjectById(100L, "outsider");
        });
    }

    @Test
    @DisplayName("6. User không thuộc Project cố lấy danh sách thành viên bị từ chối")
    void testGetProjectMembers_OutsiderDenied() {
        when(projectRepository.findById(100L)).thenReturn(Optional.of(testProject));
        when(userRepository.findByUsername("outsider")).thenReturn(Optional.of(outsiderUser));
        when(projectMemberRepository.findByProjectIdAndUserId(100L, 5L)).thenReturn(Optional.empty());

        assertThrows(AccessDeniedException.class, () -> {
            projectService.getProjectMembers(100L, "outsider");
        });
    }

    @Test
    @DisplayName("7. Regular MEMBER không có quyền cập nhật Project")
    void testUpdateProject_RegularMemberDenied() {
        when(projectRepository.findById(100L)).thenReturn(Optional.of(testProject));
        when(userRepository.findByUsername("project_member")).thenReturn(Optional.of(regularMemberUser));
        when(projectMemberRepository.findByProjectIdAndUserId(100L, 3L))
                .thenReturn(Optional.of(ProjectMember.builder().project(testProject).user(regularMemberUser).role(ProjectRole.MEMBER).build()));

        ProjectRequest updateReq = new ProjectRequest();
        updateReq.setName("New Project Name");

        assertThrows(AccessDeniedException.class, () -> {
            projectService.updateProject(100L, updateReq, "project_member");
        });
    }
}
