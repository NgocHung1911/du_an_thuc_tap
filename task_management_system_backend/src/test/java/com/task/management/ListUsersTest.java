package com.task.management;

import com.task.management.entity.User;
import com.task.management.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

@SpringBootTest
public class ListUsersTest {

    @Autowired
    private UserRepository userRepository;

    @Test
    public void listAllUsersInDb() {
        List<User> users = userRepository.findAll();
        System.out.println("\n========================================================");
        System.out.println("ALL USERS IN DATABASE (Total: " + users.size() + "):");
        for (User u : users) {
            System.out.println(String.format("ID: %d | Username: %s | Email: %s | Role: %s | Verified: %s | Avatar: %s",
                    u.getId(), u.getUsername(), u.getEmail(), u.getRole(), u.isVerified(), u.getAvatarUrl()));
        }
        System.out.println("========================================================\n");
    }
}
