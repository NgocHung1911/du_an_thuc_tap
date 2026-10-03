package com.task.management.config;

import com.task.management.enums.SubscriptionPlan;
import org.springframework.stereotype.Component;

import java.util.Set;

/**
 * Cấu hình giới hạn cho từng gói subscription.
 * Đây là nguồn chân lý duy nhất cho giới hạn — backend quyết định, không từ frontend.
 *
 * Giới hạn:
 * - STARTER: 3 dự án, 10 thành viên duy nhất, chỉ DOCX, 5MB/file, 5GB tổng
 * - PRO: 15 dự án, 50 thành viên duy nhất, DOCX + PDF, 10MB/file, 20GB tổng
 * - ENTERPRISE: không giới hạn dự án/thành viên, mọi loại file, 5GB/file, 100GB tổng
 *
 * Cách đếm thành viên:
 * - Đếm user duy nhất trong TẤT CẢ dự án do tài khoản sở hữu (ProjectRole = OWNER)
 * - Không đếm trùng cùng một user ở nhiều dự án
 * - Không tính chính chủ tài khoản vào số thành viên
 */
@Component
public class SubscriptionConfig {

    // =================== PRICING ===================
    /** Giá PRO theo VNĐ/tháng. Đây là giá gốc, frontend KHÔNG được override. */
    public static final long PRO_PRICE_VND = 10_000L;

    /** Giá ENTERPRISE theo VNĐ/tháng. */
    public static final long ENTERPRISE_PRICE_VND = 50_000L;

    // =================== PROJECT LIMITS ===================
    public static final int STARTER_MAX_PROJECTS = 3;
    public static final int PRO_MAX_PROJECTS = 15;
    public static final int ENTERPRISE_MAX_PROJECTS = Integer.MAX_VALUE; // không giới hạn

    // =================== MEMBER LIMITS ===================
    /** Tối đa thành viên duy nhất (không kể owner) trên tất cả projects của owner. */
    public static final int STARTER_MAX_UNIQUE_MEMBERS = 10;
    public static final int PRO_MAX_UNIQUE_MEMBERS = 50;
    public static final int ENTERPRISE_MAX_UNIQUE_MEMBERS = Integer.MAX_VALUE;

    // =================== FILE SIZE LIMITS ===================
    public static final long STARTER_MAX_FILE_SIZE_BYTES = 5L * 1024 * 1024;        // 5 MB
    public static final long PRO_MAX_FILE_SIZE_BYTES = 10L * 1024 * 1024;            // 10 MB
    public static final long ENTERPRISE_MAX_FILE_SIZE_BYTES = 5L * 1024 * 1024 * 1024; // 5 GB

    // =================== STORAGE QUOTA ===================
    public static final long STARTER_MAX_STORAGE_BYTES = 5L * 1024 * 1024 * 1024;   // 5 GB
    public static final long PRO_MAX_STORAGE_BYTES = 20L * 1024 * 1024 * 1024;       // 20 GB
    public static final long ENTERPRISE_MAX_STORAGE_BYTES = 100L * 1024 * 1024 * 1024; // 100 GB

    // =================== ALLOWED FILE TYPES ===================
    public static final Set<String> STARTER_ALLOWED_MIME = Set.of(
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" // DOCX
    );
    public static final Set<String> STARTER_ALLOWED_EXTENSIONS = Set.of(".docx");

    public static final Set<String> PRO_ALLOWED_MIME = Set.of(
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX
            "application/pdf"  // PDF
    );
    public static final Set<String> PRO_ALLOWED_EXTENSIONS = Set.of(".docx", ".pdf");

    // ENTERPRISE: không giới hạn loại file
    public static final boolean ENTERPRISE_ALLOW_ALL_TYPES = true;

    // =================== ORDER EXPIRY ===================
    /** Thời gian hết hạn đơn thanh toán (giây). Mặc định 15 phút. */
    public static final long ORDER_EXPIRY_SECONDS = 15 * 60L;

    // =================== METHODS ===================

    public int getMaxProjects(SubscriptionPlan plan) {
        return switch (plan) {
            case STARTER -> STARTER_MAX_PROJECTS;
            case PRO -> PRO_MAX_PROJECTS;
            case ENTERPRISE -> ENTERPRISE_MAX_PROJECTS;
        };
    }

    public int getMaxUniqueMembers(SubscriptionPlan plan) {
        return switch (plan) {
            case STARTER -> STARTER_MAX_UNIQUE_MEMBERS;
            case PRO -> PRO_MAX_UNIQUE_MEMBERS;
            case ENTERPRISE -> ENTERPRISE_MAX_UNIQUE_MEMBERS;
        };
    }

    public long getMaxFileSizeBytes(SubscriptionPlan plan) {
        return switch (plan) {
            case STARTER -> STARTER_MAX_FILE_SIZE_BYTES;
            case PRO -> PRO_MAX_FILE_SIZE_BYTES;
            case ENTERPRISE -> ENTERPRISE_MAX_FILE_SIZE_BYTES;
        };
    }

    public long getMaxStorageBytes(SubscriptionPlan plan) {
        return switch (plan) {
            case STARTER -> STARTER_MAX_STORAGE_BYTES;
            case PRO -> PRO_MAX_STORAGE_BYTES;
            case ENTERPRISE -> ENTERPRISE_MAX_STORAGE_BYTES;
        };
    }

    public boolean isFileTypeAllowed(SubscriptionPlan plan, String contentType, String filename) {
        if (plan == SubscriptionPlan.ENTERPRISE) {
            return true; // mọi loại file
        }
        // Kiểm tra extension
        String lowerFilename = (filename != null) ? filename.toLowerCase() : "";
        String lowerContentType = (contentType != null) ? contentType.toLowerCase() : "";
        Set<String> allowedExtensions = (plan == SubscriptionPlan.PRO) ? PRO_ALLOWED_EXTENSIONS : STARTER_ALLOWED_EXTENSIONS;
        Set<String> allowedMime = (plan == SubscriptionPlan.PRO) ? PRO_ALLOWED_MIME : STARTER_ALLOWED_MIME;

        boolean extOk = allowedExtensions.stream().anyMatch(lowerFilename::endsWith);
        boolean mimeOk = allowedMime.stream().anyMatch(lowerContentType::startsWith);
        return extOk || mimeOk;
    }

    public long getPriceVnd(SubscriptionPlan plan) {
        return switch (plan) {
            case STARTER -> 0L;
            case PRO -> PRO_PRICE_VND;
            case ENTERPRISE -> ENTERPRISE_PRICE_VND;
        };
    }
}
