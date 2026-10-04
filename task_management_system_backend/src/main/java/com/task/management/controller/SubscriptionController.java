package com.task.management.controller;

import com.task.management.dto.request.CheckoutRequestDTO;
import com.task.management.dto.request.SepayWebhookPayloadDTO;
import com.task.management.dto.response.PaymentOrderResponseDTO;
import com.task.management.dto.response.SubscriptionPlanDTO;
import com.task.management.dto.response.SubscriptionSummaryDTO;
import com.task.management.entity.User;
import com.task.management.exception.BadRequestException;
import com.task.management.exception.ResourceNotFoundException;
import com.task.management.repository.UserRepository;
import com.task.management.service.SubscriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/subscriptions")
@RequiredArgsConstructor
@Slf4j
public class SubscriptionController {

    private final SubscriptionService subscriptionService;
    private final UserRepository userRepository;

    private User getAuthenticatedUser(Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new BadRequestException("User must be authenticated.");
        }
        String username = auth.getName();
        return userRepository.findByUsername(username)
                .orElseGet(() -> userRepository.findByEmail(username)
                        .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username)));
    }

    /**
     * Lấy danh sách các gói subscription & bảng giá.
     */
    @GetMapping("/plans")
    public ResponseEntity<List<SubscriptionPlanDTO>> getPlans() {
        return ResponseEntity.ok(subscriptionService.getPlans());
    }

    /**
     * Lấy thông tin chi tiết gói và mức độ sử dụng Quota của User hiện tại.
     */
    @GetMapping("/me")
    public ResponseEntity<SubscriptionSummaryDTO> getMySubscription(Authentication auth) {
        User user = getAuthenticatedUser(auth);
        return ResponseEntity.ok(subscriptionService.getUserSubscriptionSummary(user));
    }

    /**
     * Tạo đơn hàng thanh toán nâng cấp gói và nhận link VietQR.
     */
    @PostMapping("/checkout")
    public ResponseEntity<PaymentOrderResponseDTO> createCheckoutOrder(
            @Valid @RequestBody CheckoutRequestDTO request,
            Authentication auth
    ) {
        User user = getAuthenticatedUser(auth);
        return ResponseEntity.ok(subscriptionService.createPaymentOrder(user, request.getTargetPlan()));
    }

    /**
     * Lấy chi tiết đơn hàng thanh toán theo orderCode (dùng cho polling chờ thanh toán).
     */
    @GetMapping("/orders/{orderCode}")
    public ResponseEntity<PaymentOrderResponseDTO> getOrderDetails(
            @PathVariable String orderCode,
            Authentication auth
    ) {
        User user = getAuthenticatedUser(auth);
        return ResponseEntity.ok(subscriptionService.getOrderDetails(orderCode, user));
    }

    /**
     * Lấy lịch sử giao dịch thanh toán của User.
     */
    @GetMapping("/orders/history")
    public ResponseEntity<List<PaymentOrderResponseDTO>> getOrderHistory(Authentication auth) {
        User user = getAuthenticatedUser(auth);
        return ResponseEntity.ok(subscriptionService.getOrderHistory(user));
    }

    /**
     * Webhook nhận thông báo giao dịch từ SePay.
     */
    @PostMapping(value = "/webhook", produces = org.springframework.http.MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> handleSepayWebhook(
            @RequestBody SepayWebhookPayloadDTO payload,
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        log.info("Incoming SePay webhook notification: {}", payload);
        Map<String, Object> result = subscriptionService.processSepayWebhook(payload, authHeader);
        return ResponseEntity.ok(result);
    }
}
