package com.task.management.service;

import com.task.management.entity.OtpToken;
import com.task.management.entity.User;
import com.task.management.repository.OtpTokenRepository;
import com.task.management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpService {

    private final OtpTokenRepository otpTokenRepository;
    private final UserRepository userRepository;
    private final BrevoMailService brevoMailService;

    private static final SecureRandom RANDOM = new SecureRandom();

    public void generateAndSendOtp(String email) {
        String otpCode = String.format("%06d", RANDOM.nextInt(1_000_000));

        OtpToken token = OtpToken.builder()
                .email(email)
                .otpCode(otpCode)
                .expiryTime(LocalDateTime.now().plusMinutes(5))
                .isUsed(false)
                .createdAt(LocalDateTime.now())
                .build();

        otpTokenRepository.save(token);

        log.info("==========================================================");
        log.info("🔑 MÃ OTP XÁC THỰC DÀNH CHO EMAIL [{}]: {}", email, otpCode);
        log.info("==========================================================");

        boolean sent = brevoMailService.sendOtpEmail(email, otpCode);
        if (!sent) {
            log.warn("Không thể gửi email OTP đến {}. Bạn có thể nhập mã OTP [{}] từ Server Log để thử nghiệm!", email, otpCode);
        }
    }

    public void verifyOtp(String email, String otpCode) {
        OtpToken token = otpTokenRepository.findTopByEmailAndIsUsedFalseOrderByCreatedAtDesc(email)
                .orElseThrow(() -> new IllegalArgumentException("OTP code does not exist or has already been used!"));

        if (LocalDateTime.now().isAfter(token.getExpiryTime())) {
            throw new IllegalArgumentException("OTP code has expired! Please click 'Resend code'.");
        }

        if (!token.getOtpCode().equals(otpCode.trim())) {
            throw new IllegalArgumentException("Incorrect OTP code. Please check and try again!");
        }

        token.setUsed(true);
        otpTokenRepository.save(token);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User account not found with email: " + email));

        user.setVerified(true);
        userRepository.save(user);
        log.info("Xác thực OTP thành công cho tài khoản: {}", email);
    }

    public void resendOtp(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User account not found with email: " + email));

        if (user.isVerified()) {
            throw new IllegalArgumentException("This account has already been verified!");
        }

        generateAndSendOtp(email);
    }

    public void verifyOnlyOtp(String email, String otpCode) {
        OtpToken token = otpTokenRepository.findTopByEmailAndIsUsedFalseOrderByCreatedAtDesc(email)
                .orElseThrow(() -> new IllegalArgumentException("OTP code does not exist or has already been used!"));

        if (LocalDateTime.now().isAfter(token.getExpiryTime())) {
            throw new IllegalArgumentException("OTP code has expired! Please resend a new OTP code.");
        }

        if (!token.getOtpCode().equals(otpCode.trim())) {
            throw new IllegalArgumentException("Incorrect OTP code. Please check and try again!");
        }

        token.setUsed(true);
        otpTokenRepository.save(token);
        log.info("Xác thực OTP đổi mật khẩu thành công cho email: {}", email);
    }
}
