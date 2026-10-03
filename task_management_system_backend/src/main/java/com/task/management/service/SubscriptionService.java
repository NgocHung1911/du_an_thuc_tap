package com.task.management.service;

import com.task.management.config.SubscriptionConfig;
import com.task.management.dto.request.SepayWebhookPayloadDTO;
import com.task.management.dto.response.PaymentOrderResponseDTO;
import com.task.management.dto.response.SubscriptionPlanDTO;
import com.task.management.dto.response.SubscriptionSummaryDTO;
import com.task.management.dto.websocket.WebSocketEvent;
import com.task.management.dto.websocket.WebSocketEventType;
import com.task.management.entity.PaymentOrder;
import com.task.management.entity.Project;
import com.task.management.entity.User;
import com.task.management.entity.UserSubscription;
import com.task.management.enums.NotificationType;
import com.task.management.enums.OrderStatus;
import com.task.management.enums.SubscriptionPlan;
import com.task.management.exception.BadRequestException;
import com.task.management.exception.ResourceNotFoundException;
import com.task.management.repository.PaymentOrderRepository;
import com.task.management.repository.ProjectMemberRepository;
import com.task.management.repository.ProjectRepository;
import com.task.management.repository.UserSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Service quản lý subscription: Quota, Enforcement, Checkout QR, Webhook SePay và Downgrade Scheduler.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SubscriptionService {

    private final UserSubscriptionRepository subscriptionRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final PaymentOrderRepository paymentOrderRepository;
    private final SubscriptionConfig subscriptionConfig;
    private final ExchangeRateService exchangeRateService;
    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;

    @Value("${sepay.api-key:}")
    private String sepayApiKey;

    @Value("${sepay.bank-id:MB}")
    private String sepayBankId;

    @Value("${sepay.account-number:0344556677}")
    private String sepayAccountNumber;

    @Value("${sepay.account-name:TRAN NGOC HUNG}")
    private String sepayAccountName;

    private static final Pattern ORDER_CODE_PATTERN = Pattern.compile("(KIRA-(?:PRO|ENTERPRISE)-[A-Za-z0-9]+)", Pattern.CASE_INSENSITIVE);

    /**
     * Khởi tạo subscription STARTER cho user mới (hoặc user hiện hữu chưa có subscription).
     */
    @Transactional
    public UserSubscription initializeStarterSubscription(User user) {
        return subscriptionRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    UserSubscription sub = UserSubscription.builder()
                            .user(user)
                            .plan(SubscriptionPlan.STARTER)
                            .build();
                    return subscriptionRepository.save(sub);
                });
    }

    /**
     * Lấy subscription hiện tại của user. Tự khởi tạo STARTER nếu chưa có.
     */
    @Transactional
    public UserSubscription getOrInitSubscription(User user) {
        return subscriptionRepository.findByUserId(user.getId())
                .orElseGet(() -> initializeStarterSubscription(user));
    }

    /**
     * Lấy danh sách các gói subscription cùng bảng giá và tính năng.
     */
    public List<SubscriptionPlanDTO> getPlans() {
        return Arrays.stream(SubscriptionPlan.values()).map(plan -> {
            long priceVnd = subscriptionConfig.getPriceVnd(plan);
            BigDecimal priceUsd = exchangeRateService.convertVndToUsd(priceVnd).usd();

            List<String> allowedTypes = switch (plan) {
                case STARTER -> List.of("DOCX");
                case PRO -> List.of("DOCX", "PDF");
                case ENTERPRISE -> List.of("All file types (DOCX, PDF, ZIP, PNG, MP4, ...)");
            };

            List<String> features = switch (plan) {
                case STARTER -> List.of(
                        "Up to 3 projects",
                        "Up to 10 unique members across all projects",
                        "5GB cloud storage",
                        "Max 5MB per file (DOCX only)",
                        "Real-time Jira board & Gantt timeline",
                        "Email notifications & mentions"
                );
                case PRO -> List.of(
                        "Up to 15 projects",
                        "Up to 50 unique members across all projects",
                        "20GB high-speed cloud storage",
                        "Max 10MB per file (DOCX & PDF supported)",
                        "Priority customer support",
                        "Real-time Webhook & Activity audit"
                );
                case ENTERPRISE -> List.of(
                        "Unlimited projects",
                        "Unlimited team members",
                        "100GB enterprise cloud storage",
                        "Max 5GB per file (All file formats supported)",
                        "Dedicated high performance & 99.9% uptime",
                        "Full administrative governance"
                );
            };

            return SubscriptionPlanDTO.builder()
                    .id(plan)
                    .name(plan.name())
                    .priceVnd(priceVnd)
                    .priceUsd(priceUsd)
                    .isPopular(plan == SubscriptionPlan.PRO)
                    .maxProjects(subscriptionConfig.getMaxProjects(plan))
                    .maxUniqueMembers(subscriptionConfig.getMaxUniqueMembers(plan))
                    .maxFileSizeBytes(subscriptionConfig.getMaxFileSizeBytes(plan))
                    .maxStorageBytes(subscriptionConfig.getMaxStorageBytes(plan))
                    .allowedFileTypes(allowedTypes)
                    .features(features)
                    .build();
        }).collect(Collectors.toList());
    }

    /**
     * Lấy tóm tắt trạng thái gói và mức sử dụng Quota của User.
     */
    @Transactional(readOnly = true)
    public SubscriptionSummaryDTO getUserSubscriptionSummary(User user) {
        UserSubscription sub = subscriptionRepository.findByUserId(user.getId())
                .orElse(null);

        SubscriptionPlan plan = (sub != null) ? sub.getPlan() : SubscriptionPlan.STARTER;
        Instant startedAt = (sub != null) ? sub.getPlanStartedAt() : null;
        Instant expiresAt = (sub != null) ? sub.getPlanExpiresAt() : null;

        Instant now = Instant.now();
        boolean isExpired = (plan != SubscriptionPlan.STARTER) && expiresAt != null && now.isAfter(expiresAt);
        Long daysRemaining = (expiresAt != null && !isExpired) ? ChronoUnit.DAYS.between(now, expiresAt) : null;

        // Số project user đang làm OWNER
        int currentProjects = (int) projectRepository.searchProjectsByUser(user.getId(), null, null)
                .stream()
                .filter(p -> p.getUser() != null && p.getUser().getId().equals(user.getId()))
                .count();

        // Số thành viên duy nhất trên tất cả project của owner
        int currentMembers = getUniqueMembers(user).size();

        // Dung lượng đã sử dụng (bytes)
        long usedStorage = calculateUsedStorage(user.getId());

        List<String> allowedTypes = switch (plan) {
            case STARTER -> List.of("DOCX");
            case PRO -> List.of("DOCX", "PDF");
            case ENTERPRISE -> List.of("All file types");
        };

        return SubscriptionSummaryDTO.builder()
                .id(sub != null ? sub.getId() : null)
                .plan(plan)
                .planStartedAt(startedAt)
                .planExpiresAt(expiresAt)
                .isExpired(isExpired)
                .daysRemaining(daysRemaining)
                .currentProjects(currentProjects)
                .maxProjects(subscriptionConfig.getMaxProjects(plan))
                .currentUniqueMembers(currentMembers)
                .maxUniqueMembers(subscriptionConfig.getMaxUniqueMembers(plan))
                .usedStorageBytes(usedStorage)
                .maxStorageBytes(subscriptionConfig.getMaxStorageBytes(plan))
                .maxFileSizeBytes(subscriptionConfig.getMaxFileSizeBytes(plan))
                .allowedFileTypes(allowedTypes)
                .build();
    }

    /**
     * Tạo đơn hàng thanh toán nâng cấp gói và sinh link VietQR.
     */
    @Transactional
    public PaymentOrderResponseDTO createPaymentOrder(User user, SubscriptionPlan targetPlan) {
        if (targetPlan == null || targetPlan == SubscriptionPlan.STARTER) {
            throw new BadRequestException("Cannot create payment order for STARTER plan.");
        }

        Instant now = Instant.now();

        // Kiểm tra xem user có đơn PENDING nào cùng gói còn hiệu lực không, tái sử dụng để tránh sinh rác
        Optional<PaymentOrder> existingPending = paymentOrderRepository.findByUserIdAndStatus(user.getId(), OrderStatus.PENDING)
                .filter(o -> o.getTargetPlan() == targetPlan && o.getExpiresAt().isAfter(now));

        if (existingPending.isPresent()) {
            return mapToOrderResponseDTO(existingPending.get());
        }

        long amountVnd = subscriptionConfig.getPriceVnd(targetPlan);
        String orderCode = String.format("KIRA-%s-%d", targetPlan.name(), System.currentTimeMillis());

        PaymentOrder order = PaymentOrder.builder()
                .orderCode(orderCode)
                .user(user)
                .targetPlan(targetPlan)
                .amountVnd(BigDecimal.valueOf(amountVnd))
                .status(OrderStatus.PENDING)
                .createdAt(now)
                .expiresAt(now.plusSeconds(SubscriptionConfig.ORDER_EXPIRY_SECONDS))
                .build();

        PaymentOrder savedOrder = paymentOrderRepository.save(order);
        log.info("Created payment order {} for user {} plan {} amount {} VND",
                savedOrder.getOrderCode(), user.getUsername(), targetPlan, amountVnd);

        return mapToOrderResponseDTO(savedOrder);
    }

    /**
     * Lấy chi tiết đơn thanh toán theo orderCode (dùng cho polling frontend).
     */
    @Transactional
    public PaymentOrderResponseDTO getOrderDetails(String orderCode, User user) {
        PaymentOrder order = paymentOrderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new ResourceNotFoundException("Payment order not found with code: " + orderCode));

        if (!order.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("You do not have permission to view this order.");
        }

        Instant now = Instant.now();
        if (order.getStatus() == OrderStatus.PENDING && order.getExpiresAt().isBefore(now)) {
            order.setStatus(OrderStatus.EXPIRED);
            paymentOrderRepository.save(order);
        }

        return mapToOrderResponseDTO(order);
    }

    /**
     * Lấy lịch sử giao dịch thanh toán của User.
     */
    @Transactional(readOnly = true)
    public List<PaymentOrderResponseDTO> getOrderHistory(User user) {
        return paymentOrderRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::mapToOrderResponseDTO)
                .collect(Collectors.toList());
    }

    /**
     * Xử lý Webhook từ SePay khi có giao dịch chuyển khoản thành công.
     */
    @Transactional
    public Map<String, Object> processSepayWebhook(SepayWebhookPayloadDTO payload, String authHeader) {
        log.info("Received SePay webhook payload: {}", payload);

        // 1. Xác thực SePay API Key (nếu được cấu hình)
        if (sepayApiKey != null && !sepayApiKey.isBlank() && !sepayApiKey.equals("sepay_api_secret_key_default")) {
            boolean authorized = false;
            if (authHeader != null) {
                if (authHeader.equalsIgnoreCase("Apikey " + sepayApiKey) ||
                    authHeader.equalsIgnoreCase("Bearer " + sepayApiKey) ||
                    authHeader.equalsIgnoreCase(sepayApiKey)) {
                    authorized = true;
                }
            }
            if (!authorized) {
                log.warn("SePay webhook rejected due to invalid Authorization header: {}", authHeader);
                throw new BadRequestException("Invalid SePay webhook authorization key.");
            }
        }

        if (payload == null || payload.getTransferType() == null || !"in".equalsIgnoreCase(payload.getTransferType())) {
            log.info("SePay webhook ignored: non-incoming transfer.");
            return Map.of("success", true, "message", "Ignored non-incoming transaction");
        }

        // 2. Kiểm tra Idempotency tránh xử lý trùng giao dịch
        if (payload.getReferenceCode() != null && !payload.getReferenceCode().isBlank()) {
            if (paymentOrderRepository.existsBySepayTransactionId(payload.getReferenceCode())) {
                log.info("SePay webhook ignored: referenceCode {} already processed.", payload.getReferenceCode());
                return Map.of("success", true, "message", "Transaction already processed");
            }
        }
        if (payload.getId() != null && paymentOrderRepository.existsBySepayId(payload.getId())) {
            log.info("SePay webhook ignored: sepayId {} already processed.", payload.getId());
            return Map.of("success", true, "message", "Transaction already processed");
        }

        // 3. Trích xuất orderCode từ nội dung giao dịch (content hoặc description)
        String orderCode = extractOrderCode(payload.getContent());
        if (orderCode == null) {
            orderCode = extractOrderCode(payload.getDescription());
        }

        if (orderCode == null) {
            log.warn("Cannot extract valid order code from SePay transaction: content='{}', desc='{}'",
                    payload.getContent(), payload.getDescription());
            return Map.of("success", false, "message", "Order code not found in transfer content");
        }

        // 4. Tìm đơn thanh toán tương ứng
        PaymentOrder order = paymentOrderRepository.findByOrderCode(orderCode)
                .orElse(null);

        if (order == null) {
            log.warn("Payment order with code {} not found in database.", orderCode);
            return Map.of("success", false, "message", "Order not found with code: " + orderCode);
        }

        if (order.getStatus() == OrderStatus.SUCCESS) {
            log.info("Payment order {} is already SUCCESS.", orderCode);
            return Map.of("success", true, "message", "Order already processed successfully");
        }

        // 5. Kiểm tra số tiền chuyển khoản
        BigDecimal transferAmount = payload.getTransferAmount() != null ? payload.getTransferAmount() : BigDecimal.ZERO;
        if (transferAmount.compareTo(order.getAmountVnd()) < 0) {
            log.warn("Transfer amount {} is less than required order amount {} for order {}",
                    transferAmount, order.getAmountVnd(), orderCode);
            throw new BadRequestException(String.format("Transfer amount (%s) is less than required (%s).",
                    transferAmount, order.getAmountVnd()));
        }

        // 6. Cập nhật trạng thái đơn hàng thành công
        Instant now = Instant.now();
        order.setStatus(OrderStatus.SUCCESS);
        order.setSepayTransactionId(payload.getReferenceCode());
        order.setSepayId(payload.getId());
        order.setPaidAt(now);
        paymentOrderRepository.save(order);

        // 7. Nâng cấp gói UserSubscription (+30 ngày)
        User user = order.getUser();
        UserSubscription sub = getOrInitSubscription(user);

        if (sub.getPlan() == order.getTargetPlan() && sub.getPlanExpiresAt() != null && sub.getPlanExpiresAt().isAfter(now)) {
            // Gia hạn thêm 30 ngày từ ngày hết hạn hiện tại
            sub.setPlanExpiresAt(sub.getPlanExpiresAt().plus(30, ChronoUnit.DAYS));
        } else {
            // Nâng cấp lên gói mới có hiệu lực 30 ngày từ hôm nay
            sub.setPlan(order.getTargetPlan());
            sub.setPlanStartedAt(now);
            sub.setPlanExpiresAt(now.plus(30, ChronoUnit.DAYS));
        }
        subscriptionRepository.save(sub);

        log.info("Successfully upgraded user {} to plan {} valid until {}",
                user.getUsername(), sub.getPlan(), sub.getPlanExpiresAt());

        // 8. Tạo thông báo trong hệ thống và bắn Realtime WebSocket
        try {
            notificationService.createAndSendNotification(
                    user,
                    null,
                    NotificationType.SUBSCRIPTION_UPGRADED,
                    "Subscription Upgraded Successfully! 🎉",
                    String.format("Your account has been upgraded to %s plan! All premium features and quotas are now active for 30 days.", order.getTargetPlan().name()),
                    null,
                    null
            );

            // Bắn WebSocket thông báo tới topic riêng của User
            SubscriptionSummaryDTO summary = getUserSubscriptionSummary(user);
            WebSocketEvent wsEvent = WebSocketEvent.builder()
                    .eventType(WebSocketEventType.SUBSCRIPTION_UPDATED)
                    .actorUsername("System")
                    .actorFullName("System")
                    .data(summary)
                    .build();

            messagingTemplate.convertAndSend("/topic/subscriptions/user-" + user.getId(), wsEvent);
            log.info("Broadcasted subscription update event to /topic/subscriptions/user-{}", user.getId());
        } catch (Exception e) {
            log.error("Failed to send notification or websocket event for subscription upgrade", e);
        }

        return Map.of(
                "success", true,
                "message", "Subscription upgraded successfully",
                "orderCode", order.getOrderCode(),
                "plan", sub.getPlan().name()
        );
    }

    private String extractOrderCode(String text) {
        if (text == null || text.isBlank()) return null;
        Matcher matcher = ORDER_CODE_PATTERN.matcher(text);
        if (matcher.find()) {
            return matcher.group(1).toUpperCase();
        }
        return null;
    }

    private PaymentOrderResponseDTO mapToOrderResponseDTO(PaymentOrder order) {
        String encodedAccountName = "";
        try {
            encodedAccountName = URLEncoder.encode(sepayAccountName, StandardCharsets.UTF_8.toString());
        } catch (Exception ignored) {}

        String qrCodeUrl = String.format(
                "https://img.vietqr.io/image/%s-%s-compact2.png?amount=%d&addInfo=%s&accountName=%s",
                sepayBankId,
                sepayAccountNumber,
                order.getAmountVnd().longValue(),
                order.getOrderCode(),
                encodedAccountName
        );

        BigDecimal priceUsd = exchangeRateService.convertVndToUsd(order.getAmountVnd().longValue()).usd();

        long remainingSeconds = 0;
        if (order.getStatus() == OrderStatus.PENDING && order.getExpiresAt() != null) {
            long diff = Duration.between(Instant.now(), order.getExpiresAt()).getSeconds();
            remainingSeconds = Math.max(0, diff);
        }

        return PaymentOrderResponseDTO.builder()
                .id(order.getId())
                .orderCode(order.getOrderCode())
                .targetPlan(order.getTargetPlan())
                .amountVnd(order.getAmountVnd())
                .amountUsd(priceUsd)
                .status(order.getStatus())
                .bankId(sepayBankId)
                .accountNumber(sepayAccountNumber)
                .accountName(sepayAccountName)
                .transferContent(order.getOrderCode())
                .qrCodeUrl(qrCodeUrl)
                .createdAt(order.getCreatedAt())
                .expiresAt(order.getExpiresAt())
                .paidAt(order.getPaidAt())
                .remainingSeconds(remainingSeconds)
                .build();
    }

    // =================== LIMIT ENFORCEMENT ===================

    @Transactional(readOnly = true)
    public SubscriptionPlan getCurrentPlan(String username) {
        return subscriptionRepository.findByUserUsername(username)
                .map(UserSubscription::getPlan)
                .orElse(SubscriptionPlan.STARTER);
    }

    @Transactional(readOnly = true)
    public void enforceProjectCreationLimit(User owner) {
        SubscriptionPlan plan = getOrInitSubscription(owner).getPlan();
        int maxProjects = subscriptionConfig.getMaxProjects(plan);
        if (maxProjects == Integer.MAX_VALUE) return;

        long ownedCount = projectRepository.searchProjectsByUser(owner.getId(), null, null)
                .stream()
                .filter(p -> p.getUser() != null && p.getUser().getId().equals(owner.getId()))
                .count();

        if (ownedCount >= maxProjects) {
            throw new BadRequestException(
                    String.format("Your %s plan allows up to %d projects. Please upgrade to create more.", plan.name(), maxProjects));
        }
    }

    @Transactional(readOnly = true)
    public void enforceMemberAddLimit(User owner, Long newMemberUserId) {
        SubscriptionPlan plan = getOrInitSubscription(owner).getPlan();
        int maxMembers = subscriptionConfig.getMaxUniqueMembers(plan);
        if (maxMembers == Integer.MAX_VALUE) return;

        Set<Long> uniqueMemberIds = getUniqueMembers(owner);

        if (!uniqueMemberIds.contains(newMemberUserId)) {
            if (uniqueMemberIds.size() >= maxMembers) {
                throw new BadRequestException(
                        String.format("Your %s plan allows up to %d unique members across all your projects. Please upgrade.", plan.name(), maxMembers));
            }
        }
    }

    @Transactional(readOnly = true)
    public void enforceFileSizeLimit(User uploader, long fileSizeBytes) {
        SubscriptionPlan plan = getOrInitSubscription(uploader).getPlan();
        long maxFileSize = subscriptionConfig.getMaxFileSizeBytes(plan);
        if (fileSizeBytes > maxFileSize) {
            long maxMB = maxFileSize / (1024 * 1024);
            throw new BadRequestException(
                    String.format("File size exceeds the %s plan limit of %dMB.", plan.name(), maxMB));
        }
    }

    @Transactional(readOnly = true)
    public void enforceFileTypeLimit(User uploader, String contentType, String filename) {
        SubscriptionPlan plan = getOrInitSubscription(uploader).getPlan();
        if (!subscriptionConfig.isFileTypeAllowed(plan, contentType, filename)) {
            String allowed = switch (plan) {
                case STARTER -> "DOCX only";
                case PRO -> "DOCX and PDF only";
                case ENTERPRISE -> "all file types";
            };
            throw new BadRequestException(
                    String.format("Your %s plan only allows %s. Please upgrade to upload this file type.", plan.name(), allowed));
        }
    }

    @Transactional(readOnly = true)
    public void enforceStorageQuota(User owner, long newFileSizeBytes) {
        SubscriptionPlan plan = getOrInitSubscription(owner).getPlan();
        long maxStorage = subscriptionConfig.getMaxStorageBytes(plan);
        if (maxStorage == Long.MAX_VALUE) return;

        long usedBytes = calculateUsedStorage(owner.getId());
        if (usedBytes + newFileSizeBytes > maxStorage) {
            long maxGB = maxStorage / (1024L * 1024 * 1024);
            throw new BadRequestException(
                    String.format("Storage quota exceeded. Your %s plan allows %dGB total.", plan.name(), maxGB));
        }
    }

    @Transactional(readOnly = true)
    public long calculateUsedStorage(Long ownerId) {
        Long used = projectRepository.sumAttachmentSizeByOwnerId(ownerId);
        return used != null ? used : 0L;
    }

    @Transactional(readOnly = true)
    public Set<Long> getUniqueMembers(User owner) {
        List<Project> ownedProjects = projectRepository.searchProjectsByUser(owner.getId(), null, null)
                .stream()
                .filter(p -> p.getUser() != null && p.getUser().getId().equals(owner.getId()))
                .toList();

        Set<Long> uniqueMemberIds = new HashSet<>();
        for (Project project : ownedProjects) {
            projectMemberRepository.findByProjectId(project.getId()).forEach(pm -> {
                if (pm.getUser() != null && !pm.getUser().getId().equals(owner.getId())) {
                    uniqueMemberIds.add(pm.getUser().getId());
                }
            });
        }
        return uniqueMemberIds;
    }

    /**
     * Scheduler: chạy mỗi ngày lúc 00:05 UTC, downgrade các subscription hết hạn về STARTER.
     */
    @Scheduled(cron = "0 5 0 * * *", zone = "UTC")
    @Transactional
    public void downgradeExpiredSubscriptions() {
        Instant now = Instant.now();
        List<UserSubscription> expired = subscriptionRepository.findExpiredPaidSubscriptions(now);
        if (!expired.isEmpty()) {
            log.info("[Scheduler] Downgrading {} expired subscriptions to STARTER.", expired.size());
        }
        for (UserSubscription sub : expired) {
            log.info("[Scheduler] Downgrading user {} from {} to STARTER (expired at {}).",
                    sub.getUser().getId(), sub.getPlan(), sub.getPlanExpiresAt());
            sub.setPlan(SubscriptionPlan.STARTER);
            sub.setPlanStartedAt(null);
            sub.setPlanExpiresAt(null);
            subscriptionRepository.save(sub);
        }

        List<PaymentOrder> expiredOrders = paymentOrderRepository.findExpiredPendingOrders(now);
        for (PaymentOrder order : expiredOrders) {
            order.setStatus(OrderStatus.EXPIRED);
            paymentOrderRepository.save(order);
        }
        if (!expiredOrders.isEmpty()) {
            log.info("[Scheduler] Marked {} pending orders as EXPIRED.", expiredOrders.size());
        }
    }
}
