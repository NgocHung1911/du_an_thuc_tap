package com.task.management.entity;

import com.task.management.enums.OrderStatus;
import com.task.management.enums.SubscriptionPlan;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Lưu lịch sử từng đơn thanh toán nâng cấp gói.
 * Mỗi đơn có mã tham chiếu duy nhất (orderCode) được nhúng vào nội dung chuyển khoản.
 * Backend là nguồn quyết định số tiền; frontend KHÔNG gửi giá.
 */
@Entity
@Table(name = "payment_orders",
        indexes = {
                @Index(name = "idx_payment_orders_order_code", columnList = "order_code", unique = true),
                @Index(name = "idx_payment_orders_user_id", columnList = "user_id"),
                @Index(name = "idx_payment_orders_sepay_ref", columnList = "sepay_transaction_id")
        })
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Mã đơn duy nhất, được nhúng vào nội dung chuyển khoản.
     * Ví dụ: "KIRA-PRO-1735000000000"
     */
    @Column(name = "order_code", nullable = false, unique = true, length = 100)
    private String orderCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Gói mà đơn này nâng cấp lên (PRO hoặc ENTERPRISE). */
    @Enumerated(EnumType.STRING)
    @Column(name = "target_plan", nullable = false, length = 20)
    private SubscriptionPlan targetPlan;

    /**
     * Số tiền VNĐ cần thanh toán. Backend tự tính theo plan, không từ frontend.
     * Luôn dùng VNĐ làm đơn vị, ngay cả khi UI hiển thị USD.
     */
    @Column(name = "amount_vnd", nullable = false, precision = 15, scale = 0)
    private BigDecimal amountVnd;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private OrderStatus status = OrderStatus.PENDING;

    /**
     * Mã giao dịch phía SePay (referenceCode từ webhook).
     * Dùng để kiểm tra idempotency: nếu đã xử lý referenceCode này thì bỏ qua.
     */
    @Column(name = "sepay_transaction_id", length = 255)
    private String sepayTransactionId;

    /**
     * ID giao dịch nội bộ SePay (trường "id" từ webhook).
     */
    @Column(name = "sepay_id")
    private Long sepayId;

    /** Thời điểm tạo đơn (UTC). */
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    /** Thời điểm hết hạn chờ thanh toán (mặc định: tạo + 15 phút). */
    @Column(name = "expires_at")
    private Instant expiresAt;

    /** Thời điểm xác nhận thanh toán thành công. */
    @Column(name = "paid_at")
    private Instant paidAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        if (this.expiresAt == null) {
            this.expiresAt = Instant.now().plusSeconds(15 * 60); // 15 phút
        }
    }
}
