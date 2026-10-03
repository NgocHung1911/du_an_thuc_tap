package com.task.management.repository;

import com.task.management.entity.UserSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface UserSubscriptionRepository extends JpaRepository<UserSubscription, Long> {

    Optional<UserSubscription> findByUserId(Long userId);

    Optional<UserSubscription> findByUserUsername(String username);

    /**
     * Tìm tất cả subscription đã hết hạn nhưng chưa bị downgrade về STARTER.
     * Dùng cho scheduler hàng ngày.
     */
    @Query("SELECT s FROM UserSubscription s WHERE s.plan <> 'STARTER' AND s.planExpiresAt IS NOT NULL AND s.planExpiresAt <= :now")
    List<UserSubscription> findExpiredPaidSubscriptions(@Param("now") Instant now);
}
