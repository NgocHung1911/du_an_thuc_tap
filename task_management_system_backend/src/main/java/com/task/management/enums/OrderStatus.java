package com.task.management.enums;

/**
 * Trạng thái đơn thanh toán.
 * - PENDING: đã tạo, chờ thanh toán
 * - SUCCESS: webhook xác nhận thanh toán thành công
 * - FAILED: thanh toán thất bại hoặc bị từ chối
 * - EXPIRED: đơn hàng hết hạn chờ thanh toán (15 phút)
 */
public enum OrderStatus {
    PENDING,
    SUCCESS,
    FAILED,
    EXPIRED
}
