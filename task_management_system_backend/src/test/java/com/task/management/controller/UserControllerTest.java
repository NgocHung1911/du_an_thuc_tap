package com.task.management.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.task.management.dto.request.UserRequest;
import com.task.management.dto.response.UserDTO;
import com.task.management.enums.Role;
import com.task.management.exception.GlobalExceptionHandler;
import com.task.management.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private UserService userService;

    @Test
    void getAllUsers_returnsUserList() throws Exception {
        when(userService.getAllUsers()).thenReturn(List.of(userDto(1L, "hung", "hung@example.com", Role.MEMBER)));

        mockMvc.perform(get("/api/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].username").value("hung"))
                .andExpect(jsonPath("$[0].email").value("hung@example.com"))
                .andExpect(jsonPath("$[0].role").value("MEMBER"))
                .andExpect(jsonPath("$[0].password").doesNotExist());
    }

    @Test
    void getUserById_returnsUser() throws Exception {
        when(userService.getUserById(1L)).thenReturn(userDto(1L, "hung", "hung@example.com", Role.MEMBER));

        mockMvc.perform(get("/api/users/{id}", 1L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.username").value("hung"))
                .andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    void createUser_returnsCreatedUser() throws Exception {
        UserRequest request = userRequest("hung", "secret123", "hung@example.com", Role.MEMBER);
        when(userService.createUser(any(UserRequest.class)))
                .thenReturn(userDto(1L, "hung", "hung@example.com", Role.MEMBER));

        mockMvc.perform(post("/api/users").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.username").value("hung"))
                .andExpect(jsonPath("$.password").doesNotExist());

        verify(userService).createUser(any(UserRequest.class));
    }

    @Test
    void createUser_withInvalidRequest_returnsBadRequest() throws Exception {
        UserRequest request = userRequest("ab", "123", "invalid-email", null);

        mockMvc.perform(post("/api/users").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    void updateUser_returnsUpdatedUser() throws Exception {
        UserRequest request = userRequest("hung-updated", "secret123", "updated@example.com", Role.ADMIN);
        when(userService.updateUser(eq(1L), any(UserRequest.class)))
                .thenReturn(userDto(1L, "hung-updated", "updated@example.com", Role.ADMIN));

        mockMvc.perform(put("/api/users/{id}", 1L).contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("hung-updated"))
                .andExpect(jsonPath("$.role").value("ADMIN"))
                .andExpect(jsonPath("$.password").doesNotExist());

        verify(userService).updateUser(eq(1L), any(UserRequest.class));
    }

    @Test
    void deleteUser_returnsSuccessMessage() throws Exception {
        doNothing().when(userService).deleteUser(1L);

        mockMvc.perform(delete("/api/users/{id}", 1L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").value("Xóa User thành công với ID: 1"));

        verify(userService).deleteUser(1L);
    }

    @Test
    void getUserById_whenServiceFails_returnsInternalServerError() throws Exception {
        doThrow(new RuntimeException("Không tìm thấy User với ID: 99")).when(userService).getUserById(99L);

        mockMvc.perform(get("/api/users/{id}", 99L))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("Không tìm thấy User với ID: 99"));
    }

    @Test
    void createUser_whenServiceRejectsDuplicate_returnsInternalServerError() throws Exception {
        UserRequest request = userRequest("hung", "secret123", "hung@example.com", Role.MEMBER);
        doThrow(new RuntimeException("Username đã tồn tại!")).when(userService).createUser(any(UserRequest.class));

        mockMvc.perform(post("/api/users").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("Username đã tồn tại!"));
    }

    private UserDTO userDto(Long id, String username, String email, Role role) {
        return UserDTO.builder().id(id).username(username).email(email).role(role).build();
    }

    private UserRequest userRequest(String username, String password, String email, Role role) {
        return UserRequest.builder().username(username).password(password).email(email).role(role).build();
    }
}
