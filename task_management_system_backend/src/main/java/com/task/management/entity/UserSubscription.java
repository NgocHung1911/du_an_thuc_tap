package com.task.management.entity;

import com.task.management.enums.SubscriptionPlan;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Lưu trạng thái subscription hiện tại của một User.
 * Mỗi User có đúng một bản ghi UserSubscription (1-1).
 * Được khởi tạo với STARTER khi User đăng ký hoặc đăng nhập Google lần đầu.
 */
@Entity
@Table(name = "user_subscriptions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private SubscriptionPlan plan = SubscriptionPlan.STARTER;

    /**
     * Thời điểm gói trả phí có hiệu lực (null nếu là STARTER).
     * Lưu theo UTC Instant.
     */
    @Column(name = "plan_started_at")
    private Instant planStartedAt;

    /**
     * Thời điểm gói trả phí hết hạn (null nếu là STARTER).
     * Scheduler chạy hàng ngày lúc 00:05 UTC kiểm tra và downgrade về STARTER.
     */
    @Column(name = "plan_expires_at")
    private Instant planExpiresAt;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
