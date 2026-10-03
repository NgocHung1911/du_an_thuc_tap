-- ============================================================
-- Migration: Subscription & Payment System
-- Tương thích Aiven MySQL (sql_require_primary_key = ON)
-- Chạy an toàn trên dữ liệu hiện hữu (IF NOT EXISTS)
-- ============================================================

-- 1. Bảng user_subscriptions: lưu gói hiện tại của mỗi user
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    plan VARCHAR(20) NOT NULL DEFAULT 'STARTER',
    plan_started_at TIMESTAMP NULL,
    plan_expires_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_subscriptions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_user_subscriptions_user UNIQUE (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index cho scheduler query
CREATE INDEX IF NOT EXISTS idx_user_sub_plan_expires
    ON user_subscriptions (plan, plan_expires_at);

-- 2. Bảng payment_orders: lưu lịch sử đơn thanh toán
CREATE TABLE IF NOT EXISTS payment_orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_code VARCHAR(100) NOT NULL,
    user_id BIGINT NOT NULL,
    target_plan VARCHAR(20) NOT NULL,
    amount_vnd DECIMAL(15, 0) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    sepay_transaction_id VARCHAR(255) NULL,
    sepay_id BIGINT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    paid_at TIMESTAMP NULL,
    CONSTRAINT fk_payment_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_payment_orders_code UNIQUE (order_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON payment_orders (user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_sepay_ref ON payment_orders (sepay_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders (status);

-- 3. Khởi tạo UserSubscription cho TẤT CẢ user hiện hữu (chưa có bản ghi)
-- Idempotent: INSERT IGNORE đảm bảo chạy nhiều lần không bị lỗi
INSERT IGNORE INTO user_subscriptions (user_id, plan, created_at, updated_at)
SELECT id, 'STARTER', NOW(), NOW()
FROM users
WHERE id NOT IN (SELECT user_id FROM user_subscriptions);
