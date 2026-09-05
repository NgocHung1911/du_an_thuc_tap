package com.task.management.service;

import com.task.management.dto.request.UserRequest;
import com.task.management.dto.response.UserDTO;
import com.task.management.entity.User;
import com.task.management.enums.Role;
import com.task.management.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private User sampleUser1;
    private User sampleUser2;
    private UserRequest sampleRequest;

    @BeforeEach
    void setUp() {
        sampleUser1 = new User();
        sampleUser1.setId(1L);
        sampleUser1.setUsername("user_one");
        sampleUser1.setPassword("encoded_pass_1");
        sampleUser1.setEmail("user1@example.com");
        sampleUser1.setRole(Role.MEMBER);

        sampleUser2 = new User();
        sampleUser2.setId(2L);
        sampleUser2.setUsername("user_two");
        sampleUser2.setPassword("encoded_pass_2");
        sampleUser2.setEmail("user2@example.com");
        sampleUser2.setRole(Role.ADMIN);

        sampleRequest = UserRequest.builder()
                .username("new_user")
                .password("raw_password")
                .email("newuser@example.com")
                .role(Role.MEMBER)
                .build();
    }

    // --- 1. Test getAllUsers ---

    @Test
    @DisplayName("Lấy tất cả danh sách người dùng - Thành công (Có dữ liệu)")
    void testGetAllUsers_Success() {
        when(userRepository.findAll()).thenReturn(List.of(sampleUser1, sampleUser2));

        List<UserDTO> result = userService.getAllUsers();

        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("user_one", result.get(0).getUsername());
        assertEquals("user_two", result.get(1).getUsername());
        verify(userRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Lấy tất cả danh sách người dùng - Danh sách rỗng")
    void testGetAllUsers_EmptyList() {
        when(userRepository.findAll()).thenReturn(Collections.emptyList());

        List<UserDTO> result = userService.getAllUsers();

        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(userRepository, times(1)).findAll();
    }

    // --- 2. Test getUserById ---

    @Test
    @DisplayName("Lấy thông tin người dùng theo ID - Thành công")
    void testGetUserById_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser1));

        UserDTO result = userService.getUserById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("user_one", result.getUsername());
        assertEquals("user1@example.com", result.getEmail());
        verify(userRepository, times(1)).findById(1L);
    }

    @Test
    @DisplayName("Lấy thông tin người dùng theo ID - Thất bại (Ngoại lệ khi không tìm thấy ID)")
    void testGetUserById_NotFound_ThrowsException() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            userService.getUserById(99L);
        });

        assertEquals("Không tìm thấy User với ID: 99", exception.getMessage());
        verify(userRepository, times(1)).findById(99L);
    }

    // --- 3. Test createUser ---

    @Test
    @DisplayName("Tạo mới người dùng - Thành công")
    void testCreateUser_Success() {
        when(userRepository.existsByUsername("new_user")).thenReturn(false);
        when(userRepository.existsByEmail("newuser@example.com")).thenReturn(false);
        when(passwordEncoder.encode("raw_password")).thenReturn("encoded_pass");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(10L);
            return u;
        });

        UserDTO result = userService.createUser(sampleRequest);

        assertNotNull(result);
        assertEquals(10L, result.getId());
        assertEquals("new_user", result.getUsername());
        assertEquals("newuser@example.com", result.getEmail());
        assertEquals(Role.MEMBER, result.getRole());

        verify(userRepository, times(1)).existsByUsername("new_user");
        verify(userRepository, times(1)).existsByEmail("newuser@example.com");
        verify(passwordEncoder, times(1)).encode("raw_password");
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    @DisplayName("Tạo mới người dùng - Thất bại do Username đã tồn tại")
    void testCreateUser_DuplicateUsername_ThrowsException() {
        when(userRepository.existsByUsername("new_user")).thenReturn(true);

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            userService.createUser(sampleRequest);
        });

        assertEquals("Username đã tồn tại!", exception.getMessage());
        verify(userRepository, times(1)).existsByUsername("new_user");
        verify(userRepository, never()).existsByEmail(anyString());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Tạo mới người dùng - Thất bại do Email đã tồn tại")
    void testCreateUser_DuplicateEmail_ThrowsException() {
        when(userRepository.existsByUsername("new_user")).thenReturn(false);
        when(userRepository.existsByEmail("newuser@example.com")).thenReturn(true);

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            userService.createUser(sampleRequest);
        });

        assertEquals("Email đã tồn tại!", exception.getMessage());
        verify(userRepository, times(1)).existsByUsername("new_user");
        verify(userRepository, times(1)).existsByEmail("newuser@example.com");
        verify(userRepository, never()).save(any(User.class));
    }

    // --- 4. Test updateUser ---

    @Test
    @DisplayName("Cập nhật người dùng - Thành công (Có thay đổi password)")
    void testUpdateUser_Success_WithNewPassword() {
        UserRequest updateRequest = UserRequest.builder()
                .username("updated_name")
                .email("updated@example.com")
                .password("new_secret_pass")
                .role(Role.ADMIN)
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser1));
        when(passwordEncoder.encode("new_secret_pass")).thenReturn("encoded_new_pass");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserDTO result = userService.updateUser(1L, updateRequest);

        assertNotNull(result);
        assertEquals("updated_name", result.getUsername());
        assertEquals("updated@example.com", result.getEmail());
        assertEquals(Role.ADMIN, result.getRole());

        verify(passwordEncoder, times(1)).encode("new_secret_pass");
        verify(userRepository, times(1)).save(sampleUser1);
    }

    @Test
    @DisplayName("Cập nhật người dùng - Thành công (Không thay đổi password)")
    void testUpdateUser_Success_WithoutPasswordChange() {
        UserRequest updateRequest = UserRequest.builder()
                .username("updated_name")
                .email("updated@example.com")
                .password("") // Rỗng -> Không cập nhật pass
                .role(Role.MEMBER)
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser1));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserDTO result = userService.updateUser(1L, updateRequest);

        assertNotNull(result);
        assertEquals("updated_name", result.getUsername());
        assertEquals("updated@example.com", result.getEmail());

        verify(passwordEncoder, never()).encode(anyString());
        verify(userRepository, times(1)).save(sampleUser1);
    }

    @Test
    @DisplayName("Cập nhật người dùng - Thất bại (Không tìm thấy User với ID)")
    void testUpdateUser_NotFound_ThrowsException() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            userService.updateUser(99L, sampleRequest);
        });

        assertEquals("Không tìm thấy User với ID: 99", exception.getMessage());
        verify(userRepository, times(1)).findById(99L);
        verify(userRepository, never()).save(any());
    }

    // --- 5. Test deleteUser ---

    @Test
    @DisplayName("Xóa người dùng - Thành công")
    void testDeleteUser_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser1));
        doNothing().when(userRepository).delete(sampleUser1);

        assertDoesNotThrow(() -> userService.deleteUser(1L));

        verify(userRepository, times(1)).findById(1L);
        verify(userRepository, times(1)).delete(sampleUser1);
    }

    @Test
    @DisplayName("Xóa người dùng - Thất bại (Không tìm thấy User với ID)")
    void testDeleteUser_NotFound_ThrowsException() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            userService.deleteUser(99L);
        });

        assertEquals("Không tìm thấy User với ID: 99", exception.getMessage());
        verify(userRepository, times(1)).findById(99L);
        verify(userRepository, never()).delete(any());
    }
}
