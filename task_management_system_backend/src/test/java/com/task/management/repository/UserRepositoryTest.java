package com.task.management.repository;

import com.task.management.entity.User;
import com.task.management.enums.Role;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserRepositoryTest {

    @Mock
    private UserRepository userRepository;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = new User();
        sampleUser.setId(1L);
        sampleUser.setUsername("john_doe");
        sampleUser.setPassword("password123");
        sampleUser.setEmail("john@example.com");
        sampleUser.setVerified(true);
        sampleUser.setRole(Role.MEMBER);
    }

    @Test
    @DisplayName("UserRepository - findByUsername: Tìm thấy người dùng khi username hợp lệ")
    void testFindByUsername_Success() {
        when(userRepository.findByUsername("john_doe")).thenReturn(Optional.of(sampleUser));

        Optional<User> result = userRepository.findByUsername("john_doe");

        assertTrue(result.isPresent(), "Phải tìm thấy user với username 'john_doe'");
        assertEquals("john_doe", result.get().getUsername());
        assertEquals("john@example.com", result.get().getEmail());
        verify(userRepository, times(1)).findByUsername("john_doe");
    }

    @Test
    @DisplayName("UserRepository - findByUsername: Trả về Optional.empty khi không tìm thấy username")
    void testFindByUsername_NotFound() {
        when(userRepository.findByUsername("unknown_user")).thenReturn(Optional.empty());

        Optional<User> result = userRepository.findByUsername("unknown_user");

        assertFalse(result.isPresent(), "Không được tìm thấy user với username không tồn tại");
        verify(userRepository, times(1)).findByUsername("unknown_user");
    }

    @Test
    @DisplayName("UserRepository - findByEmail: Tìm thấy người dùng khi email hợp lệ")
    void testFindByEmail_Success() {
        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(sampleUser));

        Optional<User> result = userRepository.findByEmail("john@example.com");

        assertTrue(result.isPresent(), "Phải tìm thấy user với email 'john@example.com'");
        assertEquals("john_doe", result.get().getUsername());
        assertEquals("john@example.com", result.get().getEmail());
        verify(userRepository, times(1)).findByEmail("john@example.com");
    }

    @Test
    @DisplayName("UserRepository - findByEmail: Trả về Optional.empty khi không tìm thấy email")
    void testFindByEmail_NotFound() {
        when(userRepository.findByEmail("notfound@example.com")).thenReturn(Optional.empty());

        Optional<User> result = userRepository.findByEmail("notfound@example.com");

        assertFalse(result.isPresent(), "Không được tìm thấy user với email không tồn tại");
        verify(userRepository, times(1)).findByEmail("notfound@example.com");
    }

    @Test
    @DisplayName("UserRepository - existsByUsername: Trả về true khi username tồn tại")
    void testExistsByUsername_ReturnsTrue() {
        when(userRepository.existsByUsername("john_doe")).thenReturn(true);

        boolean exists = userRepository.existsByUsername("john_doe");

        assertTrue(exists, "existsByUsername phải trả về true khi username tồn tại");
        verify(userRepository, times(1)).existsByUsername("john_doe");
    }

    @Test
    @DisplayName("UserRepository - existsByUsername: Trả về false khi username không tồn tại")
    void testExistsByUsername_ReturnsFalse() {
        when(userRepository.existsByUsername("unknown_user")).thenReturn(false);

        boolean exists = userRepository.existsByUsername("unknown_user");

        assertFalse(exists, "existsByUsername phải trả về false khi username không tồn tại");
        verify(userRepository, times(1)).existsByUsername("unknown_user");
    }

    @Test
    @DisplayName("UserRepository - existsByEmail: Trả về true khi email tồn tại")
    void testExistsByEmail_ReturnsTrue() {
        when(userRepository.existsByEmail("john@example.com")).thenReturn(true);

        boolean exists = userRepository.existsByEmail("john@example.com");

        assertTrue(exists, "existsByEmail phải trả về true khi email tồn tại");
        verify(userRepository, times(1)).existsByEmail("john@example.com");
    }

    @Test
    @DisplayName("UserRepository - existsByEmail: Trả về false khi email không tồn tại")
    void testExistsByEmail_ReturnsFalse() {
        when(userRepository.existsByEmail("notfound@example.com")).thenReturn(false);

        boolean exists = userRepository.existsByEmail("notfound@example.com");

        assertFalse(exists, "existsByEmail phải trả về false khi email không tồn tại");
        verify(userRepository, times(1)).existsByEmail("notfound@example.com");
    }
}
