package com.task.management;

import com.task.management.dto.response.UserDTO;
import com.task.management.entity.User;
import com.task.management.enums.Role;
import com.task.management.repository.UserRepository;
import com.task.management.service.UserService;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;

@SpringBootTest
public class AvatarUploadIntegrationTest {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Test
    public void testAvatarUploadEndToEnd() {
        String testUsername = "avatar_test_user";
        User user = userRepository.findByUsername(testUsername).orElseGet(() -> {
            User newUser = new User();
            newUser.setUsername(testUsername);
            newUser.setEmail("avatar_test_user@example.com");
            newUser.setFullName("Test Avatar User");
            newUser.setPassword("password123");
            newUser.setRole(Role.MEMBER);
            newUser.setVerified(true);
            return userRepository.save(newUser);
        });

        byte[] imageBytes = new byte[] { (byte)0x89, 'P', 'N', 'G', '\r', '\n', 0x1a, '\n' };
        MockMultipartFile mockFile = new MockMultipartFile(
                "file",
                "avatar_test.png",
                "image/png",
                imageBytes
        );

        System.out.println("\n========================================================");
        System.out.println("Uploading Avatar for User: " + testUsername);
        UserDTO updatedUser = userService.updateAvatar(testUsername, mockFile);

        System.out.println("UPDATED USER DTO:");
        System.out.println("  ID: " + updatedUser.getId());
        System.out.println("  Username: " + updatedUser.getUsername());
        System.out.println("  Avatar URL: " + updatedUser.getAvatarUrl());
        System.out.println("========================================================\n");

        Assertions.assertNotNull(updatedUser.getAvatarUrl());
        Assertions.assertTrue(updatedUser.getAvatarUrl().startsWith("https://pub-639c6583d9764eecb5cd8a0c44eb3bc9.r2.dev/avatars/"));

        User dbUser = userRepository.findByUsername(testUsername).orElseThrow();
        Assertions.assertEquals(updatedUser.getAvatarUrl(), dbUser.getAvatarUrl());
    }
}
