package com.task.management;

import com.task.management.entity.User;
import com.task.management.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootTest
public class UpdateAdminPasswordTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    public void resetAdminPassword() {
        User admin = userRepository.findByUsername("tranngochung19112004").orElseThrow();
        admin.setPassword(passwordEncoder.encode("123456"));
        userRepository.save(admin);
        System.out.println("ADMIN PASSWORD RESET SUCCESSFULLY TO '123456'");
    }
}
