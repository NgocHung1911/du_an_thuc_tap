package com.task.management.dto.response;

import com.task.management.enums.SubscriptionPlan;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionSummaryDTO {
    private Long id;
    private SubscriptionPlan plan;
    private Instant planStartedAt;
    private Instant planExpiresAt;
    private boolean isExpired;
    private Long daysRemaining;

    // Quota statistics
    private int currentProjects;
    private int maxProjects;

    private int currentUniqueMembers;
    private int maxUniqueMembers;

    private long usedStorageBytes;
    private long maxStorageBytes;

    private long maxFileSizeBytes;
    private List<String> allowedFileTypes;
}
