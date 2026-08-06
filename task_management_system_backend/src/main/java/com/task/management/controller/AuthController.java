package com.task.management.controller;

import com.task.management.config.security.JwtTokenProvider;
import com.task.management.dto.request.GoogleLoginRequestDTO;
import com.task.management.dto.request.LoginRequestDTO;
import com.task.management.dto.request.RegisterRequestDTO;
import com.task.management.dto.response.AuthResponseDTO;
import com.task.management.entity.User;
import com.task.management.enums.Role;
import com.task.management.repository.UserRepository;
import com.task.management.service.GoogleAuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final GoogleAuthService googleAuthService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequestDTO loginDTO) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginDTO.getUsername(),
                            loginDTO.getPassword()
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String token = tokenProvider.generateToken(authentication);

            User user = userRepository.findByUsername(loginDTO.getUsername()).orElse(null);
            List<String> roles = authentication.getAuthorities().stream()
                    .map(authority -> authority.getAuthority())
                    .collect(Collectors.toList());

            AuthResponseDTO response = AuthResponseDTO.builder()
                    .token(token)
                    .tokenType("Bearer")
                    .username(authentication.getName())
                    .email(user != null ? user.getEmail() : "")
                    .roles(roles)
                    .build();

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Tên đăng nhập hoặc mật khẩu không chính xác!"));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequestDTO registerDTO) {
        if (userRepository.existsByUsername(registerDTO.getUsername())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Tên đăng nhập đã được sử dụng!"));
        }

        if (userRepository.existsByEmail(registerDTO.getEmail())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Email đã được sử dụng!"));
        }

        User user = new User();
        user.setUsername(registerDTO.getUsername());
        user.setEmail(registerDTO.getEmail());
        user.setPassword(passwordEncoder.encode(registerDTO.getPassword()));
        
        // Mặc định là MEMBER nếu không chỉ định role
        user.setRole(registerDTO.getRole() != null ? registerDTO.getRole() : Role.MEMBER);

        userRepository.save(user);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "Đăng ký tài khoản thành công!", "username", user.getUsername()));
    }

    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@Valid @RequestBody GoogleLoginRequestDTO googleLoginDTO) {
        try {
            AuthResponseDTO response = googleAuthService.processGoogleLogin(googleLoginDTO.getIdToken());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage() != null ? e.getMessage() : "Đăng nhập Google thất bại!"));
        }
    }
}
