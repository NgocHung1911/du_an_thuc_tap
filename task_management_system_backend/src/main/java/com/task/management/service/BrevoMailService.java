package com.task.management.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class BrevoMailService {

    @Value("${brevo.api-key:xkeysib-your_brevo_api_key_here}")
    private String apiKey;

    @Value("${brevo.sender-email:noreply@taskmanagementsystem.com}")
    private String senderEmail;

    @Value("${brevo.sender-name:Task Management System}")
    private String senderName;

    private static final String BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

    public boolean sendOtpEmail(String recipientEmail, String otpCode) {
        String cleanKey = apiKey != null ? apiKey.trim() : "";
        String cleanSenderEmail = senderEmail != null ? senderEmail.trim() : "";
        String cleanSenderName = senderName != null ? senderName.trim() : "Task Management System";

        if (cleanKey.isEmpty() || cleanKey.contains("your_brevo_api_key_here")) {
            log.warn("CHƯA CẤU HÌNH BREVO_API_KEY HỢP LỆ! [DEV OTP CODE cho {}]: {}", recipientEmail, otpCode);
            return false;
        }

        try {
            RestTemplate restTemplate = new RestTemplate();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("api-key", cleanKey);
            headers.setAccept(List.of(MediaType.APPLICATION_JSON));

            String htmlContent = String.format(
                "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #DFE1E6; border-radius: 8px; background-color: #FFFFFF;\">" +
                "<div style=\"text-align: center; padding-bottom: 20px; border-bottom: 1px solid #EBECF0;\">" +
                "<h2 style=\"color: #0052CC; margin: 0;\">Task Management System</h2>" +
                "<p style=\"color: #5E6C84; font-size: 14px; margin-top: 5px;\">Xác thực tài khoản của bạn</p>" +
                "</div>" +
                "<div style=\"padding: 20px 0; text-align: center;\">" +
                "<p style=\"color: #172B4D; font-size: 16px;\">Mã xác thực OTP đăng ký tài khoản của bạn là:</p>" +
                "<div style=\"display: inline-block; background-color: #DEEBFF; color: #0747A6; font-size: 28px; font-weight: bold; letter-spacing: 6px; padding: 12px 28px; border-radius: 6px; margin: 15px 0;\">%s</div>" +
                "<p style=\"color: #FF8B00; font-size: 13px;\">⚠️ Mã OTP này có hiệu lực trong vòng <strong>5 phút</strong>. Vui lòng không chia sẻ mã này cho bất kỳ ai!</p>" +
                "</div>" +
                "<div style=\"border-top: 1px solid #EBECF0; padding-top: 15px; text-align: center; color: #5E6C84; font-size: 12px;\">" +
                "Trân trọng,<br><strong>Đội ngũ Task Management System</strong>" +
                "</div>" +
                "</div>",
                otpCode
            );

            Map<String, Object> body = Map.of(
                "sender", Map.of("name", cleanSenderName, "email", cleanSenderEmail),
                "to", List.of(Map.of("email", recipientEmail.trim())),
                "subject", "Mã xác thực OTP đăng ký tài khoản - Task Management",
                "htmlContent", htmlContent
            );

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.exchange(BREVO_API_URL, HttpMethod.POST, request, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Gửi email OTP qua Brevo REST API thành công tới: {}", recipientEmail);
                return true;
            } else {
                log.error("Gửi email OTP qua Brevo thất bại. Status: {}, Body: {}", response.getStatusCode(), response.getBody());
                return false;
            }
        } catch (HttpStatusCodeException ex) {
            log.error("Lỗi Brevo REST API (HTTP {}): {}", ex.getStatusCode(), ex.getResponseBodyAsString());
            log.info("[DEV OTP FALLBACK - Mã xác thực cho {}]: {}", recipientEmail, otpCode);
            return false;
        } catch (Exception e) {
            log.error("Lỗi khi gọi Brevo REST API gửi mail OTP tới {}: {}", recipientEmail, e.getMessage());
            log.info("[DEV OTP FALLBACK - Mã xác thực cho {}]: {}", recipientEmail, otpCode);
            return false;
        }
    }
}
