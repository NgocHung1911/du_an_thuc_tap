package com.task.management.repository;

import com.task.management.entity.PaymentOrder;
import com.task.management.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface PaymentOrderRepository extends JpaRepository<PaymentOrder, Long> {

    Optional<PaymentOrder> findByOrderCode(String orderCode);

    /** Kiểm tra idempotency: nếu sepayTransactionId đã được xử lý thì skip. */
    boolean existsBySepayTransactionId(String sepayTransactionId);

    /** Kiểm tra idempotency theo SePay internal ID. */
    boolean existsBySepayId(Long sepayId);

    List<PaymentOrder> findByUserIdOrderByCreatedAtDesc(Long userId);

    /** Tìm đơn PENDING đã hết hạn để chuyển sang EXPIRED. */
    @Query("SELECT o FROM PaymentOrder o WHERE o.status = 'PENDING' AND o.expiresAt <= :now")
    List<PaymentOrder> findExpiredPendingOrders(@Param("now") Instant now);

    List<PaymentOrder> findByUserIdAndStatusOrderByCreatedAtDesc(Long userId, OrderStatus status);
}
