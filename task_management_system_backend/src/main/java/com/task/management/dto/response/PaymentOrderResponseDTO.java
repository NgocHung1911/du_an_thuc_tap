package com.task.management.dto.response;

import com.task.management.enums.OrderStatus;
import com.task.management.enums.SubscriptionPlan;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentOrderResponseDTO {
    private Long id;
    private String orderCode;
    private SubscriptionPlan targetPlan;
    private BigDecimal amountVnd;
    private BigDecimal amountUsd;
    private OrderStatus status;
    private String bankId;
    private String accountNumber;
    private String accountName;
    private String transferContent;
    private String qrCodeUrl;
    private Instant createdAt;
    private Instant expiresAt;
    private Instant paidAt;
    private Long remainingSeconds;
}
