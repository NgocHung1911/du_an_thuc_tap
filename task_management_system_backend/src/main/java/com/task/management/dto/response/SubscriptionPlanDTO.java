package com.task.management.dto.response;

import com.task.management.enums.SubscriptionPlan;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionPlanDTO {
    private SubscriptionPlan id;
    private String name;
    private long priceVnd;
    private BigDecimal priceUsd;
    private boolean isPopular;
    private int maxProjects;
    private int maxUniqueMembers;
    private long maxFileSizeBytes;
    private long maxStorageBytes;
    private List<String> allowedFileTypes;
    private List<String> features;
}
