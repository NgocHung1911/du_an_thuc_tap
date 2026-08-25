package com.task.management.service;

import com.task.management.dto.response.TaskDTO;
import com.task.management.entity.Project;
import com.task.management.entity.ProjectMember;
import com.task.management.entity.Task;
import com.task.management.entity.User;
import com.task.management.enums.ProjectRole;
import com.task.management.exception.BadRequestException;
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

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProjectService projectService;

    @InjectMocks
    private TaskService taskService;

    private Project testProject;
    private Task testTask;
    private User validMember;
    private User nonMember;

    @BeforeEach
    void setUp() {
        testProject = new Project();
        testProject.setId(1L);
        testProject.setName("Test Project");

        validMember = new User();
        validMember.setId(10L);
        validMember.setUsername("valid_member");

        ProjectMember projectMember = ProjectMember.builder()
                .id(1L)
                .project(testProject)
                .user(validMember)
                .role(ProjectRole.MEMBER)
                .build();

        List<ProjectMember> members = new ArrayList<>();
        members.add(projectMember);
        testProject.setMembers(members);

        nonMember = new User();
        nonMember.setId(99L);
        nonMember.setUsername("non_member");

        testTask = new Task();
        testTask.setId(100L);
        testTask.setTitle("Test Task");
        testTask.setProject(testProject);
    }

    @Test
    @DisplayName("Gán task thành công cho người dùng thuộc dự án")
    void testAssignTaskToUser_Success() {
        when(taskRepository.findById(100L)).thenReturn(Optional.of(testTask));
        when(userRepository.findById(10L)).thenReturn(Optional.of(validMember));
        when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TaskDTO result = taskService.assignTaskToUser(100L, 10L);

        assertNotNull(result);
        assertEquals(10L, result.getUserId());
        assertEquals("valid_member", result.getUserFullName());
        verify(taskRepository, times(1)).save(testTask);
    }

    @Test
    @DisplayName("Gán task thất bại khi người dùng không thuộc dự án (Throw BadRequestException)")
    void testAssignTaskToUser_NonMember_ThrowsBadRequestException() {
        when(taskRepository.findById(100L)).thenReturn(Optional.of(testTask));
        when(userRepository.findById(99L)).thenReturn(Optional.of(nonMember));

        BadRequestException exception = assertThrows(BadRequestException.class, () -> {
            taskService.assignTaskToUser(100L, 99L);
        });

        assertEquals("Người dùng không thuộc dự án này!", exception.getMessage());
        verify(taskRepository, never()).save(any());
    }

    @Test
    @DisplayName("Hủy gán task thành công khi userId là null")
    void testAssignTaskToUser_Unassign_Success() {
        testTask.setUser(validMember);
        when(taskRepository.findById(100L)).thenReturn(Optional.of(testTask));
        when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TaskDTO result = taskService.assignTaskToUser(100L, null);

        assertNotNull(result);
        assertNull(result.getUserId());
        assertNull(result.getAssignedUser());
        verify(taskRepository, times(1)).save(testTask);
    }
}
