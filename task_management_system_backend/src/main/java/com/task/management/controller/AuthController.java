package com.task.management.controller;

import com.task.management.config.security.JwtTokenProvider;
import com.task.management.dto.request.GoogleLoginRequestDTO;
import com.task.management.dto.request.LoginRequestDTO;
import com.task.management.dto.request.RegisterRequestDTO;
import com.task.management.dto.request.ResendOtpRequestDTO;
import com.task.management.dto.request.VerifyOtpRequestDTO;
import com.task.management.dto.response.AuthResponseDTO;
import com.task.management.entity.User;
import com.task.management.enums.Role;
import com.task.management.repository.UserRepository;
import com.task.management.service.GoogleAuthService;
import com.task.management.service.OtpService;
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
    private final OtpService otpService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequestDTO loginDTO) {
        User user = userRepository.findByUsername(loginDTO.getUsername()).orElse(null);
        if (user != null && !user.isVerified()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "message", "Tài khoản chưa được xác thực OTP. Vui lòng xác thực email để đăng nhập!",
                            "isVerified", false,
                            "email", user.getEmail()
                    ));
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginDTO.getUsername(),
                            loginDTO.getPassword()
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String token = tokenProvider.generateToken(authentication);

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
        if (registerDTO.getFullName() != null && !registerDTO.getFullName().isBlank()) {
            user.setFullName(registerDTO.getFullName());
        }
        user.setPassword(passwordEncoder.encode(registerDTO.getPassword()));
        user.setVerified(false);
        user.setRole(registerDTO.getRole() != null ? registerDTO.getRole() : Role.MEMBER);

        userRepository.save(user);

        // Sinh mã OTP và gửi mail qua Brevo REST API
        try {
            otpService.generateAndSendOtp(user.getEmail());
        } catch (Exception e) {
            // Log lỡ gặp sự cố gửi mail
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of(
                        "message", "Đăng ký tài khoản thành công! Vui lòng kiểm tra email để nhập mã OTP xác thực.",
                        "username", user.getUsername(),
                        "email", user.getEmail(),
                        "isVerified", false
                ));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@Valid @RequestBody VerifyOtpRequestDTO verifyDto) {
        try {
            otpService.verifyOtp(verifyDto.getEmail(), verifyDto.getOtpCode());
            return ResponseEntity.ok(Map.of(
                    "message", "Xác thực tài khoản OTP thành công! Bạn có thể đăng nhập ngay bây giờ."
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage() != null ? e.getMessage() : "Xác thực OTP thất bại!"));
        }
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp(@Valid @RequestBody ResendOtpRequestDTO resendDto) {
        try {
            otpService.resendOtp(resendDto.getEmail());
            return ResponseEntity.ok(Map.of(
                    "message", "Mã OTP mới đã được gửi đến email của bạn!"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage() != null ? e.getMessage() : "Gửi lại mã OTP thất bại!"));
        }
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
