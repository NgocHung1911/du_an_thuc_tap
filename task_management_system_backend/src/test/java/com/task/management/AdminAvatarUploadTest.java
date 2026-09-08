package com.task.management;

import com.task.management.dto.response.UserDTO;
import com.task.management.entity.User;
import com.task.management.repository.UserRepository;
import com.task.management.service.UserService;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;

@SpringBootTest
public class AdminAvatarUploadTest {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Test
    public void testAdminAvatarUpload() {
        String adminUsername = "tranngochung19112004";
        User adminUser = userRepository.findByUsername(adminUsername).orElseThrow();

        byte[] imageBytes = new byte[] { (byte)0x89, 'P', 'N', 'G', '\r', '\n', 0x1a, '\n' };
        MockMultipartFile mockFile = new MockMultipartFile(
                "file",
                "admin_avatar.png",
                "image/png",
                imageBytes
        );

        System.out.println("\n========================================================");
        System.out.println("Uploading Avatar for ADMIN User: " + adminUsername + " (Role: " + adminUser.getRole() + ")");
        
        try {
            UserDTO updatedUser = userService.updateAvatar(adminUsername, mockFile);
            System.out.println("UPDATED ADMIN USER DTO:");
            System.out.println("  ID: " + updatedUser.getId());
            System.out.println("  Username: " + updatedUser.getUsername());
            System.out.println("  Role: " + updatedUser.getRole());
            System.out.println("  Avatar URL: " + updatedUser.getAvatarUrl());
            System.out.println("========================================================\n");

            Assertions.assertNotNull(updatedUser.getAvatarUrl());
            Assertions.assertTrue(updatedUser.getAvatarUrl().startsWith("https://pub-639c6583d9764eecb5cd8a0c44eb3bc9.r2.dev/avatars/"));
        } catch (Exception e) {
            System.err.println("ADMIN AVATAR UPLOAD FAILED WITH EXCEPTION:");
            e.printStackTrace();
            Assertions.fail(e.getMessage());
        }
    }
}
